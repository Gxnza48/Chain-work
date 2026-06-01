import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';

// Self-contained on purpose: no local relative imports. Under `"type": "module"`
// a relative import without a .js extension crashes the function at load
// (FUNCTION_INVOCATION_FAILED). Heavy deps are imported dynamically (bare
// specifiers resolve fine) so module load never touches them.

// Called by the actor's browser right after they create a todo/idea/file, join a
// chain, or tap the bell. Authenticated with the user's Supabase JWT; the server
// re-reads the record and notifies the relevant chain members.

type Event = 'todo' | 'idea' | 'file' | 'join' | 'nudge';
const NUDGE_COOLDOWN_HOURS = 12;

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'no token' });

  const db = await serviceClient();
  const { data: userData, error: userErr } = await db.auth.getUser(token);
  const actor = userData?.user;
  if (userErr || !actor) return res.status(401).json({ error: 'bad token' });

  const body = (req.body || {}) as { event?: Event; id?: string; chainId?: string };
  const event = body.event;
  if (!event) return res.status(400).json({ error: 'no event' });

  try {
    const actorName = await displayName(db, actor.id);
    const chainName = async (id: string | null) => {
      if (!id) return 'tu chain';
      const { data } = await db.from('chains').select('name').eq('id', id).single();
      return data?.name ?? 'tu chain';
    };

    // --- Manual bell / nudge: push the assignees, throttled to once per 12h. ---
    if (event === 'nudge') {
      const { data: todo } = await db
        .from('todos')
        .select('id, title, chain_id, assignees')
        .eq('id', body.id)
        .single();
      if (!todo) return res.status(404).json({ error: 'not found' });

      const assignees: string[] = todo.assignees ?? [];
      if (assignees.length === 0) return res.status(400).json({ error: 'no-assignees' });

      const member = await isMember(db, todo.chain_id, actor.id);
      if (!member) return res.status(403).json({ error: 'not a member' });

      // Atomic cooldown: only succeeds if 12h elapsed (or never nudged).
      const cutoff = new Date(Date.now() - NUDGE_COOLDOWN_HOURS * 3600 * 1000).toISOString();
      const { data: claimed } = await db
        .from('todos')
        .update({ last_nudged_at: new Date().toISOString() })
        .eq('id', todo.id)
        .or(`last_nudged_at.is.null,last_nudged_at.lt.${cutoff}`)
        .select('id')
        .maybeSingle();
      if (!claimed) {
        const { data: cur } = await db
          .from('todos')
          .select('last_nudged_at')
          .eq('id', todo.id)
          .single();
        const last = cur?.last_nudged_at ? new Date(cur.last_nudged_at).getTime() : 0;
        const retryAfter = Math.max(
          0,
          Math.ceil((last + NUDGE_COOLDOWN_HOURS * 3600 * 1000 - Date.now()) / 1000),
        );
        return res.status(429).json({ error: 'cooldown', retryAfter });
      }

      const payload: PushPayload = {
        title: await chainName(todo.chain_id),
        body: `🔔 ${actorName} te recordó: ${todo.title}`,
        url: `/chain/${todo.chain_id}`,
        tag: `nudge-${todo.id}`,
      };
      const sent = await sendToUsers(db, assignees, payload);
      return res.status(200).json({ ok: true, sent });
    }

    // --- Auto-notify on create/join: notify OTHER chain members. ---
    let chainId: string | null = null;
    let payload: PushPayload | null = null;

    if (event === 'todo' || event === 'idea') {
      const table = event === 'todo' ? 'todos' : 'ideas';
      const { data } = await db.from(table).select('chain_id, title').eq('id', body.id).single();
      if (!data) return res.status(404).json({ error: 'not found' });
      chainId = data.chain_id;
      const label = event === 'todo' ? 'todo' : 'idea';
      payload = {
        title: await chainName(chainId),
        body: `${actorName} agregó un ${label}: ${data.title}`,
        url: `/chain/${chainId}`,
        tag: `${event}-${body.id}`,
      };
    } else if (event === 'file') {
      const { data } = await db
        .from('attachments')
        .select('title, type, projects(chain_id, name)')
        .eq('id', body.id)
        .single();
      const project = (data as { projects?: { chain_id: string; name: string } } | null)?.projects;
      if (!data || !project) return res.status(404).json({ error: 'not found' });
      chainId = project.chain_id;
      payload = {
        title: await chainName(chainId),
        body: `${actorName} subió ${data.title ?? 'un archivo'} en ${project.name}`,
        url: `/chain/${chainId}`,
        tag: `file-${body.id}`,
      };
    } else if (event === 'join') {
      if (!body.chainId) return res.status(400).json({ error: 'no chainId' });
      chainId = body.chainId;
      payload = {
        title: await chainName(chainId),
        body: `${actorName} se unió a la chain`,
        url: `/chain/${chainId}`,
        tag: `join-${chainId}-${actor.id}`,
      };
    }

    if (!chainId || !payload) return res.status(400).json({ error: 'unhandled' });

    const { data: membership } = await db
      .from('chain_members')
      .select('user_id')
      .eq('chain_id', chainId);
    const memberIds = (membership ?? []).map((m: { user_id: string }) => m.user_id);
    if (!memberIds.includes(actor.id)) return res.status(403).json({ error: 'not a member' });

    const recipients = memberIds.filter((id) => id !== actor.id);
    const sent = await sendToUsers(db, recipients, payload);
    return res.status(200).json({ ok: true, sent });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}

// ---------------------------------------------------------------------------
// Inline helpers (no local imports — see header note).
// ---------------------------------------------------------------------------

async function serviceClient(): Promise<SupabaseClient> {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _webpush: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function webpushClient(): Promise<any> {
  if (_webpush) return _webpush;
  const mod = await import('web-push');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wp = ((mod as any).default ?? mod) as any;
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:agustincasal@impulsex.com.ar';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  wp.setVapidDetails(subject, publicKey, privateKey);
  _webpush = wp;
  return wp;
}

async function sendToUsers(
  db: SupabaseClient,
  userIds: string[],
  payload: PushPayload,
): Promise<number> {
  if (userIds.length === 0) return 0;
  const webpush = await webpushClient();
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds);
  const rows = (subs ?? []) as Array<{ id: string; endpoint: string; p256dh: string; auth: string }>;
  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;
  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body,
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(row.id);
      }
    }),
  );
  if (dead.length) await db.from('push_subscriptions').delete().in('id', dead);
  return sent;
}

async function displayName(db: SupabaseClient, userId: string): Promise<string> {
  const { data } = await db.from('users').select('display_name').eq('id', userId).single();
  return data?.display_name ?? 'Alguien';
}

async function isMember(db: SupabaseClient, chainId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from('chain_members')
    .select('user_id')
    .eq('chain_id', chainId)
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendToUsers, serviceClient, type PushPayload } from './_lib/push';

// Called by the actor's browser right after they create a todo/idea/file or join
// a chain. Authenticated with the user's Supabase JWT; the server re-reads the
// record (so clients can't forge content) and notifies the OTHER chain members.

type Event = 'todo' | 'idea' | 'file' | 'join' | 'nudge';

const NUDGE_COOLDOWN_HOURS = 12;

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
    // Resolve chain + notification content from the persisted record.
    let chainId: string | null = null;
    let payload: PushPayload | null = null;

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

      // Actor must be a member of the todo's chain.
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

    // Security: the actor must belong to the chain they're notifying about.
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

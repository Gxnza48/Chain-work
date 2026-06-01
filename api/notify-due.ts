import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';

// Self-contained on purpose: no local relative imports (a relative import without
// a .js extension crashes the function at load under "type": "module"). Heavy
// deps are imported dynamically.

// Daily cron (Vercel Cron). Sends two reminder kinds:
//   'due'    — todo due TODAY        'before' — todo due TOMORROW
// Recipients: the assignees, or the creator if none. Deduped via
// todo_reminders_sent. Timezone: America/Argentina (UTC-3).

const TZ_OFFSET_HOURS = -3;

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface DueTodo {
  id: string;
  title: string;
  chain_id: string;
  assignees: string[] | null;
  created_by: string;
  status: string;
}

function ymdInTz(base: Date, addDays = 0): string {
  const shifted = new Date(base.getTime() + (TZ_OFFSET_HOURS * 60 + addDays * 24 * 60) * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const db = await serviceClient();
  const now = new Date();
  const today = ymdInTz(now, 0);
  const tomorrow = ymdInTz(now, 1);

  let total = 0;
  for (const [date, kind, lead] of [
    [today, 'due', 'hoy'],
    [tomorrow, 'before', 'mañana'],
  ] as const) {
    const { data: todos } = await db
      .from('todos')
      .select('id, title, chain_id, assignees, created_by, status')
      .eq('due_date', date)
      .neq('status', 'done');

    for (const todo of (todos ?? []) as DueTodo[]) {
      const { error: insErr } = await db
        .from('todo_reminders_sent')
        .insert({ todo_id: todo.id, remind_date: today, kind });
      if (insErr) continue; // unique violation => already sent

      const recipients =
        todo.assignees && todo.assignees.length > 0 ? todo.assignees : [todo.created_by];
      const payload: PushPayload = {
        title: kind === 'due' ? 'Vence hoy' : 'Vence mañana',
        body: `${todo.title} vence ${lead}`,
        url: `/chain/${todo.chain_id}`,
        tag: `due-${todo.id}-${kind}`,
      };
      total += await sendToUsers(db, recipients, payload);
    }
  }

  return res.status(200).json({ ok: true, sent: total });
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

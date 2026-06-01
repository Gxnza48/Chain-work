import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkBearer, sendToUsers, serviceClient, type PushPayload } from './_lib/push';

// Daily cron (Vercel Cron). Sends two reminder kinds:
//   'before' — todo due TOMORROW
//   'due'    — todo due TODAY
// Recipient: the assignee, or the creator if unassigned. Deduped via
// todo_reminders_sent so a todo is only reminded once per (date, kind).
// Timezone: America/Argentina/Buenos_Aires (UTC-3), matching the team.

const TZ_OFFSET_HOURS = -3;

function ymdInTz(base: Date, addDays = 0): string {
  const shifted = new Date(base.getTime() + (TZ_OFFSET_HOURS * 60 + addDays * 24 * 60) * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

interface DueTodo {
  id: string;
  title: string;
  chain_id: string;
  assignees: string[] | null;
  created_by: string;
  status: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  if (!checkBearer(req.headers.authorization, process.env.CRON_SECRET)) {
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
      // Dedupe: skip if already reminded for this (todo, sent-date, kind).
      const sentDate = today; // we always send "now"
      const { error: insErr } = await db
        .from('todo_reminders_sent')
        .insert({ todo_id: todo.id, remind_date: sentDate, kind });
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

-- ============================================================================
-- ChainWork — 0014_todo_assignees_nudge.sql
-- Multi-assignee todos + a manual "nudge" (bell) that pushes the assignees,
-- rate-limited to once every 12h per todo.
-- ============================================================================

-- Multiple assignees (kept alongside the legacy single `assigned_to`, which is
-- left in place but no longer used by the UI). Backfill from the old column.
alter table public.todos add column if not exists assignees uuid[] not null default '{}';
update public.todos
  set assignees = array[assigned_to]
  where assigned_to is not null and assignees = '{}';

-- Cooldown timestamp for the bell. The bell can be tapped once per 12h per todo;
-- the /api/notify 'nudge' endpoint enforces it with a conditional update.
alter table public.todos add column if not exists last_nudged_at timestamptz;

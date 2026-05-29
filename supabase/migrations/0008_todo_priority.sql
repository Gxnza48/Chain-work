-- ============================================================================
-- ChainWork — 0008_todo_priority.sql
-- Adds a priority/level to todos so teammates can flag how important each one
-- is (low → critical). Existing rows default to 'medium'. No RLS changes:
-- the canonical "todos member access" policy (0003) already allows members to
-- update any todo in their chain.
-- Idempotent: safe to re-run.
-- ============================================================================

alter table public.todos
  add column if not exists priority text not null default 'medium'
  check (priority in ('low', 'medium', 'high', 'critical'));

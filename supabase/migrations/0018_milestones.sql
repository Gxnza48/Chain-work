-- ============================================================================
-- ChainWork — 0018_milestones.sql
-- Per-project milestones (goals/sprints). A milestone has a due date and an
-- open/done status; todos link to a milestone via todos.milestone_id and the
-- UI derives progress = done linked todos / total linked todos. Chain-scoped,
-- gated by the canonical public.is_chain_member helper. The Milestones panel
-- and the project todo views live-subscribe, so milestones is added to the
-- supabase_realtime publication.
-- Idempotent: safe to re-run.
-- ============================================================================

-- ============ MILESTONES ============
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  chain_id    uuid not null references public.chains (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null,
  description text,
  due_date    date,
  status      text not null default 'open' check (status in ('open', 'done')),
  order_index integer not null default 0,
  created_by  uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz default now()
);

-- Link a todo to a milestone (nullable; clearing the milestone keeps the todo).
alter table public.todos
  add column if not exists milestone_id uuid references public.milestones (id) on delete set null;

-- ============ INDEXES ============
-- Named + if-not-exists so the migration is re-runnable in Studio.
create index if not exists idx_milestones_chain_id   on public.milestones (chain_id);
create index if not exists idx_milestones_project_id on public.milestones (project_id);
create index if not exists idx_milestones_created_by on public.milestones (created_by);
-- Covers the reverse side of todos.milestone_id (on delete set null) + progress joins.
create index if not exists idx_todos_milestone_id    on public.todos (milestone_id);

-- ============ RLS ============
alter table public.milestones enable row level security;

-- Canonical chain-scoped access: any member of the chain can read/write.
-- is_chain_member is SECURITY DEFINER (0003), so this does not recurse.
drop policy if exists "milestones member access" on public.milestones;
create policy "milestones member access" on public.milestones
  for all to authenticated
  using (public.is_chain_member(chain_id))
  with check (public.is_chain_member(chain_id));

-- ============ REALTIME ============
-- Guarded add: `alter publication ... add table` errors if the table is already
-- a member, so check pg_publication_tables first to keep this re-runnable.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'milestones'
  ) then
    alter publication supabase_realtime add table public.milestones;
  end if;
end $$;

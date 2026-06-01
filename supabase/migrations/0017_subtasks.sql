-- ============================================================================
-- ChainWork — 0017_subtasks.sql
-- A lightweight checklist of subtasks inside each todo. Subtasks carry both a
-- todo_id and a denormalized chain_id so RLS can reuse public.is_chain_member
-- without a join. Progress ("3/5") is derived client-side from these rows.
-- ============================================================================

-- ===== SUBTASKS =====
create table public.subtasks (
  id          uuid primary key default gen_random_uuid(),
  todo_id     uuid not null references public.todos (id) on delete cascade,
  chain_id    uuid not null references public.chains (id) on delete cascade,
  title       text not null,
  done        boolean not null default false,
  order_index integer not null default 0,
  created_by  uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz default now()
);

-- Foreign-key indexes (todo_id is the hot path: list a todo's checklist).
create index on public.subtasks (todo_id);
create index on public.subtasks (chain_id);
create index on public.subtasks (created_by);

-- ===== RLS: canonical chain-member access =====
-- is_chain_member is SECURITY DEFINER (search_path=public, STABLE) and reads
-- chain_members directly, so this policy does NOT recurse back into subtasks.
alter table public.subtasks enable row level security;

create policy "subtasks member access" on public.subtasks
  for all to authenticated
  using (public.is_chain_member(chain_id))
  with check (public.is_chain_member(chain_id));

-- ===== REALTIME =====
-- The checklist UI live-subscribes to subtasks (postgres_changes), so the table
-- must be in the realtime publication. Guarded so the migration is re-runnable
-- (a bare "alter publication ... add table" errors if it is already a member).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'subtasks'
  ) then
    alter publication supabase_realtime add table public.subtasks;
  end if;
end
$$;
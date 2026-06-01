-- ============================================================================
-- ChainWork — 0016_comments.sql
-- Threaded discussion on each todo. A comment belongs to a todo (and carries the
-- chain_id so the canonical RLS rule and realtime filtering work without a join).
-- Members of the chain read/post; a user deletes only their own comments. The
-- actor's client calls /api/notify ('comment') to push the other chain members.
-- ============================================================================

-- ===== COMMENTS =====
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  chain_id   uuid not null references public.chains (id) on delete cascade,
  todo_id    uuid not null references public.todos (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  body       text not null check (length(btrim(body)) between 1 and 4000),
  created_at timestamptz default now()
);

-- ===== INDEXES (foreign keys + the thread read path) =====
create index on public.comments (chain_id);
create index on public.comments (user_id);
-- Thread fetch: comments for one todo, oldest first. Also covers the todo_id FK.
create index on public.comments (todo_id, created_at);

-- ===== RLS: canonical chain-member access; delete only your own =====
-- is_chain_member is SECURITY DEFINER (set search_path = public), so calling it
-- here does NOT re-trigger RLS on chain_members and cannot recurse.
alter table public.comments enable row level security;

create policy "comments read member access" on public.comments
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "comments insert member access" on public.comments
  for insert to authenticated
  with check (public.is_chain_member(chain_id) and user_id = auth.uid());
create policy "comments delete own" on public.comments
  for delete to authenticated using (user_id = auth.uid());

-- ===== REALTIME =====
-- The todo detail area live-subscribes to comments filtered by todo_id.
-- REPLICA IDENTITY FULL is required so that DELETE (and UPDATE) realtime payloads
-- include todo_id; otherwise the server-side postgres_changes filter on todo_id
-- cannot match delete events (default replica identity exposes only the PK), and
-- deleted comments would not disappear in realtime for other members.
alter table public.comments replica identity full;
alter publication supabase_realtime add table public.comments;

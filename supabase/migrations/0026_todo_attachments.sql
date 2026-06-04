-- ============================================================================
-- ChainWork — 0026_todo_attachments.sql
-- Files / screenshots attached to a single todo (distinct from the existing
-- project-scoped `attachments`). A row belongs to a todo and carries chain_id so
-- the canonical RLS rule and realtime filtering work without a join. Chain
-- members read/add; any chain member may remove (collaborative task management).
-- Files live in a public-read `todo-files` storage bucket; the authorization
-- boundary is this RLS-gated row, mirroring the chat-files design (0024).
-- ============================================================================

-- ===== TABLE =====
create table public.todo_attachments (
  id         uuid primary key default gen_random_uuid(),
  chain_id   uuid not null references public.chains (id) on delete cascade,
  todo_id    uuid not null references public.todos (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  url        text not null,
  name       text not null,
  type       text,
  size       integer,
  created_at timestamptz default now()
);

-- ===== INDEXES (foreign keys + the per-todo read path) =====
create index on public.todo_attachments (chain_id);
create index on public.todo_attachments (user_id);
-- Attachment list for one todo, newest first. Also covers the todo_id FK.
create index on public.todo_attachments (todo_id, created_at desc);

-- ===== RLS: canonical chain-member access =====
-- is_chain_member is SECURITY DEFINER (set search_path = public), so calling it
-- here does NOT re-trigger RLS on chain_members and cannot recurse.
alter table public.todo_attachments enable row level security;

create policy "todo_attachments read member access" on public.todo_attachments
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "todo_attachments insert member access" on public.todo_attachments
  for insert to authenticated
  with check (public.is_chain_member(chain_id) and user_id = auth.uid());
create policy "todo_attachments delete member access" on public.todo_attachments
  for delete to authenticated using (public.is_chain_member(chain_id));

-- ===== REALTIME =====
-- The todo detail modal live-subscribes filtered by todo_id. REPLICA IDENTITY
-- FULL is required so DELETE payloads include todo_id (default exposes only the
-- PK), otherwise removed attachments wouldn't disappear for other members.
alter table public.todo_attachments replica identity full;
alter publication supabase_realtime add table public.todo_attachments;

-- ===== STORAGE =====
insert into storage.buckets (id, name, public)
values ('todo-files', 'todo-files', true)
on conflict (id) do nothing;

-- Any authenticated user may upload to todo-files; reads are public (public
-- bucket). The sensitive boundary is the todo_attachments row, RLS-gated above.
drop policy if exists "todo-files authenticated upload" on storage.objects;
create policy "todo-files authenticated upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'todo-files');

drop policy if exists "todo-files public read" on storage.objects;
create policy "todo-files public read" on storage.objects
  for select to public
  using (bucket_id = 'todo-files');

drop policy if exists "todo-files delete own" on storage.objects;
create policy "todo-files delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'todo-files' and owner = auth.uid());

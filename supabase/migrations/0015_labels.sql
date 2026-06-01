-- ============================================================================
-- ChainWork — 0015_labels.sql
-- Chain-scoped colored labels assignable to todos. Two tables: `labels`
-- (the label definitions, unique by name per chain) and `todo_labels` (the
-- many-to-many join between todos and labels). Both are gated by the existing
-- public.is_chain_member helper. todo_labels has no chain_id of its own, so it
-- is gated via EXISTS against its parent todo's chain (mirrors attachments) and,
-- on insert, additionally requires the label and the todo to share a chain so a
-- multi-chain user cannot graft a foreign chain's label onto a todo.
-- ============================================================================

-- ============ LABELS ============
create table public.labels (
  id         uuid primary key default gen_random_uuid(),
  chain_id   uuid not null references public.chains (id) on delete cascade,
  name       text not null,
  color      text not null default 'blue',
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz default now()
);

-- Case-insensitive uniqueness of a label name within a chain.
create unique index labels_chain_lower_name_key
  on public.labels (chain_id, lower(name));

-- ============ TODO_LABELS (join) ============
create table public.todo_labels (
  todo_id  uuid not null references public.todos (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  primary key (todo_id, label_id)
);

-- ============ INDEXES (foreign keys) ============
-- labels FKs used by policies/joins.
create index labels_chain_id_idx    on public.labels (chain_id);
create index labels_created_by_idx  on public.labels (created_by);
-- todo_labels: (todo_id) is already covered by the leading column of the PK
-- (todo_id, label_id), so only label_id needs its own index.
create index todo_labels_label_id_idx on public.todo_labels (label_id);

-- ============ RLS ============
alter table public.labels      enable row level security;
alter table public.todo_labels enable row level security;

-- labels: chain-shared vocabulary — any member reads/renames/recolors/deletes;
-- authorship (created_by) is pinned to the actor only on INSERT so it cannot be
-- forged, while edits/deletes stay open to the whole chain (mirrors how todos
-- are fully member-editable). Split into per-command policies so the created_by
-- pin does not also block a member from renaming a label they did not create.
create policy "labels read member access" on public.labels
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "labels insert member access" on public.labels
  for insert to authenticated
  with check (public.is_chain_member(chain_id) and created_by = auth.uid());
create policy "labels update member access" on public.labels
  for update to authenticated
  using (public.is_chain_member(chain_id))
  with check (public.is_chain_member(chain_id));
create policy "labels delete member access" on public.labels
  for delete to authenticated using (public.is_chain_member(chain_id));

-- todo_labels: no chain_id column, so gate via the parent todo's chain.
create policy "todo_labels read" on public.todo_labels
  for select to authenticated using (
    exists (
      select 1 from public.todos td
      where td.id = todo_labels.todo_id and public.is_chain_member(td.chain_id)
    )
  );

-- Insert: the label and the todo must live in the SAME chain, and the actor
-- must be a member of that chain. The join on l.chain_id = td.chain_id is what
-- prevents a user who belongs to chains A and B from tagging an A-todo with a
-- B-label (which would leak the B-label into chain A's UI).
create policy "todo_labels insert" on public.todo_labels
  for insert to authenticated with check (
    exists (
      select 1
      from public.todos  td
      join public.labels l on l.chain_id = td.chain_id
      where td.id = todo_labels.todo_id
        and l.id  = todo_labels.label_id
        and public.is_chain_member(td.chain_id)
    )
  );

create policy "todo_labels delete" on public.todo_labels
  for delete to authenticated using (
    exists (
      select 1 from public.todos td
      where td.id = todo_labels.todo_id and public.is_chain_member(td.chain_id)
    )
  );

-- ============ REALTIME ============
-- The UI live-subscribes to both tables (label manager + per-todo chips).
-- Guarded so the migration stays re-runnable in Supabase Studio (these files
-- are applied manually; a duplicate run must not abort).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'labels'
  ) then
    alter publication supabase_realtime add table public.labels;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'todo_labels'
  ) then
    alter publication supabase_realtime add table public.todo_labels;
  end if;
end $$;
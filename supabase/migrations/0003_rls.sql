-- ============================================================================
-- ChainWork — 0003_rls.sql
-- RLS enabled on every table. Canonical rule: a user can read/write rows
-- belonging to a chain they are a member of (via chain_members).
-- ============================================================================

-- Helper: is the current user a member of this chain?
create or replace function public.is_chain_member(target_chain uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.chain_members m
    where m.chain_id = target_chain and m.user_id = auth.uid()
  );
$$;

-- Enable RLS on every table
alter table public.users         enable row level security;
alter table public.chains        enable row level security;
alter table public.chain_members enable row level security;
alter table public.projects      enable row level security;
alter table public.todos         enable row level security;
alter table public.ideas         enable row level security;
alter table public.idea_votes    enable row level security;
alter table public.attachments   enable row level security;

-- ===== USERS: profiles public within the app; owner-only updates =====
create policy "users readable by authenticated" on public.users
  for select to authenticated using (true);
create policy "users update own row" on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ===== CHAINS: members read; any authed user can create =====
create policy "chains readable by members" on public.chains
  for select to authenticated using (public.is_chain_member(id));
create policy "chains insert by authenticated" on public.chains
  for insert to authenticated with check (created_by = auth.uid());
-- (chains lookup by code for Join is done via a SECURITY DEFINER RPC, see 0004)

-- ===== CHAIN_MEMBERS: members read; user inserts own row =====
create policy "members readable by members" on public.chain_members
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "members insert own row" on public.chain_members
  for insert to authenticated with check (user_id = auth.uid());
create policy "members delete own row" on public.chain_members
  for delete to authenticated using (user_id = auth.uid());

-- ===== PROJECTS / TODOS / IDEAS / ATTACHMENTS: canonical member access =====
create policy "projects member access" on public.projects
  for all to authenticated
  using (public.is_chain_member(chain_id))
  with check (public.is_chain_member(chain_id));

create policy "todos member access" on public.todos
  for all to authenticated
  using (public.is_chain_member(chain_id))
  with check (public.is_chain_member(chain_id));

create policy "ideas read member access" on public.ideas
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "ideas insert member access" on public.ideas
  for insert to authenticated with check (public.is_chain_member(chain_id) and created_by = auth.uid());
create policy "ideas update member access" on public.ideas
  for update to authenticated using (public.is_chain_member(chain_id)) with check (public.is_chain_member(chain_id));
create policy "ideas delete own" on public.ideas
  for delete to authenticated using (created_by = auth.uid());

-- attachments: chain members read/insert; only uploader deletes
create policy "attachments read" on public.attachments
  for select to authenticated using (
    exists (select 1 from public.projects p where p.id = attachments.project_id and public.is_chain_member(p.chain_id))
  );
create policy "attachments insert" on public.attachments
  for insert to authenticated with check (
    uploaded_by = auth.uid()
    and exists (select 1 from public.projects p where p.id = attachments.project_id and public.is_chain_member(p.chain_id))
  );
create policy "attachments delete own" on public.attachments
  for delete to authenticated using (uploaded_by = auth.uid());

-- ===== IDEA_VOTES: membership read; own-row write =====
create policy "votes read by members" on public.idea_votes
  for select to authenticated using (
    exists (select 1 from public.ideas i where i.id = idea_votes.idea_id and public.is_chain_member(i.chain_id))
  );
create policy "votes insert own" on public.idea_votes
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.ideas i where i.id = idea_votes.idea_id and public.is_chain_member(i.chain_id))
  );
create policy "votes update own" on public.idea_votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "votes delete own" on public.idea_votes
  for delete to authenticated using (user_id = auth.uid());

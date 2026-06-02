-- ============================================================================
-- ChainWork — 0022_chat_reads.sql
-- Read receipts for the chain chat, the cheap way: one row per (chain, user)
-- holding their last_read_at. A message is "seen by" a user when that user's
-- last_read_at >= the message's created_at. No per-message receipt rows.
-- ============================================================================

create table public.chat_reads (
  chain_id     uuid not null references public.chains (id) on delete cascade,
  user_id      uuid not null references public.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (chain_id, user_id)
);

create index on public.chat_reads (user_id);

alter table public.chat_reads enable row level security;

create policy "chat_reads read member access" on public.chat_reads
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "chat_reads insert own" on public.chat_reads
  for insert to authenticated
  with check (public.is_chain_member(chain_id) and user_id = auth.uid());
create policy "chat_reads update own" on public.chat_reads
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_chain_member(chain_id));

-- ===== REALTIME =====
alter table public.chat_reads replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_reads'
  ) then
    alter publication supabase_realtime add table public.chat_reads;
  end if;
end $$;

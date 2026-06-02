-- ============================================================================
-- ChainWork — 0025_chat_polls.sql
-- Polls in the chat. A poll is a chat_polls row (question + options text[]); the
-- chat message that shows it carries poll_id. Votes are single-choice: one row
-- per (poll, user) in chat_poll_votes, changeable (upsert). chain_id is
-- denormalised onto both for the canonical is_chain_member RLS + realtime filter.
-- ============================================================================

create table public.chat_polls (
  id         uuid primary key default gen_random_uuid(),
  chain_id   uuid not null references public.chains (id) on delete cascade,
  question   text not null,
  options    text[] not null,
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz default now()
);
create index on public.chat_polls (chain_id);
create index on public.chat_polls (created_by);

alter table public.chat_messages add column if not exists poll_id uuid references public.chat_polls (id) on delete set null;
create index if not exists idx_chat_messages_poll_id on public.chat_messages (poll_id);

-- Relax content check so a poll message (no body/audio/file) is valid.
alter table public.chat_messages drop constraint if exists chat_messages_content_chk;
alter table public.chat_messages add constraint chat_messages_content_chk check (
  deleted_at is not null
  or (body is not null and length(btrim(body)) between 1 and 4000)
  or audio_url is not null
  or file_url is not null
  or poll_id is not null
);

create table public.chat_poll_votes (
  poll_id      uuid not null references public.chat_polls (id) on delete cascade,
  user_id      uuid not null references public.users (id) on delete cascade,
  chain_id     uuid not null references public.chains (id) on delete cascade,
  option_index integer not null,
  created_at   timestamptz default now(),
  primary key (poll_id, user_id)
);
create index on public.chat_poll_votes (chain_id);

-- ===== RLS =====
alter table public.chat_polls enable row level security;
create policy "chat_polls read member access" on public.chat_polls
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "chat_polls insert own" on public.chat_polls
  for insert to authenticated
  with check (public.is_chain_member(chain_id) and created_by = auth.uid());

alter table public.chat_poll_votes enable row level security;
create policy "chat_poll_votes read member access" on public.chat_poll_votes
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "chat_poll_votes insert own" on public.chat_poll_votes
  for insert to authenticated
  with check (public.is_chain_member(chain_id) and user_id = auth.uid());
create policy "chat_poll_votes update own" on public.chat_poll_votes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_chain_member(chain_id));
create policy "chat_poll_votes delete own" on public.chat_poll_votes
  for delete to authenticated using (user_id = auth.uid());

-- ===== REALTIME =====
alter table public.chat_polls replica identity full;
alter table public.chat_poll_votes replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chat_polls') then
    alter publication supabase_realtime add table public.chat_polls;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chat_poll_votes') then
    alter publication supabase_realtime add table public.chat_poll_votes;
  end if;
end $$;

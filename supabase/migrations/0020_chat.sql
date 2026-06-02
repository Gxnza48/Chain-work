-- ============================================================================
-- ChainWork — 0020_chat.sql
-- Per-chain group chat ("WhatsApp-style"): every member of a chain shares one
-- message stream. v1 is text-only (send / edit / reply / copy / delete-own); the
-- audio_url / audio_duration columns are added now (nullable) so the planned
-- voice-message follow-up needs no further migration. A message is either text
-- OR audio — enforced by chat_messages_content_chk.
--
-- Mirrors the comments feature (0016): chain_id is denormalised onto each row so
-- the canonical public.is_chain_member RLS rule and the realtime chain filter
-- work without a join. reply_to is a self-FK (on delete set null) so replying to
-- a message that is later deleted degrades to "deleted message" in the UI.
--
-- The actor's client calls /api/notify ('chat') to web-push the other members.
-- ============================================================================

-- ===== TABLE =====
create table public.chat_messages (
  id             uuid primary key default gen_random_uuid(),
  chain_id       uuid not null references public.chains (id) on delete cascade,
  user_id        uuid not null references public.users (id) on delete cascade,
  body           text,
  audio_url      text,
  audio_duration integer,                      -- milliseconds (future voice notes)
  reply_to       uuid references public.chat_messages (id) on delete set null,
  edited_at      timestamptz,
  created_at     timestamptz default now(),
  -- A message must carry content: non-empty text, or an audio clip.
  constraint chat_messages_content_chk check (
    (body is not null and length(btrim(body)) between 1 and 4000)
    or audio_url is not null
  )
);

-- ===== INDEXES (foreign keys + the thread read path) =====
-- The stream reads "this chain's messages, oldest first"; also covers the chain_id FK.
create index on public.chat_messages (chain_id, created_at);
create index on public.chat_messages (user_id);
create index on public.chat_messages (reply_to);

-- ===== RLS: chain-member access; edit/delete only your own =====
-- is_chain_member is SECURITY DEFINER (0003), so calling it here does not recurse.
alter table public.chat_messages enable row level security;

create policy "chat read member access" on public.chat_messages
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "chat insert member access" on public.chat_messages
  for insert to authenticated
  with check (public.is_chain_member(chain_id) and user_id = auth.uid());
-- Edit own only, and the row must stay inside a chain you belong to.
create policy "chat update own" on public.chat_messages
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_chain_member(chain_id));
create policy "chat delete own" on public.chat_messages
  for delete to authenticated using (user_id = auth.uid());

-- ===== REALTIME =====
-- The chat panel live-subscribes filtered by chain_id. REPLICA IDENTITY FULL is
-- required so UPDATE (edits) and DELETE realtime payloads include chain_id —
-- otherwise the server-side filter on chain_id cannot match those events and
-- edited/deleted messages would not update for other members.
alter table public.chat_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

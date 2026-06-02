-- ============================================================================
-- ChainWork — 0021_chat_reactions.sql
-- Chat upgrades, wave 1:
--   (a) Soft delete: chat_messages.deleted_at. Deleting a message keeps the row
--       as a tombstone ("mensaje eliminado") and nulls its body so the content
--       is actually gone — the content CHECK is relaxed to allow a deleted row
--       to carry no body/audio.
--   (b) Emoji reactions: chat_reactions (one row per message+user+emoji). chain_id
--       is denormalised so the canonical is_chain_member RLS rule and the realtime
--       chain filter work without a join.
-- Idempotent where practical (the user applies these by hand in Studio).
-- ============================================================================

-- ===== (a) SOFT DELETE =====
alter table public.chat_messages add column if not exists deleted_at timestamptz;

-- Relax the content check so a tombstoned (deleted) message may have no content.
alter table public.chat_messages drop constraint if exists chat_messages_content_chk;
alter table public.chat_messages add constraint chat_messages_content_chk check (
  deleted_at is not null
  or (body is not null and length(btrim(body)) between 1 and 4000)
  or audio_url is not null
);

-- ===== (b) REACTIONS =====
create table public.chat_reactions (
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  chain_id   uuid not null references public.chains (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz default now(),
  primary key (message_id, user_id, emoji)
);

-- message_id is the leading PK column (covers per-message lookups); index the rest.
create index on public.chat_reactions (chain_id);
create index on public.chat_reactions (user_id);

alter table public.chat_reactions enable row level security;

create policy "chat_reactions read member access" on public.chat_reactions
  for select to authenticated using (public.is_chain_member(chain_id));
create policy "chat_reactions insert own" on public.chat_reactions
  for insert to authenticated
  with check (public.is_chain_member(chain_id) and user_id = auth.uid());
create policy "chat_reactions delete own" on public.chat_reactions
  for delete to authenticated using (user_id = auth.uid());

-- ===== REALTIME =====
-- The chat panel live-subscribes to reactions. REPLICA IDENTITY FULL so DELETE
-- payloads carry message_id / user_id / emoji / chain_id (the PK alone is the
-- composite, but full keeps the chain filter + client removal reliable).
alter table public.chat_reactions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_reactions'
  ) then
    alter publication supabase_realtime add table public.chat_reactions;
  end if;
end $$;

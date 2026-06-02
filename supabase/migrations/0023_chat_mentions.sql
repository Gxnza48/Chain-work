-- ============================================================================
-- ChainWork — 0023_chat_mentions.sql
-- @-mentions of chain members in the chat. One row per (message, mentioned user).
-- Drives the unread-mention alert on the Chat tab: a mention is "unread" when its
-- created_at is newer than the mentioned user's chat_reads.last_read_at (0022).
-- Project mentions are rendered client-side from the message text and need no row.
-- ============================================================================

create table public.chat_mentions (
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  chain_id   uuid not null references public.chains (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index on public.chat_mentions (user_id, created_at);
create index on public.chat_mentions (chain_id);

alter table public.chat_mentions enable row level security;

create policy "chat_mentions read member access" on public.chat_mentions
  for select to authenticated using (public.is_chain_member(chain_id));
-- Insert only mentions that point at YOUR OWN just-sent message — prevents
-- forging a mention (and thus an alert) on someone else's message.
create policy "chat_mentions insert own message" on public.chat_mentions
  for insert to authenticated
  with check (
    public.is_chain_member(chain_id)
    and exists (
      select 1 from public.chat_messages m
      where m.id = message_id and m.user_id = auth.uid()
    )
  );

-- ===== REALTIME =====
alter table public.chat_mentions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_mentions'
  ) then
    alter publication supabase_realtime add table public.chat_mentions;
  end if;
end $$;

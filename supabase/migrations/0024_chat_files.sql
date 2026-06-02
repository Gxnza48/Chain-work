-- ============================================================================
-- ChainWork — 0024_chat_files.sql
-- Image / file attachments in the chat. A message may now carry a file (image
-- rendered inline, anything else as a download chip) instead of, or alongside,
-- text. Adds the columns + a public `chat-files` storage bucket with an upload
-- policy. Per-chain authorization stays on the chat_messages row (RLS); the
-- bucket is public-read so getPublicUrl works.
-- ============================================================================

alter table public.chat_messages add column if not exists file_url  text;
alter table public.chat_messages add column if not exists file_name text;
alter table public.chat_messages add column if not exists file_type text;
alter table public.chat_messages add column if not exists file_size integer;

-- Relax the content check so a file-only message (no body/audio) is valid.
alter table public.chat_messages drop constraint if exists chat_messages_content_chk;
alter table public.chat_messages add constraint chat_messages_content_chk check (
  deleted_at is not null
  or (body is not null and length(btrim(body)) between 1 and 4000)
  or audio_url is not null
  or file_url is not null
);

-- ===== STORAGE =====
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', true)
on conflict (id) do nothing;

-- Any authenticated user may upload to chat-files; reads are public (public
-- bucket). The sensitive boundary is the chat_messages row, which is RLS-gated.
drop policy if exists "chat-files authenticated upload" on storage.objects;
create policy "chat-files authenticated upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-files');

drop policy if exists "chat-files public read" on storage.objects;
create policy "chat-files public read" on storage.objects
  for select to public
  using (bucket_id = 'chat-files');

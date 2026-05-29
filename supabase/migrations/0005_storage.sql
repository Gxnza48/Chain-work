-- ============================================================================
-- ChainWork — 0005_storage.sql
-- Buckets: avatars (public-read), attachments (images), videos (<=50MB).
-- Enforce the 50MB video cap client-side AND set the bucket file-size limit
-- in the Supabase dashboard.
-- ============================================================================

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('attachments', 'attachments', true),
  ('videos', 'videos', true)
on conflict (id) do nothing;

-- Authenticated users can upload; everyone can read public buckets.
create policy "avatar read"   on storage.objects for select using (bucket_id = 'avatars');
create policy "avatar write"  on storage.objects for insert to authenticated with check (bucket_id = 'avatars');

create policy "attach read"   on storage.objects for select using (bucket_id = 'attachments');
create policy "attach write"  on storage.objects for insert to authenticated with check (bucket_id = 'attachments');

create policy "video read"    on storage.objects for select using (bucket_id = 'videos');
create policy "video write"   on storage.objects for insert to authenticated with check (bucket_id = 'videos');

-- Owners can delete their own uploads
create policy "storage delete own" on storage.objects
  for delete to authenticated
  using (owner = auth.uid());

-- ============================================================================
-- ChainWork — 0009_oauth_profile.sql
--   Harden profile bootstrap so OAuth (Google) signups work.
--   * OAuth users have no `username` in metadata -> derive + de-duplicate it,
--     otherwise the `users.username` UNIQUE constraint aborts the signup.
--   * Pull display_name from Google's `full_name`/`name` and avatar from
--     `avatar_url`/`picture`.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username  text;
  final_username text;
  suffix         int := 0;
begin
  -- derive a base username: explicit metadata > email local-part, sanitized
  base_username := lower(coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1)
  ));
  base_username := regexp_replace(base_username, '[^a-z0-9]', '', 'g');
  if base_username = '' then
    base_username := 'user';
  end if;
  base_username := left(base_username, 24);

  -- ensure uniqueness: append a numeric suffix on collision
  final_username := base_username;
  while exists (select 1 from public.users where username = final_username) loop
    suffix := suffix + 1;
    final_username := left(base_username, 20) || suffix::text;
  end loop;

  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    )
  );
  return new;
end;
$$;

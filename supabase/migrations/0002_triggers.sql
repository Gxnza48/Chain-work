-- ============================================================================
-- ChainWork — 0002_triggers.sql
--   * profile bootstrap on auth.users insert
--   * 25-project cap per chain
-- ============================================================================

-- ===== Profile bootstrap: create public.users row on new auth user =====
-- username + display_name come from registration metadata (options.data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, username, display_name)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Project cap of 25 per chain =====
create or replace function public.enforce_project_cap()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.projects where chain_id = new.chain_id) >= 25 then
    raise exception 'Project limit reached: a chain may contain at most 25 projects.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_project_cap
  before insert on public.projects
  for each row execute function public.enforce_project_cap();

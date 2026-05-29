-- ============================================================================
-- ChainWork — 0007_roles_and_profile.sql
--   * users.website        — optional portfolio / personal link on the profile
--   * chain_members.role    — 'owner' | 'member' (enables ban / promote)
--   * is_chain_owner()      — RLS helper
--   * owner policies        — rename chain, ban members, promote members
--   * create_chain()        — creator is seeded as 'owner'
-- Idempotent: safe to re-run.
-- ============================================================================

-- ===== Profile link =====
alter table public.users
  add column if not exists website text;

-- ===== Member roles =====
alter table public.chain_members
  add column if not exists role text not null default 'member'
  check (role in ('owner', 'member'));

-- Backfill: whoever created a chain becomes its owner.
update public.chain_members m
   set role = 'owner'
  from public.chains c
 where c.id = m.chain_id
   and c.created_by = m.user_id
   and m.role <> 'owner';

-- ===== Owner helper (SECURITY DEFINER → bypasses RLS, no recursion) =====
create or replace function public.is_chain_owner(target_chain uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.chain_members m
    where m.chain_id = target_chain
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- ===== CHAINS: owners can rename =====
drop policy if exists "chains update by owner" on public.chains;
create policy "chains update by owner" on public.chains
  for update to authenticated
  using (public.is_chain_owner(id))
  with check (public.is_chain_owner(id));

-- ===== CHAIN_MEMBERS: owners can ban (delete) and promote (update role) =====
-- (the existing "members delete own row" policy still lets anyone leave; these
--  permissive policies are OR-combined with it.)
drop policy if exists "members remove by owner" on public.chain_members;
create policy "members remove by owner" on public.chain_members
  for delete to authenticated
  using (public.is_chain_owner(chain_id));

drop policy if exists "members role update by owner" on public.chain_members;
create policy "members role update by owner" on public.chain_members
  for update to authenticated
  using (public.is_chain_owner(chain_id))
  with check (public.is_chain_owner(chain_id));

-- ===== create_chain: seed the creator's membership row as 'owner' =====
create or replace function public.create_chain(p_name text)
returns table (chain_id uuid, chain_name text, chain_code char(8))
language plpgsql
security definer set search_path = public
as $$
declare
  v_id         uuid;
  v_code       char(8);
  v_attempts   int  := 0;
  v_alphabet   text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_clean_name text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  v_clean_name := trim(p_name);
  if v_clean_name = '' then
    raise exception 'NAME_REQUIRED' using errcode = '22023';
  end if;

  loop
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'CODE_COLLISION' using errcode = 'P0001';
    end if;

    v_code := '';
    for _ in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;

    begin
      insert into public.chains (name, code, created_by)
      values (v_clean_name, v_code, auth.uid())
      returning id into v_id;
      exit;
    exception when unique_violation then
      continue;
    end;
  end loop;

  insert into public.chain_members (chain_id, user_id, role)
  values (v_id, auth.uid(), 'owner')
  on conflict (chain_id, user_id) do update set role = 'owner';

  chain_id   := v_id;
  chain_name := v_clean_name;
  chain_code := v_code;
  return next;
end;
$$;

revoke all on function public.create_chain(text) from public;
grant execute on function public.create_chain(text) to authenticated;

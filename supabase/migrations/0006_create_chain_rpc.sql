-- ============================================================================
-- ChainWork — 0006_create_chain_rpc.sql
-- Atomic chain creation. Bypasses the chicken-and-egg where:
--   1) RLS on `chains` requires created_by = auth.uid()  (fine in theory)
--   2) but reading the inserted chain back via .select() requires
--      is_chain_member(id), which is false until we insert chain_members.
-- This SECURITY DEFINER RPC inserts both rows in one transaction, generating
-- a unique 8-char alphanumeric code server-side (so the client doesn't have
-- to retry on collisions).
-- ============================================================================

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
      -- code collision; retry
      continue;
    end;
  end loop;

  insert into public.chain_members (chain_id, user_id)
  values (v_id, auth.uid())
  on conflict do nothing;

  chain_id   := v_id;
  chain_name := v_clean_name;
  chain_code := v_code;
  return next;
end;
$$;

revoke all on function public.create_chain(text) from public;
grant execute on function public.create_chain(text) to authenticated;

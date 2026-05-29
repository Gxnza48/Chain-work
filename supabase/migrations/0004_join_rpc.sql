-- ============================================================================
-- ChainWork — 0004_join_rpc.sql
-- Join a chain by code. SECURITY DEFINER so a non-member can resolve a code,
-- but it only ever inserts the caller's own membership row. Idempotent.
-- ============================================================================

create or replace function public.join_chain_by_code(p_code char(8))
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_chain_id uuid;
begin
  select id into v_chain_id from public.chains where code = upper(p_code);
  if v_chain_id is null then
    raise exception 'CHAIN_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.chain_members (chain_id, user_id)
  values (v_chain_id, auth.uid())
  on conflict (chain_id, user_id) do nothing;  -- idempotent join

  return v_chain_id;
end;
$$;

revoke all on function public.join_chain_by_code(char) from public;
grant execute on function public.join_chain_by_code(char) to authenticated;

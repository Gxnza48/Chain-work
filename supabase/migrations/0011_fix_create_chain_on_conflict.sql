-- ============================================================================
-- ChainWork — 0011_fix_create_chain_on_conflict.sql
--   Real fix for "column reference 'chain_id' is ambiguous" on chain creation.
--
--   0010 added `#variable_conflict use_column`, but that directive only governs
--   expression evaluation (WHERE / SET / VALUES) — it does NOT reach the
--   `ON CONFLICT (...)` index-inference column list, which is parsed separately.
--   So `on conflict (chain_id, user_id)` still saw `chain_id` as ambiguous
--   between the table column and the RETURNS TABLE OUT variable.
--
--   The ON CONFLICT was pointless here: the chain row is brand new in this same
--   transaction, so the creator's membership can never already exist. We drop it
--   and do a plain INSERT (an INSERT target column list is never ambiguous).
--
--   Idempotent: safe to re-run.
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
      continue;
    end;
  end loop;

  -- Plain insert: the chain is new, so this membership cannot pre-exist.
  -- No ON CONFLICT (which would re-introduce the chain_id ambiguity).
  insert into public.chain_members (chain_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  chain_id   := v_id;
  chain_name := v_clean_name;
  chain_code := v_code;
  return next;
end;
$$;

revoke all on function public.create_chain(text) from public;
grant execute on function public.create_chain(text) to authenticated;

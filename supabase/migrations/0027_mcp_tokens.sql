-- ============================================================================
-- ChainWork — 0027_mcp_tokens.sql
-- Personal API keys for the ChainWork MCP server (Claude Code integration).
--
-- A user generates a token in Settings → Integrations. The RAW token
-- (cw_live_…) is shown ONCE in the browser and only its SHA-256 hash is stored
-- here. The MCP Edge Function (supabase/functions/mcp) authenticates EACH
-- request by SHA-256-hashing the presented key and looking the row up in this
-- table with the service-role key (which bypasses RLS). It then acts scoped to
-- token.user_id, re-checking chain_members membership on every call — exactly
-- the same trust model as api/notify.ts.
--
-- RLS: a user manages ONLY their own tokens from the browser. There is NO
-- update policy (tokens are immutable; "rotate" = delete + create). The Edge
-- Function is unaffected by these policies because it uses the service role.
--
-- Apply in numeric order in the Supabase SQL editor (this repo has no CLI link).
-- ============================================================================

create table public.mcp_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  name         text not null,
  -- SHA-256 hex of the raw token. Unique so a (vanishingly unlikely) collision
  -- can't shadow another user's key, and so the lookup index is selective.
  token_hash   text not null unique,
  -- First ~12 chars of the raw token, for display only ("cw_live_ab12…").
  prefix       text not null,
  last_used_at timestamptz,
  created_at   timestamptz default now()
);

create index mcp_tokens_user_idx on public.mcp_tokens (user_id);
-- The Edge Function looks tokens up by hash on every MCP request.
create index mcp_tokens_hash_idx on public.mcp_tokens (token_hash);

alter table public.mcp_tokens enable row level security;

create policy "mcp_tokens select own" on public.mcp_tokens
  for select to authenticated using (user_id = auth.uid());
create policy "mcp_tokens insert own" on public.mcp_tokens
  for insert to authenticated with check (user_id = auth.uid());
create policy "mcp_tokens delete own" on public.mcp_tokens
  for delete to authenticated using (user_id = auth.uid());

-- ============================================================================
-- ChainWork — 0013_push_notifications.sql
-- Web Push support. Notifications are SENT by the Vercel API routes (/api/*)
-- using the service role, so the DB only needs to (a) store each device's push
-- subscription and (b) dedupe due-date reminders. No pg_net / webhooks / triggers
-- required — the actor's client calls /api/notify after each action.
-- ============================================================================

-- ===== PUSH SUBSCRIPTIONS (one row per device/browser) =====
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz default now()
);
create index on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- A user manages only their own subscriptions. The service role (used by the
-- Vercel endpoints to read everyone's subscriptions) bypasses RLS.
create policy "push_subscriptions select own" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "push_subscriptions insert own" on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());
create policy "push_subscriptions update own" on public.push_subscriptions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push_subscriptions delete own" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

-- ===== DUE-DATE REMINDER DEDUPE =====
-- One row per (todo, day-we-sent, kind). kind is 'before' (1 day before) or
-- 'due' (the morning it is due). Written only by the service role.
create table public.todo_reminders_sent (
  todo_id     uuid not null references public.todos (id) on delete cascade,
  remind_date date not null,
  kind        text not null default 'due',
  created_at  timestamptz default now(),
  primary key (todo_id, remind_date, kind)
);

alter table public.todo_reminders_sent enable row level security;
-- No policies on purpose: only the service role (bypasses RLS) reads/writes this.

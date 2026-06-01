-- ============================================================================
-- ChainWork — 0019_notifications.sql
-- In-app notification inbox ("Centro de notificaciones"). Rows are created ONLY
-- by SECURITY DEFINER trigger functions (which run as table owner and therefore
-- bypass RLS) — there is intentionally NO authenticated INSERT policy. Each
-- recipient may read / mark-read / delete only their own rows.
--
-- Triggers fan out a notification to a uuid[] of recipients, ALWAYS excluding
-- the actor (auth.uid()). Sources:
--   (a) new comment on a todo  -> other chain members
--   (b) todo status -> 'done'  -> the todo creator + its assignees
--   (c) new chain member       -> the existing members
-- All triggers guard a null auth.uid() (e.g. service-role / cron writes) and
-- never recurse (notifications has no trigger that writes to a source table).
--
-- PREREQUISITES (apply in numeric order): 0016_comments.sql must already exist
-- (this file creates an AFTER INSERT trigger on public.comments). todos.assignees
-- (0014) and users.display_name (0001) are also required.
-- ============================================================================

-- ===== TABLE =====
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  chain_id   uuid references public.chains (id) on delete cascade,
  actor_id   uuid references public.users (id) on delete set null,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  entity_id  uuid,
  read       boolean not null default false,
  created_at timestamptz default now()
);

-- ===== INDEXES (foreign keys + the inbox query) =====
create index on public.notifications (user_id);
create index on public.notifications (chain_id);
create index on public.notifications (actor_id);
-- The inbox reads "my newest first"; partial index speeds the unread count.
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx  on public.notifications (user_id) where read = false;

-- ===== RLS — recipient-only; NO insert policy (trigger functions only) =====
-- NOTE: do NOT enable FORCE row level security here — the SECURITY DEFINER
-- helper (owned by postgres) must bypass RLS to insert notifications for OTHER
-- users. With plain ENABLE, the table owner bypasses RLS as intended, while
-- authenticated users are fully constrained by the policies below.
alter table public.notifications enable row level security;

create policy "notifications select own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications update own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications delete own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- ===== Reusable fan-out helper =====
-- Inserts one notification per recipient in `recipients`, skipping the actor
-- (p_actor = auth.uid() at the call site) and any null/duplicate ids.
-- SECURITY DEFINER so it can insert despite the missing INSERT policy. A
-- null/empty recipient set is a no-op. Returns void (NOT a table) so the
-- RETURNS TABLE / ON CONFLICT OUT-name ambiguity gotcha does not apply.
create or replace function public.notify_fanout(
  recipients uuid[],
  p_actor    uuid,
  p_chain_id uuid,
  p_type     text,
  p_title    text,
  p_body     text,
  p_link     text,
  p_entity   uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if recipients is null or array_length(recipients, 1) is null then
    return;
  end if;

  insert into public.notifications (user_id, chain_id, actor_id, type, title, body, link, entity_id)
  select distinct r.uid, p_chain_id, p_actor, p_type, p_title, p_body, p_link, p_entity
  from   unnest(recipients) as r(uid)
  where  r.uid is not null
    and  (p_actor is null or r.uid <> p_actor);
end;
$$;

-- Authenticated users must NOT be able to call the fan-out helper directly
-- (that would let them forge notifications for arbitrary users). The default
-- EXECUTE grant goes to PUBLIC; revoke it. (anon is covered by the PUBLIC
-- revoke; restated explicitly for clarity.) Trigger functions below do NOT
-- need an EXECUTE grant — they run in the trigger/owner context.
revoke all on function public.notify_fanout(uuid[], uuid, uuid, text, text, text, text, uuid) from public;
revoke all on function public.notify_fanout(uuid[], uuid, uuid, text, text, text, text, uuid) from anon;

-- ===== (a) New comment on a todo -> notify other chain members =====
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor      uuid := auth.uid();
  v_recipients uuid[];
  v_todo_title text;
begin
  if v_actor is null then
    return new;
  end if;

  select array_agg(m.user_id)
    into v_recipients
  from public.chain_members m
  where m.chain_id = new.chain_id;

  select t.title into v_todo_title from public.todos t where t.id = new.todo_id;

  perform public.notify_fanout(
    v_recipients,
    v_actor,
    new.chain_id,
    'comment',
    'New comment',
    left(coalesce(v_todo_title, ''), 120),
    '/chain/' || new.chain_id::text,
    new.todo_id
  );
  return new;
end;
$$;

create trigger trg_notify_on_comment
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ===== (b) Todo status -> 'done' -> notify creator + assignees =====
create or replace function public.notify_on_todo_done()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor      uuid := auth.uid();
  v_recipients uuid[];
begin
  if v_actor is null then
    return new;
  end if;

  -- Only fire on a real transition INTO 'done'. (status is the public.todo_status
  -- enum; the 'done' literal is coerced to the enum type.)
  if new.status is distinct from 'done' or old.status is not distinct from new.status then
    return new;
  end if;

  -- creator + every assignee (fanout dedupes and drops the actor + nulls)
  v_recipients := array_append(coalesce(new.assignees, '{}'::uuid[]), new.created_by);

  perform public.notify_fanout(
    v_recipients,
    v_actor,
    new.chain_id,
    'todo_done',
    'Todo completed',
    left(coalesce(new.title, ''), 120),
    '/chain/' || new.chain_id::text,
    new.id
  );
  return new;
end;
$$;

create trigger trg_notify_on_todo_done
  after update of status on public.todos
  for each row execute function public.notify_on_todo_done();

-- ===== (c) New chain member -> notify existing members =====
-- Existing members = everyone in the chain EXCEPT the newly inserted row. This
-- exclusion is also what makes the chain-CREATOR's own self-join (inserted inside
-- the create_chain() SECURITY DEFINER RPC, where auth.uid() is the creator) a
-- harmless no-op: the only member at that instant is the creator == new.user_id,
-- so v_recipients is empty. Do not remove the `m.user_id <> new.user_id` guard.
create or replace function public.notify_on_member_join()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor      uuid := auth.uid();
  v_recipients uuid[];
  v_actor_name text;
begin
  if v_actor is null then
    return new;
  end if;

  select array_agg(m.user_id)
    into v_recipients
  from public.chain_members m
  where m.chain_id = new.chain_id
    and m.user_id <> new.user_id;

  select u.display_name into v_actor_name from public.users u where u.id = new.user_id;

  perform public.notify_fanout(
    v_recipients,
    v_actor,
    new.chain_id,
    'member_join',
    'New member joined',
    coalesce(v_actor_name, ''),
    '/chain/' || new.chain_id::text,
    new.user_id
  );
  return new;
end;
$$;

create trigger trg_notify_on_member_join
  after insert on public.chain_members
  for each row execute function public.notify_on_member_join();

-- ===== REALTIME =====
-- The inbox live-subscribes to its own notifications (filter user_id=eq.<me>).
-- RLS (notifications select own) scopes the change feed per user.
alter publication supabase_realtime add table public.notifications;
-- ============================================================================
-- ChainWork — 0001_schema.sql
-- Eight tables in public. RLS is enabled in 0003_rls.sql.
-- ============================================================================

-- ============ ENUMS ============
create type public.todo_status     as enum ('pending', 'in_progress', 'done');
create type public.attachment_type as enum ('repo', 'image', 'video', 'link');

-- ============ USERS (extends auth.users) ============
create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null,
  display_name text not null,
  bio          text,
  avatar_url   text,
  last_seen    timestamptz default now(),
  created_at   timestamptz default now()
);

-- ============ CHAINS ============
create table public.chains (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       char(8) unique not null,
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz default now()
);

-- ============ CHAIN MEMBERS ============
create table public.chain_members (
  id        uuid primary key default gen_random_uuid(),
  chain_id  uuid not null references public.chains (id) on delete cascade,
  user_id   uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz default now(),
  unique (chain_id, user_id)
);

-- ============ PROJECTS ============
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  chain_id    uuid not null references public.chains (id) on delete cascade,
  name        text not null,
  description text,
  created_by  uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz default now()
);

-- ============ TODOS ============
create table public.todos (
  id            uuid primary key default gen_random_uuid(),
  chain_id      uuid not null references public.chains (id) on delete cascade,
  project_id    uuid references public.projects (id) on delete cascade,
  title         text not null,
  description   text,
  status        public.todo_status not null default 'pending',
  assigned_to   uuid references public.users (id) on delete set null,
  due_date      date,
  completed_at  timestamptz,
  completed_by  uuid references public.users (id) on delete set null,
  order_index   integer not null default 0,
  created_by    uuid not null references public.users (id) on delete cascade,
  created_at    timestamptz default now()
);

-- ============ IDEAS ============
create table public.ideas (
  id          uuid primary key default gen_random_uuid(),
  chain_id    uuid not null references public.chains (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete cascade,
  title       text not null,
  description text,
  created_by  uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz default now()
);

-- ============ IDEA VOTES ============
create table public.idea_votes (
  id       uuid primary key default gen_random_uuid(),
  idea_id  uuid not null references public.ideas (id) on delete cascade,
  user_id  uuid not null references public.users (id) on delete cascade,
  vote     smallint not null check (vote in (-1, 1)),
  unique (idea_id, user_id)
);

-- ============ ATTACHMENTS ============
create table public.attachments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  type        public.attachment_type not null,
  url         text not null,
  title       text,
  uploaded_by uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz default now()
);

-- ============ INDEXES ============
create index on public.chain_members (user_id);
create index on public.chain_members (chain_id);
create index on public.projects (chain_id);
create index on public.todos (chain_id);
create index on public.todos (project_id);
create index on public.ideas (chain_id);
create index on public.ideas (project_id);
create index on public.idea_votes (idea_id);
create index on public.attachments (project_id);

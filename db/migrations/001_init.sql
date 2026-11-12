-- 001_init.sql — baseline schema.
-- Conventions (see docs/adr): every tenant table carries school_id and is protected by
-- row-level security; clinical observations and the audit log are append-only;
-- ids for sessions/observations are generated on the client so sync is idempotent.

do $$ begin
  if not exists (select from pg_roles where rolname = 'aba_app') then create role aba_app login; end if;
end $$;

-- ───────────────────────── request context (set per transaction by the API)
create function app_school() returns uuid language sql stable as
  $$ select nullif(current_setting('app.school_id', true), '')::uuid $$;
create function app_role() returns text language sql stable as
  $$ select coalesce(nullif(current_setting('app.role', true), ''), 'none') $$;
create function app_user() returns uuid language sql stable as
  $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

-- ───────────────────────── platform
create table schools (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  status     text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

create table sites (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  name       text not null,
  status     text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table users (
  id                   uuid primary key default gen_random_uuid(),
  school_id            uuid references schools on delete restrict,
  email                text not null,
  name                 text not null,
  role                 text not null check (role in ('system_admin','school_admin','bcba','rbt')),
  password_hash        text not null,
  status               text not null default 'active' check (status in ('active','deactivated')),
  must_change_password boolean not null default false,
  failed_attempts      int not null default 0,
  locked_until         timestamptz,
  last_login_at        timestamptz,
  tours_done           jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  check ((role = 'system_admin') = (school_id is null))
);
create unique index users_email_key on users (lower(email));

-- which sites a staff member works at (school admins: which sites they administer)
create table user_sites (
  user_id   uuid not null references users on delete cascade,
  site_id   uuid not null references sites on delete cascade,
  school_id uuid not null references schools on delete restrict,
  primary key (user_id, site_id)
);

create table refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users on delete cascade,
  family      uuid not null,               -- rotation chain; reuse of an old token revokes the family
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index on refresh_tokens (user_id);

-- ───────────────────────── clinical
create table students (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  site_id    uuid not null references sites on delete restrict,
  first_name text not null,
  last_name  text not null,
  birth_date date,
  status     text not null default 'active' check (status in ('active','discharged')),
  bcba_id    uuid references users on delete restrict,
  created_at timestamptz not null default now()
);
create index on students (school_id, site_id);

-- RBT ↔ student, with history (ended_at null = current)
create table staff_assignments (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  student_id uuid not null references students on delete restrict,
  user_id    uuid not null references users on delete restrict,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  created_by uuid references users
);
create unique index staff_assignments_current on staff_assignments (student_id, user_id) where ended_at is null;

create table plans (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  student_id uuid not null references students on delete restrict,
  name       text not null,
  status     text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now()
);

create table programs (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools on delete restrict,
  student_id  uuid not null references students on delete restrict,
  plan_id     uuid not null references plans on delete restrict,
  name        text not null,
  kind        text not null check (kind in ('trial','frequency','duration')),
  goal        text not null default 'increase' check (goal in ('increase','decrease')),
  domain      text not null default '',
  instruction text not null default '',     -- SD / operational definition shown to the RBT
  -- structured mastery rule: value compared per session, met in n of the last m sessions
  mastery     jsonb not null default '{"value":80,"n":3,"m":3,"min_trials":5}',
  status      text not null default 'active' check (status in ('active','paused','mastered','archived')),
  position    int not null default 0,
  created_by  uuid references users,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on programs (student_id);

create table targets (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  program_id uuid not null references programs on delete restrict,
  label      text not null,
  status     text not null default 'active' check (status in ('active','mastered','retired')),
  position   int not null default 0
);
create index on targets (program_id);

-- a phase starts at a point in time and runs until the next phase of the same program
create table phases (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  program_id uuid not null references programs on delete restrict,
  label      text not null,
  kind       text not null default 'intervention' check (kind in ('baseline','intervention','maintenance')),
  started_at timestamptz not null,
  note       text not null default '',
  created_by uuid references users,
  created_at timestamptz not null default now()
);
create index on phases (program_id, started_at);

create table annotations (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  program_id uuid not null references programs on delete restrict,
  at         timestamptz not null,
  kind       text not null default 'note' check (kind in ('note','treatment','context')),
  body       text not null check (length(body) between 1 and 500),
  created_by uuid references users,
  created_at timestamptz not null default now(),
  removed_at timestamptz
);
create index on annotations (program_id, at);

-- ───────────────────────── data collection
create table session_locks (
  student_id   uuid primary key references students on delete restrict,
  school_id    uuid not null references schools on delete restrict,
  holder_id    uuid not null references users,
  device_id    text not null,
  epoch        int not null default 1,
  acquired_at  timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  released_at  timestamptz
);

create table sessions (
  id           uuid primary key,              -- client-generated
  school_id    uuid not null references schools on delete restrict,
  student_id   uuid not null references students on delete restrict,
  user_id      uuid not null references users on delete restrict,
  device_id    text not null,
  kind         text not null default 'direct' check (kind in ('direct','probe')),
  setting      text not null default 'school' check (setting in ('school','home','community')),
  started_at   timestamptz not null,
  ended_at     timestamptz,
  lock_epoch   int,                           -- null = started offline (provisional lock)
  review_state text not null default 'live' check (review_state in ('live','pending','accepted','rejected')),
  review_why   text not null default '',      -- why it was queued
  review_note  text not null default '',
  reviewed_by  uuid references users,
  reviewed_at  timestamptz,
  note         text not null default '',
  received_at  timestamptz not null default now()
);
create index on sessions (student_id, started_at);
create index on sessions (school_id, review_state);

-- append-only: a mistake is fixed by a later 'void' row, never by update/delete
create table observations (
  id          uuid primary key,               -- client-generated
  school_id   uuid not null references schools on delete restrict,
  session_id  uuid not null references sessions on delete restrict,
  program_id  uuid not null references programs on delete restrict,
  target_id   uuid references targets on delete restrict,
  kind        text not null check (kind in ('trial','event','duration','window','void')),  -- window = how long a program was observed
  outcome     text check (outcome in ('correct','prompted','incorrect','no_response')),
  seconds     int check (seconds >= 0),
  voids       uuid references observations,   -- kind='void': the observation being voided
  corrects    uuid references observations,   -- set when this row replaces a voided one
  reason      text not null default '',
  user_id     uuid not null references users,
  recorded_at timestamptz not null,           -- device clock
  received_at timestamptz not null default now(),
  check ((kind = 'trial') = (outcome is not null)),
  check ((kind in ('duration','window')) = (seconds is not null)),
  check ((kind = 'void') = (voids is not null))
);
create index on observations (session_id);
create index on observations (program_id, recorded_at);
create index on observations (voids) where voids is not null;

-- ───────────────────────── audit (append-only)
create table audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  school_id  uuid,
  actor_id   uuid,
  actor_role text not null default '',
  action     text not null,
  entity     text not null default '',
  entity_id  text not null default '',
  detail     jsonb not null default '{}',
  ip         text not null default ''
);
create index on audit_log (school_id, at desc);
create index on audit_log (at desc);

-- ───────────────────────── privileges: the API connects as aba_app, never as owner
grant usage on schema public to aba_app;
grant select, insert, update, delete on
  schools, sites, users, user_sites, refresh_tokens, students, staff_assignments,
  plans, programs, targets, phases, annotations, session_locks, sessions to aba_app;
grant select, insert on observations, audit_log to aba_app;   -- no update, no delete

-- ───────────────────────── row-level security
-- Tenant rule: a row is visible only inside its own school.
-- System admins run the platform but get NO access to clinical tables (minimum necessary).
do $$
declare t text;
begin
  foreach t in array array['students','staff_assignments','plans','programs','targets','phases',
                           'annotations','session_locks','sessions','observations'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('create policy tenant on %I using (school_id = app_school()) with check (school_id = app_school())', t);
  end loop;
  foreach t in array array['sites','user_sites'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('create policy tenant on %I using (app_role() = ''system_admin'' or school_id = app_school())
                    with check (app_role() = ''system_admin'' or school_id = app_school())', t);
  end loop;
end $$;

alter table schools enable row level security;
alter table schools force row level security;
create policy read_own on schools for select using (app_role() = 'system_admin' or id = app_school());
create policy platform_write on schools for all using (app_role() = 'system_admin') with check (app_role() = 'system_admin');

-- users: 'auth' is the pre-login context used only by the auth module to look up an email
alter table users enable row level security;
alter table users force row level security;
create policy tenant on users
  using (app_role() in ('system_admin','auth') or school_id = app_school())
  with check (app_role() in ('system_admin','auth') or school_id = app_school());

alter table refresh_tokens enable row level security;
alter table refresh_tokens force row level security;
create policy own on refresh_tokens using (app_role() = 'auth' or user_id = app_user())
  with check (app_role() = 'auth' or user_id = app_user());

alter table audit_log enable row level security;
alter table audit_log force row level security;
create policy audit_read on audit_log for select using (app_role() = 'system_admin' or school_id = app_school());
create policy audit_write on audit_log for insert with check (true);

-- ───────────────────────── platform health without PHI access
-- Counts only; runs as owner so a system admin can verify writes without reading rows.
create function platform_row_counts() returns table (tbl text, total bigint, recent bigint)
language plpgsql security definer set search_path = public as $$
declare r record; ts text;
begin
  if app_role() <> 'system_admin' then raise exception 'forbidden'; end if;
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'schema_migrations' order by 1 loop
    ts := case r.relname
            when 'observations' then 'received_at' when 'sessions' then 'received_at'
            when 'audit_log' then 'at' when 'session_locks' then 'heartbeat_at'
            when 'user_sites' then null when 'programs' then 'updated_at' else 'created_at' end;
    tbl := r.relname;
    execute format('select count(*) from %I', r.relname) into total;
    if ts is null then recent := 0;
    else execute format('select count(*) from %I where %I > now() - interval ''5 minutes''', r.relname, ts) into recent;
    end if;
    return next;
  end loop;
end $$;
revoke all on function platform_row_counts() from public;
grant execute on function platform_row_counts() to aba_app;

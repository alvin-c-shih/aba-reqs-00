-- 005 — Phase 3 (family & teacher access, messaging, notifications, two-factor sign-in)
--       and Phase 4 (consent & media, program templates, school feature switches).

-- roles: parents/guardians and classroom teachers
alter table users drop constraint users_role_check;
alter table users add constraint users_role_check
  check (role in ('system_admin','school_admin','bcba','rbt','parent','teacher'));

-- two-factor sign-in (TOTP)
alter table users add column totp_secret text;
alter table users add column totp_enabled_at timestamptz;
alter table users add column recovery_codes jsonb not null default '[]';     -- sha256 hashes, single use

-- per-school switches for features that need an explicit decision (all off by default)
alter table schools add column settings jsonb not null default '{}';          -- {"ai": bool, "voice": bool}

-- a BCBA may allow a program to be recorded at home by the family
alter table programs add column home_ok boolean not null default false;

-- who, outside the clinical team, is connected to a student
create table student_contacts (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  student_id uuid not null references students on delete restrict,
  user_id    uuid not null references users on delete restrict,
  kind       text not null check (kind in ('guardian','teacher')),
  relation   text not null default '',
  home_data  boolean not null default false,   -- guardian may submit home data (always reviewed by the BCBA)
  created_at timestamptz not null default now(),
  ended_at   timestamptz
);
create unique index student_contacts_current on student_contacts (student_id, user_id) where ended_at is null;

-- what the BCBA has chosen to share with the family: a frozen snapshot, never live clinical data
create table family_summaries (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools on delete restrict,
  student_id   uuid not null references students on delete restrict,
  title        text not null,
  body         text not null,
  period_days  int not null,
  snapshot     jsonb not null default '[]',
  published_by uuid references users,
  published_at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create index on family_summaries (student_id, published_at desc);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  student_id uuid not null references students on delete restrict,
  author_id  uuid not null references users,
  audience   text not null check (audience in ('team','family','classroom')),   -- who can read the thread
  body       text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on messages (student_id, audience, created_at);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools on delete restrict,
  user_id    uuid not null references users on delete cascade,
  kind       text not null,
  text       text not null,
  link       text not null default '',
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index on notifications (user_id, read_at, created_at desc);

-- consent is recorded per student and per kind, with its source; media is refused without it
create table consents (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools on delete restrict,
  student_id  uuid not null references students on delete restrict,
  kind        text not null check (kind in ('photo','video')),
  granted_by  text not null,            -- name of the parent/guardian who signed
  source      text not null,            -- e.g. "Signed form, on file"
  granted_on  date not null,
  recorded_by uuid references users,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

create table media (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools on delete restrict,
  student_id  uuid not null references students on delete restrict,
  session_id  uuid references sessions on delete restrict,
  kind        text not null check (kind in ('photo','video')),
  mime        text not null,
  bytes       int not null,
  path        text not null,            -- relative to the media directory; never served directly
  caption     text not null default '',
  uploaded_by uuid references users,
  created_at  timestamptz not null default now(),
  removed_at  timestamptz
);
create index on media (student_id, created_at desc);

create table program_templates (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools on delete restrict,
  name        text not null,
  kind        text not null,
  goal        text not null,
  domain      text not null default '',
  instruction text not null default '',
  mastery     jsonb not null,
  config      jsonb not null default '{}',
  targets     jsonb not null default '[]',
  created_by  uuid references users,
  created_at  timestamptz not null default now()
);

grant select, insert, update, delete on student_contacts, family_summaries, messages, notifications, consents, media, program_templates to aba_app;
do $$
declare t text;
begin
  foreach t in array array['student_contacts','family_summaries','messages','notifications','consents','media','program_templates'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('create policy tenant on %I using (school_id = app_school()) with check (school_id = app_school())', t);
  end loop;
end $$;

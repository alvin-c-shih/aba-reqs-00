-- 003 — remember which analytic suggestions a BCBA dismissed, so they are not offered again.
create table dismissals (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools on delete restrict,
  program_id   uuid not null references programs on delete restrict,
  kind         text not null check (kind in ('change_point','unusual','recorder_gap','prompt_dependence')),
  key          text not null,           -- what was dismissed: a session id, or the phase it applied to
  dismissed_by uuid references users,
  created_at   timestamptz not null default now(),
  unique (program_id, kind, key)
);
grant select, insert, delete on dismissals to aba_app;
alter table dismissals enable row level security;
alter table dismissals force row level security;
create policy tenant on dismissals using (school_id = app_school()) with check (school_id = app_school());

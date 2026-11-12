-- 004 — Phase 2 recording methods: interval recording, ABC data, task analysis.
alter table programs add column config jsonb not null default '{}';
-- interval: {"method":"partial|whole|momentary","seconds":30,"count":20}
-- abc:      {"antecedents":[…],"consequences":[…]}
-- task:     {"chaining":"forward|backward|total"}   (steps are the program's targets, in order)

alter table observations add column hit boolean;          -- interval: behaviour scored in this interval
alter table observations add column data jsonb;           -- abc: {antecedent, behavior, consequence, note}

do $$
declare r record;
begin
  for r in select conname from pg_constraint where contype = 'c' and conrelid in ('observations'::regclass, 'programs'::regclass)
           and pg_get_constraintdef(oid) ~ '\mkind\M' loop
    execute format('alter table %s drop constraint %I',
                   (select conrelid::regclass from pg_constraint where conname = r.conname limit 1), r.conname);
  end loop;
end $$;

alter table programs add constraint programs_kind_check
  check (kind in ('trial','frequency','duration','interval','abc','task'));
alter table observations
  add constraint observations_kind_check check (kind in ('trial','event','duration','window','void','interval','abc','step')),
  add constraint observations_outcome_rule check ((kind in ('trial','step')) = (outcome is not null)),
  add constraint observations_seconds_rule check ((kind in ('duration','window')) = (seconds is not null)),
  add constraint observations_void_rule check ((kind = 'void') = (voids is not null)),
  add constraint observations_interval_rule check ((kind = 'interval') = (hit is not null)),
  add constraint observations_abc_rule check ((kind = 'abc') = (data is not null));

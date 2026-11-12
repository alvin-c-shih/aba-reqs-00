-- demo.sql — resettable demo dataset. Run as the database owner (the API's reset endpoint
-- and `make reset` do this). All dates are relative to now(), so the data never goes stale.
--
-- Requires:  select set_config('seed.password_hash', '<argon2 hash>', false);
-- Deterministic: setseed() fixes the pseudo-random noise, so every reset yields the same curves.
--
-- Cast: 2 schools (tenant isolation), Bridgeway has 2 sites. 1 system admin, 2 school admins,
-- 1 BCBA, 2 RBTs. 5 Bridgeway students, one per clinical scenario:
--   Ava M.  mastered            Ben T.  no progress → plan change → improving (3 phases)
--   Dee K.  regression          Eli R.  new, baseline only
--   Cam S.  highly variable + a stale program

truncate program_templates, media, consents, notifications, messages, family_summaries, student_contacts, dismissals, audit_log, observations, sessions, session_locks, annotations, phases, targets, programs,
         plans, staff_assignments, students, refresh_tokens, user_sites, users, sites, schools
         restart identity cascade;

select setseed(0.42);

insert into schools (id, name, slug) values
  ('a0000000-0000-4000-8000-000000000001', 'Bridgeway Academy', 'bridgeway'),
  ('a0000000-0000-4000-8000-000000000002', 'Lakeshore Learning Center', 'lakeshore');

insert into sites (id, school_id, name) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'East Harlem'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Bronx'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'Main Campus');

insert into users (id, school_id, email, name, role, password_hash) values
  ('c0000000-0000-4000-8000-000000000001', null, 'sam.okafor@aba-platform.example', 'Sam Okafor', 'system_admin', current_setting('seed.password_hash')),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'priya.raman@bridgeway.example', 'Priya Raman', 'school_admin', current_setting('seed.password_hash')),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'anita.nair@bridgeway.example', 'Dr. Anita Nair', 'bcba', current_setting('seed.password_hash')),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'marcus.rivera@bridgeway.example', 'Marcus Rivera', 'rbt', current_setting('seed.password_hash')),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'jo.chen@bridgeway.example', 'Jo Chen', 'rbt', current_setting('seed.password_hash')),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'lena.fischer@lakeshore.example', 'Lena Fischer', 'school_admin', current_setting('seed.password_hash')),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000002', 'omar.haddad@lakeshore.example', 'Omar Haddad', 'bcba', current_setting('seed.password_hash')),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 'linh.tran@family.example', 'Linh Tran', 'parent', current_setting('seed.password_hash')),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'grace.adeyemi@bridgeway.example', 'Grace Adeyemi', 'teacher', current_setting('seed.password_hash'));

-- Bridgeway has switched on local-model drafts and voice notes; Lakeshore has not (the default)
update schools set settings = '{"ai": true, "voice": true}' where slug = 'bridgeway';

insert into user_sites (user_id, site_id, school_id)
select u.id, s.id, s.school_id from users u join sites s on s.school_id = u.school_id
where u.name not in ('Jo Chen', 'Linh Tran', 'Grace Adeyemi') or s.name = 'East Harlem';

insert into students (id, school_id, site_id, first_name, last_name, birth_date, bcba_id) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Ava', 'Morales', current_date - 2500, 'c0000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Ben', 'Tran',    current_date - 2900, 'c0000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'Dee', 'Kowalski', current_date - 3300, 'c0000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'Eli', 'Reyes',   current_date - 2100, 'c0000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Cam', 'Silva',   current_date - 3000, 'c0000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003', 'Noa', 'Berg',    current_date - 2700, 'c0000000-0000-4000-8000-000000000007');

-- Marcus works with all five; Jo also covers Ben (drives the lock-takeover demo)
insert into staff_assignments (school_id, student_id, user_id, started_at, created_by)
select school_id, id, 'c0000000-0000-4000-8000-000000000004', now() - interval '80 days', bcba_id
from students where school_id = 'a0000000-0000-4000-8000-000000000001';
insert into staff_assignments (school_id, student_id, user_id, started_at, created_by) values
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000005', now() - interval '30 days', 'c0000000-0000-4000-8000-000000000003');

insert into plans (school_id, student_id, name)
select school_id, id, to_char(now(), 'YYYY') || '–' || to_char(now() + interval '1 year', 'YY') || ' Treatment Plan' from students;

-- ── programs, phases and per-phase curves ────────────────────────────────────
-- spec columns: student, program, kind, goal, domain, instruction, mastery, targets,
--   phases: [label, kind, sessions, from, to, noise, note, hidden?, prompt_from?, prompt_to?]   (values: % / count / seconds)
--     hidden = true: the data shifts but no phase line is recorded (exercises change-point suggestions)
--     prompt_from/to: share of non-correct trials that are 'prompted', drifting across the phase
--   stale_days: last session this many days ago (0 = up to date)
create temp table seed_spec (ord int, student text, name text, kind text, goal text, domain text,
                             instruction text, mastery jsonb, targets text[], phases jsonb, stale_days int) on commit drop;
insert into seed_spec values
 (1,'Ava','Receptive ID: colors','trial','increase','Language',
  'Lay out 3 colour cards. Say “Touch <colour>”. Reinforce independent responses.',
  '{"value":80,"n":3,"m":3,"min_trials":8}', '{red,blue,green,yellow}',
  '[["Baseline","baseline",4,20,30,8,""],["Least-to-most prompting","intervention",8,40,75,9,"Introduced least-to-most prompt hierarchy"],["Prompt fading","intervention",7,78,95,5,"Faded to gestural prompts only"]]', 0),
 (2,'Ava','On-task during seat work','duration','increase','Attending',
  'Start the timer when Ava is oriented to materials; stop when she looks away for 3+ seconds.',
  '{"value":480,"n":3,"m":4,"min_trials":1}', '{}',
  '[["Baseline","baseline",4,90,120,25,""],["Visual schedule","intervention",15,150,560,45,"Added visual schedule and first/then board"]]', 0),
 (3,'Ben','Manding for preferred items','trial','increase','Communication',
  'Hold a preferred item in view. Wait 5 s for an independent request (sign or vocal).',
  '{"value":80,"n":3,"m":3,"min_trials":8}', '{juice,ball,tablet,swing}',
  '[["Baseline","baseline",4,10,15,6,""],["Vocal prompt + delay","intervention",8,30,34,7,"Vocal model with 5 s time delay"],["PECS phase 2","intervention",7,40,72,7,"No progress after 8 sessions — switched response form to picture exchange"]]', 0),
 (4,'Ben','Elopement from work area','frequency','decrease','Behavior reduction',
  'Count each time Ben moves more than 2 m from the work area without permission.',
  '{"value":1,"n":3,"m":3,"min_trials":0}', '{}',
  '[["Baseline","baseline",5,7,8,1.5,""],["FCT: break card","intervention",14,6,1,1.2,"Taught “break” card as replacement behaviour"]]', 0),
 (5,'Dee','Two-step instructions','trial','increase','Listener responding',
  'Give a two-step instruction once (e.g. “Get your folder and sit down”). No repeats.',
  '{"value":80,"n":3,"m":3,"min_trials":8}', '{"folder + sit","coat + line up","book + table"}',
  '[["Baseline","baseline",3,25,30,6,""],["Modeling + reinforcement","intervention",9,45,82,6,"Model first, then independent opportunity"],["After winter break","intervention",7,70,38,7,"Returned from 2-week break; new classroom"]]', 0),
 (6,'Dee','Aggression (hit/kick)','frequency','decrease','Behavior reduction',
  'One instance = any hit or kick that makes contact with another person.',
  '{"value":1,"n":3,"m":3,"min_trials":0}', '{}',
  '[["Baseline","baseline",4,5,6,1.2,""],["DRA + response block","intervention",15,5,4.6,0.9,"Differential reinforcement of asking for help"]]', 0),
 (7,'Eli','Imitation: gross motor','trial','increase','Imitation',
  'Say “Do this” and model the action. Reinforce a match within 3 s.',
  '{"value":80,"n":3,"m":3,"min_trials":8}', '{"clap","arms up","tap table","stomp"}',
  '[["Baseline","baseline",3,20,25,7,""]]', 0),
 (8,'Eli','Tantrum duration','duration','decrease','Behavior reduction',
  'Time from the first cry/drop to 30 s of calm.',
  '{"value":60,"n":3,"m":3,"min_trials":0}', '{}',
  '[["Baseline","baseline",3,420,460,60,""]]', 0),
 (9,'Cam','Tacting: common objects','trial','increase','Language',
  'Hold up the object and ask “What is it?”.',
  '{"value":80,"n":3,"m":3,"min_trials":8}', '{cup,shoe,spoon,book,car}',
  '[["Baseline","baseline",3,30,35,6,""],["Errorless teaching","intervention",12,50,55,48,"Errorless prompting with transfer trials"]]', 0),
 (10,'Cam','Requesting a break','frequency','increase','Communication',
  'Count each independent break request (card or vocal).',
  '{"value":4,"n":3,"m":3,"min_trials":0}', '{}',
  '[["Baseline","baseline",4,0,1,0.6,""],["Break card training","intervention",6,1,3,0.8,"Prompted card exchange, fading prompts"]]', 12),
 (11,'Noa','Matching: identical objects','trial','increase','Visual performance',
  'Place 3 objects; hand over a match and say “Match”.',
  '{"value":80,"n":3,"m":3,"min_trials":8}', '{cup,block,sock}',
  '[["Baseline","baseline",3,35,40,6,""],["Reduced array","intervention",6,50,70,7,"Array of 2, then 3"]]', 0),
 -- an unmarked jump half-way through the phase → "possible change point" suggestion
 (12,'Ben','Following group instructions','trial','increase','Listener responding',
  'Give the instruction to the whole group once. Score Ben''s first response.',
  '{"value":80,"n":3,"m":3,"min_trials":8}', '{"line up","sit on carpet","hands on head"}',
  '[["Baseline","baseline",4,20,22,5,""],["Visual cue cards","intervention",7,32,36,5,"Cue card shown with each group instruction"],["(unmarked)","intervention",7,62,66,5,"",true]]', 0),
 -- independent responding flat while prompting climbs → "prompt dependence" flag
 (13,'Cam','Hand washing: full sequence','trial','increase','Daily living',
  'Say “Wash your hands”. Score the whole sequence as one trial.',
  '{"value":80,"n":3,"m":3,"min_trials":8}', '{}',
  '[["Baseline","baseline",3,30,32,4,""],["Most-to-least prompting","intervention",10,40,42,4,"Full physical prompt, fading to gestural",false,0.2,0.95]]', 0),
 -- Phase 2 recording methods
 (14,'Dee','Out of seat (partial interval)','interval','decrease','Behavior reduction',
  'Every 30 seconds: was Dee out of her seat at any point in the interval?',
  '{"value":10,"n":3,"m":3,"min_trials":0}', '{}',
  '[["Baseline","baseline",4,60,65,6,""],["Scheduled movement breaks","intervention",10,55,20,6,"Two-minute movement break every 15 minutes"]]', 0),
 (15,'Dee','Aggression: ABC log','abc','decrease','Behavior reduction',
  'For each incident note what happened just before and just after.',
  '{"value":1,"n":3,"m":3,"min_trials":0}', '{}',
  '[["Functional assessment","baseline",8,3,4,1,"Collecting ABC data to identify the function of the behaviour"]]', 0),
 (16,'Ava','Brushing teeth','task','increase','Daily living',
  'Give the instruction once. Score each step; prompt only after 5 seconds.',
  '{"value":80,"n":3,"m":3,"min_trials":0}', '{"Pick up toothbrush","Wet brush","Apply toothpaste","Brush top teeth","Brush bottom teeth","Spit","Rinse brush","Put brush away"}',
  '[["Baseline","baseline",3,25,30,5,""],["Forward chaining","intervention",9,38,78,6,"Teach steps in order; prompt the rest"]]', 0);

do $$
declare
  sp record; ph jsonb; st students%rowtype; prog uuid; plan uuid; tgt uuid[]; rbt uuid;
  total int; idx int; pi int; n int; v float; t timestamptz; sess uuid; days int[]; d int; k int; i int;
  kcorrect int; oc text; secs int; ph_start timestamptz; pshare float; srbt uuid;
begin
  for sp in select * from seed_spec order by ord loop
    select * into st from students where first_name = sp.student;
    select id into plan from plans where student_id = st.id;
    rbt := case when st.school_id = 'a0000000-0000-4000-8000-000000000001'
                then 'c0000000-0000-4000-8000-000000000004'::uuid else st.bcba_id end;
    -- stable ids so tours, tests and docs can link straight to a program
    insert into programs (id, school_id, student_id, plan_id, name, kind, goal, domain, instruction, mastery, position, created_by, created_at)
      values (('f0000000-0000-4000-8000-' || lpad(sp.ord::text, 12, '0'))::uuid, st.school_id, st.id, plan, sp.name, sp.kind, sp.goal, sp.domain, sp.instruction, sp.mastery, sp.ord, st.bcba_id, now() - interval '75 days')
      returning id into prog;
    tgt := '{}';
    for i in 1 .. coalesce(array_length(sp.targets, 1), 0) loop
      insert into targets (school_id, program_id, label, position) values (st.school_id, prog, sp.targets[i], i);
    end loop;
    select coalesce(array_agg(id order by position), '{}') into tgt from targets where program_id = prog;

    -- weekdays going back from (stale_days) — newest first
    select sum((p->>2)::int) into total from jsonb_array_elements(sp.phases) p;
    days := '{}'; d := greatest(sp.stale_days, 1);
    while coalesce(array_length(days, 1), 0) < total loop
      if extract(isodow from current_date - d) < 6 and (d % 7) not in (3) then days := days || d; end if;
      d := d + 1;
    end loop;

    idx := 0; pi := 0;
    for ph in select * from jsonb_array_elements(sp.phases) loop
      n := (ph->>2)::int; pi := pi + 1;
      ph_start := date_trunc('day', now()) - make_interval(days => days[total - idx]) + interval '8 hours';
      if coalesce((ph->>7)::boolean, false) is not true then
        insert into phases (school_id, program_id, label, kind, started_at, note, created_by)
          values (st.school_id, prog, ph->>0, ph->>1, ph_start, ph->>6, st.bcba_id);
      end if;
      for i in 1 .. n loop
        idx := idx + 1;
        v := (ph->>3)::float + ((ph->>4)::float - (ph->>3)::float) * (i - 1) / greatest(n - 1, 1)
             + (random() * 2 - 1) * (ph->>5)::float;
        t := date_trunc('day', now()) - make_interval(days => days[total - idx + 1]) + interval '9 hours' + make_interval(mins => sp.ord * 17);
        -- one session per student per day: reuse if another program already created it
        select id into sess from sessions where student_id = st.id and started_at::date = t::date limit 1;
        if sess is null then
          sess := gen_random_uuid();
          -- Jo covers every other recent session with Ben (exercises the recorder-difference flag)
          srbt := case when sp.student = 'Ben' and days[total - idx + 1] <= 10 and idx % 2 = 0
                       then 'c0000000-0000-4000-8000-000000000005'::uuid else rbt end;
          insert into sessions (id, school_id, student_id, user_id, device_id, started_at, ended_at, lock_epoch, received_at)
            values (sess, st.school_id, st.id, srbt, 'seed-device', t, t + interval '45 minutes', 1, t + interval '46 minutes');
        end if;
        select user_id into srbt from sessions where id = sess;
        if sp.kind = 'trial' then
          kcorrect := greatest(0, least(10, round(v / 10.0)::int));
          -- Jo scores Ben's manding trials more generously than Marcus
          if srbt <> rbt and sp.ord = 3 then kcorrect := least(10, kcorrect + 3); end if;
          pshare := case when ph->>8 is null then 0.55
                         else (ph->>8)::float + ((ph->>9)::float - (ph->>8)::float) * (i - 1) / greatest(n - 1, 1) end;
          for k in 1 .. 10 loop
            oc := case when k <= kcorrect then 'correct'
                       when random() < pshare then 'prompted' when random() < 0.8 then 'incorrect' else 'no_response' end;
            insert into observations (id, school_id, session_id, program_id, target_id, kind, outcome, user_id, recorded_at, received_at)
              values (gen_random_uuid(), st.school_id, sess, prog, tgt[1 + (k % greatest(array_length(tgt, 1), 1))], 'trial', oc, srbt,
                      t + make_interval(secs => ((k * 37 + i * 11) % 10) * 40 + k), t + interval '46 minutes');
          end loop;
        else
          insert into observations (id, school_id, session_id, program_id, kind, seconds, user_id, recorded_at, received_at)
            values (gen_random_uuid(), st.school_id, sess, prog, 'window', 2700, rbt, t + interval '45 minutes', t + interval '46 minutes');
        end if;
        if sp.kind = 'trial' then null;
        elsif sp.kind = 'interval' then
          for k in 1 .. 20 loop
            insert into observations (id, school_id, session_id, program_id, kind, hit, user_id, recorded_at, received_at)
              values (gen_random_uuid(), st.school_id, sess, prog, 'interval', ((k * 7 + i * 3) % 20) < round(v / 5.0), srbt,
                      t + make_interval(secs => k * 30), t + interval '46 minutes');
          end loop;
        elsif sp.kind = 'abc' then
          for k in 1 .. greatest(0, round(v)::int) loop
            insert into observations (id, school_id, session_id, program_id, kind, data, user_id, recorded_at, received_at)
              values (gen_random_uuid(), st.school_id, sess, prog, 'abc', jsonb_build_object(
                        'antecedent', (array['Asked to stop a preferred activity','Asked to stop a preferred activity','Asked to stop a preferred activity','Task demand','Task demand','Peer took an item','Waiting'])[1 + floor(random() * 7)::int],
                        'behavior', (array['Hit','Hit','Kick'])[1 + floor(random() * 3)::int],
                        'consequence', (array['Activity continued','Activity continued','Activity continued','Adult attention','Adult attention','Task removed','Redirected'])[1 + floor(random() * 7)::int]),
                      srbt, t + make_interval(mins => k * 6), t + interval '46 minutes');
          end loop;
        elsif sp.kind = 'task' then
          for k in 1 .. coalesce(array_length(tgt, 1), 0) loop
            insert into observations (id, school_id, session_id, program_id, target_id, kind, outcome, user_id, recorded_at, received_at)
              values (gen_random_uuid(), st.school_id, sess, prog, tgt[k], 'step',
                      case when k <= round(v / 100.0 * array_length(tgt, 1)) then 'correct' else 'prompted' end,
                      srbt, t + make_interval(secs => k * 25), t + interval '46 minutes');
          end loop;
        elsif sp.kind = 'frequency' then
          for k in 1 .. greatest(0, round(v)::int) loop
            insert into observations (id, school_id, session_id, program_id, kind, user_id, recorded_at, received_at)
              values (gen_random_uuid(), st.school_id, sess, prog, 'event', rbt, t + make_interval(mins => k * 3), t + interval '46 minutes');
          end loop;
        else
          secs := greatest(5, round(v)::int);
          insert into observations (id, school_id, session_id, program_id, kind, seconds, user_id, recorded_at, received_at)
            values (gen_random_uuid(), st.school_id, sess, prog, 'duration', secs, rbt, t + interval '5 minutes', t + interval '46 minutes');
        end if;
      end loop;
    end loop;
  end loop;
end $$;

update programs set config = '{"method":"partial","seconds":30,"count":20}' where kind = 'interval';
update programs set config = '{"chaining":"forward"}' where kind = 'task';
update programs set config = '{"antecedents":["Asked to stop a preferred activity","Task demand","Peer took an item","Waiting","Transition"],"consequences":["Activity continued","Adult attention","Task removed","Redirected","Ignored"]}' where kind = 'abc';

-- family & classroom: Ben's parent (may send home counts) and the East Harlem classroom teacher
insert into student_contacts (school_id, student_id, user_id, kind, relation, home_data) values
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000008', 'guardian', 'Mother', true),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000009', 'teacher', 'Classroom teacher', false),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000009', 'teacher', 'Classroom teacher', false),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000009', 'teacher', 'Classroom teacher', false);
insert into programs (id, school_id, student_id, plan_id, name, kind, goal, domain, instruction, mastery, position, created_by, home_ok, created_at)
select 'f0000000-0000-4000-8000-000000000017', st.school_id, st.id, pl.id, 'Asking for help (home & school)', 'frequency', 'increase', 'Communication',
       'Count each time Ben asks for help with words or his card, without being reminded.', '{"value":5,"n":3,"m":3,"min_trials":0}', 17, st.bcba_id, true, now() - interval '20 days'
from students st join plans pl on pl.student_id = st.id where st.first_name = 'Ben';
insert into phases (school_id, program_id, label, kind, started_at, created_by)
select school_id, id, 'Baseline', 'baseline', now() - interval '20 days', created_by from programs where id = 'f0000000-0000-4000-8000-000000000017';

insert into messages (school_id, student_id, author_id, audience, body, created_at) values
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'family', 'Hello Ms. Tran — Ben started using picture cards to ask for things this month and it is going well. If you would like a set for home, tell me which items matter most to him.', now() - interval '3 days'),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000008', 'family', 'Thank you! Juice, the tablet and going outside. He has started bringing me the juice card on his own.', now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000004', 'team', 'Tablet is by far the strongest reinforcer this week. Swing only works before lunch.', now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000009', 'classroom', 'Ben left the carpet twice during morning circle today, both times when the group got loud.', now() - interval '5 hours');
insert into notifications (school_id, user_id, kind, text, link, created_at) values
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'message', 'New message from Grace Adeyemi about Ben', '/clinic/students/d0000000-0000-4000-8000-000000000002', now() - interval '5 hours'),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'review', 'A session for Ben is waiting for your review', '/clinic/review', now() - interval '18 hours'),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000008', 'summary', 'A new progress summary for Ben is ready', '/family/d0000000-0000-4000-8000-000000000002', now() - interval '6 days');

insert into family_summaries (school_id, student_id, title, body, period_days, snapshot, published_by, published_at) values
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'October progress',
   E'Ben had a good month. The biggest change is how he asks for things: we moved from spoken prompts to picture cards, and he now hands over a card on his own for about half of his requests, up from almost none.\n\nHe is also leaving the work area much less often now that he has a “break” card to use instead.\n\nNext month we will keep building on the picture cards and start practising asking for help.',
   30, '[{"name":"Asking for things he wants","domain":"Communication","plain":"Making progress","kind":"trial","criterion":80,"values":[10,10,30,30,30,40,40,50,60]},{"name":"Staying in the work area","domain":"Behavior","plain":"Making progress","kind":"frequency","criterion":1,"values":[8,7,9,6,5,4,3,3,2]}]',
   'c0000000-0000-4000-8000-000000000003', now() - interval '6 days');

insert into consents (school_id, student_id, kind, granted_by, source, granted_on, recorded_by) values
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'photo', 'Linh Tran', 'Signed media consent form, on file in the office', current_date - 40, 'c0000000-0000-4000-8000-000000000003');

insert into program_templates (school_id, name, kind, goal, domain, instruction, mastery, config, targets, created_by) values
  ('a0000000-0000-4000-8000-000000000001', 'Manding with picture exchange', 'trial', 'increase', 'Communication', 'Hold a preferred item in view. Wait 5 s for an independent exchange.', '{"value":80,"n":3,"m":3,"min_trials":8}', '{}', '["juice","ball","tablet"]', 'c0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000001', 'Out of seat — partial interval', 'interval', 'decrease', 'Behavior reduction', 'Every 30 seconds: was the student out of seat at any point?', '{"value":10,"n":3,"m":3,"min_trials":0}', '{"method":"partial","seconds":30,"count":20}', '[]', 'c0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000001', 'Hand washing — task analysis', 'task', 'increase', 'Daily living', 'Give the instruction once. Score each step.', '{"value":80,"n":3,"m":3,"min_trials":0}', '{"chaining":"forward"}', '["Turn on water","Wet hands","Apply soap","Scrub 20 seconds","Rinse","Turn off water","Dry hands"]', 'c0000000-0000-4000-8000-000000000003');

-- family-facing names say what is counted: for a behaviour to reduce, name the behaviour, not its opposite (ASSUMPTIONS D20)
update programs p set plain_name = x.plain from (values
  ('Manding for preferred items', 'Asking for things he wants'), ('Elopement from work area', 'Leaving the work area'),
  ('Following group instructions', 'Following instructions given to the group'), ('Asking for help (home & school)', 'Asking for help'),
  ('Receptive ID: colors', 'Pointing to colours when asked'), ('On-task during seat work', 'Staying with a task at her desk'), ('Brushing teeth', 'Brushing her teeth'),
  ('Tacting: common objects', 'Naming everyday objects'), ('Requesting a break', 'Asking for a break'), ('Hand washing: full sequence', 'Washing hands'),
  ('Two-step instructions', 'Following two-step instructions'), ('Aggression (hit/kick)', 'Hitting or kicking'), ('Out of seat (partial interval)', 'Getting out of her seat'),
  ('Aggression: ABC log', 'Understanding what leads to hitting'), ('Imitation: gross motor', 'Copying actions'), ('Tantrum duration', 'How long tantrums last')
) as x(name, plain) where p.name = x.name;

-- Ava's colours program met criterion: mark it mastered so the lifecycle is visible
update programs set status = 'mastered' where name = 'Receptive ID: colors';

-- one clearly unusual session: aggression spikes on a single day, well inside the phase
insert into observations (id, school_id, session_id, program_id, kind, user_id, recorded_at, received_at)
select gen_random_uuid(), p.school_id, x.id, p.id, 'event', x.user_id, x.started_at + make_interval(mins => 20 + g), x.started_at + interval '46 minutes'
from programs p
join lateral (select s.id, s.user_id, s.started_at from sessions s where s.student_id = p.student_id
              order by s.started_at desc offset 9 limit 1) x on true,
     generate_series(1, 7) g
where p.name = 'Aggression (hit/kick)';

-- annotations: context an analyst wants on the graph without cluttering it
insert into annotations (school_id, program_id, at, kind, body, created_by)
select p.school_id, p.id, (select started_at from sessions s where s.student_id = p.student_id order by started_at desc offset x.back limit 1) + interval '10 minutes',
       x.kind, x.body, st.bcba_id
from (values
  ('Manding for preferred items', 9, 'context',   'Fire drill — session cut short'),
  ('Manding for preferred items', 3, 'treatment', 'Added tablet as a new reinforcer after preference assessment'),
  ('Two-step instructions',       5, 'context',   'Substitute teacher all week'),
  ('Aggression (hit/kick)',       8, 'treatment', 'Team trained on response blocking'),
  ('Tacting: common objects',     6, 'context',   'Poor sleep reported by parent'),
  ('On-task during seat work',    4, 'note',      'Moved desk away from window')
) as x(prog, back, kind, body)
join programs p on p.name = x.prog join students st on st.id = p.student_id;

-- one session recorded without a valid lock → waits in the BCBA review queue
with s as (
  insert into sessions (id, school_id, student_id, user_id, device_id, started_at, ended_at, lock_epoch, review_state, review_why, received_at)
  values ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002',
          'c0000000-0000-4000-8000-000000000005', 'jo-tablet', now() - interval '20 hours', now() - interval '19 hours 30 minutes', null,
          'pending', 'Started offline while Marcus Rivera held the session lock', now() - interval '18 hours')
  returning id, school_id, student_id, user_id, started_at)
insert into observations (id, school_id, session_id, program_id, target_id, kind, outcome, user_id, recorded_at)
select gen_random_uuid(), s.school_id, s.id, p.id, (select id from targets where program_id = p.id order by position limit 1), 'trial',
       (array['correct','correct','prompted','correct','incorrect','correct','correct','prompted','correct','correct'])[g],
       s.user_id, s.started_at + make_interval(mins => g)
from s join programs p on p.student_id = s.student_id and p.kind = 'trial', generate_series(1, 10) g;

insert into audit_log (school_id, actor_id, actor_role, action, entity, detail)
values (null, null, 'system', 'demo.reset', 'database', jsonb_build_object('seed', 'demo.sql'));

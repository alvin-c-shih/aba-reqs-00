-- 006 — a school admin may update their own school's row (used for the feature switches in settings).
-- Creating, suspending and renaming schools stays with the system admin in the application layer.
create policy school_self_update on schools for update
  using (app_role() = 'school_admin' and id = app_school())
  with check (app_role() = 'school_admin' and id = app_school());

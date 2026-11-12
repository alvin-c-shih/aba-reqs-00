-- 002 — platform_row_counts(): find each table's "last written" column instead of assuming one.
create or replace function platform_row_counts() returns table (tbl text, total bigint, recent bigint)
language plpgsql security definer set search_path = public as $$
declare r record; ts text;
begin
  if app_role() <> 'system_admin' then raise exception 'forbidden'; end if;
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'schema_migrations' order by 1 loop
    select col into ts from unnest(array['received_at','at','updated_at','heartbeat_at','created_at','started_at']) with ordinality as p(col, ord)
      where exists (select 1 from information_schema.columns k
                    where k.table_schema = 'public' and k.table_name = r.relname and k.column_name = p.col)
      order by ord limit 1;
    tbl := r.relname;
    execute format('select count(*) from %I', r.relname) into total;
    if ts is null then recent := 0;
    else execute format('select count(*) from %I where %I > now() - interval ''5 minutes''', r.relname, ts) into recent;
    end if;
    return next;
  end loop;
end $$;

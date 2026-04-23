-- Make ALL related foreign keys cascade-delete for user data chain.
-- Run in Supabase SQL Editor.
--
-- Targets any FK in schema public that references one of:
--   auth.users, public.profiles, public.vendor_profiles, public.products
--
-- This is dynamic and works even if FK names differ.

begin;

do $$
declare
  r record;
  def_sql text;
begin
  for r in
    select
      c.oid,
      n.nspname as child_schema,
      t.relname as child_table,
      c.conname as fk_name,
      pg_get_constraintdef(c.oid, true) as fk_def,
      c.confdeltype
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.contype = 'f'
      and n.nspname = 'public'
      and c.confrelid in (
        'auth.users'::regclass,
        'public.profiles'::regclass,
        'public.vendor_profiles'::regclass,
        'public.products'::regclass
      )
  loop
    -- Skip if already CASCADE
    if r.confdeltype = 'c' then
      continue;
    end if;

    def_sql := r.fk_def;

    if def_sql ~* 'on delete (no action|restrict|set null|set default|cascade)' then
      def_sql := regexp_replace(def_sql, 'on delete (no action|restrict|set null|set default|cascade)', 'ON DELETE CASCADE', 'i');
    else
      def_sql := def_sql || ' ON DELETE CASCADE';
    end if;

    execute format('alter table %I.%I drop constraint %I', r.child_schema, r.child_table, r.fk_name);
    execute format('alter table %I.%I add constraint %I %s', r.child_schema, r.child_table, r.fk_name, def_sql);
  end loop;
end $$;

commit;

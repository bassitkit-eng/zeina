-- Diagnose blockers for deleting users from auth.users
-- Run in Supabase SQL Editor.

-- 1) Show all relevant foreign keys and ON DELETE rule
select
  n.nspname as child_schema,
  t.relname as child_table,
  c.conname as fk_name,
  rn.nspname as parent_schema,
  rt.relname as parent_table,
  case c.confdeltype
    when 'c' then 'CASCADE'
    when 'r' then 'RESTRICT'
    when 'n' then 'SET NULL'
    when 'd' then 'SET DEFAULT'
    when 'a' then 'NO ACTION'
  end as on_delete,
  pg_get_constraintdef(c.oid, true) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
join pg_class rt on rt.oid = c.confrelid
join pg_namespace rn on rn.oid = rt.relnamespace
where c.contype = 'f'
  and n.nspname = 'public'
  and c.confrelid in (
    'auth.users'::regclass,
    'public.profiles'::regclass,
    'public.vendor_profiles'::regclass,
    'public.products'::regclass
  )
order by parent_schema, parent_table, child_schema, child_table, fk_name;

-- 2) Optional: set a user id below to inspect existing related rows count
-- replace with real uuid then run
-- with u as (select '00000000-0000-0000-0000-000000000000'::uuid as user_id)
-- select 'profiles' as table_name, count(*) from public.profiles p join u on p.id = u.user_id
-- union all
-- select 'vendor_profiles', count(*) from public.vendor_profiles vp join u on vp.user_id = u.user_id
-- union all
-- select 'products', count(*) from public.products pr
--   join public.vendor_profiles vp on vp.id = pr.vendor_id
--   join u on vp.user_id = u.user_id
-- union all
-- select 'product_images', count(*) from public.product_images pi
--   join public.products pr on pr.id = pi.product_id
--   join public.vendor_profiles vp on vp.id = pr.vendor_id
--   join u on vp.user_id = u.user_id
-- union all
-- select 'favorites_by_user', count(*) from public.favorites f join u on f.user_id = u.user_id;

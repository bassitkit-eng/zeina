-- Zeina: required base categories for frontend mapping
-- Run this in Supabase SQL Editor.
-- This script does NOT require a unique index on slug.

begin;

update public.categories set name = 'كوشات', is_active = true where slug = 'kosha';
update public.categories set name = 'المرايا', is_active = true where slug = 'mirrors';
update public.categories set name = 'تورتات', is_active = true where slug = 'cakes';

insert into public.categories (name, slug, is_active)
select 'كوشات', 'kosha', true
where not exists (select 1 from public.categories where slug = 'kosha');

insert into public.categories (name, slug, is_active)
select 'المرايا', 'mirrors', true
where not exists (select 1 from public.categories where slug = 'mirrors');

insert into public.categories (name, slug, is_active)
select 'تورتات', 'cakes', true
where not exists (select 1 from public.categories where slug = 'cakes');

commit;

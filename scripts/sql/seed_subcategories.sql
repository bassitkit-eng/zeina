-- Zeina: seed subcategories for kosha, cakes, and mirrors
-- Run this in Supabase SQL Editor (after seed_categories.sql).

begin;

-- Ensure parent categories are active and named correctly.
update public.categories set name = 'كوشات', is_active = true where slug = 'kosha';
update public.categories set name = 'تورتات', is_active = true where slug = 'cakes';
update public.categories set name = 'المرايا', is_active = true where slug = 'mirrors';

create temporary table tmp_desired_subcategories (
  category_slug text not null,
  subcategory_name text not null,
  subcategory_slug text not null
) on commit drop;

insert into tmp_desired_subcategories (category_slug, subcategory_name, subcategory_slug)
values
  -- Kosha
  ('kosha', 'كوشات زفاف', 'kosha-wedding'),
  ('kosha', 'كوشات خطوبة', 'kosha-engagement'),

  -- Mirrors
  ('mirrors', 'مراية خطوبة', 'mirror-engagement'),
  ('mirrors', 'مراية زفاف', 'mirror-wedding'),
  ('mirrors', 'مراية ديكور', 'mirror-decor'),

  -- Cakes / Tortat
  ('cakes', 'تورتة زفاف', 'cake-wedding'),
  ('cakes', 'تورتة خطوبة', 'cake-engagement'),
  ('cakes', 'تورتة عيد ميلاد', 'cake-birthday'),
  ('cakes', 'تورتة شوكولاتة', 'cake-chocolate'),
  ('cakes', 'تورتة فواكه', 'cake-fruit'),
  ('cakes', 'صينية شوكولاتة', 'chocolate-tray');

create temporary table tmp_matched_categories (
  category_id uuid not null,
  category_slug text not null
) on commit drop;

insert into tmp_matched_categories (category_id, category_slug)
select c.id as category_id, c.slug as category_slug
from public.categories c
where c.slug in ('kosha', 'cakes', 'mirrors');

-- Update existing rows first (if found by category + slug).
update public.subcategories s
set
  name = d.subcategory_name,
  is_active = true
from tmp_desired_subcategories d
join tmp_matched_categories mc on mc.category_slug = d.category_slug
where s.category_id = mc.category_id
  and s.slug = d.subcategory_slug;

-- Insert missing rows.
insert into public.subcategories (category_id, name, slug, is_active)
select
  mc.category_id,
  d.subcategory_name,
  d.subcategory_slug,
  true
from tmp_desired_subcategories d
join tmp_matched_categories mc on mc.category_slug = d.category_slug
where not exists (
  select 1
  from public.subcategories s
  where s.category_id = mc.category_id
    and s.slug = d.subcategory_slug
);

commit;

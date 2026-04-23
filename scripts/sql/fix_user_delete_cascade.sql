-- Fix "Database error deleting user" on Supabase Auth delete
-- This script force-resets the relevant foreign keys to ON DELETE CASCADE
-- even if existing constraint names are different.

begin;

do $$
declare
  r record;
begin
  -- profiles.id -> auth.users.id
  if to_regclass('public.profiles') is not null then
    for r in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where c.contype = 'f'
        and n.nspname = 'public'
        and t.relname = 'profiles'
        and c.confrelid = 'auth.users'::regclass
    loop
      execute format('alter table public.profiles drop constraint %I', r.conname);
    end loop;

    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;

  -- vendor_profiles.user_id -> profiles.id
  if to_regclass('public.vendor_profiles') is not null and to_regclass('public.profiles') is not null then
    for r in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where c.contype = 'f'
        and n.nspname = 'public'
        and t.relname = 'vendor_profiles'
        and c.confrelid = 'public.profiles'::regclass
    loop
      execute format('alter table public.vendor_profiles drop constraint %I', r.conname);
    end loop;

    alter table public.vendor_profiles
      add constraint vendor_profiles_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  -- products.vendor_id -> vendor_profiles.id
  if to_regclass('public.products') is not null and to_regclass('public.vendor_profiles') is not null then
    for r in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where c.contype = 'f'
        and n.nspname = 'public'
        and t.relname = 'products'
        and c.confrelid = 'public.vendor_profiles'::regclass
    loop
      execute format('alter table public.products drop constraint %I', r.conname);
    end loop;

    alter table public.products
      add constraint products_vendor_id_fkey
      foreign key (vendor_id) references public.vendor_profiles(id) on delete cascade;
  end if;

  -- product_images.product_id -> products.id
  if to_regclass('public.product_images') is not null and to_regclass('public.products') is not null then
    for r in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where c.contype = 'f'
        and n.nspname = 'public'
        and t.relname = 'product_images'
        and c.confrelid = 'public.products'::regclass
    loop
      execute format('alter table public.product_images drop constraint %I', r.conname);
    end loop;

    alter table public.product_images
      add constraint product_images_product_id_fkey
      foreign key (product_id) references public.products(id) on delete cascade;
  end if;

  -- favorites.user_id -> profiles.id
  if to_regclass('public.favorites') is not null and to_regclass('public.profiles') is not null then
    for r in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where c.contype = 'f'
        and n.nspname = 'public'
        and t.relname = 'favorites'
        and c.confrelid = 'public.profiles'::regclass
    loop
      execute format('alter table public.favorites drop constraint %I', r.conname);
    end loop;

    alter table public.favorites
      add constraint favorites_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  -- favorites.product_id -> products.id
  if to_regclass('public.favorites') is not null and to_regclass('public.products') is not null then
    for r in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where c.contype = 'f'
        and n.nspname = 'public'
        and t.relname = 'favorites'
        and c.confrelid = 'public.products'::regclass
    loop
      execute format('alter table public.favorites drop constraint %I', r.conname);
    end loop;

    alter table public.favorites
      add constraint favorites_product_id_fkey
      foreign key (product_id) references public.products(id) on delete cascade;
  end if;
end $$;

commit;

-- Verification query (run after script):
-- select
--   conrelid::regclass as table_name,
--   conname,
--   confrelid::regclass as references_table,
--   case confdeltype
--     when 'c' then 'CASCADE'
--     when 'r' then 'RESTRICT'
--     when 'n' then 'SET NULL'
--     when 'd' then 'SET DEFAULT'
--     when 'a' then 'NO ACTION'
--   end as on_delete
-- from pg_constraint
-- where contype = 'f'
--   and conrelid::regclass::text in ('profiles','vendor_profiles','products','product_images','favorites')
-- order by table_name::text, conname;

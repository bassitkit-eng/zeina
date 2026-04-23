-- Zeina: account cleanup + cascade delete + R2 delete queue
-- Run this in Supabase SQL Editor.
-- Goal:
-- 1) Deleting auth.users row removes related data in public tables.
-- 2) Deleted/changed image storage paths are queued for Cloudflare R2 deletion.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Ensure FK cascade chain from auth.users -> profiles -> vendor/products/etc.
-- ---------------------------------------------------------------------------

-- profiles.id -> auth.users.id (ON DELETE CASCADE)
do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles drop constraint if exists profiles_id_fkey;
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- vendor_profiles.user_id -> profiles.id (ON DELETE CASCADE)
do $$
begin
  if to_regclass('public.vendor_profiles') is not null and to_regclass('public.profiles') is not null then
    alter table public.vendor_profiles drop constraint if exists vendor_profiles_user_id_fkey;
    alter table public.vendor_profiles
      add constraint vendor_profiles_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

-- products.vendor_id -> vendor_profiles.id (ON DELETE CASCADE)
do $$
begin
  if to_regclass('public.products') is not null and to_regclass('public.vendor_profiles') is not null then
    alter table public.products drop constraint if exists products_vendor_id_fkey;
    alter table public.products
      add constraint products_vendor_id_fkey
      foreign key (vendor_id) references public.vendor_profiles(id) on delete cascade;
  end if;
end $$;

-- product_images.product_id -> products.id (ON DELETE CASCADE)
do $$
begin
  if to_regclass('public.product_images') is not null and to_regclass('public.products') is not null then
    alter table public.product_images drop constraint if exists product_images_product_id_fkey;
    alter table public.product_images
      add constraint product_images_product_id_fkey
      foreign key (product_id) references public.products(id) on delete cascade;
  end if;
end $$;

-- favorites.user_id -> profiles.id (ON DELETE CASCADE)
do $$
begin
  if to_regclass('public.favorites') is not null and to_regclass('public.profiles') is not null then
    alter table public.favorites drop constraint if exists favorites_user_id_fkey;
    alter table public.favorites
      add constraint favorites_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

-- favorites.product_id -> products.id (ON DELETE CASCADE)
do $$
begin
  if to_regclass('public.favorites') is not null and to_regclass('public.products') is not null then
    alter table public.favorites drop constraint if exists favorites_product_id_fkey;
    alter table public.favorites
      add constraint favorites_product_id_fkey
      foreign key (product_id) references public.products(id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Queue table for R2 object deletion
-- ---------------------------------------------------------------------------

create table if not exists public.r2_deletion_queue (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  source_table text not null,
  source_id text,
  reason text not null default 'cleanup',
  status text not null default 'pending',
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_r2_deletion_queue_status_created_at
  on public.r2_deletion_queue(status, created_at);

create unique index if not exists uq_r2_deletion_queue_pending_path
  on public.r2_deletion_queue(storage_path)
  where status = 'pending';

create or replace function public.get_pending_r2_deletions(p_limit int default 100)
returns table (
  id uuid,
  storage_path text
)
language sql
security definer
as $$
  select q.id, q.storage_path
  from public.r2_deletion_queue q
  where q.status = 'pending'
  order by q.created_at asc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

create or replace function public.mark_r2_deletion_result(
  p_id uuid,
  p_success boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
as $$
begin
  if p_success then
    update public.r2_deletion_queue
    set
      status = 'done',
      processed_at = now(),
      last_error = null
    where id = p_id;
  else
    update public.r2_deletion_queue
    set
      status = case when attempts + 1 >= 10 then 'failed' else 'pending' end,
      attempts = attempts + 1,
      last_error = p_error
    where id = p_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Trigger functions to enqueue deleted/old paths from product tables
-- ---------------------------------------------------------------------------

create or replace function public.enqueue_r2_deletion(
  p_storage_path text,
  p_source_table text,
  p_source_id text,
  p_reason text default 'cleanup'
)
returns void
language plpgsql
as $$
begin
  if p_storage_path is null or btrim(p_storage_path) = '' then
    return;
  end if;

  insert into public.r2_deletion_queue (storage_path, source_table, source_id, reason, status)
  values (p_storage_path, p_source_table, p_source_id, p_reason, 'pending')
  on conflict do nothing;
end;
$$;

create or replace function public.trg_queue_product_image_storage()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.enqueue_r2_deletion(old.storage_path, 'product_images', old.id::text, 'row_delete');
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if coalesce(old.storage_path, '') <> coalesce(new.storage_path, '') then
      perform public.enqueue_r2_deletion(old.storage_path, 'product_images', old.id::text, 'path_changed');
    end if;
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_queue_product_image_storage on public.product_images;
create trigger trg_queue_product_image_storage
after delete or update of storage_path on public.product_images
for each row execute function public.trg_queue_product_image_storage();

create or replace function public.trg_queue_product_cover_storage()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.enqueue_r2_deletion(old.cover_storage_path, 'products', old.id::text, 'row_delete');
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if coalesce(old.cover_storage_path, '') <> coalesce(new.cover_storage_path, '') then
      perform public.enqueue_r2_deletion(old.cover_storage_path, 'products', old.id::text, 'path_changed');
    end if;
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_queue_product_cover_storage on public.products;
create trigger trg_queue_product_cover_storage
after delete or update of cover_storage_path on public.products
for each row execute function public.trg_queue_product_cover_storage();

commit;

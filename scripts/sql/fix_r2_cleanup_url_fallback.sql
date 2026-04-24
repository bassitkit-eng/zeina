-- Zeina: fix R2 cleanup when old rows store URL instead of storage path
-- Run this in Supabase SQL Editor.
--
-- Why:
-- Some legacy rows may have NULL storage_path and only image_url/cover_image_url.
-- This patch enqueues either storage_path or URL fallback, so Worker can normalize and delete.

begin;

create or replace function public.enqueue_r2_deletion(
  p_storage_path text,
  p_source_table text,
  p_source_id text,
  p_reason text default 'cleanup'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_path text;
begin
  v_path := btrim(coalesce(p_storage_path, ''));
  if v_path = '' then
    return;
  end if;

  insert into public.r2_deletion_queue (storage_path, source_table, source_id, reason, status)
  values (v_path, p_source_table, p_source_id, p_reason, 'pending')
  on conflict do nothing;
end;
$$;

create or replace function public.trg_queue_product_image_storage()
returns trigger
language plpgsql
as $$
declare
  v_old_path text;
  v_new_path text;
begin
  v_old_path := coalesce(nullif(old.storage_path, ''), nullif(old.image_url, ''));

  if tg_op = 'DELETE' then
    perform public.enqueue_r2_deletion(v_old_path, 'product_images', old.id::text, 'row_delete');
    return old;
  end if;

  v_new_path := coalesce(nullif(new.storage_path, ''), nullif(new.image_url, ''));
  if tg_op = 'UPDATE' then
    if coalesce(v_old_path, '') <> coalesce(v_new_path, '') then
      perform public.enqueue_r2_deletion(v_old_path, 'product_images', old.id::text, 'path_changed');
    end if;
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_queue_product_image_storage on public.product_images;
create trigger trg_queue_product_image_storage
after delete or update of storage_path, image_url on public.product_images
for each row execute function public.trg_queue_product_image_storage();

create or replace function public.trg_queue_product_cover_storage()
returns trigger
language plpgsql
as $$
declare
  v_old_path text;
  v_new_path text;
begin
  v_old_path := coalesce(nullif(old.cover_storage_path, ''), nullif(old.cover_image_url, ''));

  if tg_op = 'DELETE' then
    perform public.enqueue_r2_deletion(v_old_path, 'products', old.id::text, 'row_delete');
    return old;
  end if;

  v_new_path := coalesce(nullif(new.cover_storage_path, ''), nullif(new.cover_image_url, ''));
  if tg_op = 'UPDATE' then
    if coalesce(v_old_path, '') <> coalesce(v_new_path, '') then
      perform public.enqueue_r2_deletion(v_old_path, 'products', old.id::text, 'path_changed');
    end if;
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_queue_product_cover_storage on public.products;
create trigger trg_queue_product_cover_storage
after delete or update of cover_storage_path, cover_image_url on public.products
for each row execute function public.trg_queue_product_cover_storage();

commit;


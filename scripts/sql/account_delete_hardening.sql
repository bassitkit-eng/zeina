-- Zeina: harden account deletion so product_images are always removed
-- Run this in Supabase SQL Editor.
--
-- Why:
-- - Even with FK cascade, legacy/edge data may survive if linkage is broken.
-- - This trigger explicitly deletes vendor data by user id before profile deletion.
-- - product_images delete triggers will enqueue R2 paths automatically.

begin;

create or replace function public.cleanup_vendor_data_for_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Remove favorites saved by this user
  delete from public.favorites f
  where f.user_id = old.id;

  -- Remove product images for all vendor products owned by this profile
  delete from public.product_images pi
  where pi.product_id in (
    select p.id
    from public.products p
    join public.vendor_profiles vp on vp.id = p.vendor_id
    where vp.user_id = old.id
  );

  -- Remove products for all vendor profiles owned by this profile
  delete from public.products p
  where p.vendor_id in (
    select vp.id
    from public.vendor_profiles vp
    where vp.user_id = old.id
  );

  -- Remove vendor profiles
  delete from public.vendor_profiles vp
  where vp.user_id = old.id;

  return old;
end;
$$;

drop trigger if exists trg_cleanup_vendor_data_before_profile_delete on public.profiles;
create trigger trg_cleanup_vendor_data_before_profile_delete
before delete on public.profiles
for each row execute function public.cleanup_vendor_data_for_profile_delete();

commit;

begin;

alter table zdrop_private.shops add column if not exists pricing jsonb;

create or replace function public.zdrop_create_shop(p_shop jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  s jsonb;
  n bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if p_shop->>'id' is null or p_shop->>'ownerId' is null or p_shop->>'shopName' is null or p_shop->>'shopCode' is null then
    raise exception 'Missing required shop fields';
  end if;

  insert into zdrop_private.shops (
    id, owner_id, owner_email, shop_name, owner_name, phone, campus_address, shop_code, created_at, is_active, pricing
  ) values (
    p_shop->>'id',
    p_shop->>'ownerId',
    coalesce(p_shop->>'ownerEmail', ''),
    p_shop->>'shopName',
    coalesce(p_shop->>'ownerName', ''),
    coalesce(p_shop->>'phone', ''),
    coalesce(p_shop->>'campusAddress', ''),
    upper(trim(p_shop->>'shopCode')),
    n,
    coalesce((p_shop->>'isActive')::boolean, true),
    p_shop->'pricing'
  );

  return jsonb_build_object(
    'id', p_shop->>'id',
    'ownerId', p_shop->>'ownerId',
    'ownerEmail', coalesce(p_shop->>'ownerEmail', ''),
    'shopName', p_shop->>'shopName',
    'ownerName', coalesce(p_shop->>'ownerName', ''),
    'phone', coalesce(p_shop->>'phone', ''),
    'campusAddress', coalesce(p_shop->>'campusAddress', ''),
    'shopCode', upper(trim(p_shop->>'shopCode')),
    'createdAt', n,
    'isActive', true,
    'pricing', p_shop->'pricing'
  );
end;
$$;

create or replace function public.zdrop_get_shop_by_owner(p_owner_id text) returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', id,
    'ownerId', owner_id,
    'ownerEmail', owner_email,
    'shopName', shop_name,
    'ownerName', owner_name,
    'phone', phone,
    'campusAddress', campus_address,
    'shopCode', shop_code,
    'createdAt', created_at,
    'isActive', is_active,
    'pricing', pricing
  )
  from zdrop_private.shops
  where owner_id = p_owner_id and is_active = true
  limit 1;
$$;

create or replace function public.zdrop_get_shop_by_code(p_code text) returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', id,
    'ownerId', owner_id,
    'ownerEmail', owner_email,
    'shopName', shop_name,
    'ownerName', owner_name,
    'phone', phone,
    'campusAddress', campus_address,
    'shopCode', shop_code,
    'createdAt', created_at,
    'isActive', is_active,
    'pricing', pricing
  )
  from zdrop_private.shops
  where upper(shop_code) = upper(trim(p_code)) and is_active = true
  limit 1;
$$;

create or replace function public.zdrop_list_shops() returns setof jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', id,
    'ownerId', owner_id,
    'ownerEmail', owner_email,
    'shopName', shop_name,
    'ownerName', owner_name,
    'phone', phone,
    'campusAddress', campus_address,
    'shopCode', shop_code,
    'createdAt', created_at,
    'isActive', is_active,
    'pricing', pricing
  )
  from zdrop_private.shops
  where is_active = true
  order by shop_name asc;
$$;

create or replace function public.zdrop_get_shop_by_id(p_shop_id text) returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', id,
    'ownerId', owner_id,
    'ownerEmail', owner_email,
    'shopName', shop_name,
    'ownerName', owner_name,
    'phone', phone,
    'campusAddress', campus_address,
    'shopCode', shop_code,
    'createdAt', created_at,
    'isActive', is_active,
    'pricing', pricing
  )
  from zdrop_private.shops
  where id = p_shop_id and is_active;
$$;

create or replace function public.zdrop_update_shop_pricing(
  p_shop_id text, p_owner_id text, p_pricing jsonb
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
  update zdrop_private.shops set pricing = p_pricing
  where id = p_shop_id and owner_id = p_owner_id and is_active;
  if not found then return null; end if;
  return public.zdrop_get_shop_by_id(p_shop_id);
end;
$$;

revoke execute on function public.zdrop_create_shop(jsonb) from public, anon, authenticated;
grant execute on function public.zdrop_create_shop(jsonb) to service_role;

revoke execute on function public.zdrop_get_shop_by_owner(text) from public, anon, authenticated;
grant execute on function public.zdrop_get_shop_by_owner(text) to service_role;

revoke execute on function public.zdrop_get_shop_by_code(text) from public, anon, authenticated;
grant execute on function public.zdrop_get_shop_by_code(text) to service_role;

revoke execute on function public.zdrop_list_shops() from public, anon, authenticated;
grant execute on function public.zdrop_list_shops() to service_role;

revoke execute on function public.zdrop_get_shop_by_id(text) from public, anon, authenticated;
grant execute on function public.zdrop_get_shop_by_id(text) to service_role;

revoke execute on function public.zdrop_update_shop_pricing(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.zdrop_update_shop_pricing(text, text, jsonb) to service_role;

commit;

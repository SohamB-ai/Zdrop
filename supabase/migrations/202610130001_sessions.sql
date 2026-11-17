begin;

create schema if not exists zdrop_private;
revoke all on schema zdrop_private from public, anon, authenticated;
grant usage on schema zdrop_private to service_role;

do $bootstrap$
declare
  signature text;
  installed integer := 0;
  signatures text[] := array[
    'public.zdrop_reserve(jsonb)', 'public.zdrop_read_session(text)', 'public.zdrop_by_code(text)',
    'public.zdrop_acquire_lock(text,text)', 'public.zdrop_renew_lock(text,text)',
    'public.zdrop_release_lock(text,text)', 'public.zdrop_save_session(jsonb,text)',
    'public.zdrop_activate(jsonb,text)', 'public.zdrop_candidates(text,integer)',
    'public.zdrop_retire(text,text)', 'public.zdrop_rate_limit(text,integer)',
    'public.zdrop_housekeeping()'
  ];
begin
  foreach signature in array signatures loop
    if to_regprocedure(signature) is not null then installed := installed + 1; end if;
  end loop;
  if installed = cardinality(signatures) then return; end if;
  if installed > 0 then
    raise exception 'Partial legacy ZDrop session schema: reconcile existing RPCs before bootstrapping';
  end if;

create table if not exists zdrop_private.session_records (
  id text primary key,
  access_code text not null unique,
  payload jsonb not null
);

create table if not exists zdrop_private.session_leases (
  id text primary key,
  token text not null,
  expires_at timestamptz not null
);

create table if not exists zdrop_private.request_limits (
  key text primary key,
  hits integer not null,
  expires_at timestamptz not null
);

alter table zdrop_private.session_records enable row level security;
alter table zdrop_private.session_leases enable row level security;
alter table zdrop_private.request_limits enable row level security;
grant select, insert, update, delete on
  zdrop_private.session_records, zdrop_private.session_leases, zdrop_private.request_limits to service_role;

create function public.zdrop_reserve(p_session jsonb) returns jsonb
language sql set search_path = '' as $$
  insert into zdrop_private.session_records (id, access_code, payload)
  values (p_session->>'id', p_session->>'accessCode', p_session)
  on conflict (access_code) do nothing
  returning payload;
$$;

create function public.zdrop_read_session(p_id text) returns jsonb
language sql stable set search_path = '' as $$
  select payload from zdrop_private.session_records where id = p_id;
$$;

create function public.zdrop_by_code(p_code text) returns jsonb
language sql stable set search_path = '' as $$
  select payload from zdrop_private.session_records where access_code = p_code;
$$;

create function public.zdrop_acquire_lock(p_id text, p_lease text) returns boolean
language sql set search_path = '' as $$
  with acquired as (
    insert into zdrop_private.session_leases as lease (id, token, expires_at)
    values (p_id, p_lease, clock_timestamp() + interval '5 minutes')
    on conflict (id) do update set token = excluded.token, expires_at = excluded.expires_at
    where lease.expires_at <= clock_timestamp()
    returning id
  )
  select exists(select 1 from acquired);
$$;

create function public.zdrop_renew_lock(p_id text, p_lease text) returns void
language sql set search_path = '' as $$
  update zdrop_private.session_leases set expires_at = clock_timestamp() + interval '5 minutes'
  where id = p_id and token = p_lease and expires_at > clock_timestamp();
$$;

create function public.zdrop_release_lock(p_id text, p_lease text) returns void
language sql set search_path = '' as $$
  delete from zdrop_private.session_leases where id = p_id and token = p_lease;
$$;

create function zdrop_private.require_session_lease(p_id text, p_lease text) returns void
language plpgsql set search_path = '' as $$
begin
  perform 1 from zdrop_private.session_leases
  where id = p_id and token = p_lease and expires_at > clock_timestamp()
  for update;
  if not found then raise exception 'Session lease is no longer valid'; end if;
end;
$$;

create function public.zdrop_save_session(p_session jsonb, p_lease text) returns void
language plpgsql set search_path = '' as $$
begin
  perform zdrop_private.require_session_lease(p_session->>'id', p_lease);
  update zdrop_private.session_records set payload = p_session
  where id = p_session->>'id' and access_code = p_session->>'accessCode';
  if not found then raise exception 'Session record is missing'; end if;
end;
$$;

create function public.zdrop_activate(p_session jsonb, p_lease text) returns jsonb
language plpgsql set search_path = '' as $$
declare
  now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000);
  activated jsonb;
begin
  perform zdrop_private.require_session_lease(p_session->>'id', p_lease);
  update zdrop_private.session_records
  set payload = p_session || jsonb_build_object('status', 'ACTIVE', 'expiresAt', now_ms + 900000)
  where id = p_session->>'id' and access_code = p_session->>'accessCode'
    and payload->>'status' = 'PENDING_UPLOAD' and (payload->>'expiresAt')::bigint > now_ms
  returning payload into activated;
  if not found then raise exception 'Upload expired or session is no longer pending'; end if;
  return activated;
end;
$$;

create function public.zdrop_candidates(p_after text, p_limit integer) returns setof jsonb
language sql stable set search_path = '' as $$
  select payload from zdrop_private.session_records
  where id > p_after
    and (coalesce((payload->>'purging')::boolean, false)
      or payload->>'deletedAt' is not null
      or (payload->>'expiresAt')::bigint <= floor(extract(epoch from statement_timestamp()) * 1000))
  order by id limit greatest(1, least(p_limit, 200));
$$;

create function public.zdrop_retire(p_id text, p_lease text) returns void
language plpgsql set search_path = '' as $$
begin
  perform zdrop_private.require_session_lease(p_id, p_lease);
  delete from zdrop_private.session_records where id = p_id and payload->>'deletedAt' is not null;
end;
$$;

create function public.zdrop_rate_limit(p_key text, p_max integer) returns boolean
language sql set search_path = '' as $$
  with counted as (
    insert into zdrop_private.request_limits as bucket (key, hits, expires_at)
    values (p_key, 1, clock_timestamp() + interval '1 minute')
    on conflict (key) do update
    set hits = case when bucket.expires_at <= clock_timestamp() then 1 else bucket.hits + 1 end,
        expires_at = case when bucket.expires_at <= clock_timestamp() then excluded.expires_at else bucket.expires_at end
    where bucket.expires_at <= clock_timestamp() or bucket.hits < p_max
    returning hits
  )
  select exists(select 1 from counted where hits <= p_max);
$$;

create function public.zdrop_housekeeping() returns void
language sql set search_path = '' as $$
  delete from zdrop_private.request_limits where expires_at <= clock_timestamp();
  delete from zdrop_private.session_leases where expires_at <= clock_timestamp();
$$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'public.zdrop_reserve(jsonb)', 'public.zdrop_read_session(text)', 'public.zdrop_by_code(text)',
    'public.zdrop_acquire_lock(text,text)', 'public.zdrop_renew_lock(text,text)',
    'public.zdrop_release_lock(text,text)', 'public.zdrop_save_session(jsonb,text)',
    'public.zdrop_activate(jsonb,text)', 'public.zdrop_candidates(text,integer)',
    'public.zdrop_retire(text,text)', 'public.zdrop_rate_limit(text,integer)',
    'public.zdrop_housekeeping()', 'zdrop_private.require_session_lease(text,text)'
  ] loop
    execute 'revoke execute on function ' || signature || ' from public, anon, authenticated';
    execute 'grant execute on function ' || signature || ' to service_role';
  end loop;
end;
$$;

end;
$bootstrap$;

insert into storage.buckets (id, name, public)
values ('zdrop-documents', 'zdrop-documents', false)
on conflict (id) do nothing;

commit;

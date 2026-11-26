create or replace function public.record_site_visit(
  p_session_id text,
  p_user_id uuid,
  p_path text,
  p_referrer text,
  p_ip_address text,
  p_country text,
  p_city text,
  p_user_agent text,
  p_device_type text,
  p_browser text,
  p_os text
)
returns boolean
language plpgsql
security invoker
set search_path = 'pg_catalog', 'public'
as $function$
declare
  v_rate_key text := coalesce(nullif(p_ip_address, ''), p_session_id);
  v_count integer;
begin
  if p_session_id is null or char_length(p_session_id) < 8 or char_length(p_session_id) > 128 then
    raise exception 'Invalid session' using errcode = '22023';
  end if;
  if p_path is null or p_path !~ '^/' or char_length(p_path) > 500 then
    raise exception 'Invalid path' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_rate_key, 0)
  );

  select count(*)::integer
    into v_count
  from public.site_visits
  where created_at >= pg_catalog.now() - interval '1 minute'
    and (
      (p_ip_address is not null and ip_address = p_ip_address)
      or (p_ip_address is null and session_id = p_session_id)
    );

  if v_count >= 30 then
    return false;
  end if;

  insert into public.site_visits (
    session_id, user_id, path, referrer, ip_address, country, city,
    user_agent, device_type, browser, os
  )
  values (
    p_session_id, p_user_id, p_path, p_referrer, p_ip_address, p_country, p_city,
    left(coalesce(p_user_agent, ''), 1000),
    left(coalesce(p_device_type, ''), 32),
    left(coalesce(p_browser, ''), 32),
    left(coalesce(p_os, ''), 32)
  );

  return true;
end;
$function$;

revoke all on function public.record_site_visit(text, uuid, text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_site_visit(text, uuid, text, text, text, text, text, text, text, text, text)
  to service_role;

create index if not exists site_visits_ip_created_at_idx
  on public.site_visits (ip_address, created_at desc);

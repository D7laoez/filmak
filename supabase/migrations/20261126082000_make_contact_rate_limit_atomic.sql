create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_ip_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = 'pg_catalog', 'public'
as $function$
declare
  v_count integer;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid request' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_ip_hash, 0)
  );

  select count(*)::integer
    into v_count
  from public.contact_messages
  where ip_hash = p_ip_hash
    and created_at >= pg_catalog.now() - interval '15 minutes';

  if v_count >= 5 then
    return false;
  end if;

  insert into public.contact_messages (name, email, subject, message, ip_hash)
  values (p_name, p_email, p_subject, p_message, p_ip_hash);

  return true;
end;
$function$;

revoke all on function public.submit_contact_message(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_contact_message(text, text, text, text, text)
  to service_role;

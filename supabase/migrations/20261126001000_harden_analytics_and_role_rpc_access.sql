-- Restrict contact inbox access to the Edge Function's service role.
drop policy if exists service_role_manage_contact_messages on public.contact_messages;
create policy service_role_manage_contact_messages
  on public.contact_messages
  for all
  to service_role
  using (true)
  with check (true);

-- The analytics RPC contains visitor IPs and must only be callable by administrators.
create or replace function public.admin_site_analytics(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  v_days integer := greatest(1, least(coalesce(days, 30), 365));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_result jsonb;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_visits', (select count(*)::integer from public.site_visits where created_at >= v_since),
    'unique_sessions', (select count(distinct session_id)::integer from public.site_visits where created_at >= v_since),
    'unique_ips', (select count(distinct ip_address)::integer from public.site_visits where created_at >= v_since and ip_address is not null),
    'logged_in_visits', (select count(*)::integer from public.site_visits where created_at >= v_since and user_id is not null),
    'top_paths', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select path, count(*)::integer as visits
        from public.site_visits
        where created_at >= v_since
        group by path
        order by visits desc
        limit 15
      ) t
    ), '[]'::jsonb),
    'top_ips', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select ip_address as ip, count(*)::integer as visits, max(created_at) as last_seen
        from public.site_visits
        where created_at >= v_since and ip_address is not null
        group by ip_address
        order by visits desc
        limit 15
      ) t
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select coalesce(country, 'Unknown') as country, count(*)::integer as visits
        from public.site_visits
        where created_at >= v_since
        group by coalesce(country, 'Unknown')
        order by visits desc
        limit 15
      ) t
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select coalesce(device_type, 'unknown') as device, count(*)::integer as visits
        from public.site_visits
        where created_at >= v_since
        group by coalesce(device_type, 'unknown')
        order by visits desc
      ) t
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select
          to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
          count(*)::integer as visits,
          count(distinct session_id)::integer as sessions
        from public.site_visits
        where created_at >= v_since
        group by date_trunc('day', created_at)
        order by date_trunc('day', created_at) asc
      ) t
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

-- Keep the role helper available to authenticated RLS checks, not anonymous callers.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog'
as $function$
  select exists (
    select 1
    from public.user_roles target_role
    where target_role.user_id = _user_id
      and target_role.role = _role
      and (
        _user_id = auth.uid()
        or exists (
          select 1
          from public.user_roles caller_role
          where caller_role.user_id = auth.uid()
            and caller_role.role = 'admin'::public.app_role
        )
      )
  );
$function$;

revoke all on function public.admin_site_analytics(integer) from public, anon, authenticated;
grant execute on function public.admin_site_analytics(integer) to authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- These RPCs do not need to bypass RLS: their callers only inspect their own role,
-- and site_visits already has an administrator-only SELECT policy.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security invoker
set search_path to 'pg_catalog'
as $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and user_id = _user_id
      and role = _role
  );
$function$;

create or replace function public.admin_site_analytics(days integer default 30)
returns jsonb
language plpgsql
security invoker
set search_path to 'pg_catalog'
as $function$
declare
  v_days integer := greatest(1, least(coalesce(days, 30), 365));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_result jsonb;
begin
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

revoke all on function public.admin_site_analytics(integer) from public, anon, authenticated;
grant execute on function public.admin_site_analytics(integer) to authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

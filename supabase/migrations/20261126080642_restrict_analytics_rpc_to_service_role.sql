revoke all on function public.admin_site_analytics(integer) from public, anon, authenticated;
grant execute on function public.admin_site_analytics(integer) to service_role;

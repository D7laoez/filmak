drop policy if exists contact_messages_admin_read on public.contact_messages;
create policy contact_messages_admin_read
  on public.contact_messages
  for select
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists contact_messages_admin_update on public.contact_messages;
create policy contact_messages_admin_update
  on public.contact_messages
  for update
  to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

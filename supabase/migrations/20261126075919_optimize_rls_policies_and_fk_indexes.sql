-- Avoid per-row auth function evaluation in user-owned table policies.
drop policy if exists "Users can add own favorites" on public.favorites;
create policy "Users can add own favorites" on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites" on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites" on public.favorites for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Users can view their own list entries" on public.user_lists;
create policy "Users can view their own list entries" on public.user_lists for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Users can insert their own list entries" on public.user_lists;
create policy "Users can insert their own list entries" on public.user_lists for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users can update their own list entries" on public.user_lists;
create policy "Users can update their own list entries" on public.user_lists for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete their own list entries" on public.user_lists;
create policy "Users can delete their own list entries" on public.user_lists for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Users can view their own roles" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()));

-- Public visitors see published editorial records; authenticated admins can see drafts.
drop policy if exists "Admins have full access to articles" on public.articles;
drop policy if exists "Public can view published articles" on public.articles;
create policy "Anonymous can view published articles" on public.articles for select to anon
  using (status = 'published');
create policy "Users can view published articles and admins all articles" on public.articles for select to authenticated
  using (status = 'published' or (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can insert articles" on public.articles for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can update articles" on public.articles for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can delete articles" on public.articles for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "Admins have full access to collections" on public.collections_editorial;
drop policy if exists "Public can view published collections" on public.collections_editorial;
create policy "Anonymous can view published collections" on public.collections_editorial for select to anon
  using (status = 'published');
create policy "Users can view published collections and admins all collections" on public.collections_editorial for select to authenticated
  using (status = 'published' or (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can insert collections" on public.collections_editorial for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can update collections" on public.collections_editorial for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can delete collections" on public.collections_editorial for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "Admins have full access to editorial reviews" on public.editorial_reviews;
drop policy if exists "Public can view published editorial reviews" on public.editorial_reviews;
create policy "Anonymous can view published editorial reviews" on public.editorial_reviews for select to anon
  using (status = 'published');
create policy "Users can view published reviews and admins all reviews" on public.editorial_reviews for select to authenticated
  using (status = 'published' or (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can insert editorial reviews" on public.editorial_reviews for insert to authenticated
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can update editorial reviews" on public.editorial_reviews for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins can delete editorial reviews" on public.editorial_reviews for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "Admins can read site_visits" on public.site_visits;
create policy "Admins can read site_visits" on public.site_visits for select to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "Admins can insert submissions" on public.sitemap_submissions;
create policy "Admins can insert submissions" on public.sitemap_submissions for insert to authenticated
  with check (
    (select public.has_role((select auth.uid()), 'admin'::public.app_role))
    and submitted_by = (select auth.uid())
  );
drop policy if exists "Admins can view submissions" on public.sitemap_submissions;
create policy "Admins can view submissions" on public.sitemap_submissions for select to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

-- Cover the existing foreign keys used for joins and cascade checks.
create index if not exists editorial_reviews_author_id_idx on public.editorial_reviews (author_id);
create index if not exists site_visits_user_id_idx on public.site_visits (user_id);
create index if not exists sitemap_submissions_submitted_by_idx on public.sitemap_submissions (submitted_by);

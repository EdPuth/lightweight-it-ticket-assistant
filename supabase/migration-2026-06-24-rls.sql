-- Migration: Row Level Security policies (follow-up #2).
-- Run once in the Supabase SQL Editor. Safe to run while the app still uses the
-- service-role key (service-role bypasses RLS, so adding policies changes nothing
-- for existing traffic) — apply this BEFORE deploying the code that reads via the
-- user-scoped (anon + user JWT) client.
--
-- Model: reads go through the user client and are governed by these policies;
-- writes still go through the service-role client + app-layer role checks.
-- Write policies below are future-proofing (and block any direct anon writes).

-- Role of the current user, read with definer rights so it works even when
-- profiles RLS is enabled. Used by the policies below.
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

-- profiles: a user can read their own row; staff can read all.
drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_staff_select on profiles;
create policy profiles_staff_select on profiles
  for select to authenticated
  using (public.app_role() in ('it_support', 'admin'));

-- tickets: employees see only their own; staff see all.
drop policy if exists tickets_select on tickets;
create policy tickets_select on tickets
  for select to authenticated
  using (
    public.app_role() in ('it_support', 'admin')
    or requester_user_id = (select auth.uid())
  );

drop policy if exists tickets_insert on tickets;
create policy tickets_insert on tickets
  for insert to authenticated
  with check (requester_user_id = (select auth.uid()));

drop policy if exists tickets_update on tickets;
create policy tickets_update on tickets
  for update to authenticated
  using (public.app_role() in ('it_support', 'admin'))
  with check (public.app_role() in ('it_support', 'admin'));

drop policy if exists tickets_delete on tickets;
create policy tickets_delete on tickets
  for delete to authenticated
  using (public.app_role() = 'admin');

-- activities: visibility follows the parent ticket.
drop policy if exists activities_select on activities;
create policy activities_select on activities
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = activities.ticket_id
        and (
          public.app_role() in ('it_support', 'admin')
          or t.requester_user_id = (select auth.uid())
        )
    )
  );

drop policy if exists activities_insert on activities;
create policy activities_insert on activities
  for insert to authenticated
  with check (
    public.app_role() in ('it_support', 'admin')
    or exists (
      select 1 from tickets t
      where t.id = activities.ticket_id
        and t.requester_user_id = (select auth.uid())
    )
  );

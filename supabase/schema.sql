-- Lightweight IT Support Ticket Assistant — database schema
-- Paste this into the Supabase SQL Editor and Run it once.
-- Safe to re-run: it drops and recreates the tables.

drop table if exists activities;
drop table if exists tickets;
drop table if exists profiles;
drop sequence if exists ticket_seq;

-- RBAC: one profile row per Supabase Auth user, holding role + display fields.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('employee','it_support','admin')),
  created_at timestamptz not null default now()
);

-- Sequence for human-friendly ticket ids like TKT-1014.
create sequence ticket_seq start with 1014;

create table tickets (
  id text primary key default ('TKT-' || lpad(nextval('ticket_seq')::text, 4, '0')),
  title text not null,
  requester_name text not null,
  requester_email text not null,
  requester_user_id uuid references auth.users (id),
  category text not null check (category in ('email','network','hardware','software','access','other')),
  priority text not null check (priority in ('low','medium','high','urgent')),
  status text not null check (status in ('open','in_progress','waiting','resolved','closed')),
  description text not null,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_requester_user_id_idx on tickets (requester_user_id);

create table activities (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null references tickets(id) on delete cascade,
  type text not null check (type in ('created','status_changed','note','reply')),
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index activities_ticket_id_idx on activities (ticket_id);
create index activities_created_at_idx on activities (created_at);

-- Row Level Security. Reads go through the user-scoped (anon + user JWT) client
-- and are governed by the policies below; writes go through the service-role key
-- (which bypasses RLS) plus app-layer role checks. See docs/decisions.md.
alter table profiles enable row level security;
alter table tickets enable row level security;
alter table activities enable row level security;

-- Current user's role, read with definer rights so policies can use it even
-- though profiles itself has RLS.
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create policy profiles_self_select on profiles
  for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_staff_select on profiles
  for select to authenticated
  using (public.app_role() in ('it_support', 'admin'));

create policy tickets_select on tickets
  for select to authenticated
  using (
    public.app_role() in ('it_support', 'admin')
    or requester_user_id = (select auth.uid())
  );
create policy tickets_insert on tickets
  for insert to authenticated
  with check (requester_user_id = (select auth.uid()));
create policy tickets_update on tickets
  for update to authenticated
  using (public.app_role() in ('it_support', 'admin'))
  with check (public.app_role() in ('it_support', 'admin'));
create policy tickets_delete on tickets
  for delete to authenticated
  using (public.app_role() = 'admin');

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

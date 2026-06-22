-- Lightweight IT Support Ticket Assistant — database schema
-- Paste this into the Supabase SQL Editor and Run it once.
-- Safe to re-run: it drops and recreates the tables.

drop table if exists activities;
drop table if exists tickets;
drop sequence if exists ticket_seq;

-- Sequence for human-friendly ticket ids like TKT-1014.
create sequence ticket_seq start with 1014;

create table tickets (
  id text primary key default ('TKT-' || lpad(nextval('ticket_seq')::text, 4, '0')),
  title text not null,
  requester_name text not null,
  requester_email text not null,
  category text not null check (category in ('email','network','hardware','software','access','other')),
  priority text not null check (priority in ('low','medium','high','urgent')),
  status text not null check (status in ('open','in_progress','waiting','resolved','closed')),
  description text not null,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- Enable Row Level Security with NO public policies. All access in this app
-- goes through the server using the service_role key, which bypasses RLS.
-- The anon/public key therefore cannot read or write anything.
alter table tickets enable row level security;
alter table activities enable row level security;

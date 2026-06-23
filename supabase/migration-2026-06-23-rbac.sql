-- Migration: RBAC Auth v1 — profiles (role) + ticket ownership.
-- Run once in the Supabase SQL Editor on an existing database. Non-destructive.
-- After running this, run scripts/seed-users.ts to create the 3 test accounts
-- and backfill existing tickets' requester_user_id.

-- 1. profiles: one row per Supabase Auth user, holding role + display fields.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('employee','it_support','admin')),
  created_at timestamptz not null default now()
);

-- RLS on, no public policies (v1). The app uses the service-role key with
-- explicit server-side role checks; RLS policies are a planned follow-up.
alter table profiles enable row level security;

-- 2. Ticket ownership: link a ticket to the auth user who created it. Keep
-- requester_name / requester_email as denormalized display fields.
alter table tickets
  add column if not exists requester_user_id uuid references auth.users (id);

create index if not exists tickets_requester_user_id_idx
  on tickets (requester_user_id);

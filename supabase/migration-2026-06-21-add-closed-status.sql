-- Migration: allow the new 'closed' ticket status on an existing database.
-- Run this once in the Supabase SQL Editor on a DB that was created from an
-- earlier schema.sql. It does NOT drop data (unlike re-running schema.sql).

alter table tickets drop constraint if exists tickets_status_check;

alter table tickets
  add constraint tickets_status_check
  check (status in ('open','in_progress','waiting','resolved','closed'));

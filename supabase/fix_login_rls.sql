-- ============================================================
-- Fix: 403 Forbidden on every table after login.
-- Cause: the API roles (anon / authenticated) lack base access
-- to the schema. RLS still controls WHICH ROWS each user sees;
-- these grants just let the roles reach the tables/functions.
-- Run once in the SQL Editor. Safe to re-run.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to anon, authenticated;

grant usage, select
  on all sequences in schema public
  to anon, authenticated;

grant execute
  on all functions in schema public
  to anon, authenticated;

-- Let each user read their own profile (used at login).
drop policy if exists "profiles staff read" on public.profiles;
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (id = auth.uid());

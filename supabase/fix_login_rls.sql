-- ============================================================
-- Fix: "permission denied for schema public" / 403 on every table
-- (affects the app AND the Edge Function).
--
-- The base privileges on the public schema were lost. This restores
-- exactly what a standard Supabase project grants. Row-Level Security
-- still controls WHICH ROWS each role can see — these grants only let
-- the roles reach the schema/objects. Safe to run; safe to re-run.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all routines  in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- Make sure objects created in the future are granted too.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- Each user can read their own profile (used at login).
drop policy if exists "profiles staff read" on public.profiles;
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (id = auth.uid());

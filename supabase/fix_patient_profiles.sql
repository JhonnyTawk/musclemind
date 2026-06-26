-- ============================================================
-- Fix: a patient login was being treated as STAFF.
-- Cause: the "new user" trigger created a staff profiles row for
-- every auth user — including patients. A patient with a profiles
-- row passes is_staff(), so they could see the whole admin app and
-- ALL patients' data. This closes that hole.
-- Run once in the SQL Editor. Safe to re-run.
-- ============================================================

-- 1) Trigger no longer creates a staff profile for patient accounts.
--    (Patients are created with metadata role = 'patient'.)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data->>'role', '') = 'patient' then
    return new;  -- patients are NOT staff: no profile row
  end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'therapist')
  on conflict (id) do nothing;
  return new;
end $$;

-- 2) Remove any staff profile rows that actually belong to a patient
--    (created in error before the fix). This does NOT touch your admin
--    profile, because your admin account is not linked to a patient row.
delete from public.profiles p
using public.patients pt
where pt.auth_user_id = p.id;

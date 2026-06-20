-- ============================================================
-- MuscleMind — Phase 2B: secure patient portal + RLS hardening
-- Run AFTER schema.sql and phase2.sql. Safe to re-run.
--
-- What this does:
--   * Links each patient to a real Supabase auth user (patients.auth_user_id)
--   * Adds appointments + follow-up/portal fields
--   * Replaces the old, loose policies with a strict model:
--       - STAFF (a profiles row with role admin/therapist) → full access
--       - PATIENTS (logged in, linked to a patient row) → ONLY their own data
--       - the public booking form (anon) → can only create a booking
-- ============================================================

-- ---------- patient ↔ auth link + portal fields ----------
alter table public.patients
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null,
  add column if not exists follow_up_date date,
  add column if not exists follow_up_instructions text,
  add column if not exists portal_notes text;

create index if not exists patients_auth_user_idx on public.patients (auth_user_id);

-- ---------- appointments ----------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id text references public.patients (id) on delete cascade,
  date date not null,
  time text,
  type text,
  notes text,
  created_at timestamptz default now()
);
create index if not exists appointments_patient_idx on public.appointments (patient_id, date);
alter table public.appointments enable row level security;

-- ============================================================
-- is_staff(): true only for authenticated users that have a
-- profiles row (i.e. real clinic staff). Patients have NO profiles
-- row, so this is false for them — that's what keeps them out.
-- ============================================================
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'therapist')
  );
$$;

-- owns_patient(): true if the given patient row belongs to the
-- currently logged-in patient.
create or replace function public.owns_patient(pid text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.patients
    where id = pid and auth_user_id = auth.uid()
  );
$$;

-- ============================================================
-- Drop every old policy we are replacing (loose / anon-wide).
-- ============================================================
drop policy if exists "staff read profiles" on public.profiles;
drop policy if exists "staff update own profile" on public.profiles;

drop policy if exists "staff all patients" on public.patients;
drop policy if exists "anon read patient by token" on public.patients;

drop policy if exists "staff all logs" on public.symptom_logs;
drop policy if exists "anon read own logs" on public.symptom_logs;
drop policy if exists "anon insert logs" on public.symptom_logs;

drop policy if exists "staff all programs" on public.exercise_programs;
drop policy if exists "anon read programs" on public.exercise_programs;

drop policy if exists "staff all alerts" on public.alerts;
drop policy if exists "staff all assessments" on public.assessments;

drop policy if exists "staff manage bookings" on public.bookings;
drop policy if exists "staff manage availability" on public.availability_blocks;

-- ============================================================
-- New strict policies
-- ============================================================

-- profiles: staff only
create policy "profiles staff read"  on public.profiles for select using (public.is_staff());
create policy "profiles update own"  on public.profiles for update using (auth.uid() = id);

-- patients: staff full; patient may read ONLY their own row
create policy "patients staff all" on public.patients
  for all using (public.is_staff()) with check (public.is_staff());
create policy "patients read own" on public.patients
  for select using (auth_user_id = auth.uid());

-- exercise programs: staff full; patient reads only their own program
create policy "programs staff all" on public.exercise_programs
  for all using (public.is_staff()) with check (public.is_staff());
create policy "programs read own" on public.exercise_programs
  for select using (public.owns_patient(patient_id));

-- symptom logs: staff full; patient reads + inserts only their own
create policy "logs staff all" on public.symptom_logs
  for all using (public.is_staff()) with check (public.is_staff());
create policy "logs read own" on public.symptom_logs
  for select using (public.owns_patient(patient_id));
create policy "logs insert own" on public.symptom_logs
  for insert with check (public.owns_patient(patient_id));

-- appointments: staff full; patient reads only their own
create policy "appointments staff all" on public.appointments
  for all using (public.is_staff()) with check (public.is_staff());
create policy "appointments read own" on public.appointments
  for select using (public.owns_patient(patient_id));

-- alerts & assessments: staff only (never exposed to patients)
create policy "alerts staff all" on public.alerts
  for all using (public.is_staff()) with check (public.is_staff());
create policy "assessments staff all" on public.assessments
  for all using (public.is_staff()) with check (public.is_staff());

-- bookings: public may still CREATE a request; only staff can read/manage.
-- (anon insert policy from phase2.sql stays.)
create policy "bookings staff all" on public.bookings
  for all using (public.is_staff()) with check (public.is_staff());

-- availability: public (anon) read stays for the booking form; staff manage.
create policy "availability staff all" on public.availability_blocks
  for all using (public.is_staff()) with check (public.is_staff());

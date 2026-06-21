-- ============================================================
-- MuscleMind — COMPLETE database setup (run this ONE file once)
-- ------------------------------------------------------------
-- This replaces running schema.sql + phase2.sql + phase2b.sql
-- separately. It is secure, contains NO demo/sample patients,
-- and is safe to re-run.
--
-- Run in: Supabase → Database → SQL Editor → New query → Run.
-- You only ever run this once (or again if you reset the DB).
-- ============================================================

-- ---------- staff profiles (admin / therapist) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  title text,
  role text not null default 'therapist' check (role in ('admin', 'therapist')),
  created_at timestamptz default now()
);

-- Auto-create a profile row whenever a staff user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'therapist')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- patients ----------
create table if not exists public.patients (
  id text primary key default ('p' || substr(md5(random()::text), 1, 8)),
  code text,
  full_name text not null,
  age int,
  gender text,
  phone text,
  email text,
  occupation text,
  activity text,
  complaint text,
  diagnosis text,
  therapist_id text,
  last_visit date default current_date,
  status text default 'Active' check (status in ('Active', 'Discharged')),
  pain_now int default 0,
  adherence int default 0,
  rehab_phase int,
  history text,
  surgical text,
  medications text,
  goals text,
  red_flags text,
  frequency text,
  progress text,
  share_token text unique default substr(md5(random()::text), 1, 10),
  is_acl boolean default false,
  -- patient portal:
  auth_user_id uuid references auth.users (id) on delete set null,
  follow_up_date date,
  follow_up_instructions text,
  portal_notes text,
  created_at timestamptz default now()
);
create index if not exists patients_auth_user_idx on public.patients (auth_user_id);

-- ---------- symptom logs ----------
create table if not exists public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id text references public.patients (id) on delete cascade,
  date date default current_date,
  pain int, stiffness int, swelling int, sleep int, fatigue int,
  function_level int, confidence int, mood int,
  exercises_done boolean default false,
  body_area text,
  note text,
  created_at timestamptz default now()
);

-- ---------- alerts ----------
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id text references public.patients (id) on delete cascade,
  severity text check (severity in ('low', 'medium', 'high')),
  kind text,
  text text,
  date date default current_date
);

-- ---------- exercise programs ----------
create table if not exists public.exercise_programs (
  patient_id text primary key references public.patients (id) on delete cascade,
  program jsonb not null,
  updated_at timestamptz default now()
);

-- ---------- assessments ----------
create table if not exists public.assessments (
  patient_id text primary key references public.patients (id) on delete cascade,
  form jsonb not null,
  status text default 'draft' check (status in ('draft', 'complete')),
  updated_at timestamptz default now()
);

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

-- ---------- booking requests (public homepage form) ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  session_type text,
  requested_date date,
  requested_time text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'declined', 'done')),
  created_at timestamptz default now()
);
create index if not exists bookings_status_idx on public.bookings (status, requested_date);

-- ---------- availability blocks ----------
create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text,
  reason text,
  created_at timestamptz default now()
);
create unique index if not exists availability_unique
  on public.availability_blocks (date, coalesce(time, ''));

-- ============================================================
-- Security helpers
--   is_staff()     → true only for users with a profiles row
--   owns_patient() → true if a patient row belongs to this login
-- ============================================================
create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'therapist')
  );
$$;

create or replace function public.owns_patient(pid text)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.patients
    where id = pid and auth_user_id = auth.uid()
  );
$$;

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.patients            enable row level security;
alter table public.symptom_logs        enable row level security;
alter table public.alerts              enable row level security;
alter table public.exercise_programs   enable row level security;
alter table public.assessments         enable row level security;
alter table public.appointments        enable row level security;
alter table public.bookings            enable row level security;
alter table public.availability_blocks enable row level security;

-- Drop any older policies (so this file is safe to re-run) ----
drop policy if exists "staff read profiles" on public.profiles;
drop policy if exists "staff update own profile" on public.profiles;
drop policy if exists "profiles staff read" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "staff all patients" on public.patients;
drop policy if exists "anon read patient by token" on public.patients;
drop policy if exists "patients staff all" on public.patients;
drop policy if exists "patients read own" on public.patients;
drop policy if exists "staff all logs" on public.symptom_logs;
drop policy if exists "anon read own logs" on public.symptom_logs;
drop policy if exists "anon insert logs" on public.symptom_logs;
drop policy if exists "logs staff all" on public.symptom_logs;
drop policy if exists "logs read own" on public.symptom_logs;
drop policy if exists "logs insert own" on public.symptom_logs;
drop policy if exists "staff all programs" on public.exercise_programs;
drop policy if exists "anon read programs" on public.exercise_programs;
drop policy if exists "programs staff all" on public.exercise_programs;
drop policy if exists "programs read own" on public.exercise_programs;
drop policy if exists "staff all alerts" on public.alerts;
drop policy if exists "alerts staff all" on public.alerts;
drop policy if exists "staff all assessments" on public.assessments;
drop policy if exists "assessments staff all" on public.assessments;
drop policy if exists "appointments staff all" on public.appointments;
drop policy if exists "appointments read own" on public.appointments;
drop policy if exists "anon create booking" on public.bookings;
drop policy if exists "staff manage bookings" on public.bookings;
drop policy if exists "bookings staff all" on public.bookings;
drop policy if exists "anon read availability" on public.availability_blocks;
drop policy if exists "staff manage availability" on public.availability_blocks;
drop policy if exists "availability staff all" on public.availability_blocks;

-- profiles: staff only
create policy "profiles staff read" on public.profiles for select using (public.is_staff());
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- patients: staff full; patient reads only their own row
create policy "patients staff all" on public.patients
  for all using (public.is_staff()) with check (public.is_staff());
create policy "patients read own" on public.patients
  for select using (auth_user_id = auth.uid());

-- exercise programs: staff full; patient reads only their own
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

-- alerts & assessments: staff only
create policy "alerts staff all" on public.alerts
  for all using (public.is_staff()) with check (public.is_staff());
create policy "assessments staff all" on public.assessments
  for all using (public.is_staff()) with check (public.is_staff());

-- bookings: public may CREATE a request; only staff read/manage
create policy "anon create booking" on public.bookings
  for insert to anon with check (true);
create policy "bookings staff all" on public.bookings
  for all using (public.is_staff()) with check (public.is_staff());

-- availability: public may read (so the booking form hides blocked slots); staff manage
create policy "anon read availability" on public.availability_blocks
  for select to anon using (true);
create policy "availability staff all" on public.availability_blocks
  for all using (public.is_staff()) with check (public.is_staff());

-- ============================================================
-- Done. Next: create your admin user in Authentication → Users,
-- then run the admin upsert in SETUP.md (step 3).
-- ============================================================

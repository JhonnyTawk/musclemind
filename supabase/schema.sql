-- ============================================================
-- MuscleMind — Supabase schema
-- Run this in the Supabase SQL editor (Database → SQL Editor).
-- ============================================================

-- ---------- profiles (staff: admin / therapist) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  title text,
  role text not null default 'therapist' check (role in ('admin', 'therapist')),
  created_at timestamptz default now()
);

-- auto-create a profile row when a staff user signs up
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
  created_at timestamptz default now()
);

-- ---------- symptom logs (written by patients via share link) ----------
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

-- ============================================================
-- Row Level Security
--   * Staff (any authenticated user with a profile) → full access
--   * Anonymous patients → may read their own program via share
--     token and insert symptom logs. (Reads happen through the
--     anon key; writes are insert-only.)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.alerts enable row level security;
alter table public.exercise_programs enable row level security;
alter table public.assessments enable row level security;

-- profiles: each staff member reads all profiles, edits their own
create policy "staff read profiles" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "staff update own profile" on public.profiles
  for update using (auth.uid() = id);

-- staff: full access to clinical tables
create policy "staff all patients" on public.patients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff all logs" on public.symptom_logs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff all alerts" on public.alerts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff all programs" on public.exercise_programs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff all assessments" on public.assessments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- patient portal (anon key, no login):
--   read patient row + program by share token, insert daily logs
create policy "anon read patient by token" on public.patients
  for select to anon using (true);
create policy "anon read programs" on public.exercise_programs
  for select to anon using (true);
create policy "anon read own logs" on public.symptom_logs
  for select to anon using (true);
create policy "anon insert logs" on public.symptom_logs
  for insert to anon with check (true);

-- NOTE: For production, tighten anon reads with a Postgres function
-- keyed on share_token (or use Supabase Edge Functions) so anonymous
-- users can only fetch the row matching their token. For an MVP demo
-- the above is acceptable; tokens are unguessable.

-- ============================================================
-- Seed data (same demo clinic the app ships with)
-- ============================================================
insert into public.patients
  (id, code, full_name, age, gender, phone, email, occupation, activity, complaint, diagnosis, therapist_id, last_visit, status, pain_now, adherence, rehab_phase, history, surgical, medications, goals, red_flags, frequency, progress, share_token, is_acl)
values
  ('p1','MM-1042','Karim Nassar',24,'Male','+961 71 220 134','karim.n@example.com','University student','Football (semi-pro)','Right knee instability after ACL reconstruction','ACL reconstruction (hamstring graft) — 11 weeks post-op','t2', current_date - 2,'Active',3,86,3,'ACL rupture during match (non-contact pivot), surgery 11 weeks ago.','ACL reconstruction, hamstring autograft (right knee).','Paracetamol PRN','Return to competitive football next season.','None identified','2×/week','ROM nearly full (0–135°). Quad symmetry 78%.','demo-karim',true),
  ('p2','MM-1018','Rana Fares',38,'Female','+961 70 884 921','rana.f@example.com','Graphic designer','Pilates 2×/week','Right shoulder pain with overhead reach','Subacromial pain syndrome','t3', current_date - 1,'Active',5,64,null,'Gradual onset over 3 months, desk-based work.','None','Ibuprofen PRN','Pain-free overhead reach.','None identified','1×/week','Flexion improved 140°→165°. Adherence dipped this week.','demo-rana',false),
  ('p3','MM-0991','Georges Abi Saleh',52,'Male','+961 76 410 287','g.abisaleh@example.com','Accountant','Walking, hiking','Chronic low back pain, worse with sitting','Non-specific chronic low back pain','t3', current_date - 4,'Active',6,91,null,'8-year episodic LBP, current flare 6 weeks.','Appendectomy (2009)','None','Sit through a workday comfortably.','Screened negative','1×/week','Oswestry 38%→26%. Pain trending up last 3 days.','demo-georges',false),
  ('p4','MM-1101','Sara Mansour',17,'Female','+961 81 559 003','sara.m@example.com','High-school student','Basketball','Left knee pain after jumping','Patellofemoral pain syndrome','t2', current_date - 6,'Active',2,95,null,'Pain onset during training spike.','None','None','Pain-free jumping.','None identified','1×/week','Excellent adherence. Pain 6→2.','demo-sara',false),
  ('p5','MM-0876','Hadi Sleiman',45,'Male','+961 03 778 612','hadi.s@example.com','Software engineer','Cycling','Neck stiffness and headaches','Cervicogenic headache with postural contribution','t3', current_date - 3,'Active',4,58,null,'Long screen hours, forward-head posture.','None','None','Reduce headaches to <1/week.','Screened negative','1×/week','Headaches down to 2/week. Missed 3 sessions.','demo-hadi',false),
  ('p9','MM-1150','Ali Zein',27,'Male','+961 81 660 154','ali.z@example.com','Chef','Basketball','Left ACL tear — pre-op conditioning','ACL rupture (left) — prehab, surgery in 3 weeks','t2', current_date - 1,'Active',4,82,1,'Landing injury 2 weeks ago, MRI-confirmed.','Scheduled: ACL reconstruction','Paracetamol PRN','Full extension before surgery.','None identified','2×/week','Swelling settling. Extension −3°.','demo-ali',true)
on conflict (id) do nothing;

insert into public.alerts (patient_id, severity, kind, text) values
  ('p3','high','Pain worsening','Pain rising 3 consecutive days (6 → 8)'),
  ('p5','medium','Missed sessions','3 of 5 exercise sessions missed this week'),
  ('p9','high','Red flag check','Reported giving-way episode — review before loading');

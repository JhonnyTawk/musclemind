-- ============================================================
-- Therapists / team — an editable list you manage in Settings.
-- (Decoupled from logins: this is just who patients are assigned
-- to. Staff logins still live in profiles.)
-- Run once in the SQL Editor. Safe to re-run.
-- ============================================================
create table if not exists public.therapists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  created_at timestamptz default now()
);

alter table public.therapists enable row level security;
grant select, insert, update, delete on public.therapists to authenticated;

drop policy if exists "therapists staff all" on public.therapists;
create policy "therapists staff all" on public.therapists
  for all using (public.is_staff()) with check (public.is_staff());

-- Seed yourself as the first therapist (only if the table is empty).
insert into public.therapists (name, title)
select 'Chada Tawk', 'Physiotherapist'
where not exists (select 1 from public.therapists);

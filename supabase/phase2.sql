-- ============================================================
-- MuscleMind — Phase 2A schema (bookings + availability)
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Safe to re-run.
-- ============================================================

-- ---------- booking requests (from the public homepage) ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  session_type text,
  requested_date date,
  requested_time text,
  notes text,
  -- pending → confirmed → done, or declined
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'declined', 'done')),
  created_at timestamptz default now()
);

create index if not exists bookings_status_idx on public.bookings (status, requested_date);

-- ---------- clinic availability blocks ----------
-- time null/empty = the whole day is blocked.
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
-- Row Level Security
--   * Anonymous visitors → may CREATE a booking and READ
--     availability (so the form can hide blocked slots).
--   * Staff (authenticated) → full control of both tables.
-- ============================================================
alter table public.bookings enable row level security;
alter table public.availability_blocks enable row level security;

-- bookings: public can submit; only staff can read/update/delete
drop policy if exists "anon create booking" on public.bookings;
create policy "anon create booking" on public.bookings
  for insert to anon with check (true);

drop policy if exists "staff manage bookings" on public.bookings;
create policy "staff manage bookings" on public.bookings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- availability: public can read; only staff can modify
drop policy if exists "anon read availability" on public.availability_blocks;
create policy "anon read availability" on public.availability_blocks
  for select to anon using (true);

drop policy if exists "staff manage availability" on public.availability_blocks;
create policy "staff manage availability" on public.availability_blocks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

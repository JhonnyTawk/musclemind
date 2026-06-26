-- ============================================================
-- Fix: website bookings are not being saved.
-- Cause: the public (anon) INSERT policy on bookings was missing,
-- so every submission from the website was rejected by RLS.
-- This restores it (and the staff policies). Safe to re-run.
-- ============================================================

-- Helper used by the staff policies (create if it doesn't exist).
create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'therapist'));
$$;
grant execute on function public.is_staff() to anon, authenticated;

alter table public.bookings enable row level security;
alter table public.availability_blocks enable row level security;

grant insert on public.bookings to anon;
grant select on public.availability_blocks to anon;

-- Public website visitors may CREATE a booking request.
drop policy if exists "anon create booking" on public.bookings;
create policy "anon create booking" on public.bookings
  for insert to anon with check (true);

-- Staff can read / manage all bookings.
drop policy if exists "staff manage bookings" on public.bookings;
drop policy if exists "bookings staff all" on public.bookings;
create policy "bookings staff all" on public.bookings
  for all using (public.is_staff()) with check (public.is_staff());

-- Public may read availability (so the booking form hides blocked slots).
drop policy if exists "anon read availability" on public.availability_blocks;
create policy "anon read availability" on public.availability_blocks
  for select to anon using (true);

drop policy if exists "staff manage availability" on public.availability_blocks;
drop policy if exists "availability staff all" on public.availability_blocks;
create policy "availability staff all" on public.availability_blocks
  for all using (public.is_staff()) with check (public.is_staff());

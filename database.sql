-- ============================================================
-- Supabase database setup for the Land Record Admin package
-- Run this SQL in Supabase SQL Editor.
-- ============================================================
create table if not exists public.land_records (
  id bigint primary key,
  khatian text not null default '৩০২',
  owner text not null default 'দঃ আবদুল খালেক',
  dag_no text not null default '৪৯৬৯',
  survey text not null default 'আর এস',
  mouza text not null default 'আলাদিনগর',
  upazila text not null default 'বেগমগঞ্জ',
  district text not null default 'নোয়াখালী',
  division text not null default 'চট্টগ্রাম',
  record_date text not null default '২৪ আগস্ট ২০২৬',
  updated_at timestamptz not null default now()
);
insert into public.land_records (id) values (1) on conflict (id) do nothing;

alter table public.land_records enable row level security;

-- Anyone can read the public record.
drop policy if exists "Public can read land record" on public.land_records;
create policy "Public can read land record" on public.land_records
for select to anon, authenticated using (true);

-- Only authenticated users with the admin email/role should write.
-- For the simplest setup, replace YOUR_ADMIN_EMAIL below with your admin email.
drop policy if exists "Admin can write land record" on public.land_records;
create policy "Admin can write land record" on public.land_records
for all to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL')
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');

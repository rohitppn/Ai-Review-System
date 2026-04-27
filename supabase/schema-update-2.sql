-- Phase 2.2 — categories, keywords, QR designs, super admin, storage, tighter RLS
-- Run in Supabase Dashboard → SQL Editor.

-- ─── stores: new columns ───────────────────────────────────────────────
alter table public.stores
  add column if not exists keywords text[] not null default '{}',
  add column if not exists qr_design text not null default 'classic';

-- ─── profiles (for is_admin role) ──────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

-- Auto-create a profile row for every new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill existing users
insert into public.profiles (id)
select id from auth.users on conflict do nothing;

-- ─── tighten RLS on stores ─────────────────────────────────────────────
-- The old policy let any logged-in user read every store. Replace with
-- owner-or-admin read. The customer (anonymous) review page uses the
-- service-role client server-side, which bypasses RLS, so public scan
-- still works.
drop policy if exists "stores public read" on public.stores;

drop policy if exists "stores owner or admin read" on public.stores;
create policy "stores owner or admin read"
  on public.stores for select
  using (
    auth.uid() = owner_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Also let admins update/delete any store
drop policy if exists "stores admin write" on public.stores;
create policy "stores admin write"
  on public.stores for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (true);

drop policy if exists "stores admin delete" on public.stores;
create policy "stores admin delete"
  on public.stores for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- ─── reviews: admin can read all ───────────────────────────────────────
drop policy if exists "reviews admin read" on public.reviews;
create policy "reviews admin read"
  on public.reviews for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- ─── storage bucket for store logos ────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Anyone authenticated can upload to the logos bucket; we namespace by
-- user id so RLS prevents one owner from overwriting another's logos.
drop policy if exists "logos auth upload" on storage.objects;
create policy "logos auth upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'logos');

drop policy if exists "logos public read" on storage.objects;
create policy "logos public read"
  on storage.objects for select
  using (bucket_id = 'logos');

drop policy if exists "logos owner update" on storage.objects;
create policy "logos owner update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'logos' and owner = auth.uid());

drop policy if exists "logos owner delete" on storage.objects;
create policy "logos owner delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'logos' and owner = auth.uid());

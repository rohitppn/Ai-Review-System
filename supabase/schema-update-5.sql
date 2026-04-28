-- Phase 2.5 — self-onboarding: pending stores, custom categories, delivery addresses
-- Run in Supabase Dashboard → SQL Editor.

alter table public.stores
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected')),
  add column if not exists custom_category_label text,
  add column if not exists delivery_name        text,
  add column if not exists delivery_phone       text,
  add column if not exists delivery_address     text,
  add column if not exists delivery_city        text,
  add column if not exists delivery_state       text,
  add column if not exists delivery_pincode     text,
  add column if not exists payment_amount_inr   integer,
  add column if not exists submitted_at         timestamptz,
  add column if not exists approved_at          timestamptz,
  add column if not exists rejection_reason     text;

-- Backfill existing stores as 'active' so the live ones don't go dark.
update public.stores set status = 'active' where status = 'pending' and created_at < now() - interval '1 hour';

-- Helpful index for admin's pending queue.
create index if not exists stores_status_submitted_idx
  on public.stores(status, submitted_at desc nulls last);

-- Allow newly-signed-up users to insert THEIR OWN pending store (in addition to admin).
drop policy if exists "stores admin insert" on public.stores;
drop policy if exists "stores self insert pending" on public.stores;

create policy "stores self insert pending"
  on public.stores for insert
  to authenticated
  with check (
    -- Either an admin is doing it (any state), or the signed-in user is creating
    -- their own pending store.
    (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    )
    or (
      auth.uid() = owner_id
      and status = 'pending'
    )
  );

-- AI Review — Phase 2 schema
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run.

-- ─── stores ────────────────────────────────────────────────────────────
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  category text not null default 'store',
  google_review_url text,
  created_at timestamptz not null default now()
);

create index if not exists stores_owner_id_idx on public.stores(owner_id);

-- ─── reviews (each customer scan that picked a review) ─────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  picked_review text,
  posted_to_google boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reviews_store_id_created_at_idx
  on public.reviews(store_id, created_at desc);

-- ─── RLS ───────────────────────────────────────────────────────────────
alter table public.stores  enable row level security;
alter table public.reviews enable row level security;

-- Stores: anyone can read (needed for the public /review/[slug] page),
-- but only the owner can insert/update/delete their own stores.
drop policy if exists "stores public read" on public.stores;
create policy "stores public read"
  on public.stores for select
  using (true);

drop policy if exists "stores owner insert" on public.stores;
create policy "stores owner insert"
  on public.stores for insert
  with check (auth.uid() = owner_id);

drop policy if exists "stores owner update" on public.stores;
create policy "stores owner update"
  on public.stores for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "stores owner delete" on public.stores;
create policy "stores owner delete"
  on public.stores for delete
  using (auth.uid() = owner_id);

-- Reviews: anonymous can insert (the public scan page),
-- only the store's owner can read/update/delete their reviews.
drop policy if exists "reviews public insert" on public.reviews;
create policy "reviews public insert"
  on public.reviews for insert
  with check (true);

drop policy if exists "reviews owner read" on public.reviews;
create policy "reviews owner read"
  on public.reviews for select
  using (
    exists (
      select 1 from public.stores s
      where s.id = reviews.store_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "reviews owner delete" on public.reviews;
create policy "reviews owner delete"
  on public.reviews for delete
  using (
    exists (
      select 1 from public.stores s
      where s.id = reviews.store_id and s.owner_id = auth.uid()
    )
  );

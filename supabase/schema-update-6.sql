-- Phase 2.6 — homepage showcase CMS.
-- Powers the "Real stores" grid on the marketing site (rohitppn/Starly).
-- Admins manage rows from /dashboard/showcase; the public reads via
-- /api/showcase (CORS-open, anon-key-readable).
-- Run in Supabase Dashboard → SQL Editor.

-- ─── table ─────────────────────────────────────────────────────────────
create table if not exists public.showcase_stores (
  id          uuid primary key default gen_random_uuid(),
  sort_order  integer not null default 0,
  name        text not null,
  category    text,
  city        text,
  photo_url   text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Sort: lower sort_order first, then newest first.
create index if not exists showcase_stores_sort_idx
  on public.showcase_stores(is_active, sort_order, created_at desc);

-- Auto-bump updated_at on every UPDATE.
create or replace function public.touch_showcase_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists showcase_stores_touch on public.showcase_stores;
create trigger showcase_stores_touch
  before update on public.showcase_stores
  for each row execute function public.touch_showcase_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────
alter table public.showcase_stores enable row level security;

-- Anyone (including anon) can read active rows. The marketing site uses
-- the anon key over CORS to fetch these.
drop policy if exists "showcase public read active" on public.showcase_stores;
create policy "showcase public read active"
  on public.showcase_stores for select
  using (is_active = true);

-- Admins can read everything (including is_active = false drafts).
drop policy if exists "showcase admin read all" on public.showcase_stores;
create policy "showcase admin read all"
  on public.showcase_stores for select
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.is_admin = true)
  );

-- Only admins can write.
drop policy if exists "showcase admin insert" on public.showcase_stores;
create policy "showcase admin insert"
  on public.showcase_stores for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "showcase admin update" on public.showcase_stores;
create policy "showcase admin update"
  on public.showcase_stores for update
  to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.is_admin = true)
  )
  with check (true);

drop policy if exists "showcase admin delete" on public.showcase_stores;
create policy "showcase admin delete"
  on public.showcase_stores for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.is_admin = true)
  );

-- ─── storage bucket ────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('showcase', 'showcase', true)
on conflict (id) do nothing;

-- Anyone can read showcase images (public bucket).
drop policy if exists "showcase public read" on storage.objects;
create policy "showcase public read"
  on storage.objects for select
  using (bucket_id = 'showcase');

-- Only admins can upload / replace / delete.
drop policy if exists "showcase admin upload" on storage.objects;
create policy "showcase admin upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'showcase'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "showcase admin update" on storage.objects;
create policy "showcase admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'showcase'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "showcase admin delete" on storage.objects;
create policy "showcase admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'showcase'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.is_admin = true)
  );

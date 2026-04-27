-- Phase 2.3 — admin-only store creation & deletion
-- Run in Supabase Dashboard → SQL Editor.
--
-- Before this migration:
--   Stores INSERT: any logged-in user could create a store and become its owner.
--   Stores DELETE: only owner could delete.
--
-- After this migration:
--   Stores INSERT: super admin only.
--   Stores DELETE: super admin only.
--   Stores UPDATE: owner of the store OR super admin.
--   Stores SELECT: owner OR super admin (unchanged).

-- ─── stores INSERT: admin only ─────────────────────────────────────────
drop policy if exists "stores owner insert" on public.stores;
drop policy if exists "stores admin insert" on public.stores;

create policy "stores admin insert"
  on public.stores for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ─── stores UPDATE: owner OR admin ─────────────────────────────────────
drop policy if exists "stores owner update" on public.stores;
drop policy if exists "stores admin write" on public.stores;
drop policy if exists "stores owner or admin update" on public.stores;

create policy "stores owner or admin update"
  on public.stores for update
  to authenticated
  using (
    auth.uid() = owner_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (true);

-- ─── stores DELETE: admin only ─────────────────────────────────────────
drop policy if exists "stores owner delete" on public.stores;
drop policy if exists "stores admin delete" on public.stores;

create policy "stores admin delete"
  on public.stores for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

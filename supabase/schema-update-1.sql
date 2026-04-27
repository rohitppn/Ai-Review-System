-- Phase 2.1 — store branding
-- Run this in Supabase Dashboard → SQL Editor.

alter table public.stores
  add column if not exists logo_url text;

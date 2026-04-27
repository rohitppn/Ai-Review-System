-- Phase 2.4 — store social media links
-- Run in Supabase Dashboard → SQL Editor.

alter table public.stores
  add column if not exists instagram_url text,
  add column if not exists facebook_url  text,
  add column if not exists twitter_url   text,
  add column if not exists youtube_url   text,
  add column if not exists whatsapp_url  text;

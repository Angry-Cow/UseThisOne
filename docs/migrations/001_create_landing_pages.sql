-- =============================================================
-- Migration: 001_create_landing_pages  (FINAL — v2, hardened)
-- Project:   TOLR (fgfyfxgbsqirdenkwatl)
-- Purpose:   Create the LandingPage table for admin-managed
--            sales offer landing pages with embedded iframe content
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Create the table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."LandingPage" (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  slug         text        NOT NULL,
  embed_script text        NOT NULL DEFAULT '',
  iframe_src   text        NOT NULL DEFAULT '',
  is_published boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- 2. Unique constraint — slug must be unique across all pages
--    (slug becomes the URL path segment: /offers/<slug>)
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'landing_page_slug_unique'
      AND conrelid = 'public."LandingPage"'::regclass
  ) THEN
    ALTER TABLE public."LandingPage"
      ADD CONSTRAINT landing_page_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Index to speed up public slug look-ups
CREATE INDEX IF NOT EXISTS idx_landing_page_slug
  ON public."LandingPage" (slug)
  WHERE is_published = true;

-- ---------------------------------------------------------------
-- 3. Auto-update updated_at on every row change
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER landing_page_set_updated_at
  BEFORE UPDATE ON public."LandingPage"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------
ALTER TABLE public."LandingPage" ENABLE ROW LEVEL SECURITY;

-- Drop policies first so the script is idempotent
DROP POLICY IF EXISTS "public_read_published_landing_pages"    ON public."LandingPage";
DROP POLICY IF EXISTS "authenticated_full_access_landing_pages" ON public."LandingPage";

-- Public (anonymous) policy: SELECT only published pages
CREATE POLICY "public_read_published_landing_pages"
  ON public."LandingPage"
  FOR SELECT
  TO anon
  USING (is_published = true);

-- Authenticated admins: full CRUD on all rows
CREATE POLICY "authenticated_full_access_landing_pages"
  ON public."LandingPage"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------
-- 5. Grant table-level permissions
-- ---------------------------------------------------------------
GRANT SELECT ON public."LandingPage" TO anon;
GRANT ALL    ON public."LandingPage" TO authenticated;

-- ---------------------------------------------------------------
-- Done.
-- After running this script the following is true:
--   • Anonymous visitors can SELECT rows where is_published = true
--   • Logged-in admins can INSERT / UPDATE / DELETE all rows
--   • slug is enforced unique (duplicate slugs will error)
--   • updated_at is managed automatically by the trigger
-- ---------------------------------------------------------------

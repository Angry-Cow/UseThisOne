-- =============================================================
-- Migration: SASSTAC Site Control Migration
-- Project:   SASSTAC (sister site to TOLR)
-- Purpose:   Create three tables that back the new admin
--            "Setup" and "Section Management" areas:
--              1. SiteSettings   — single-row color tokens + site identity
--              2. SectionText    — key/value store for all section copy fields
--              3. UsefulLink     — footer "Useful" column link items
--
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE / DO $$
--
-- ⚠️  AFTER RUNNING: Log in to the SASSTAC admin panel and update all
--     SectionText values + SiteSettings colors to SASSTAC content.
--     The seed values below use TOLR defaults as placeholders.
-- =============================================================

-- ================================================================
-- SHARED UTILITY: set_updated_at trigger function
-- Uses CREATE OR REPLACE so this is safe whether or not migration
-- 001 has already been run on this Supabase project.
-- ================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- TABLE 1: SiteSettings
-- ================================================================
-- Single-row table (singleton boolean PK + CHECK constraint).
-- Stores 30 color tokens, site identity, and navbar items.
-- Public can SELECT only; authenticated admins can UPDATE only.
-- No INSERT or DELETE allowed after seed row is created.
-- ================================================================
CREATE TABLE IF NOT EXISTS public."SiteSettings" (
  singleton        boolean PRIMARY KEY DEFAULT true,
  CONSTRAINT site_settings_singleton CHECK (singleton = true),

  -- Site identity
  site_name        text NOT NULL DEFAULT 'SASSTAC',
  site_tagline     text NOT NULL DEFAULT 'Your Tagline Here',
  logo_url         text NOT NULL DEFAULT '',

  -- Navbar
  navbar_cta_text        text NOT NULL DEFAULT 'Book Now',
  navbar_cta_href        text NOT NULL DEFAULT '#contact',
  navbar_mobile_cta_text text NOT NULL DEFAULT 'Book a Course',
  navbar_items     jsonb NOT NULL DEFAULT '[
    {"label":"Services","href":"#services"},
    {"label":"Why Us","href":"#why-us"},
    {"label":"Courses","href":"#courses"},
    {"label":"Pricing","href":"#pricing"},
    {"label":"FAQ","href":"#faq"},
    {"label":"Contact","href":"#contact"}
  ]'::jsonb,

  -- Navbar colors
  color_navbar_bg          text NOT NULL DEFAULT '#ffffff',
  color_navbar_border      text NOT NULL DEFAULT '#0e7490',
  color_navbar_text        text NOT NULL DEFAULT '#1f2937',
  color_navbar_active      text NOT NULL DEFAULT '#d97706',
  color_brand_primary      text NOT NULL DEFAULT '#d97706',

  -- Button colors
  color_btn_primary_bg     text NOT NULL DEFAULT '#d97706',
  color_btn_primary_text   text NOT NULL DEFAULT '#ffffff',
  color_btn_secondary_bg   text NOT NULL DEFAULT 'rgba(255,255,255,0.1)',
  color_btn_secondary_text text NOT NULL DEFAULT '#ffffff',
  color_btn_nav_bg         text NOT NULL DEFAULT '#0c4a6e',
  color_btn_nav_text       text NOT NULL DEFAULT '#ffffff',

  -- Page backgrounds
  color_bg_light           text NOT NULL DEFAULT '#ffffff',
  color_bg_alt             text NOT NULL DEFAULT '#f8fafc',

  -- Section typography
  color_section_eyebrow    text NOT NULL DEFAULT '#0c4a6e',
  color_section_heading    text NOT NULL DEFAULT '#0f172a',
  color_section_body       text NOT NULL DEFAULT '#6b7280',

  -- Accents
  color_accent_orange      text NOT NULL DEFAULT '#d97706',
  color_accent_peach       text NOT NULL DEFAULT '#fdba74',

  -- Footer
  color_footer_bg          text NOT NULL DEFAULT '#0f172a',
  color_footer_heading     text NOT NULL DEFAULT '#d97706',
  color_footer_text        text NOT NULL DEFAULT 'rgba(255,255,255,0.6)',
  color_footer_copyright   text NOT NULL DEFAULT 'rgba(255,255,255,0.4)',

  -- FAQ
  color_faq_eyebrow        text NOT NULL DEFAULT '#d97706',
  color_faq_heading        text NOT NULL DEFAULT '#0c4a6e',

  -- Hero
  color_hero_overlay_start text NOT NULL DEFAULT 'rgba(11,74,111,0.4)',
  color_hero_overlay_end   text NOT NULL DEFAULT 'rgba(11,74,111,0.8)',
  color_badge_bg           text NOT NULL DEFAULT '#0c4a6e',
  color_badge_text         text NOT NULL DEFAULT '#ffffff',
  color_badge_highlight    text NOT NULL DEFAULT '#fbbf24',

  -- CTA
  color_cta_overlay        text NOT NULL DEFAULT 'rgba(12,74,110,0.9)',

  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public."SiteSettings";
CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public."SiteSettings"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the singleton row (idempotent)
INSERT INTO public."SiteSettings" (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

-- RLS
ALTER TABLE public."SiteSettings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings"          ON public."SiteSettings";
DROP POLICY IF EXISTS "authenticated_manage_site_settings"  ON public."SiteSettings";

CREATE POLICY "public_read_site_settings"
  ON public."SiteSettings"
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "authenticated_manage_site_settings"
  ON public."SiteSettings"
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT             ON public."SiteSettings" TO anon;
GRANT SELECT, UPDATE     ON public."SiteSettings" TO authenticated;


-- ================================================================
-- TABLE 2: SectionText
-- ================================================================
-- Key/value store for all section copy text fields.
-- field_type drives the admin form widget:
--   'text'     → single-line input
--   'textarea' → multi-line textarea
--   'url'      → URL input (image or embed URL)
--   'href'     → anchor (#section) or full URL
-- All 53 seed rows below use TOLR copy as placeholders.
-- Update them to SASSTAC content via the Section Management admin page.
-- ================================================================
CREATE TABLE IF NOT EXISTS public."SectionText" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section     text NOT NULL,
  field_key   text NOT NULL UNIQUE,
  field_label text NOT NULL,
  field_type  text NOT NULL DEFAULT 'text',
  value       text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_section_text_section
  ON public."SectionText" (section);

CREATE INDEX IF NOT EXISTS idx_section_text_field_key
  ON public."SectionText" (field_key);

DROP TRIGGER IF EXISTS section_text_set_updated_at ON public."SectionText";
CREATE TRIGGER section_text_set_updated_at
  BEFORE UPDATE ON public."SectionText"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public."SectionText" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_section_text"          ON public."SectionText";
DROP POLICY IF EXISTS "authenticated_manage_section_text"  ON public."SectionText";

CREATE POLICY "public_read_section_text"
  ON public."SectionText"
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "authenticated_manage_section_text"
  ON public."SectionText"
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT ON public."SectionText" TO anon;
GRANT ALL    ON public."SectionText" TO authenticated;

-- ----------------------------------------------------------------
-- Seed: 53 text fields covering all 10 sections
-- Values below are TOLR defaults — update to SASSTAC content after running
-- ON CONFLICT DO NOTHING = idempotent / safe to re-run
-- ----------------------------------------------------------------
INSERT INTO public."SectionText" (section, field_key, field_label, field_type, value) VALUES

-- NAVBAR
('navbar', 'navbar_site_name',        'Site Name',                   'text',     'SASSTAC'),
('navbar', 'navbar_tagline',          'Tagline',                     'text',     'Your Site Tagline'),
('navbar', 'navbar_logo_url',         'Logo Image URL',              'url',      ''),
('navbar', 'navbar_cta_button_text',  '"Book Now" Button Text',      'text',     'Book Now'),
('navbar', 'navbar_cta_button_href',  '"Book Now" Button Target',    'href',     '#contact'),
('navbar', 'navbar_mobile_cta_text',  'Mobile CTA Button Text',      'text',     'Book a Course'),

-- HERO
('hero', 'hero_badge_text',           'Star Badge Text',             'text',     'Training at YOUR Office, Home or Facility'),
('hero', 'hero_badge_highlight',      'Badge Highlight Word',        'text',     'YOUR'),
('hero', 'hero_h1_line1',             'Headline Line 1',             'text',     'Be Aware.'),
('hero', 'hero_h1_line2',             'Headline Line 2',             'text',     'Be Benchmarked.'),
('hero', 'hero_h1_line3',             'Headline Line 3',             'text',     'Be Committed.'),
('hero', 'hero_paragraph',            'Body Paragraph',              'textarea', 'Placeholder hero paragraph. Update this in Section Management.'),
('hero', 'hero_btn1_text',            'Primary Button Text',         'text',     'Book a Course'),
('hero', 'hero_btn1_target',          'Primary Button Target',       'href',     '#booking-form'),
('hero', 'hero_btn2_text',            'Secondary Button Text',       'text',     'View Courses'),
('hero', 'hero_btn2_target',          'Secondary Button Target',     'href',     '#courses'),
('hero', 'hero_image_url',            'Hero Background Image URL',   'url',      ''),

-- SERVICES
('services', 'services_eyebrow',      'Eyebrow Label',               'text',     'Our Expertise'),
('services', 'services_heading',      'Main Heading',                'text',     'Comprehensive Training'),
('services', 'services_subtext',      'Description Paragraph',       'textarea', 'Placeholder services description. Update this in Section Management.'),

-- WHY US
('whyus', 'whyus_eyebrow',            'Eyebrow Label',               'text',     'The Difference'),
('whyus', 'whyus_heading',            'Main Heading',                'text',     'Why Choose SASSTAC?'),

-- TESTIMONIALS
('testimonials', 'testimonials_eyebrow', 'Eyebrow Label',            'text',     'Student Experiences'),
('testimonials', 'testimonials_heading', 'Main Heading',             'text',     'What Our Students Say'),
('testimonials', 'testimonials_subtext', 'Body Paragraph',           'textarea', 'Real feedback from real people who trained with us.'),

-- COURSES
('courses', 'courses_eyebrow',        'Eyebrow Label',               'text',     'Course Catalog'),
('courses', 'courses_heading',        'Main Heading',                'text',     'Find the Right Course'),
('courses', 'courses_subtext',        'Description Paragraph',       'textarea', 'Browse all available training programs.'),

-- COURSE INVESTMENT
('investment', 'investment_eyebrow',  'Eyebrow Label',               'text',     'Course Investment'),
('investment', 'investment_heading',  'Main Heading',                'text',     'Ready to Start Your Training?'),
('investment', 'investment_alert_text','Notice Box Text',            'textarea', ''),

-- CTA
('cta', 'cta_heading',                'Main Heading',                'text',     'Empower Yourself with Life-Saving Skills Today.'),
('cta', 'cta_subtext',                'Body Text',                   'textarea', 'Don''t wait for an emergency to be prepared. Take the first step toward personal safety.'),
('cta', 'cta_button_text',            'Button Text',                 'text',     'Book Your Course Now'),
('cta', 'cta_button_target',          'Button Target',               'href',     '#booking-form'),

-- FAQ
('faq', 'faq_eyebrow',                'Eyebrow Label',               'text',     'Got Questions?'),
('faq', 'faq_heading',                'Main Heading',                'text',     'Frequently Asked Questions'),
('faq', 'faq_intro_text',             'Intro Paragraph Text',        'textarea', 'Everything you need to know before you book. Can''t find your answer here?'),
('faq', 'faq_link_text',              'Inline Link Label',           'text',     'Reach out directly.'),
('faq', 'faq_link_target',            'Inline Link Target',          'href',     '#contact'),

-- FOOTER
('footer', 'footer_brand_name',           'Footer Brand Name',          'text',     'SASSTAC'),
('footer', 'footer_brand_tagline',        'Footer Tagline',             'text',     'Your Site Tagline'),
('footer', 'footer_brand_description',    'Brand Blurb',                'textarea', 'Placeholder brand description. Update this in Section Management.'),
('footer', 'footer_logo_url',             'Footer Logo URL',            'url',      ''),
('footer', 'footer_contact_address',      'Address',                    'text',     'Your City, State'),
('footer', 'footer_contact_phone',        'Phone Number',               'text',     '(000) 000-0000'),
('footer', 'footer_contact_email',        'Email Address',              'text',     'info@yourdomain.com'),
('footer', 'footer_contact_hours',        'Business Hours',             'text',     'Mon–Sat: 8am – 7pm'),
('footer', 'footer_findus_heading',       '"Find Us" Heading',          'text',     'Find Us'),
('footer', 'footer_map_src',              'Google Maps Embed URL',      'url',      ''),
('footer', 'footer_map_caption',          'Map Caption Text',           'textarea', 'Serving your local community.'),
('footer', 'footer_copyright_text',       'Copyright Line',             'text',     '© {year} SASSTAC. All rights reserved.'),
('footer', 'legal_privacy_content',       'Privacy Policy Content',     'textarea', ''),
('footer', 'legal_terms_content',         'Terms of Service Content',   'textarea', ''),
('footer', 'legal_accessibility_content', 'Accessibility Statement',    'textarea', '')

ON CONFLICT (field_key) DO NOTHING;


-- ================================================================
-- TABLE 3: UsefulLink
-- ================================================================
-- Footer "Useful" column items.
-- switch=0 hides from public; switch=1 shows.
-- order column drives drag-drop sort (lower = first).
-- ================================================================
CREATE TABLE IF NOT EXISTS public."UsefulLink" (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  switch      smallint    NOT NULL DEFAULT 1,
  "order"     integer     NOT NULL DEFAULT 0,
  label       text        NOT NULL DEFAULT '',
  url         text        NOT NULL DEFAULT '',
  description text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_useful_link_order
  ON public."UsefulLink" ("order");

DROP TRIGGER IF EXISTS useful_link_set_updated_at ON public."UsefulLink";
CREATE TRIGGER useful_link_set_updated_at
  BEFORE UPDATE ON public."UsefulLink"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public."UsefulLink" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_useful_links"          ON public."UsefulLink";
DROP POLICY IF EXISTS "authenticated_manage_useful_links"  ON public."UsefulLink";

-- Public footer reads only switch=1 rows
CREATE POLICY "public_read_useful_links"
  ON public."UsefulLink"
  FOR SELECT TO anon
  USING (switch = 1);

-- Admins full CRUD
CREATE POLICY "authenticated_manage_useful_links"
  ON public."UsefulLink"
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT ON public."UsefulLink" TO anon;
GRANT ALL    ON public."UsefulLink" TO authenticated;


-- ================================================================
-- Done.
--
-- After running this script:
--
--   1. Log in to SASSTAC admin panel
--   2. Go to Site Setup → update site name, tagline, color tokens
--      to match SASSTAC's actual brand colors
--   3. Go to Section Management → update ALL text fields to
--      SASSTAC's actual content (hero, services, footer, etc.)
--   4. Update footer_map_src in Section Management → Footer
--      to SASSTAC's Google Maps embed URL
--   5. Add any Useful Links relevant to SASSTAC
--
-- Tables created:
--   SiteSettings  — 1 singleton row seeded, public SELECT / auth UPDATE
--   SectionText   — 53 seed rows (SASSTAC placeholder content), full CRUD
--   UsefulLink    — empty, ready to receive footer Useful column items
--
-- All three tables:
--   • Use snake_case columns (project convention)
--   • Have updated_at auto-managed by trigger
--   • Are safe to re-run (idempotent)
--   • RLS: anon SELECT, authenticated write
-- ================================================================

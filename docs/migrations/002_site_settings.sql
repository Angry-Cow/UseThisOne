-- =============================================================
-- Migration: 002_site_settings
-- Project:   TOLR (fgfyfxgbsqirdenkwatl)
-- Purpose:   Create three tables that back the new admin
--            "Setup" and "Section Management" areas:
--              1. SiteSettings   — single-row color tokens + site identity
--              2. SectionText    — key/value store for all section copy fields
--              3. UsefulLink     — footer "Useful" column link items
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE / DO $$
-- =============================================================

-- ================================================================
-- SHARED UTILITY: set_updated_at trigger function
-- Already created by migration 001 — use CREATE OR REPLACE so this
-- migration is safe to run independently on a fresh schema.
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
-- Design decisions:
--   • Single-row table enforced by a CHECK constraint on a
--     "singleton" boolean column that must always be TRUE.
--     This prevents a second row from ever being inserted.
--   • Color tokens stored as hex strings (e.g. '#d97706').
--     Rgba values stored as css-ready strings (e.g. 'rgba(11,74,111,0.8)').
--   • navbar_items stored as JSONB array of {label, href} objects.
--     Both Navbar and Footer Quick Links read this one source.
--   • All columns have NOT NULL DEFAULT so the row is always
--     fully populated even without any admin customisation.
-- ================================================================
CREATE TABLE IF NOT EXISTS public."SiteSettings" (
  -- Singleton guard
  singleton        boolean PRIMARY KEY DEFAULT true,
  CONSTRAINT site_settings_singleton CHECK (singleton = true),

  -- Site identity (also used by Navbar + Footer brand)
  site_name        text NOT NULL DEFAULT 'T.O.L.R.™',
  site_tagline     text NOT NULL DEFAULT 'Tools Of Last Resort',
  logo_url         text NOT NULL DEFAULT '',

  -- Navbar
  navbar_cta_text  text NOT NULL DEFAULT 'Book Now',
  navbar_cta_href  text NOT NULL DEFAULT '#contact',
  navbar_mobile_cta_text text NOT NULL DEFAULT 'Book a Course',
  navbar_items     jsonb NOT NULL DEFAULT '[
    {"label":"Services","href":"#services"},
    {"label":"Why Us","href":"#why-us"},
    {"label":"Courses","href":"#courses"},
    {"label":"Pricing","href":"#pricing"},
    {"label":"FAQ","href":"#faq"},
    {"label":"Contact","href":"#contact"}
  ]'::jsonb,

  -- ── PART A: Color tokens ──────────────────────────────────────
  -- Navbar
  color_navbar_bg          text NOT NULL DEFAULT '#ffffff',
  color_navbar_border      text NOT NULL DEFAULT '#0e7490',
  color_navbar_text        text NOT NULL DEFAULT '#1f2937',
  color_navbar_active      text NOT NULL DEFAULT '#d97706',
  color_brand_primary      text NOT NULL DEFAULT '#d97706',

  -- Buttons
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

  -- Accent
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

  -- Timestamps
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger: keep updated_at current
DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public."SiteSettings";
CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public."SiteSettings"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the single row (idempotent — DO NOTHING on conflict)
INSERT INTO public."SiteSettings" (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

-- RLS
ALTER TABLE public."SiteSettings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings"         ON public."SiteSettings";
DROP POLICY IF EXISTS "authenticated_manage_site_settings" ON public."SiteSettings";

-- Anyone can read (public site needs color tokens at runtime)
CREATE POLICY "public_read_site_settings"
  ON public."SiteSettings"
  FOR SELECT
  TO anon
  USING (true);

-- Only authenticated admins can update (INSERT is seeded above; no DELETE allowed)
CREATE POLICY "authenticated_manage_site_settings"
  ON public."SiteSettings"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public."SiteSettings" TO anon;
GRANT SELECT, UPDATE ON public."SiteSettings" TO authenticated;


-- ================================================================
-- TABLE 2: SectionText
-- ================================================================
-- Design decisions:
--   • Key/value pattern: one row per text field, keyed by `field_key`
--     (matches the field keys in SITE_SETTINGS_SCOPE_MAP.md Part B).
--   • Storing as key/value (rather than one column per field) keeps
--     the schema flexible — new fields can be added without a schema
--     migration, just a new seed row.
--   • `section` column allows the admin UI to group fields by section
--     without parsing the key name.
--   • `field_label` is a human-readable label shown in the admin form.
--   • `field_type` controls the input widget:
--       'text'     → single-line input
--       'textarea' → multi-line textarea
--       'url'      → URL input (image picker or plain URL)
--       'href'     → anchor/scroll-target selector
--   • All text values default to the current hardcoded site copy so
--     the site looks identical on first deploy.
-- ================================================================
CREATE TABLE IF NOT EXISTS public."SectionText" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section     text NOT NULL,          -- e.g. 'navbar', 'hero', 'services'
  field_key   text NOT NULL UNIQUE,   -- e.g. 'hero_h1_line1'
  field_label text NOT NULL,          -- e.g. 'Headline Line 1'
  field_type  text NOT NULL DEFAULT 'text',  -- 'text' | 'textarea' | 'url' | 'href'
  value       text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_section_text_section
  ON public."SectionText" (section);

CREATE INDEX IF NOT EXISTS idx_section_text_field_key
  ON public."SectionText" (field_key);

-- Trigger: keep updated_at current
DROP TRIGGER IF EXISTS section_text_set_updated_at ON public."SectionText";
CREATE TRIGGER section_text_set_updated_at
  BEFORE UPDATE ON public."SectionText"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public."SectionText" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_section_text"         ON public."SectionText";
DROP POLICY IF EXISTS "authenticated_manage_section_text" ON public."SectionText";

CREATE POLICY "public_read_section_text"
  ON public."SectionText"
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "authenticated_manage_section_text"
  ON public."SectionText"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public."SectionText" TO anon;
GRANT ALL    ON public."SectionText" TO authenticated;

-- ----------------------------------------------------------------
-- Seed all 33 text fields (PART B from SITE_SETTINGS_SCOPE_MAP.md)
-- ON CONFLICT DO NOTHING = idempotent / safe to re-run
-- ----------------------------------------------------------------
INSERT INTO public."SectionText" (section, field_key, field_label, field_type, value) VALUES

-- B1 Navbar
('navbar', 'navbar_site_name',        'Site Name',              'text',     'T.O.L.R.™'),
('navbar', 'navbar_tagline',           'Tagline',                'text',     'Tools Of Last Resort'),
('navbar', 'navbar_logo_url',          'Logo Image URL',         'url',      ''),
('navbar', 'navbar_cta_button_text',   '"Book Now" Button Text',  'text',     'Book Now'),
('navbar', 'navbar_cta_button_href',   '"Book Now" Button Target','href',     '#contact'),
('navbar', 'navbar_mobile_cta_text',   'Mobile CTA Button Text', 'text',     'Book a Course'),

-- B2 Hero
('hero', 'hero_badge_text',            'Star Badge Text',                'text',     'Training at YOUR Office, Home or Facility'),
('hero', 'hero_badge_highlight',       'Badge Highlight Word',           'text',     'YOUR'),
('hero', 'hero_h1_line1',              'Headline Line 1',                'text',     'Be Aware.'),
('hero', 'hero_h1_line2',              'Headline Line 2',                'text',     'Be Benchmarked.'),
('hero', 'hero_h1_line3',              'Headline Line 3',                'text',     'Be Committed.'),
('hero', 'hero_paragraph',             'Body Paragraph',                 'textarea', 'T.O.L.R.™ = Tools Of Last Resort. We specialize in personal firearms training from basic firearm orientation and operation to advanced defensive shooting and knife defense. Our instructors exceed NRA standards to ensure our practices are delivered at the highest quality.'),
('hero', 'hero_btn1_text',             'Primary Button Text',            'text',     'Book a Course'),
('hero', 'hero_btn1_target',           'Primary Button Target',          'href',     '#booking-form'),
('hero', 'hero_btn2_text',             'Secondary Button Text',          'text',     'View Courses'),
('hero', 'hero_btn2_target',           'Secondary Button Target',        'href',     '#courses'),
('hero', 'hero_image_url',             'Hero Background Image URL',      'url',      ''),

-- B3 Services
('services', 'services_eyebrow',       'Eyebrow Label',          'text',     'Our Expertise'),
('services', 'services_heading',       'Main Heading',           'text',     'Comprehensive Firearms Training'),
('services', 'services_subtext',       'Description Paragraph',  'textarea', 'If you are new to firearms or a seasoned shooter looking to improve your skills, we offer a wide variety of training courses to meet your needs.'),

-- B4 Why Us
('whyus', 'whyus_eyebrow',             'Eyebrow Label',          'text',     'The Difference'),
('whyus', 'whyus_heading',             'Main Heading',           'text',     'Why Choose T.O.L.R.™?'),

-- B5 Testimonials
('testimonials', 'testimonials_eyebrow', 'Eyebrow Label',        'text',     'Student Experiences'),
('testimonials', 'testimonials_heading', 'Main Heading',         'text',     'What Our Students Say'),
('testimonials', 'testimonials_subtext', 'Body Paragraph',       'textarea', 'Real feedback from real people who trained with us. We are proud of our students and the progress they make.'),

-- B6 Courses
('courses', 'courses_eyebrow',         'Eyebrow Label',          'text',     'Course Catalog'),
('courses', 'courses_heading',         'Main Heading',           'text',     'Find the Right Course'),
('courses', 'courses_subtext',         'Description Paragraph',  'textarea', 'From first aid to firearms, we offer courses for every skill level. Filter by category or browse all available training programs.'),

-- B7 Course Investment
('investment', 'investment_eyebrow',   'Eyebrow Label',          'text',     'Course Investment'),
('investment', 'investment_heading',   'Main Heading',           'text',     'Ready to Start Your Training?'),
('investment', 'investment_alert_text','Notice Box Text',        'textarea', ''),

-- B8 CTA
('cta', 'cta_heading',                 'Main Heading',           'text',     'Empower Yourself with Life-Saving Skills Today.'),
('cta', 'cta_subtext',                 'Body Text',              'textarea', 'Don''t wait for an emergency to be prepared. Take the first step toward personal safety and confidence.'),
('cta', 'cta_button_text',             'Button Text',            'text',     'Book Your Course Now'),
('cta', 'cta_button_target',           'Button Target',          'href',     '#booking-form'),

-- B9 FAQ
('faq', 'faq_eyebrow',                 'Eyebrow Label',          'text',     'Got Questions?'),
('faq', 'faq_heading',                 'Main Heading',           'text',     'Frequently Asked Questions'),
('faq', 'faq_intro_text',              'Intro Paragraph Text',   'textarea', 'Everything you need to know before you book. Can''t find your answer here?'),
('faq', 'faq_link_text',               'Inline Link Label',      'text',     'Reach out directly.'),
('faq', 'faq_link_target',             'Inline Link Target',     'href',     '#contact'),

-- B10 Footer
('footer', 'footer_brand_name',        'Footer Brand Name',      'text',     'T.O.L.R.™'),
('footer', 'footer_brand_tagline',     'Footer Tagline',         'text',     'Tools Of Last Resort'),
('footer', 'footer_brand_description', 'Brand Blurb',            'textarea', 'Providing personal awareness and defense training for individuals and groups. Serving South Plainfield, NJ and surrounding communities.'),
('footer', 'footer_logo_url',          'Footer Logo URL',        'url',      ''),
('footer', 'footer_contact_address',   'Address',                'text',     'South Plainfield, NJ'),
('footer', 'footer_contact_phone',     'Phone Number',           'text',     '(908) 758-4894'),
('footer', 'footer_contact_email',     'Email Address',          'text',     'info@tolr.net'),
('footer', 'footer_contact_hours',     'Business Hours',         'text',     'Mon–Sat: 8am – 7pm'),
('footer', 'footer_findus_heading',    '"Find Us" Heading',      'text',     'Find Us'),
('footer', 'footer_map_src',           'Google Maps Embed URL',  'url',      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020.123456789!2d-74.41!3d40.57!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDM0JzEyLjAiTiA3NMKwMjQnMzYuMCJX!5e0!3m2!1sen!2sus!4v1234567890'),
('footer', 'footer_map_caption',       'Map Caption Text',       'textarea', 'Serving South Plainfield, NJ and surrounding communities. Private training available at your home, office, or facility.'),
('footer', 'footer_copyright_text',    'Copyright Line',         'text',     '© {year} Safe and Secure Services. All rights reserved.'),
('footer', 'legal_privacy_content',    'Privacy Policy Content', 'textarea', ''),
('footer', 'legal_terms_content',      'Terms of Service Content','textarea',''),
('footer', 'legal_accessibility_content','Accessibility Statement Content','textarea','')

ON CONFLICT (field_key) DO NOTHING;


-- ================================================================
-- TABLE 3: UsefulLink
-- ================================================================
-- Design decisions:
--   • Separate table (not key/value) because each row is a
--     structured object with 4 independent fields plus ordering.
--   • `order` drives drag-and-drop sort position (lower = first).
--   • `switch` follows the project-wide visibility toggle convention
--     (1 = visible, 0 = hidden).
--   • No hard limit on number of rows.
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

-- Trigger: keep updated_at current
DROP TRIGGER IF EXISTS useful_link_set_updated_at ON public."UsefulLink";
CREATE TRIGGER useful_link_set_updated_at
  BEFORE UPDATE ON public."UsefulLink"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public."UsefulLink" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_useful_links"         ON public."UsefulLink";
DROP POLICY IF EXISTS "authenticated_manage_useful_links" ON public."UsefulLink";

-- Public site footer can read visible links
CREATE POLICY "public_read_useful_links"
  ON public."UsefulLink"
  FOR SELECT
  TO anon
  USING (switch = 1);

-- Admins full CRUD
CREATE POLICY "authenticated_manage_useful_links"
  ON public."UsefulLink"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public."UsefulLink" TO anon;
GRANT ALL    ON public."UsefulLink" TO authenticated;


-- ================================================================
-- Done.
-- After running this script the following is true:
--
--   SiteSettings:
--     • Single row seeded with all default color + identity values
--     • Public can SELECT; only admins can UPDATE
--     • No INSERT or DELETE allowed on this table
--
--   SectionText:
--     • 53 seed rows covering all Part B fields from scope map
--     • field_type drives admin input widget ('text'|'textarea'|'url'|'href')
--     • Public can SELECT; admins full CRUD
--     • New fields can be added later without schema changes
--
--   UsefulLink:
--     • Empty table ready to receive footer "Useful" column items
--     • Public sees switch=1 rows; admins full CRUD
--     • Supports drag-drop reorder via `order` column
--
--   All three tables:
--     • Follow project snake_case column convention
--     • Have updated_at auto-managed by trigger
--     • Are safe to re-run (idempotent)
-- ================================================================

<instructions>
## 🚨 MANDATORY: CHANGELOG TRACKING 🚨

You MUST maintain this file to track your work across messages. This is NON-NEGOTIABLE.

---

## INSTRUCTIONS

- **MAX 5 lines** per entry - be concise but informative
- **Include file paths** of key files modified or discovered
- **Note patterns/conventions** found in the codebase
- **Sort entries by date** in DESCENDING order (most recent first)
- If this file gets corrupted, messy, or unsorted -> re-create it. 
- CRITICAL: Updating this file at the END of EVERY response is MANDATORY.
- CRITICAL: Keep this file under 300 lines. You are allowed to summarize, change the format, delete entries, etc., in order to keep it under the limit.

</instructions>

<changelog>
## 2026-07-13 — Fix main.tsx React 18 root API
- `src/main.tsx`: replaced `ReactDOM.render(...)` (React 17) with `ReactDOM.createRoot(...).render(...)` (React 18)
- Root cause of preview not loading — `react-dom` v18 dropped the legacy `render` export entirely

## 2026-07-13 — Fix HeroSection import error
- `src/sections/HeroSection/index.tsx`: changed `HERO_BG` → `HERO_BG_URL` (the constant `HERO_BG` didn't exist in assets.ts, causing bundler failure)

## 2026-07-13 — Asset Picker wired into WhyUsCardManager + SectionManagementPage
- `WhyUsCardManager.tsx`: removed custom URL+file-upload video control; replaced with `AssetPickerField` (defaultFolder=Videos); cleaned up `uploadedFile`/`uploadedObjectUrl`/`fileInputRef` state
- `SectionManagementPage.tsx`: `FieldRow` now renders `AssetPickerField` for all `field_type === 'url'` fields; `inferAssetFolder()` helper picks folder by key (logo→Logos, video→Videos, audio→Audio, icon→Icons, map_src→Documents, else Images); `showPreview` auto-enabled for logo/image/icon keys
- `Field` import removed from SectionManagementPage (no longer used directly in FieldRow)

## 2026-07-13 — Fixed ResourcesManager uploads (RLS policy)
- Root cause: Supabase Storage RLS policies used `TO anon` but admin uploads use `authenticated` role JWT
- Fix: replaced all 4 storage.objects policies on `tolrBucket` with `TO authenticated` equivalents (INSERT/SELECT/UPDATE/DELETE)
- No code changes needed — pure Supabase SQL fix run in the SQL Editor
- Removed `__ANIMA_DBG__` debug logs that were temporarily added to surface the error

## 2026-07-12 — SASSTAC Asset Picker prompt authored
## 2026-07-12 — SASSTAC Asset Picker prompt authored
- New `docs/SASSTAC_asset_picker_prompt.md`: complete step-by-step prompt for SASSTAC to replicate the Asset Picker + Resources Manager system
- Covers: bucket setup (`sasstacBucket`), full component source (AssetPicker.tsx + ResourcesManager.tsx), routing, nav wiring, AssetPickerField usage guide, styling notes, and a 9-item checklist
- `workspace/CODER.md`: condensed by ~50% — column lists collapsed to table, removed verbose prose

## 2026-07-12 — Asset Picker + Resources Manager
- New `src/pages/admin/components/AssetPicker.tsx`: `AssetPickerModal` (5 folder tabs, grid thumbnails, select → populates URL) + `AssetPickerField` (URL input + "Browse assets" link)
- New `src/pages/admin/content/ResourcesManager.tsx`: upload/delete/copy assets from `tolrBucket`; grid + list view; folder tabs with file counts
- `AdminShell.tsx`: added "Resources" nav item → `/admin/content/resources`
- `App.tsx`: added `/admin/content/resources` route
- `ServicesManager.tsx`: replaced `ImagePicker` + plain icon `<input>` with `AssetPickerField` for both Card Image and Icon URL fields

## 2026-07-12 — Workspace tidy-up (context clear)
- Rewrote `CODER.md`: consolidated DB rules, added SiteSettings/SectionText/UsefulLink column lists, added verified SectionText audit table for SASSTAC cross-reference
- Rewrote `DATABASE.md`: condensed to 3 key decisions (SiteSettings schema, Auth migration, Course/Offering merge)
- Rewrote `SITE_SETTINGS_SCOPE_MAP.md`: stripped verbose prose/file-impact tables; kept only the two authoritative lookup tables (Part A color tokens, Part B field_keys) + DB table list + out-of-scope list

## 2026-07-12 — Full SectionText key audit: fixed all mismatches across 7 files
- Root cause: component key lookups did not match `002_site_settings.sql` seed — always fell through to hardcoded defaults
- `HeroContent.tsx`: `hero_headline_1/2/3` → `hero_h1_line1/2/3`; `hero_btn1/2_href` → `hero_btn1/2_target`
- `CourseInvestment.tsx`: section `"booking"` → `"investment"`; `booking_*` → `investment_*`
- `WhyUsContent.tsx`: section `"why_us"` → `"whyus"`; `why_us_*` → `whyus_*`
- `CtaSection`: `cta_btn_text/href` → `cta_button_text/target`; `FaqSection`: `faq_link_href` → `faq_link_target`
- `FooterBrand`: `footer_brand_desc` → `footer_brand_description`; `FooterCopyright`: `footer_copyright` → `footer_copyright_text`
- `Footer/index.tsx`: `footer_find_us_heading` → `footer_findus_heading`; `footer_map_desc` → `footer_map_caption`; removed orphan `footer_contact_phone_raw`

## 2026-07-12 — SASSTAC migration package authored
- `docs/SASSTAC_site_control_migration.md`: full implementation blueprint (sections A–G), 30-item checklist
- `docs/SASSTAC_site_control_migration.sql`: standalone idempotent DDL (SiteSettings + SectionText 53 rows + UsefulLink) with SASSTAC placeholder defaults

## 2026-07-11 — Site Control feature complete (Steps 1–7)
- Data layer: `src/lib/siteSettings.ts` (fetchSiteSettings, saveSiteSettings, fetchSectionText, saveSectionTextField, fetchUsefulLinks, CRUD+reorder for UsefulLink)
- Admin pages: `SectionManagementPage.tsx`, `SiteSetupPage.tsx` (split-scroll layout), `UsefulLinksManager.tsx`
- AdminShell + App.tsx: routes `/admin/content/section-management`, `/admin/content/site-setup`, `/admin/content/useful-links`
- All 10 public sections wired to SectionText; Navbar + Footer Quick Links driven by SiteSettings.navbar_items
- Footer Useful column live: reads UsefulLink table (switch=1, ordered); 5-col grid when links present
</changelog>

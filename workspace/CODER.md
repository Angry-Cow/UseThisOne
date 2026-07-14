<instructions>
Auto-added to every context. Keep entries in DESC order (newest first).
</instructions>

<coder>
# ⚠️ CRITICAL — DATABASE RULE: SUPABASE ONLY ⚠️

This project uses **SUPABASE exclusively**.
- `@animaapp/playground-react-sdk`, `AnimaProvider`, `useQuery`, `useMutation`, `useLazyQuery`, `useAuth` — **BANNED**
- Auth: `supabase.auth` | Data: `supabase.from("TableName")...`
- `backend_database_*` tools and their camelCase names — **NEVER use**
- CDN URLs at `c.animaapp.com` in `src/assets.ts` — fine to keep

---

## ⚠️ STORAGE BUCKET ⚠️
- Bucket: **`tolrBucket`** | Folders: `Logos` | `Images` | `Videos` | `Audio` | `Documents`
- Helper: `getPublicUrl(path)` → `src/pages/admin/components/AssetPicker.tsx`
- **`AssetPickerField`** — drop-in URL field with "Browse assets" link → opens `AssetPickerModal`
- **`ResourcesManager`** — `/admin/content/resources` — upload / delete / copy-URL per folder

---

## ⚠️ DEFINITIVE COLUMN NAMES — ALL snake_case ⚠️

| Table | Key columns |
|-------|-------------|
| `Booking` | `id`, `full_name`, `email`, `phone`, `course`, `preferred_date`, `number_of_attendees`, `training_location`, `request_type`, `admin_notes`, `notes`, `created_at` |
| `BookingGroup` | `id`, `full_name`, `email`, `phone`, `course`, `number_of_attendees`, `training_location`, `preferred_dates`, `admin_notes`, `notes`, `created_at` |
| `Course` | `id`, `switch`, `order`, `title`, `category`, `duration`, `description`, `features`, `group_price`, `group_price_note`, `private_price`, `private_price_note`, `button1_text`, `button2_text` |
| `Service` | `id`, `switch`, `order`, `title`, `description`, `icon_src`, `card_image_src`, `card_image_alt`, `list_items` ⚠️ no `button_text` |
| `WhyUsCard` | `id`, `switch`, `order`, `video_url`, `quote`, `name`, `role`, `initial` |
| `Review` | `id`, `switch`, `order`, `name`, `role`, `text`, `initials`, `color`, `rating` |
| `Faq` | `id`, `switch`, `order`, `question`, `answer`, `link`, `link_text` |
| `WhyUsReason` | `id`, `switch`, `order`, `headline`, `message` |
| `Category` | `id`, `switch`, `order`, `name` |
| `Admin` | `id`, `full_name`, `username`, `is_main`, `switch`, `order`, `auth_user_id` |
| `SiteSettings` | `singleton` (PK bool), `navbar_items` (jsonb), `site_name`, `site_tagline`, `navbar_cta_text`, `navbar_cta_href`, `navbar_mobile_cta_text`, + 30 `color_*` columns |
| `SectionText` | `id`, `section`, `field_key` (UNIQUE), `field_label`, `field_type`, `value`, `updated_at` |
| `UsefulLink` | `id`, `switch`, `order`, `label`, `url`, `description`, `created_at`, `updated_at` |

---

## ⚠️ SECTIONTEXT KEY AUDIT (verified 2026-07-12)

| Component | Correct field_key |
|-----------|------------------|
| HeroContent | `hero_h1_line1/2/3`, `hero_btn1/2_target` |
| CourseInvestment | section `"investment"`, `investment_*` |
| WhyUsContent | section `"whyus"`, `whyus_*` |
| CtaSection | `cta_button_text`, `cta_button_target` |
| FaqSection | `faq_link_target` |
| FooterBrand | `footer_brand_description` |
| FooterCopyright | `footer_copyright_text` |
| Footer/index | `footer_findus_heading`, `footer_map_caption` |

---

## Project Context

**TOLR — Tools Of Last Resort** — Firearms training website. Admin-only auth via Supabase Auth.

**Admin routes:** `/admin` login · `/admin/dashboard` admin mgmt · `/admin/content/*` content managers

| Purpose | Path |
|---------|------|
| Supabase client | `src/lib/supabase.ts` |
| Site settings | `src/lib/siteSettings.ts` |
| Admin shell | `src/pages/admin/components/AdminShell.tsx` |
| Admin UI primitives | `src/pages/admin/components/AdminUI.tsx` |
| Asset picker | `src/pages/admin/components/AssetPicker.tsx` |
| Content managers | `src/pages/admin/content/` |
| Resources manager | `src/pages/admin/content/ResourcesManager.tsx` |

### siteSettings.ts helpers
`fetchSiteSettings()` · `saveSiteSettings(patch)` · `fetchSectionText(section)` · `saveSectionTextField(field_key, value)` · `fetchUsefulLinks()`
</coder>

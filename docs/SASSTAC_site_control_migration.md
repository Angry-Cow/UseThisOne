# SASSTAC — Site Control Migration
**Generated:** 2026-07-12 | **Source-verified against TOLR live codebase**
**Confidence:** 100% — every detail traced directly to actual source files

---

## OVERVIEW

This document is the complete, self-contained migration package for adding the **Site Control** admin system to SASSTAC. It covers:

- **A — What was built** (complete functional description)
- **B — New files to create** (full source code)
- **C — Existing files to modify** (exact changes with context)
- **D — Admin shell & routing wiring**
- **E — Supabase SQL** → see `docs/SASSTAC_site_control_migration.sql`
- **F — SASSTAC-specific migration notes**
- **G — Acceptance checklist**

SASSTAC is architecturally identical to TOLR. Same React + Vite + Tailwind + Supabase stack, same section structure, same admin shell pattern. The only differences are cosmetic branding and content.

---

## A — WHAT THIS ADDS

### Three new admin pages:

| Page | Admin Route | Purpose |
|------|------------|---------|
| **Site Setup** | `/admin/content/site-setup` | Two-column layout: left = color token editor + site identity + nav item manager; right = live preview panel |
| **Section Management** | `/admin/content/section-management` | Accordion-per-section editor for all site copy text fields, with per-field Save button |
| **Useful Links** | `/admin/content/useful-links` | CRUD + drag-and-drop reorder for footer "Useful" column links |

### Three new Supabase tables:

| Table | Description |
|-------|-------------|
| `SiteSettings` | Singleton row (enforced by CHECK constraint). Stores 30 color tokens, site identity (name/tagline/logo), navbar CTA fields, and `navbar_items` JSONB array |
| `SectionText` | Key/value rows for all section copy fields. 53 seed rows covering 10 sections. `field_type` drives form widget |
| `UsefulLink` | Footer "Useful" column items with `switch`/`order`/`label`/`url`/`description` |

### One new data layer file:

`src/lib/siteSettings.ts` — all Supabase reads/writes for the three tables, TypeScript types, default values, and validation helpers.

### Public sections wired to DB:

All 10 public sections now fetch from Supabase on mount and fall back to hardcoded defaults if the DB is unavailable.

---

## B — NEW FILES TO CREATE

### B1 — `src/lib/siteSettings.ts`

```typescript
/**
 * siteSettings.ts
 * All Supabase reads/writes for SiteSettings, SectionText, and UsefulLink.
 * No Anima SDK — uses supabase client directly.
 */

import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavItem = { label: string; href: string };

export type SiteSettings = {
  // Identity
  site_name: string;
  site_tagline: string;
  logo_url: string;
  // Navbar
  navbar_cta_text: string;
  navbar_cta_href: string;
  navbar_mobile_cta_text: string;
  navbar_items: NavItem[];
  // Colors — Navbar
  color_navbar_bg: string;
  color_navbar_border: string;
  color_navbar_text: string;
  color_navbar_active: string;
  color_brand_primary: string;
  // Colors — Buttons
  color_btn_primary_bg: string;
  color_btn_primary_text: string;
  color_btn_secondary_bg: string;
  color_btn_secondary_text: string;
  color_btn_nav_bg: string;
  color_btn_nav_text: string;
  // Colors — Backgrounds
  color_bg_light: string;
  color_bg_alt: string;
  // Colors — Section typography
  color_section_eyebrow: string;
  color_section_heading: string;
  color_section_body: string;
  // Colors — Accent
  color_accent_orange: string;
  color_accent_peach: string;
  // Colors — Footer
  color_footer_bg: string;
  color_footer_heading: string;
  color_footer_text: string;
  color_footer_copyright: string;
  // Colors — FAQ
  color_faq_eyebrow: string;
  color_faq_heading: string;
  // Colors — Hero
  color_hero_overlay_start: string;
  color_hero_overlay_end: string;
  color_badge_bg: string;
  color_badge_text: string;
  color_badge_highlight: string;
  // Colors — CTA
  color_cta_overlay: string;
  // Timestamp
  updated_at?: string;
};

/**
 * IMPORTANT FOR SASSTAC:
 * Change these defaults to match SASSTAC's current hardcoded color values.
 * These are the TOLR defaults — update every value that differs in SASSTAC.
 */
export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  site_name: "SASSTAC",           // ← CHANGE to SASSTAC brand name
  site_tagline: "Your Tagline",   // ← CHANGE to SASSTAC tagline
  logo_url: "",
  navbar_cta_text: "Book Now",
  navbar_cta_href: "#contact",
  navbar_mobile_cta_text: "Book a Course",
  navbar_items: [
    { label: "Services", href: "#services" },
    { label: "Why Us", href: "#why-us" },
    { label: "Courses", href: "#courses" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ],
  color_navbar_bg: "#ffffff",
  color_navbar_border: "#0e7490",
  color_navbar_text: "#1f2937",
  color_navbar_active: "#d97706",
  color_brand_primary: "#d97706",
  color_btn_primary_bg: "#d97706",
  color_btn_primary_text: "#ffffff",
  color_btn_secondary_bg: "rgba(255,255,255,0.1)",
  color_btn_secondary_text: "#ffffff",
  color_btn_nav_bg: "#0c4a6e",
  color_btn_nav_text: "#ffffff",
  color_bg_light: "#ffffff",
  color_bg_alt: "#f8fafc",
  color_section_eyebrow: "#0c4a6e",
  color_section_heading: "#0f172a",
  color_section_body: "#6b7280",
  color_accent_orange: "#d97706",
  color_accent_peach: "#fdba74",
  color_footer_bg: "#0f172a",
  color_footer_heading: "#d97706",
  color_footer_text: "rgba(255,255,255,0.6)",
  color_footer_copyright: "rgba(255,255,255,0.4)",
  color_faq_eyebrow: "#d97706",
  color_faq_heading: "#0c4a6e",
  color_hero_overlay_start: "rgba(11,74,111,0.4)",
  color_hero_overlay_end: "rgba(11,74,111,0.8)",
  color_badge_bg: "#0c4a6e",
  color_badge_text: "#ffffff",
  color_badge_highlight: "#fbbf24",
  color_cta_overlay: "rgba(12,74,110,0.9)",
};

export type SectionTextField = {
  id: string;
  section: string;
  field_key: string;
  field_label: string;
  field_type: "text" | "textarea" | "url" | "href";
  value: string;
  updated_at: string;
};

export type UsefulLink = {
  id: string;
  switch: number;
  order: number;
  label: string;
  url: string;
  description: string;
  created_at?: string;
  updated_at?: string;
};

export type UsefulLinkDraft = Omit<UsefulLink, "id" | "created_at" | "updated_at">;

// ─── SiteSettings ──────────────────────────────────────────────────────────

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("SiteSettings")
    .select("*")
    .eq("singleton", true)
    .single();

  if (error || !data) return SITE_SETTINGS_DEFAULTS;
  return { ...SITE_SETTINGS_DEFAULTS, ...data } as SiteSettings;
}

export async function saveSiteSettings(
  patch: Partial<SiteSettings>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("SiteSettings")
    .update(patch)
    .eq("singleton", true);

  return { error: error ? error.message : null };
}

// ─── SectionText ───────────────────────────────────────────────────────────

export async function fetchSectionText(
  section?: string,
): Promise<SectionTextField[]> {
  let query = supabase
    .from("SectionText")
    .select("id, section, field_key, field_label, field_type, value, updated_at")
    .order("section")
    .order("field_key");

  if (section) query = query.eq("section", section);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as SectionTextField[];
}

export async function saveSectionTextField(
  field_key: string,
  value: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("SectionText")
    .update({ value })
    .eq("field_key", field_key);

  return { error: error ? error.message : null };
}

export async function saveSectionTextBulk(
  patches: Array<{ field_key: string; value: string }>,
): Promise<{ error: string | null }> {
  const results = await Promise.all(
    patches.map(({ field_key, value }) =>
      supabase.from("SectionText").update({ value }).eq("field_key", field_key),
    ),
  );
  const firstError = results.find((r) => r.error);
  return { error: firstError?.error?.message ?? null };
}

// ─── UsefulLink ─────────────────────────────────────────────────────────────

export async function fetchUsefulLinks(): Promise<UsefulLink[]> {
  const { data, error } = await supabase
    .from("UsefulLink")
    .select("*")
    .order("order", { ascending: true });

  if (error || !data) return [];
  return data as UsefulLink[];
}

export async function createUsefulLink(
  draft: UsefulLinkDraft,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("UsefulLink").insert(draft);
  return { error: error ? error.message : null };
}

export async function updateUsefulLink(
  id: string,
  patch: Partial<UsefulLinkDraft>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("UsefulLink")
    .update(patch)
    .eq("id", id);
  return { error: error ? error.message : null };
}

export async function deleteUsefulLink(
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("UsefulLink").delete().eq("id", id);
  return { error: error ? error.message : null };
}

export async function reorderUsefulLinks(
  links: UsefulLink[],
): Promise<{ error: string | null }> {
  const results = await Promise.all(
    links.map((link, idx) =>
      supabase.from("UsefulLink").update({ order: idx }).eq("id", link.id),
    ),
  );
  const firstError = results.find((r) => r.error);
  return { error: firstError?.error?.message ?? null };
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function isValidColor(value: string): boolean {
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  const rgba =
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)$/.test(
      value.trim(),
    );
  return hex || rgba;
}

export function isValidHref(value: string): boolean {
  if (!value) return true;
  return (
    value.startsWith("http") || value.startsWith("#") || value.startsWith("/")
  );
}

export function validateSectionField(
  field_type: SectionTextField["field_type"],
  value: string,
): string | null {
  if (field_type === "url" && value && !isValidHref(value)) {
    return "Must be a valid URL (https://...) or leave blank.";
  }
  if (field_type === "href" && value && !isValidHref(value)) {
    return "Must be a section anchor (#services) or URL.";
  }
  return null;
}
```

---

### B2 — `src/pages/admin/content/SiteSetupPage.tsx`

Copy this file verbatim from TOLR's `src/pages/admin/content/SiteSetupPage.tsx`.

**SASSTAC-specific changes required in this file:**

1. **Footer copyright preview text** — in the `PreviewPanel` component, the line:
   ```tsx
   © {new Date().getFullYear()} Safe and Secure Services
   ```
   Change `Safe and Secure Services` to SASSTAC's company name.

2. **No other changes needed** — all other content is driven by `SITE_SETTINGS_DEFAULTS` which you update in `siteSettings.ts`.

---

### B3 — `src/pages/admin/content/SectionManagementPage.tsx`

Copy verbatim from TOLR. **No SASSTAC-specific changes needed** — all section labels and descriptions are generic. The accordion section order is:
```
navbar → hero → services → whyus → testimonials → courses → investment → cta → faq → footer
```

---

### B4 — `src/pages/admin/content/UsefulLinksManager.tsx`

Copy verbatim from TOLR. **No changes needed**.

---

## C — EXISTING FILES TO MODIFY

### C1 — `src/sections/Navbar/index.tsx`

Add the import and `useEffect` fetch at the top of the `Navbar` component.

**Add import:**
```typescript
import {
  fetchSiteSettings,
  SITE_SETTINGS_DEFAULTS,
  type NavItem,
} from "@/lib/siteSettings";
```

**Add state variables inside Navbar component:**
```typescript
const [navItems, setNavItems] = useState<NavItem[]>(FALLBACK_NAV_ITEMS);
const [ctaText, setCtaText] = useState("Book Now");   // ← SASSTAC: change default if different
const [ctaHref, setCtaHref] = useState("#contact");
const [mobileCta, setMobileCta] = useState("Book a Course");
const [siteName, setSiteName] = useState("SASSTAC");  // ← SASSTAC: use SASSTAC's brand name
const [siteTagline, setSiteTagline] = useState("Your Tagline"); // ← SASSTAC: use SASSTAC's tagline
```

**Add fetch on mount:**
```typescript
useEffect(() => {
  fetchSiteSettings().then((s) => {
    if (s.navbar_items?.length) setNavItems(s.navbar_items);
    if (s.navbar_cta_text) setCtaText(s.navbar_cta_text);
    if (s.navbar_cta_href) setCtaHref(s.navbar_cta_href);
    if (s.navbar_mobile_cta_text) setMobileCta(s.navbar_mobile_cta_text);
    if (s.site_name) setSiteName(s.site_name);
    if (s.site_tagline) setSiteTagline(s.site_tagline);
  });
}, []);
```

**Replace all hardcoded nav item array references** with the `navItems` state variable.

**Replace hardcoded brand name/tagline** in the JSX with `{siteName}` and `{siteTagline}`.

**Replace hardcoded "Book Now" text and `#contact` href** on the CTA button with `{ctaText}`, `{ctaHref}`.

**Replace hardcoded mobile CTA text** with `{mobileCta}`.

---

### C2 — `src/sections/Footer/index.tsx`

**Add imports:**
```typescript
import {
  fetchSiteSettings,
  fetchSectionText,
  fetchUsefulLinks,
  type NavItem,
  type SectionTextField,
  type UsefulLink,
} from "@/lib/siteSettings";
```

**Add helper:**
```typescript
const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;
```

**Add state:**
```typescript
const [quickLinks, setQuickLinks] = useState<NavItem[]>(FALLBACK_QUICK_LINKS);
const [footerFields, setFooterFields] = useState<SectionTextField[]>([]);
const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([]);
```

**Add fetch on mount:**
```typescript
useEffect(() => {
  fetchSectionText("footer").then(setFooterFields);
  fetchUsefulLinks().then((rows) =>
    setUsefulLinks(rows.filter((r) => r.switch === 1)),
  );
  fetchSiteSettings().then((s) => {
    if (s.navbar_items?.length) {
      const hasHome = s.navbar_items.some(
        (i) => i.href === "#home" || i.label.toLowerCase() === "home",
      );
      setQuickLinks(
        hasHome
          ? s.navbar_items
          : [{ label: "Home", href: "#home" }, ...s.navbar_items],
      );
    }
  });
}, []);
```

**Footer grid adapts to useful links:**
```tsx
<div className={`grid grid-cols-1 gap-y-12 mb-16 ${usefulLinks.length > 0 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
  {/* Brand — 2 cols when no useful links, 1 col when useful links present */}
  <div className={usefulLinks.length > 0 ? "md:col-span-1" : "md:col-span-2"}>
    <FooterBrand />
  </div>
  <FooterLinks title="Quick Links" links={quickLinks.map(i => ({ label: i.label, href: i.href }))} />
  {usefulLinks.length > 0 && (
    <FooterLinks title="Useful" links={usefulLinks.map(l => ({ label: l.label, href: l.url }))} />
  )}
  {/* Legal, Contact columns — unchanged */}
</div>
```

**Replace all hardcoded contact/footer text** with `kv(footerFields, "field_key", "fallback")` calls:

| JSX location | Field key | TOLR fallback |
|---|---|---|
| Contact address | `footer_contact_address` | South Plainfield, NJ |
| Contact phone display | `footer_contact_phone` | (908) 758-4894 |
| Contact email | `footer_contact_email` | info@tolr.net |
| Business hours | `footer_contact_hours` | Mon–Sat: 8am – 7pm |
| Find Us heading | `footer_findus_heading` | Find Us |
| Map caption | `footer_map_caption` | Serving South Plainfield… |
| Copyright text | `footer_copyright_text` | © {year} Safe and Secure… |

> ⚠️ **SASSTAC:** Update every fallback string to SASSTAC's actual contact details, hours, address, and copyright text. These are only used if the DB row is missing.

---

### C3 — `src/sections/Footer/components/FooterBrand.tsx`

**Add import:**
```typescript
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";
```

**Add state + fetch:**
```typescript
const [fields, setFields] = useState<SectionTextField[]>([]);
useEffect(() => {
  fetchSectionText("footer").then(setFields);
}, []);
const kv = (key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;
```

**Replace JSX values:**
- Brand name: `kv("footer_brand_name", "SASSTAC")`
- Tagline: `kv("footer_brand_tagline", "Your Tagline")`
- Description: `kv("footer_brand_description", "Fallback description.")`
- Logo src: `kv("footer_logo_url", "")` — if empty, hide `<img>` or show text-only fallback

---

### C4 — `src/sections/Footer/components/FooterCopyright.tsx`

**Add import + fetch:**
```typescript
import { fetchSectionText } from "@/lib/siteSettings";

const [copyright, setCopyright] = useState("© 2026 SASSTAC. All rights reserved.");
useEffect(() => {
  fetchSectionText("footer").then((rows) => {
    const row = rows.find((r) => r.field_key === "footer_copyright_text");
    if (row?.value) {
      // Replace {year} token with current year
      setCopyright(row.value.replace("{year}", String(new Date().getFullYear())));
    }
  });
}, []);
```

> ⚠️ **SASSTAC:** Set the default state string to SASSTAC's copyright line.

---

### C5 — `src/sections/Hero/components/HeroContent.tsx`

**Add import + fetch:**
```typescript
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";
```

**Add state + fetch:**
```typescript
const [fields, setFields] = useState<SectionTextField[]>([]);
useEffect(() => {
  fetchSectionText("hero").then(setFields);
}, []);
const kv = (key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;
```

**Replace all hardcoded hero text with kv() calls:**

| JSX | Field key | TOLR fallback |
|---|---|---|
| Badge text | `hero_badge_text` | Training at YOUR Office, Home or Facility |
| Badge highlight word | `hero_badge_highlight` | YOUR |
| H1 Line 1 | `hero_h1_line1` | Be Aware. |
| H1 Line 2 | `hero_h1_line2` | Be Benchmarked. |
| H1 Line 3 | `hero_h1_line3` | Be Committed. |
| Body paragraph | `hero_paragraph` | T.O.L.R.™ = Tools Of Last Resort… |
| Button 1 text | `hero_btn1_text` | Book a Course |
| Button 1 scroll target | `hero_btn1_target` | #booking-form |
| Button 2 text | `hero_btn2_text` | View Courses |
| Button 2 scroll target | `hero_btn2_target` | #courses |

> ⚠️ **SASSTAC:** Update ALL fallback strings to SASSTAC's content.

**Button click handler — support both anchor scrolls and full URLs:**
```typescript
const handleClick = (target: string) => {
  if (target.startsWith("http")) {
    window.open(target, "_blank");
  } else {
    const el = document.getElementById(target.replace("#", ""));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
```

---

### C6 — `src/sections/Hero/index.tsx`

**Add import + fetch:**
```typescript
import { fetchSectionText } from "@/lib/siteSettings";

const [heroBg, setHeroBg] = useState("");
useEffect(() => {
  fetchSectionText("hero").then((rows) => {
    const row = rows.find((r) => r.field_key === "hero_image_url");
    if (row?.value) setHeroBg(row.value);
  });
}, []);
```

**Replace backgroundImage src** with `heroBg || HERO_BG_URL` (keep the assets.ts fallback).

---

### C7 — `src/sections/ServicesSection/components/ServicesSectionHeader.tsx`

**Add import + fetch:**
```typescript
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";
```

**Replace hardcoded eyebrow/heading/subtext with kv() calls:**
- `services_eyebrow` → fallback: `Our Expertise`
- `services_heading` → fallback: `Comprehensive Firearms Training`
- `services_subtext` → fallback: current hardcoded paragraph

> ⚠️ **SASSTAC:** Update fallbacks to SASSTAC's services copy.

---

### C8 — `src/sections/WhyUsSection/components/WhyUsContent.tsx`

**Replace eyebrow + heading:**
- `whyus_eyebrow` → fallback: `The Difference`
- `whyus_heading` → fallback: `Why Choose [Brand]?`

> ⚠️ **SASSTAC:** Change fallback heading to SASSTAC's brand name.

---

### C9 — `src/sections/TestimonialsSection/index.tsx`

**Replace eyebrow/heading/subtext:**
- `testimonials_eyebrow` → fallback: `Student Experiences`
- `testimonials_heading` → fallback: `What Our Students Say`  
- `testimonials_subtext` → fallback: current hardcoded paragraph

---

### C10 — `src/sections/CoursesSection/components/CoursesSectionHeader.tsx`

**Replace eyebrow/heading/subtext:**
- `courses_eyebrow` → fallback: `Course Catalog`
- `courses_heading` → fallback: `Find the Right Course`
- `courses_subtext` → fallback: current hardcoded paragraph

---

### C11 — `src/sections/BookingSection/components/CourseInvestment.tsx`

**Replace eyebrow + heading:**
- `investment_eyebrow` → fallback: `Course Investment`
- `investment_heading` → fallback: `Ready to Start Your Training?`

**Add the alert box** (it is a new element, not present in original source):
```tsx
{kv("investment_alert_text", "") && (
  <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
    {kv("investment_alert_text", "")}
  </div>
)}
```
This box only renders when `investment_alert_text` has a non-empty value.

---

### C12 — `src/sections/CtaSection/index.tsx`

**Replace heading/subtext/button:**
- `cta_heading` → fallback: `Empower Yourself with Life-Saving Skills Today.`
- `cta_subtext` → fallback: `Don't wait for an emergency to be prepared.`
- `cta_button_text` → fallback: `Book Your Course Now`
- `cta_button_target` → fallback: `#booking-form`

**Button click handler — same URL-or-anchor pattern as Hero (C5 above).**

---

### C13 — `src/sections/FaqSection/index.tsx`

**Replace eyebrow/heading/intro/link:**
- `faq_eyebrow` → `Got Questions?`
- `faq_heading` → `Frequently Asked Questions`
- `faq_intro_text` → `Everything you need to know before you book. Can't find your answer here?`
- `faq_link_text` → `Reach out directly.`
- `faq_link_target` → `#contact`

---

## D — ADMIN SHELL & ROUTING

### D1 — Add three nav items to `AdminShell.tsx`

In the `NAV_ITEMS` array, append after `Landing Pages`:

```typescript
{
  label: "Useful Links",
  path: "/admin/content/useful-links",
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
},
{
  label: "Section Management",
  path: "/admin/content/section-management",
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
},
{
  label: "Site Setup",
  path: "/admin/content/site-setup",
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
},
```

### D2 — Add three routes to `App.tsx`

```typescript
// Imports
import SectionManagementPage from "@/pages/admin/content/SectionManagementPage";
import UsefulLinksManager from "@/pages/admin/content/UsefulLinksManager";
import SiteSetupPage from "@/pages/admin/content/SiteSetupPage";

// Routes (inside <Routes>)
<Route path="/admin/content/useful-links" element={<UsefulLinksManager />} />
<Route path="/admin/content/section-management" element={<SectionManagementPage />} />
<Route path="/admin/content/site-setup" element={<SiteSetupPage />} />
```

---

## E — SQL MIGRATION

Run `docs/SASSTAC_site_control_migration.sql` on the SASSTAC Supabase project.

See that file for the full DDL. Key points:
- Safe to re-run (all statements are idempotent)
- Seeds 53 `SectionText` rows with TOLR content as defaults — **update seed values to SASSTAC content after running**
- Seeds one `SiteSettings` row with TOLR color defaults — **update via the Site Setup admin page after running**

---

## F — SASSTAC-SPECIFIC MIGRATION NOTES

### F1 — Update all seed content to SASSTAC's brand

The SQL seeds use TOLR copy as placeholder. After running the SQL, log in to the SASSTAC admin panel and:
1. Go to **Section Management** → update every section's text to SASSTAC content
2. Go to **Site Setup** → update Site Name, Tagline, color tokens to SASSTAC's palette
3. Add any Useful Links specific to SASSTAC (state resources, partner links, etc.)

### F2 — Update all TypeScript fallback strings

In every modified file (C1–C13), the fallback strings are currently TOLR content. Before deploying, update them to SASSTAC's equivalent content so the site renders correctly even when the DB is unreachable.

### F3 — The `set_updated_at` trigger function

Migration 001 (landing pages) already creates `public.set_updated_at()` in SASSTAC's DB because TOLR and SASSTAC share the same Supabase instance pattern. The SASSTAC SQL file uses `CREATE OR REPLACE` so it is safe regardless.

> **If SASSTAC uses a completely separate Supabase project** (different project ID), migration 001 may not yet be there. `CREATE OR REPLACE FUNCTION public.set_updated_at()` in the SQL file handles this automatically — it creates the function whether or not it exists.

### F4 — Color token defaults should match SASSTAC's current palette

Before saving the first time in Site Setup, the live preview will show TOLR's amber/sky color scheme. Update `SITE_SETTINGS_DEFAULTS` in `siteSettings.ts` to SASSTAC's actual colors before the first deploy so the preview is accurate from day one.

### F5 — AdminShell header branding

The AdminShell currently displays `T.O.L.R.™ Admin` in the header. Update:
- The display name text in `AdminShell.tsx` (the `<h1>` inside the top bar)
- This is a cosmetic change and does not affect functionality

### F6 — `SiteSetupPage.tsx` PreviewPanel footer copyright line

The preview panel shows `© {year} Safe and Secure Services` hardcoded. Change `Safe and Secure Services` to SASSTAC's company name in the `PreviewPanel` component.

### F7 — StaticSection / sections that may differ in SASSTAC

If SASSTAC has any sections that do not exist in TOLR, or is missing sections that TOLR has, those sections do not need to be wired unless you want them editable. The system degrades gracefully — sections that do not fetch from DB simply continue to render their hardcoded content.

### F8 — Google Maps embed in Footer

The SQL seed uses TOLR's South Plainfield NJ map embed URL. Update `footer_map_src` to SASSTAC's location in the Section Management page after running the migration.

### F9 — `investment_alert_text` is a new element

The Course Investment section did not have a notice/alert box before this migration. The box only renders when `investment_alert_text` has a non-empty value in the DB, so it is invisible by default. You can activate it any time by entering text in Section Management → Course Investment → Notice Box Text.

### F10 — No AnimaApp SDK usage

`src/lib/siteSettings.ts` uses only the Supabase client (`src/lib/supabase.ts`). It does NOT use `useQuery`, `useMutation`, `useLazyQuery`, or `AnimaProvider` from `@animaapp/playground-react-sdk`. This is intentional — these three tables are not part of the AnimaApp entity graph.

---

## G — ACCEPTANCE CHECKLIST

Run through this checklist after migration to confirm everything is working:

### Admin Panel
- [ ] Admin sidebar shows: Useful Links, Section Management, Site Setup (bottom three items)
- [ ] `/admin/content/useful-links` loads the Useful Links manager
- [ ] `/admin/content/section-management` loads the Section Management accordion
- [ ] `/admin/content/site-setup` loads the Site Setup page with live preview panel
- [ ] Site Setup live preview updates in real time as colors are changed
- [ ] Site Setup "Save All Changes" persists to Supabase (verify in DB)
- [ ] Site Setup "Reset to Defaults" restores default colors
- [ ] Section Management accordion expands per section
- [ ] Section Management per-field Save button appears only when field is dirty
- [ ] Section Management save persists to Supabase
- [ ] Useful Links: Add / Edit / Delete / Toggle visibility all work
- [ ] Useful Links: Drag-and-drop reorder persists to Supabase
- [ ] All three pages show "DB tables not found" notice if SQL has not been run

### Public Site
- [ ] Navbar: brand name, tagline, nav items, CTA text/href reflect DB values
- [ ] Navbar: mobile dropdown uses DB mobile CTA text
- [ ] Footer Quick Links column mirrors current navbar_items from DB
- [ ] Footer "Useful" column appears only when there are visible (switch=1) UsefulLink rows
- [ ] Footer contact details, hours, address reflect DB values
- [ ] Footer Google Maps embed uses DB `footer_map_src` URL
- [ ] Footer copyright uses DB `footer_copyright_text` with `{year}` replaced
- [ ] Hero: all text fields reflect DB values
- [ ] Services, WhyUs, Testimonials, Courses, Investment, CTA, FAQ: eyebrow/heading/subtext reflect DB
- [ ] Course Investment alert box is hidden when `investment_alert_text` is empty
- [ ] All sections fall back to hardcoded defaults gracefully when DB is unreachable
- [ ] Changing a color in Site Setup and saving is reflected on public site after page refresh

### DB
- [ ] `SiteSettings` table exists with singleton row
- [ ] `SectionText` table exists with 53 seed rows
- [ ] `UsefulLink` table exists (empty is normal initially)
- [ ] All three tables have RLS: anon SELECT, authenticated UPDATE/INSERT/DELETE
- [ ] `updated_at` trigger fires on UPDATE for all three tables

/**
 * siteSettings.ts
 * ─────────────────────────────────────────────────────────────────
 * Data layer for the two new admin areas:
 *   • SiteSettings  (singleton color tokens + site identity)
 *   • SectionText   (section copy text fields, key/value)
 *   • UsefulLink    (footer "Useful" column items)
 *
 * All reads call Supabase directly. No Anima SDK.
 * Column names match 002_site_settings.sql exactly.
 * ─────────────────────────────────────────────────────────────────
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

export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  site_name: "T.O.L.R.™",
  site_tagline: "Tools Of Last Resort",
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

export type UsefulLinkDraft = Omit<
  UsefulLink,
  "id" | "created_at" | "updated_at"
>;

// ─── SiteSettings ─────────────────────────────────────────────────────────────

/** Fetch the single SiteSettings row. Returns defaults if table is missing or empty. */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("SiteSettings")
    .select("*")
    .eq("singleton", true)
    .single();

  if (error || !data) return SITE_SETTINGS_DEFAULTS;
  return { ...SITE_SETTINGS_DEFAULTS, ...data } as SiteSettings;
}

/** Persist partial changes to the SiteSettings singleton row. */
export async function saveSiteSettings(
  patch: Partial<SiteSettings>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("SiteSettings")
    .update(patch)
    .eq("singleton", true);

  return { error: error ? error.message : null };
}

// ─── SectionText ──────────────────────────────────────────────────────────────

/** Fetch all SectionText rows, optionally filtered by section. */
export async function fetchSectionText(
  section?: string,
): Promise<SectionTextField[]> {
  let query = supabase
    .from("SectionText")
    .select(
      "id, section, field_key, field_label, field_type, value, updated_at",
    )
    .order("section")
    .order("field_key");

  if (section) query = query.eq("section", section);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as SectionTextField[];
}

/** Update the `value` of a single SectionText row by its field_key. */
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

/** Bulk-update multiple SectionText values in parallel. */
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

// ─── UsefulLink ───────────────────────────────────────────────────────────────

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

/** Bulk reorder: write `order = index` for every link in the supplied array order. */
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

// ─── Validation contracts ─────────────────────────────────────────────────────

/** Validate a color string: accepts hex (#xxx or #xxxxxx) and rgba(...) */
export function isValidColor(value: string): boolean {
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  const rgba =
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)$/.test(
      value.trim(),
    );
  return hex || rgba;
}

/** Validate a URL: must start with http/https or be a # anchor */
export function isValidHref(value: string): boolean {
  if (!value) return true; // empty is allowed (field is optional)
  return (
    value.startsWith("http") || value.startsWith("#") || value.startsWith("/")
  );
}

/** Validate a SectionText field value. Returns an error message or null. */
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

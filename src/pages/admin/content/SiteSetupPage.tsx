import React, { useEffect, useState, useCallback } from "react";
import AdminShell from "@/pages/admin/components/AdminShell";
import { FlashBanner } from "@/pages/admin/components/AdminUI";
import {
  fetchSiteSettings,
  saveSiteSettings,
  isValidColor,
  type SiteSettings,
  type NavItem,
  SITE_SETTINGS_DEFAULTS,
} from "@/lib/siteSettings";

// ─── Color token groups for the form ─────────────────────────────────────────
type ColorToken = {
  key: keyof SiteSettings;
  label: string;
  hint?: string;
};
type ColorGroup = {
  title: string;
  tokens: ColorToken[];
};

const COLOR_GROUPS: ColorGroup[] = [
  {
    title: "Navbar",
    tokens: [
      { key: "color_navbar_bg", label: "Background" },
      { key: "color_navbar_border", label: "Bottom Border" },
      { key: "color_navbar_text", label: "Link Text" },
      { key: "color_navbar_active", label: "Active / Hover Link" },
      { key: "color_brand_primary", label: "Brand Accent" },
    ],
  },
  {
    title: "Buttons",
    tokens: [
      { key: "color_btn_primary_bg", label: "Primary Button Background" },
      { key: "color_btn_primary_text", label: "Primary Button Text" },
      {
        key: "color_btn_secondary_bg",
        label: "Secondary Button Background",
        hint: "Supports rgba()",
      },
      { key: "color_btn_secondary_text", label: "Secondary Button Text" },
      { key: "color_btn_nav_bg", label: "Navbar CTA Button Background" },
      { key: "color_btn_nav_text", label: "Navbar CTA Button Text" },
    ],
  },
  {
    title: "Page Backgrounds",
    tokens: [
      { key: "color_bg_light", label: "Light Background (primary)" },
      { key: "color_bg_alt", label: "Alternate Background (sections)" },
    ],
  },
  {
    title: "Section Typography",
    tokens: [
      { key: "color_section_eyebrow", label: "Eyebrow / Label Text" },
      { key: "color_section_heading", label: "Section Heading Text" },
      { key: "color_section_body", label: "Body / Paragraph Text" },
    ],
  },
  {
    title: "Hero",
    tokens: [
      {
        key: "color_hero_overlay_start",
        label: "Overlay Gradient Start",
        hint: "Supports rgba()",
      },
      {
        key: "color_hero_overlay_end",
        label: "Overlay Gradient End",
        hint: "Supports rgba()",
      },
      { key: "color_badge_bg", label: "Star Badge Background" },
      { key: "color_badge_text", label: "Star Badge Text" },
      { key: "color_badge_highlight", label: "Star Badge Highlight Word" },
    ],
  },
  {
    title: "CTA Section",
    tokens: [
      {
        key: "color_cta_overlay",
        label: "CTA Overlay Color",
        hint: "Supports rgba()",
      },
    ],
  },
  {
    title: "FAQ Section",
    tokens: [
      { key: "color_faq_eyebrow", label: "FAQ Eyebrow Text" },
      { key: "color_faq_heading", label: "FAQ Heading Text" },
    ],
  },
  {
    title: "Footer",
    tokens: [
      { key: "color_footer_bg", label: "Footer Background" },
      { key: "color_footer_heading", label: "Footer Column Headings" },
      {
        key: "color_footer_text",
        label: "Footer Body Text",
        hint: "Supports rgba()",
      },
      {
        key: "color_footer_copyright",
        label: "Copyright Line Text",
        hint: "Supports rgba()",
      },
    ],
  },
  {
    title: "Accents",
    tokens: [
      { key: "color_accent_orange", label: "Accent Orange" },
      { key: "color_accent_peach", label: "Accent Peach" },
    ],
  },
];

// ─── Live color preview panel ─────────────────────────────────────────────────
function PreviewPanel({ s }: { s: SiteSettings }) {
  return (
    <div className="sticky top-6 space-y-3">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">
        Live Preview
      </p>

      {/* Navbar strip */}
      <div
        className="rounded-lg overflow-hidden border"
        style={{
          backgroundColor: s.color_navbar_bg,
          borderColor: s.color_navbar_border,
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b-2"
          style={{ borderColor: s.color_navbar_border }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: s.color_brand_primary }}
          >
            {s.site_name}
          </span>
          <div className="flex items-center gap-3">
            {["Services", "Courses", "FAQ"].map((lbl) => (
              <span
                key={lbl}
                className="text-xs"
                style={{ color: s.color_navbar_text }}
              >
                {lbl}
              </span>
            ))}
            <span
              className="text-xs px-2.5 py-1 rounded font-semibold"
              style={{
                backgroundColor: s.color_btn_nav_bg,
                color: s.color_btn_nav_text,
              }}
            >
              {s.navbar_cta_text}
            </span>
          </div>
        </div>
      </div>

      {/* Hero strip */}
      <div
        className="rounded-lg px-4 py-5 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${s.color_hero_overlay_start}, ${s.color_hero_overlay_end})`,
        }}
      >
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
          style={{
            backgroundColor: s.color_badge_bg,
            color: s.color_badge_text,
          }}
        >
          ★ Training Near You
        </div>
        <div>
          {["Be Aware.", "Be Benchmarked.", "Be Committed."].map((line) => (
            <div
              key={line}
              className="text-white font-bold text-base leading-tight"
            >
              {line}
            </div>
          ))}
        </div>
        <p className="text-xs mt-2 text-white/70">
          Body paragraph text goes here…
        </p>
        <div className="flex gap-2 mt-3">
          <span
            className="text-xs px-3 py-1.5 rounded font-semibold"
            style={{
              backgroundColor: s.color_btn_primary_bg,
              color: s.color_btn_primary_text,
            }}
          >
            Book a Course
          </span>
          <span
            className="text-xs px-3 py-1.5 rounded font-semibold border border-white/30"
            style={{
              backgroundColor: s.color_btn_secondary_bg,
              color: s.color_btn_secondary_text,
            }}
          >
            View Courses
          </span>
        </div>
      </div>

      {/* Section strip */}
      <div
        className="rounded-lg px-4 py-4"
        style={{ backgroundColor: s.color_bg_light }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: s.color_section_eyebrow }}
        >
          Eyebrow Label
        </span>
        <h3
          className="text-base font-bold mt-0.5"
          style={{ color: s.color_section_heading }}
        >
          Section Heading
        </h3>
        <p className="text-xs mt-1" style={{ color: s.color_section_body }}>
          Body paragraph text preview for this section.
        </p>
      </div>

      {/* Alt background section */}
      <div
        className="rounded-lg px-4 py-4"
        style={{ backgroundColor: s.color_bg_alt }}
      >
        <span className="text-xs text-slate-500 italic">
          Alt background section
        </span>
        <p className="text-xs mt-1" style={{ color: s.color_section_body }}>
          Some content on an alternate background color.
        </p>
      </div>

      {/* CTA strip */}
      <div
        className="rounded-lg px-4 py-4"
        style={{ backgroundColor: s.color_cta_overlay }}
      >
        <p className="text-white font-bold text-sm">Empower Yourself Today.</p>
        <span
          className="mt-2 inline-block text-xs px-3 py-1.5 rounded font-semibold"
          style={{
            backgroundColor: s.color_btn_primary_bg,
            color: s.color_btn_primary_text,
          }}
        >
          Book Your Course Now
        </span>
      </div>

      {/* Footer strip */}
      <div
        className="rounded-lg px-4 py-4"
        style={{ backgroundColor: s.color_footer_bg }}
      >
        <p
          className="text-sm font-bold mb-1"
          style={{ color: s.color_footer_heading }}
        >
          {s.site_name}
        </p>
        <p className="text-xs" style={{ color: s.color_footer_text }}>
          Footer body text example.
        </p>
        <p className="text-xs mt-2" style={{ color: s.color_footer_copyright }}>
          © {new Date().getFullYear()} Safe and Secure Services
        </p>
      </div>

      {/* Button row */}
      <div className="rounded-lg px-4 py-3 bg-slate-900 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 w-full mb-1">
          Button samples:
        </span>
        <span
          className="text-xs px-3 py-1.5 rounded font-semibold"
          style={{
            backgroundColor: s.color_btn_primary_bg,
            color: s.color_btn_primary_text,
          }}
        >
          Primary
        </span>
        <span
          className="text-xs px-3 py-1.5 rounded font-semibold border"
          style={{
            backgroundColor: s.color_btn_secondary_bg,
            color: s.color_btn_secondary_text,
            borderColor: s.color_btn_secondary_text + "40",
          }}
        >
          Secondary
        </span>
        <span
          className="text-xs px-3 py-1.5 rounded font-semibold"
          style={{
            backgroundColor: s.color_btn_nav_bg,
            color: s.color_btn_nav_text,
          }}
        >
          Nav CTA
        </span>
      </div>
    </div>
  );
}

// ─── Color input row ──────────────────────────────────────────────────────────
function ColorRow({
  token,
  value,
  error,
  onChange,
}: {
  token: ColorToken;
  value: string;
  error: string;
  onChange: (key: keyof SiteSettings, val: string) => void;
}) {
  // Determine if this is a simple hex color (no rgba) for the color picker
  const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-700/50 last:border-b-0">
      {/* Swatch + picker */}
      <div className="relative shrink-0">
        <div
          className="w-8 h-8 rounded-md border border-slate-600 overflow-hidden"
          style={{ backgroundColor: value }}
        />
        {isHex && (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(token.key, e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Pick color"
          />
        )}
      </div>
      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 font-medium truncate">
          {token.label}
        </p>
        {token.hint && <p className="text-xs text-slate-500">{token.hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      {/* Text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(token.key, e.target.value)}
        className="w-40 px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
        spellCheck={false}
      />
    </div>
  );
}

// ─── Color group card ─────────────────────────────────────────────────────────
function ColorGroupCard({
  group,
  values,
  errors,
  onChange,
}: {
  group: ColorGroup;
  values: Partial<SiteSettings>;
  errors: Record<string, string>;
  onChange: (key: keyof SiteSettings, val: string) => void;
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/60 bg-slate-800/80">
        <h3 className="text-sm font-semibold text-white">{group.title}</h3>
      </div>
      <div className="px-5">
        {group.tokens.map((token) => (
          <ColorRow
            key={token.key as string}
            token={token}
            value={(values[token.key] as string) ?? ""}
            error={errors[token.key as string] ?? ""}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Nav Items Editor ─────────────────────────────────────────────────────────
function NavItemsEditor({
  items,
  onChange,
}: {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
}) {
  const handleChange = (idx: number, field: keyof NavItem, val: string) => {
    const next = items.map((item, i) =>
      i === idx ? { ...item, [field]: val } : item,
    );
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...items, { label: "New Link", href: "#section" }]);
  };

  const handleRemove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/60 bg-slate-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Navigation Items</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            These items populate both the Navbar and the Footer Quick Links
            column.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-700/40 text-amber-400 hover:bg-amber-600/30 text-xs font-semibold transition"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Item
        </button>
      </div>
      <div className="divide-y divide-slate-700/60">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 px-5 py-3">
            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => handleMoveUp(idx)}
                disabled={idx === 0}
                className="p-0.5 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 transition"
                title="Move up"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(idx)}
                disabled={idx === items.length - 1}
                className="p-0.5 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 transition"
                title="Move down"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            {/* Label */}
            <input
              type="text"
              value={item.label}
              onChange={(e) => handleChange(idx, "label", e.target.value)}
              placeholder="Label"
              className="w-32 px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
            {/* Href */}
            <input
              type="text"
              value={item.href}
              onChange={(e) => handleChange(idx, "href", e.target.value)}
              placeholder="#section or https://..."
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
            {/* Remove */}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="p-1 rounded text-slate-500 hover:text-red-400 transition"
              title="Remove"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="px-5 py-4 text-xs text-slate-500 italic">
            No nav items. Click &ldquo;Add Item&rdquo; to create one.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SiteSetupPage() {
  const [settings, setSettings] = useState<SiteSettings>(
    SITE_SETTINGS_DEFAULTS,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 4000);
  };

  useEffect(() => {
    fetchSiteSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleColorChange = useCallback(
    (key: keyof SiteSettings, val: string) => {
      setSettings((prev) => ({ ...prev, [key]: val }));
      setDirty(true);

      // Validate
      if (typeof val === "string" && val.length > 0 && !isValidColor(val)) {
        setErrors((prev) => ({
          ...prev,
          [key as string]: "Invalid color. Use #hex or rgba(r,g,b,a).",
        }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key as string];
          return next;
        });
      }
    },
    [],
  );

  const handleNavItemsChange = useCallback((items: NavItem[]) => {
    setSettings((prev) => ({ ...prev, navbar_items: items }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      showFlash("Fix color errors before saving.", "error");
      return;
    }
    setSaving(true);

    // Save color fields + identity + navbar_items
    const patch: Partial<SiteSettings> = {};
    COLOR_GROUPS.forEach((g) =>
      g.tokens.forEach((t) => {
        (patch[t.key] as string) = settings[t.key] as string;
      }),
    );
    patch.site_name = settings.site_name;
    patch.site_tagline = settings.site_tagline;
    patch.navbar_cta_text = settings.navbar_cta_text;
    patch.navbar_cta_href = settings.navbar_cta_href;
    patch.navbar_mobile_cta_text = settings.navbar_mobile_cta_text;
    patch.navbar_items = settings.navbar_items;

    const { error } = await saveSiteSettings(patch);
    setSaving(false);
    if (error) {
      showFlash(`Save failed: ${error}`, "error");
    } else {
      setDirty(false);
      showFlash("Site settings saved successfully.");
    }
  };

  const handleReset = () => {
    setSettings(SITE_SETTINGS_DEFAULTS);
    setErrors({});
    setDirty(true);
    showFlash("Colors reset to defaults — click Save to persist.", "success");
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 animate-pulse text-sm">
            Loading site settings…
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {/*
        Strategy: AdminShell's <main> is overflow-y-auto and is the real scroll container.
        We need to ESCAPE that scroll container by making this page fill it entirely with
        its own internal layout — header pinned at top, body below split into two columns
        where ONLY the left column scrolls independently.

        To do this we use h-screen on the outer div and subtract the AdminShell header
        height (~65px) and the sidebar wrapper. Since AdminShell renders us inside
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">, we need to make OUR root
        element stretch to fill that main element exactly. We do this by using negative
        margins to cancel the padding, then restoring it internally, so we get a
        full-bleed height container we can control.
      */}
      <div
        className="-m-4 sm:-m-6 flex flex-col"
        style={{ height: "calc(100vh - 65px)" }}
      >
        {/* ── Pinned header strip ── */}
        <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-slate-700/60 bg-slate-900">
          <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Site Setup</h1>
              <p className="text-slate-400 text-sm mt-1">
                Configure site-wide color tokens. Changes are reflected live in
                the preview panel. Click{" "}
                <strong className="text-slate-300">Save All Changes</strong> to
                persist, or{" "}
                <strong className="text-slate-300">Reset to Defaults</strong> to
                restore original colors.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 hover:text-white text-sm font-medium transition"
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !dirty}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
              >
                {saving ? "Saving…" : "Save All Changes"}
              </button>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-2">
            <FlashBanner msg={flash} type={flashType} />
          </div>
        </div>

        {/* ── Body: two columns, left scrolls, right is static ── */}
        <div className="flex-1 overflow-hidden px-4 sm:px-6">
          <div className="max-w-6xl mx-auto h-full grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            {/* Left column — scrolls independently */}
            <div className="overflow-y-auto py-6 space-y-4 pr-1">
              {/* Site Identity quick-edit strip */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-700/60 bg-slate-800/80">
                  <h3 className="text-sm font-semibold text-white">
                    Site Identity &amp; CTA Buttons
                  </h3>
                </div>
                <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.site_name}
                      onChange={(e) => {
                        setSettings((p) => ({
                          ...p,
                          site_name: e.target.value,
                        }));
                        setDirty(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={settings.site_tagline}
                      onChange={(e) => {
                        setSettings((p) => ({
                          ...p,
                          site_tagline: e.target.value,
                        }));
                        setDirty(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Navbar CTA Text
                    </label>
                    <input
                      type="text"
                      value={settings.navbar_cta_text}
                      onChange={(e) => {
                        setSettings((p) => ({
                          ...p,
                          navbar_cta_text: e.target.value,
                        }));
                        setDirty(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Navbar CTA Link
                    </label>
                    <input
                      type="text"
                      value={settings.navbar_cta_href}
                      onChange={(e) => {
                        setSettings((p) => ({
                          ...p,
                          navbar_cta_href: e.target.value,
                        }));
                        setDirty(true);
                      }}
                      placeholder="#section or https://..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Mobile CTA Text
                    </label>
                    <input
                      type="text"
                      value={settings.navbar_mobile_cta_text}
                      onChange={(e) => {
                        setSettings((p) => ({
                          ...p,
                          navbar_mobile_cta_text: e.target.value,
                        }));
                        setDirty(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>
                </div>
              </div>

              <NavItemsEditor
                items={settings.navbar_items}
                onChange={handleNavItemsChange}
              />

              {COLOR_GROUPS.map((group) => (
                <ColorGroupCard
                  key={group.title}
                  group={group}
                  values={settings}
                  errors={errors}
                  onChange={handleColorChange}
                />
              ))}

              {/* Bottom padding so last card clears the visible area */}
              <div className="h-6" />
            </div>

            {/* Right column — static, never scrolls */}
            <div className="hidden xl:flex flex-col py-6 overflow-y-hidden">
              <PreviewPanel s={settings} />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

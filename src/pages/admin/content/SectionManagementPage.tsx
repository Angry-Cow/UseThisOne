import React, { useEffect, useState, useCallback } from "react";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  FlashBanner,
  inputCls,
  textareaCls,
} from "@/pages/admin/components/AdminUI";
import {
  fetchSectionText,
  saveSectionTextField,
  validateSectionField,
  type SectionTextField,
} from "@/lib/siteSettings";
import {
  AssetPickerField,
  type AssetFolder,
} from "@/pages/admin/components/AssetPicker";

// ─── Section order + display labels ──────────────────────────────────────────
const SECTION_META: Record<string, { label: string; description: string }> = {
  navbar: {
    label: "Navbar / Header",
    description: "Site name, tagline, logo, and navigation CTA buttons.",
  },
  hero: {
    label: "Hero Section",
    description:
      "Badge text, headline lines, body paragraph, and button copy/targets.",
  },
  services: {
    label: "Services Section",
    description: "Section eyebrow, heading, and description paragraph.",
  },
  whyus: {
    label: "Why Us Section",
    description: "Section eyebrow and main heading.",
  },
  testimonials: {
    label: "Testimonials Section",
    description: "Section eyebrow, heading, and intro paragraph.",
  },
  courses: {
    label: "Courses Section",
    description: "Section eyebrow, heading, and description paragraph.",
  },
  investment: {
    label: "Course Investment",
    description: "Section eyebrow, heading, and notice box text.",
  },
  cta: {
    label: "CTA Section",
    description: "Main heading, body text, and button copy/target.",
  },
  faq: {
    label: "FAQ Section",
    description:
      "Eyebrow, heading, intro paragraph, and inline link text/target.",
  },
  footer: {
    label: "Footer",
    description:
      "Brand info, contact details, map, copyright, and legal content.",
  },
};

const SECTION_ORDER = [
  "navbar",
  "hero",
  "services",
  "whyus",
  "testimonials",
  "courses",
  "investment",
  "cta",
  "faq",
  "footer",
];

// ─── Types ────────────────────────────────────────────────────────────────────
type FieldValues = Record<string, string>;
type FieldErrors = Record<string, string>;
type DirtyFlags = Record<string, boolean>;

// ── Infer the best default Asset Picker folder from the field_key ─────────────
function inferAssetFolder(key: string): AssetFolder {
  if (key.includes("logo")) return "Logos";
  if (key.includes("video")) return "Videos";
  if (key.includes("audio")) return "Audio";
  if (key.includes("doc") || key.includes("map_src")) return "Documents";
  if (key.includes("icon")) return "Icons";
  return "Images";
}

// ─── Single field row ─────────────────────────────────────────────────────────
function FieldRow({
  field,
  value,
  error,
  dirty,
  saving,
  onChange,
  onSave,
}: {
  field: SectionTextField;
  value: string;
  error: string;
  dirty: boolean;
  saving: boolean;
  onChange: (key: string, val: string) => void;
  onSave: (key: string) => void;
}) {
  const isTextarea = field.field_type === "textarea";
  const isUrl = field.field_type === "url";

  return (
    <div className="py-4 border-b border-slate-700/60 last:border-b-0">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          {!isUrl && (
            <label className="block text-sm font-medium text-slate-200 mb-0.5">
              {field.field_label}
            </label>
          )}
          <span className="text-xs text-slate-500 font-mono">
            {field.field_key}
          </span>
        </div>
        {dirty && !isUrl && (
          <button
            type="button"
            onClick={() => onSave(field.field_key)}
            disabled={saving || !!error}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      {isUrl ? (
        <div>
          <div className="flex items-start justify-between gap-4 mb-1.5">
            <AssetPickerField
              label={field.field_label}
              value={value}
              onChange={(url) => onChange(field.field_key, url)}
              defaultFolder={inferAssetFolder(field.field_key)}
              modalTitle={`Select — ${field.field_label}`}
              placeholder="https://… or browse assets"
              showPreview={
                field.field_key.includes("logo") ||
                field.field_key.includes("image") ||
                field.field_key.includes("icon")
              }
            />
          </div>
          {dirty && (
            <button
              type="button"
              onClick={() => onSave(field.field_key)}
              disabled={saving || !!error}
              className="mt-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      ) : isTextarea ? (
        <textarea
          className={textareaCls + (error ? " border-red-500" : "")}
          value={value}
          rows={3}
          onChange={(e) => onChange(field.field_key, e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={inputCls + (error ? " border-red-500" : "")}
          value={value}
          onChange={(e) => onChange(field.field_key, e.target.value)}
          placeholder={
            field.field_type === "href" ? "#section-id or https://..." : ""
          }
        />
      )}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {field.field_type === "href" && !error && (
        <p className="text-xs text-slate-500 mt-1">
          Use a section anchor like{" "}
          <code className="text-slate-400">#services</code> or a full URL.
        </p>
      )}
    </div>
  );
}

// ─── Section accordion panel ──────────────────────────────────────────────────
function SectionPanel({
  sectionKey,
  fields,
  values,
  errors,
  dirtyFields,
  savingField,
  onChange,
  onSave,
}: {
  sectionKey: string;
  fields: SectionTextField[];
  values: FieldValues;
  errors: FieldErrors;
  dirtyFields: DirtyFlags;
  savingField: string | null;
  onChange: (key: string, val: string) => void;
  onSave: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = SECTION_META[sectionKey] ?? {
    label: sectionKey,
    description: "",
  };
  const dirtyCount = fields.filter((f) => dirtyFields[f.field_key]).length;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-700/40 transition"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <span className="font-semibold text-white text-sm">{meta.label}</span>
          {dirtyCount > 0 && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-700/40">
              {dirtyCount} unsaved
            </span>
          )}
          <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
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

      {open && (
        <div className="px-5 pb-4 border-t border-slate-700/60">
          {fields.map((field) => (
            <FieldRow
              key={field.field_key}
              field={field}
              value={values[field.field_key] ?? field.value}
              error={errors[field.field_key] ?? ""}
              dirty={!!dirtyFields[field.field_key]}
              saving={savingField === field.field_key}
              onChange={onChange}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SectionManagementPage() {
  const [fields, setFields] = useState<SectionTextField[]>([]);
  const [values, setValues] = useState<FieldValues>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [dirty, setDirty] = useState<DirtyFlags>({});
  const [savingField, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 4000);
  };

  useEffect(() => {
    fetchSectionText().then((rows) => {
      setFields(rows);
      const initial: FieldValues = {};
      rows.forEach((r) => {
        initial[r.field_key] = r.value;
      });
      setValues(initial);
      setLoading(false);
    });
  }, []);

  const handleChange = useCallback(
    (key: string, val: string) => {
      setValues((prev) => ({ ...prev, [key]: val }));
      setDirty((prev) => ({ ...prev, [key]: true }));

      const field = fields.find((f) => f.field_key === key);
      if (field) {
        const err = validateSectionField(field.field_type, val);
        setErrors((prev) => ({ ...prev, [key]: err ?? "" }));
      }
    },
    [fields],
  );

  const handleSave = useCallback(
    async (key: string) => {
      setSaving(key);
      const { error } = await saveSectionTextField(key, values[key] ?? "");
      setSaving(null);
      if (error) {
        showFlash(`Failed to save: ${error}`, "error");
      } else {
        setDirty((prev) => ({ ...prev, [key]: false }));
        showFlash("Saved successfully.");
      }
    },
    [values],
  );

  // Group fields by section, preserving SECTION_ORDER
  const grouped: Record<string, SectionTextField[]> = {};
  fields.forEach((f) => {
    if (!grouped[f.section]) grouped[f.section] = [];
    grouped[f.section].push(f);
  });

  const orderedSections = SECTION_ORDER.filter((s) => grouped[s]);

  const totalDirty = Object.values(dirty).filter(Boolean).length;

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 animate-pulse text-sm">
            Loading section fields…
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Section Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Edit the text copy for each site section. Click a section to expand
            it, edit any field, then click{" "}
            <strong className="text-slate-300">Save</strong> next to that field.
          </p>
          {totalDirty > 0 && (
            <p className="text-amber-400 text-xs mt-2 font-medium">
              ⚠ You have {totalDirty} unsaved change
              {totalDirty !== 1 ? "s" : ""}. Save or discard before leaving.
            </p>
          )}
        </div>

        <FlashBanner msg={flash} type={flashType} />

        {/* DB missing notice */}
        {fields.length === 0 && !loading && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-5">
            <p className="text-amber-300 text-sm font-semibold mb-1">
              Database tables not found.
            </p>
            <p className="text-amber-200/70 text-xs">
              Run{" "}
              <code className="bg-amber-900/40 px-1 rounded">
                docs/migrations/002_site_settings.sql
              </code>{" "}
              in your Supabase SQL editor, then refresh this page.
            </p>
          </div>
        )}

        {/* Section accordions */}
        {orderedSections.map((sectionKey) => (
          <SectionPanel
            key={sectionKey}
            sectionKey={sectionKey}
            fields={grouped[sectionKey]}
            values={values}
            errors={errors}
            dirtyFields={dirty}
            savingField={savingField}
            onChange={handleChange}
            onSave={handleSave}
          />
        ))}
      </div>
    </AdminShell>
  );
}

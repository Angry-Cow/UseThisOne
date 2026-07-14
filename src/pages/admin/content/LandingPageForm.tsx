import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/pages/admin/components/AdminShell";
import { FlashBanner } from "@/pages/admin/components/AdminUI";

// ── Types ─────────────────────────────────────────────────────────────────────
type FormState = {
  name: string;
  slug: string;
  iframe_src: string;
  is_published: boolean;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  iframe_src: "",
  is_published: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Turn a page name into a URL-safe slug */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Basic URL validation */
function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// ── Copy button (inline) ──────────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
        copied
          ? "bg-green-900/40 border-green-700/60 text-green-300"
          : "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white"
      }`}
    >
      {copied ? (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
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
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ── Live Preview Panel ────────────────────────────────────────────────────────
function LivePreview({ iframeSrc }: { iframeSrc: string }) {
  if (!iframeSrc) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-slate-500 gap-3 p-6">
        <svg
          className="w-10 h-10 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm text-center">
          Enter a page URL on the left to see a live preview here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border-b border-slate-700 rounded-t-xl">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-slate-500 text-xs truncate flex-1">
          {iframeSrc}
        </span>
      </div>
      <iframe
        src={iframeSrc}
        className="flex-1 w-full rounded-b-xl"
        style={{ border: "none", minHeight: "400px" }}
        title="Landing page preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-slate-300 text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-slate-500 text-xs">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 transition";

// ── Validation errors type ────────────────────────────────────────────────────
type FieldErrors = {
  name?: string;
  slug?: string;
  iframe_src?: string;
};

// ── Main Form ─────────────────────────────────────────────────────────────────
export default function LandingPageForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugAutoSync, setSlugAutoSync] = useState(!isEdit);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");
  const [savedId, setSavedId] = useState<string | null>(id ?? null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [slugTaken, setSlugTaken] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const originalSlug = useRef<string>("");

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 4000);
  };

  // Load existing record for edit
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const { data, error } = await supabase
        .from("LandingPage")
        .select("id, name, slug, iframe_src, is_published")
        .eq("id", id)
        .single();
      if (error || !data) {
        showFlash("Could not load landing page.", "error");
        setLoading(false);
        return;
      }
      const loaded: FormState = {
        name: data.name ?? "",
        slug: data.slug ?? "",
        iframe_src: data.iframe_src ?? "",
        is_published: data.is_published ?? false,
      };
      setForm(loaded);
      setSlugAutoSync(false);
      originalSlug.current = data.slug ?? "";
      setLoading(false);
    })();
  }, [id, isEdit]);

  // Slug uniqueness check (debounced 600 ms)
  useEffect(() => {
    const slug = form.slug.trim();
    if (!slug || slug === originalSlug.current) {
      setSlugTaken(false);
      return;
    }
    setSlugChecking(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("LandingPage")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      // taken if a row exists and it's NOT the current record
      setSlugTaken(Boolean(data && data.id !== id));
      setSlugChecking(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [form.slug, id]);

  // Unsaved-changes guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const markDirty = () => setIsDirty(true);

  const handleUrlChange = (value: string) => {
    setForm((f) => ({ ...f, iframe_src: value }));
    setFieldErrors((e) => ({ ...e, iframe_src: undefined }));
    markDirty();
  };

  const handleNameChange = (value: string) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugAutoSync ? slugify(value) : f.slug,
    }));
    setFieldErrors((e) => ({ ...e, name: undefined }));
    markDirty();
  };

  const handleSlugChange = (value: string) => {
    setSlugAutoSync(false);
    setForm((f) => ({ ...f, slug: slugify(value) }));
    setFieldErrors((e) => ({ ...e, slug: undefined }));
    markDirty();
  };

  const publicUrl = form.slug
    ? `${window.location.origin}/offers/${form.slug}`
    : "";

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = "Page name is required.";
    if (!form.slug.trim()) {
      errors.slug = "URL slug is required.";
    } else if (slugTaken) {
      errors.slug = "This slug is already in use. Choose a different one.";
    }
    if (!form.iframe_src.trim()) {
      errors.iframe_src = "A page URL is required.";
    } else if (!isValidUrl(form.iframe_src.trim())) {
      errors.iframe_src = "Enter a valid http:// or https:// URL.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (slugChecking) {
      showFlash(
        "Still checking slug availability — please wait a moment.",
        "error",
      );
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        iframe_src: form.iframe_src.trim(),
        is_published: form.is_published,
        updated_at: new Date().toISOString(),
      };

      if (isEdit && id) {
        const { error } = await supabase
          .from("LandingPage")
          .update(payload)
          .eq("id", id);
        if (error) {
          // Unique constraint violation
          if (error.code === "23505") {
            setFieldErrors((fe) => ({
              ...fe,
              slug: "This slug is already taken.",
            }));
            showFlash(
              "Slug conflict — please choose a different URL slug.",
              "error",
            );
            return;
          }
          throw new Error(error.message);
        }
        setIsDirty(false);
        originalSlug.current = payload.slug;
        showFlash("Landing page updated successfully.");
      } else {
        const { data, error } = await supabase
          .from("LandingPage")
          .insert([{ ...payload, created_at: new Date().toISOString() }])
          .select("id")
          .single();
        if (error) {
          if (error.code === "23505") {
            setFieldErrors((fe) => ({
              ...fe,
              slug: "This slug is already taken.",
            }));
            showFlash(
              "Slug conflict — please choose a different URL slug.",
              "error",
            );
            return;
          }
          throw new Error(error.message);
        }
        setSavedId(data.id);
        setIsDirty(false);
        originalSlug.current = payload.slug;
        showFlash("Landing page created! You can now copy its public URL.");
        navigate(`/admin/content/landing-pages/edit/${data.id}`, {
          replace: true,
        });
      }
    } catch (e: any) {
      showFlash(e.message ?? "Failed to save landing page.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-24 text-slate-400 animate-pulse">
          Loading…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate("/admin/content/landing-pages")}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-700"
            title="Back to list"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? "Edit Landing Page" : "New Landing Page"}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {isEdit
                ? "Update the name, embed script, or publish state."
                : "Name the page, paste the embed script, and save."}
            </p>
          </div>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        {/* Two-column layout: form left, preview right */}
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* ── Left: form fields ── */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col gap-5">
              <Field
                label="Page Name"
                hint="Displayed in the admin list and browser tab."
              >
                <input
                  type="text"
                  className={`${inputCls} ${fieldErrors.name ? "border-red-500 focus:ring-red-500/40" : ""}`}
                  placeholder="e.g. Spring Defensive Handgun Offer"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                {fieldErrors.name && (
                  <p className="text-red-400 text-xs mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </Field>

              <Field label="URL Slug">
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputCls} pr-20 ${fieldErrors.slug || slugTaken ? "border-red-500 focus:ring-red-500/40" : ""}`}
                    placeholder="spring-defensive-handgun-offer"
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                  />
                  {slugChecking && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      checking…
                    </span>
                  )}
                  {!slugChecking && slugTaken && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs">
                      taken
                    </span>
                  )}
                  {!slugChecking &&
                    !slugTaken &&
                    form.slug &&
                    form.slug !== originalSlug.current && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-xs">
                        available
                      </span>
                    )}
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  Public path:{" "}
                  <code className="text-amber-400">
                    /offers/{form.slug || "your-slug"}
                  </code>
                </p>
                {fieldErrors.slug && (
                  <p className="text-red-400 text-xs mt-0.5">
                    {fieldErrors.slug}
                  </p>
                )}
              </Field>

              <Field
                label="Page URL"
                hint="Enter the full URL of the page to embed (must start with https://)."
              >
                <input
                  type="url"
                  className={`${inputCls} ${fieldErrors.iframe_src ? "border-red-500 focus:ring-red-500/40" : ""}`}
                  placeholder="https://your-offer-page.com/page"
                  value={form.iframe_src}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  spellCheck={false}
                />
                {form.iframe_src &&
                  !fieldErrors.iframe_src &&
                  isValidUrl(form.iframe_src) && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-green-400 text-xs">Valid URL</span>
                    </div>
                  )}
                {fieldErrors.iframe_src && (
                  <p className="text-red-400 text-xs mt-1">
                    {fieldErrors.iframe_src}
                  </p>
                )}
              </Field>

              {/* Publish toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600/60">
                <div>
                  <p className="text-white text-sm font-medium">Published</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    When on, anyone with the link can view this page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, is_published: !f.is_published }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    form.is_published ? "bg-amber-600" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.is_published ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Public URL row (shown once slug exists) */}
              {publicUrl && (
                <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-600/40">
                  <code className="text-amber-400 text-xs flex-1 truncate">
                    {publicUrl}
                  </code>
                  <CopyButton text={publicUrl} label="Copy URL" />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
                <button
                  type="submit"
                  disabled={saving || slugChecking || slugTaken}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
                >
                  {saving ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {isEdit ? "Save Changes" : "Create Page"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/content/landing-pages")}
                  className="px-4 py-2.5 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* ── Right: live preview ── */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden sticky top-6">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">
                  Live Preview
                </span>
                {form.iframe_src && isValidUrl(form.iframe_src) && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <LivePreview iframeSrc={form.iframe_src} />
            </div>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}

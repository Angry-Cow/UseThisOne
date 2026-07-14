# SASSTAC — Asset Picker & Resources Manager Implementation Prompt

> **Objective:** Add the exact same Asset Picker system that exists in the TOLR project to the SASSTAC admin interface. Both sites must look and function identically. The only difference is the Supabase bucket name.

---

## Context

The TOLR project already has a fully working Asset Picker system consisting of three parts:

1. **`AssetPickerModal`** — a pop-up modal with 5 folder tabs (Logos, Images, Videos, Audio, Documents). Each tab lists files from the corresponding folder in Supabase Storage. Clicking a file closes the modal and populates the associated URL field.
2. **`AssetPickerField`** — a reusable URL text input component with a "Browse assets" link beneath it. Clicking "Browse assets" opens the `AssetPickerModal`.
3. **`ResourcesManager`** — a full admin page at `/admin/content/resources` that lets admins upload files to the bucket, view them in grid or list layout, copy their public URLs, and delete them.

The system uses the Supabase JS client (`supabase.storage`) directly — **not** any SDK hooks.

---

## Step 1 — Supabase Bucket Setup

In your Supabase project dashboard:

1. Go to **Storage → Buckets**
2. Create a public bucket named exactly: **`sasstacBucket`**
3. Inside that bucket, create these 5 folders (you can do this by uploading a placeholder file to each path, e.g. `Logos/.gitkeep`):
   - `Logos/`
   - `Images/`
   - `Videos/`
   - `Audio/`
   - `Documents/`
4. Set a **Storage policy** that allows:
   - **SELECT (read)** — public (anon role)
   - **INSERT / UPDATE / DELETE** — authenticated role only (or service role if your admin bypasses RLS)

---

## Step 2 — Create `AssetPicker.tsx`

Create the file at: `src/pages/admin/components/AssetPicker.tsx`

This file exports three things:
- `BUCKET` constant (`"sasstacBucket"`)
- `getPublicUrl(path: string): string` helper
- `AssetPickerModal` component
- `AssetPickerField` component

**Full source to copy exactly** (change only `BUCKET`):

```tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type AssetFolder = "Logos" | "Images" | "Videos" | "Audio" | "Documents";

const FOLDERS: AssetFolder[] = ["Logos", "Images", "Videos", "Audio", "Documents"];

export const BUCKET = "sasstacBucket"; // ← ONLY change from TOLR

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncName(name: string, max = 16): string {
  if (name.length <= max) return name;
  const ext = name.lastIndexOf(".");
  if (ext > 0) {
    const base = name.slice(0, ext);
    const suffix = name.slice(ext);
    return base.slice(0, max - suffix.length - 1) + "…" + suffix;
  }
  return name.slice(0, max - 1) + "…";
}

type StorageFile = {
  name: string;
  metadata?: { size?: number; mimetype?: string };
  updated_at?: string;
};

const FOLDER_ICONS: Record<AssetFolder, React.ReactNode> = {
  Logos: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  Images: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Videos: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Audio: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  Documents: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

// ── Asset Picker Modal ────────────────────────────────────────────────────────
type AssetPickerModalProps = {
  title?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
  defaultFolder?: AssetFolder;
};

export function AssetPickerModal({
  title = "Select Asset",
  onSelect,
  onClose,
  defaultFolder = "Logos",
}: AssetPickerModalProps) {
  const [activeFolder, setActiveFolder] = useState<AssetFolder>(defaultFolder);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFolder(activeFolder);
  }, [activeFolder]);

  const loadFolder = async (folder: AssetFolder) => {
    setLoading(true);
    setError("");
    setFiles([]);
    const { data, error: err } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 200, sortBy: { column: "name", order: "asc" } });
    if (err) {
      setError("Could not load files: " + err.message);
    } else {
      setFiles((data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder"));
    }
    setLoading(false);
  };

  const handleSelect = (file: StorageFile) => {
    const url = getPublicUrl(`${activeFolder}/${file.name}`);
    onSelect(url);
    onClose();
  };

  const isImage = (f: StorageFile) => {
    const mime = f.metadata?.mimetype ?? "";
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    return mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"].includes(ext);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Folder tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-1 border-b border-gray-100">
          {FOLDERS.map((folder) => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                activeFolder === folder
                  ? "bg-slate-800 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {folder}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 160px)" }}>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400 text-sm animate-pulse">Loading…</div>
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}
          {!loading && !error && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm">No files in {activeFolder}</p>
              <p className="text-xs mt-1 text-gray-400">Upload files via the Resources tab</p>
            </div>
          )}
          {!loading && !error && files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => handleSelect(file)}
                  className="group flex flex-col items-center p-3 rounded-xl border-2 border-transparent hover:border-slate-300 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-full aspect-square rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center mb-2 border border-gray-200">
                    {isImage(file) ? (
                      <img
                        src={getPublicUrl(`${activeFolder}/${file.name}`)}
                        alt={file.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        {FOLDER_ICONS[activeFolder]}
                        <span className="text-xs font-mono uppercase">{file.name.split(".").pop()}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center leading-snug w-full truncate" title={file.name}>
                    {truncName(file.name, 18)}
                  </p>
                  {file.metadata?.size != null && (
                    <p className="text-xs text-gray-400 mt-0.5">{fmtBytes(file.metadata.size)}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Asset Picker Field ────────────────────────────────────────────────────────
type AssetPickerFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  placeholder?: string;
  defaultFolder?: AssetFolder;
  modalTitle?: string;
  showPreview?: boolean;
};

export function AssetPickerField({
  label,
  value,
  onChange,
  hint,
  placeholder = "https://…",
  defaultFolder = "Images",
  modalTitle,
  showPreview = false,
}: AssetPickerFieldProps) {
  const [open, setOpen] = useState(false);

  // NOTE: Update the inputCls to match your project's admin form field styling.
  // The example below matches the TOLR dark-slate admin theme.
  const inputCls =
    "w-full px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm font-mono";

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        {showPreview && value && (
          <div className="mb-2 w-20 h-16 rounded-lg bg-slate-700 border border-slate-600 overflow-hidden">
            <img src={value} alt="preview" className="w-full h-full object-contain" />
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-amber-400 hover:text-amber-300 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Browse assets
        </button>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>

      {open && (
        <AssetPickerModal
          title={modalTitle ?? `Select ${label}`}
          defaultFolder={defaultFolder}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

---

## Step 3 — Create `ResourcesManager.tsx`

Create the file at: `src/pages/admin/content/ResourcesManager.tsx`

Copy the source below exactly. The only change from TOLR is the import path for `BUCKET` and `getPublicUrl` (which point to your new `AssetPicker.tsx`, which has `sasstacBucket` already baked in).

> **Note on `AdminShell` and `FlashBanner`:** These components must already exist in your project at `src/pages/admin/components/AdminShell.tsx` and `src/pages/admin/components/AdminUI.tsx`. If they are named differently, update the imports accordingly.

```tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import AdminShell from "@/pages/admin/components/AdminShell";
import { FlashBanner } from "@/pages/admin/components/AdminUI";
import { supabase } from "@/lib/supabase";
import { BUCKET, getPublicUrl, type AssetFolder } from "@/pages/admin/components/AssetPicker";

const FOLDERS = ["Logos", "Images", "Videos", "Audio", "Documents"] as const;

const ACCEPTED: Record<AssetFolder, string> = {
  Logos: "image/*,.svg",
  Images: "image/*,.svg,.webp,.avif",
  Videos: "video/*",
  Audio: "audio/*",
  Documents: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
};

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type StorageFile = {
  name: string;
  metadata?: { size?: number; mimetype?: string };
  updated_at?: string;
};

function isImage(f: StorageFile): boolean {
  const mime = f.metadata?.mimetype ?? "";
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  return mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"].includes(ext);
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} title="Copy URL" className="text-slate-400 hover:text-amber-400 transition p-1 rounded">
      {copied ? (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export default function ResourcesManager() {
  const [activeFolder, setActiveFolder] = useState<AssetFolder>("Logos");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StorageFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");
  const [view, setView] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 4000);
  };

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(activeFolder, { limit: 500, sortBy: { column: "name", order: "asc" } });
    if (error) {
      showFlash("Failed to load files: " + error.message, "error");
      setFiles([]);
    } else {
      setFiles((data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder"));
    }
    setLoading(false);
  }, [activeFolder]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setUploading(true);
    let successCount = 0, failCount = 0;
    for (const file of selected) {
      const path = `${activeFolder}/${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
      if (error) failCount++; else successCount++;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    if (failCount === 0) showFlash(`${successCount} file${successCount !== 1 ? "s" : ""} uploaded successfully.`);
    else showFlash(`${successCount} uploaded, ${failCount} failed.`, "error");
    await loadFiles();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const path = `${activeFolder}/${deleteTarget.name}`;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) showFlash("Delete failed: " + error.message, "error");
    else { showFlash(`"${deleteTarget.name}" deleted.`); setDeleteTarget(null); }
    setDeleting(false);
    await loadFiles();
  };

  // [Folder icon map, grid view, list view, delete confirm modal]
  // Copy the full JSX return body from the TOLR ResourcesManager.tsx verbatim.
  // The only token that differs is colour accents — adapt to your SASSTAC theme if needed.
  // (See TOLR source at src/pages/admin/content/ResourcesManager.tsx)
}
```

> **Important:** The comment block at the end of `ResourcesManager` JSX is a placeholder. Copy the complete JSX `return (...)` from the TOLR `ResourcesManager.tsx` source directly. No logic changes are required — only styling accent colours if SASSTAC uses a different palette.

---

## Step 4 — Wire the Route

In your SASSTAC `App.tsx`, add a route inside the admin section:

```tsx
import ResourcesManager from "@/pages/admin/content/ResourcesManager";

// Inside your <Routes> block, alongside other /admin/content/* routes:
<Route path="/admin/content/resources" element={<ResourcesManager />} />
```

---

## Step 5 — Add "Resources" to Admin Navigation

In `AdminShell.tsx` (or whatever file renders the admin sidebar/nav), add a nav item:

```tsx
{ label: "Resources", href: "/admin/content/resources", icon: <FolderIcon /> }
```

The icon can be any folder/asset SVG that matches your nav style. In TOLR the nav items are rendered as `<NavLink>` or `<button>` elements with consistent styling — match that pattern.

---

## Step 6 — Use `AssetPickerField` in Admin Forms

Anywhere in the SASSTAC admin where you currently have a plain `<input type="text">` for a URL (logo URL, image URL, video URL, etc.), replace it with `AssetPickerField`:

```tsx
import { AssetPickerField } from "@/pages/admin/components/AssetPicker";

// Replace:
<input type="text" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} />

// With:
<AssetPickerField
  label="Logo URL"
  value={form.logo_url}
  onChange={(url) => setForm({ ...form, logo_url: url })}
  defaultFolder="Logos"
  modalTitle="Select Logo"
  showPreview
/>
```

**`defaultFolder` guide:**
| Field type | defaultFolder |
|-----------|--------------|
| Logo / brand image | `"Logos"` |
| Background / card / hero image | `"Images"` |
| Video URL | `"Videos"` |
| Audio / podcast | `"Audio"` |
| PDF / doc download | `"Documents"` |

---

## Step 7 — Styling Notes

The `AssetPickerModal` uses a **white / light** theme (intentional — it pops over the dark admin backgrounds). Do **not** change the modal to dark.

The `AssetPickerField`'s `inputCls` and "Browse assets" button use Tailwind classes. If SASSTAC uses a different accent colour (not `amber`), update the two `text-amber-*` class references in `AssetPickerField`:

```
text-amber-400 hover:text-amber-300   →   text-[your-accent]-400 hover:text-[your-accent]-300
```

---

## Checklist

- [ ] Supabase bucket `sasstacBucket` created and set to public
- [ ] 5 folders created: `Logos`, `Images`, `Videos`, `Audio`, `Documents`
- [ ] Storage RLS policy: SELECT = anon, INSERT/UPDATE/DELETE = authenticated
- [ ] `src/pages/admin/components/AssetPicker.tsx` created with `BUCKET = "sasstacBucket"`
- [ ] `src/pages/admin/content/ResourcesManager.tsx` created
- [ ] `/admin/content/resources` route added to `App.tsx`
- [ ] "Resources" nav item added to admin shell/sidebar
- [ ] `AssetPickerField` used in all admin URL input fields
- [ ] Modal tested: file thumbnails load, clicking a file populates the URL field
- [ ] Upload tested: files appear in grid after upload
- [ ] Delete tested: delete confirm modal works, file removed from bucket
- [ ] URL copy button tested: correct public URL copied to clipboard

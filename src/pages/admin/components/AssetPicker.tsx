import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
export type AssetFolder =
  | "Logos"
  | "Images"
  | "Icons"
  | "Videos"
  | "Audio"
  | "Documents";

const FOLDERS: AssetFolder[] = [
  "Logos",
  "Images",
  "Icons",
  "Videos",
  "Audio",
  "Documents",
];

const FOLDER_ICONS: Record<AssetFolder, React.ReactNode> = {
  Logos: (
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
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  ),
  Images: (
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
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  Icons: (
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
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  ),
  Videos: (
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
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  ),
  Audio: (
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
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  ),
  Documents: (
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
};

export const BUCKET = "tolrbucket";

// Build the public URL for a stored file
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Format bytes nicely
function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Truncate filename for display
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
      setFiles(
        (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder"),
      );
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
    return (
      mime.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"].includes(ext)
    );
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
                d="M6 18L18 6M6 6l12 12"
              />
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
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "calc(85vh - 160px)" }}
        >
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400 text-sm animate-pulse">
                Loading…
              </div>
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}
          {!loading && !error && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg
                className="w-12 h-12 mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <p className="text-sm">No files in {activeFolder}</p>
              <p className="text-xs mt-1 text-gray-400">
                Upload files via the Resources tab
              </p>
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
                  {/* Thumbnail */}
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
                        <span className="text-xs font-mono uppercase">
                          {file.name.split(".").pop()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Name + size */}
                  <p
                    className="text-xs font-medium text-gray-700 text-center leading-snug w-full truncate"
                    title={file.name}
                  >
                    {truncName(file.name, 18)}
                  </p>
                  {file.metadata?.size != null && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtBytes(file.metadata.size)}
                    </p>
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
// Drop-in replacement for any URL input that also allows browsing the bucket.
type AssetPickerFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  placeholder?: string;
  defaultFolder?: AssetFolder;
  modalTitle?: string;
  /** Show a small image preview above the field */
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
  const inputCls =
    "w-full px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm font-mono";

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
        {showPreview && value && (
          <div className="mb-2 w-20 h-16 rounded-lg bg-slate-700 border border-slate-600 overflow-hidden">
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-contain"
            />
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
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

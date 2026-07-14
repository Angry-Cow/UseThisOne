import React, { useState, useEffect, useRef, useCallback } from "react";
import AdminShell from "@/pages/admin/components/AdminShell";
import { FlashBanner } from "@/pages/admin/components/AdminUI";
import { supabase } from "@/lib/supabase";
import {
  BUCKET,
  getPublicUrl,
  type AssetFolder,
} from "@/pages/admin/components/AssetPicker";

const FOLDERS = [
  "Logos",
  "Images",
  "Icons",
  "Videos",
  "Audio",
  "Documents",
] as const;

const ACCEPTED: Record<AssetFolder, string> = {
  Logos: "image/*,.svg",
  Images: "image/*,.svg,.webp,.avif",
  Icons: "image/svg+xml,.svg,image/png",
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
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type StorageFile = {
  name: string;
  metadata?: { size?: number; mimetype?: string };
  updated_at?: string;
};

function isImage(f: StorageFile): boolean {
  const mime = f.metadata?.mimetype ?? "";
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"].includes(ext)
  );
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
    <button
      onClick={copy}
      title="Copy URL"
      className="text-slate-400 hover:text-amber-400 transition p-1 rounded"
    >
      {copied ? (
        <svg
          className="w-4 h-4 text-green-400"
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
      ) : (
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
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
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
  const [isDragging, setIsDragging] = useState(false);
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
      .list(activeFolder, {
        limit: 500,
        sortBy: { column: "name", order: "asc" },
      });
    if (error) {
      showFlash("Failed to load files: " + error.message, "error");
      setFiles([]);
    } else {
      setFiles(
        (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder"),
      );
    }
    setLoading(false);
  }, [activeFolder]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (selected: File[]) => {
    if (selected.length === 0) return;

    if (!supabase) {
      showFlash(
        "Supabase client is not initialised — check your env variables.",
        "error",
      );
      return;
    }

    setUploading(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const file of selected) {
      const path = `${activeFolder}/${file.name}`;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || undefined,
        });

      if (error) {
        errors.push(`"${file.name}": ${error.message}`);
      } else {
        successCount++;
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);

    if (errors.length === 0) {
      showFlash(
        `${successCount} file${successCount !== 1 ? "s" : ""} uploaded successfully.`,
      );
    } else if (successCount > 0) {
      showFlash(
        `${successCount} uploaded. Failures — ${errors.join(" | ")}`,
        "error",
      );
    } else {
      showFlash(`Upload failed — ${errors.join(" | ")}`, "error");
    }
    await loadFiles();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileUpload(files);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const path = `${activeFolder}/${deleteTarget.name}`;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      showFlash("Delete failed: " + error.message, "error");
    } else {
      showFlash(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    }
    setDeleting(false);
    await loadFiles();
  };

  const folderIcons: Record<AssetFolder, React.ReactNode> = {
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

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Resources</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Upload and manage assets stored in the Supabase bucket
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`p-2 transition ${view === "grid" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                title="Grid view"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
                </svg>
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 transition ${view === "list" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                title="List view"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {uploading ? "Uploading…" : `Upload to ${activeFolder}`}
            </button>
          </div>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        {/* Drag-drop upload zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-amber-500 bg-amber-50/10"
              : "border-slate-600 bg-slate-800/50 hover:border-amber-400 hover:bg-amber-50/5"
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <svg
              className="w-10 h-10 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="font-semibold text-sm text-slate-300">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-slate-500">or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">
              Accepted: {ACCEPTED[activeFolder]}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED[activeFolder]}
            multiple
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []);
              if (selected.length > 0) handleFileUpload(selected);
            }}
          />
        </div>

        {/* Folder tabs */}
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1.5 overflow-x-auto">
          {FOLDERS.map((folder) => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeFolder === folder
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <span
                className={
                  activeFolder === folder ? "text-amber-400" : "text-slate-500"
                }
              >
                {folderIcons[folder]}
              </span>
              {folder}
              {activeFolder === folder && files.length > 0 && (
                <span className="ml-1 text-xs bg-slate-600 text-slate-300 rounded-full px-1.5 py-0.5">
                  {files.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* File list */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden min-h-[300px]">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-slate-400 text-sm animate-pulse">
                Loading {activeFolder}…
              </div>
            </div>
          )}

          {!loading && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <svg
                className="w-14 h-14 mb-4 text-slate-700"
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
              <p className="text-sm font-medium text-slate-400">
                No files in {activeFolder}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Click{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-amber-400 hover:underline"
                >
                  Upload to {activeFolder}
                </button>{" "}
                to add files.
              </p>
            </div>
          )}

          {!loading && files.length > 0 && view === "grid" && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {files.map((file) => {
                const url = getPublicUrl(`${activeFolder}/${file.name}`);
                return (
                  <div
                    key={file.name}
                    className="group relative flex flex-col rounded-xl border border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/50 transition overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-slate-700 overflow-hidden flex items-center justify-center">
                      {isImage(file) ? (
                        <img
                          src={url}
                          alt={file.name}
                          loading="lazy"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400 p-4">
                          <span className="text-slate-500">
                            {folderIcons[activeFolder]}
                          </span>
                          <span className="text-xs font-mono uppercase text-slate-500">
                            {file.name.split(".").pop()}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-2 flex-1">
                      <p
                        className="text-xs text-slate-300 font-medium truncate"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      {file.metadata?.size != null && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {fmtBytes(file.metadata.size)}
                        </p>
                      )}
                    </div>
                    {/* Actions overlay */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <CopyButton url={url} />
                      <button
                        onClick={() => setDeleteTarget(file)}
                        title="Delete"
                        className="p-1 rounded bg-red-900/70 text-red-300 hover:bg-red-800 transition"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && files.length > 0 && view === "list" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium">File</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                      Size
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Modified
                    </th>
                    <th className="text-left px-4 py-3 font-medium">URL</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {files.map((file) => {
                    const url = getPublicUrl(`${activeFolder}/${file.name}`);
                    return (
                      <tr
                        key={file.name}
                        className="hover:bg-slate-700/30 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {isImage(file) ? (
                              <div className="w-10 h-8 rounded bg-slate-700 border border-slate-600 overflow-hidden shrink-0">
                                <img
                                  src={url}
                                  alt={file.name}
                                  loading="lazy"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-8 rounded bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 text-slate-400">
                                {folderIcons[activeFolder]}
                              </div>
                            )}
                            <span
                              className="text-white text-xs font-medium max-w-[160px] truncate"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-slate-400 text-xs">
                          {file.metadata?.size != null
                            ? fmtBytes(file.metadata.size)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs">
                          {fmtDate(file.updated_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-xs text-slate-500 font-mono max-w-[180px] truncate"
                              title={url}
                            >
                              …{url.slice(-40)}
                            </span>
                            <CopyButton url={url} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget(file)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition border border-red-800/50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete File
            </h3>
            <p className="text-slate-300 text-sm mb-6">
              Are you sure you want to permanently delete{" "}
              <span className="text-white font-semibold">
                {deleteTarget.name}
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition border border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold transition"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

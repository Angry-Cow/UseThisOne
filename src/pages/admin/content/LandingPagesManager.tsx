import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  FlashBanner,
  DeleteConfirmModal,
} from "@/pages/admin/components/AdminUI";

// ── Types ─────────────────────────────────────────────────────────────────────
type LandingPage = {
  id: string;
  name: string;
  slug: string;
  embed_script: string | null;
  iframe_src: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function publicPath(slug: string): string {
  return `/offers/${slug}`;
}

// ── Published badge ───────────────────────────────────────────────────────────
function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        published
          ? "bg-green-900/40 text-green-300 border-green-700/60"
          : "bg-slate-700 text-slate-400 border-slate-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${published ? "bg-green-400" : "bg-slate-500"}`}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyPathButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const path = publicPath(slug);
    try {
      await navigator.clipboard.writeText(window.location.origin + path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = window.location.origin + path;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy public URL"
      className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
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
          Copy URL
        </>
      )}
    </button>
  );
}

// ── Main LandingPagesManager ──────────────────────────────────────────────────
export default function LandingPagesManager() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 3500);
  };

  const fetchPages = useCallback(async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("LandingPage")
      .select(
        "id, name, slug, embed_script, iframe_src, is_published, created_at, updated_at",
      )
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(true);
    } else {
      setPages(data ?? []);
    }
    setIsPending(false);
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleTogglePublish = async (page: LandingPage) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("LandingPage")
        .update({
          is_published: !page.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", page.id);
      if (error) throw new Error(error.message);
      showFlash(
        page.is_published
          ? `"${page.name}" moved to draft.`
          : `"${page.name}" is now published.`,
      );
      await fetchPages();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update publish state.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("LandingPage")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("Landing page deleted.");
      await fetchPages();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete landing page.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Landing Pages</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Create and manage public offer pages with embedded content
            </p>
          </div>
          <a
            href="/admin/content/landing-pages/new"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/admin/content/landing-pages/new";
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Landing Page
          </a>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        {/* Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading landing pages…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center">
              <p className="text-red-400 mb-2">Failed to load landing pages.</p>
              <p className="text-slate-500 text-xs">
                Make sure the{" "}
                <code className="text-amber-400">LandingPage</code> table exists
                in Supabase. Run the SQL in{" "}
                <code className="text-amber-400">
                  docs/migrations/001_create_landing_pages.sql
                </code>{" "}
                if you haven&#39;t yet.
              </p>
            </div>
          )}
          {!isPending && !fetchError && pages.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">
                No landing pages yet
              </p>
              <p className="text-slate-400 text-sm mb-5">
                Create your first offer page and it will appear here.
              </p>
              <a
                href="/admin/content/landing-pages/new"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = "/admin/content/landing-pages/new";
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Landing Page
              </a>
            </div>
          )}
          {!isPending && !fetchError && pages.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Public Path
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                      Updated
                    </th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {pages.map((page) => (
                    <tr
                      key={page.id}
                      className="hover:bg-slate-700/30 transition"
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <p className="text-white font-medium leading-tight">
                          {page.name}
                        </p>
                        {page.iframe_src && (
                          <p
                            className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]"
                            title={page.iframe_src}
                          >
                            {page.iframe_src}
                          </p>
                        )}
                      </td>
                      {/* Public path */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <code className="text-amber-400 text-xs bg-slate-900/60 px-2 py-0.5 rounded">
                          {publicPath(page.slug)}
                        </code>
                      </td>
                      {/* Status toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePublish(page)}
                          disabled={saving}
                          className="focus:outline-none"
                          title={
                            page.is_published
                              ? "Click to unpublish"
                              : "Click to publish"
                          }
                        >
                          <PublishBadge published={page.is_published} />
                        </button>
                      </td>
                      {/* Updated date */}
                      <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">
                        {formatDate(page.updated_at)}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <CopyPathButton slug={page.slug} />
                          <button
                            onClick={() =>
                              (window.location.href = `/admin/content/landing-pages/edit/${page.id}`)
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({ id: page.id, name: page.name })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition border border-red-800/50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info note about SQL migration */}
        <p className="text-slate-600 text-xs mt-4 text-center">
          Table not created yet?{" "}
          <span className="text-slate-500">
            Run{" "}
            <code className="text-amber-600/80">
              docs/migrations/001_create_landing_pages.sql
            </code>{" "}
            in your Supabase SQL editor.
          </span>
        </p>
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={saving}
        />
      )}
    </AdminShell>
  );
}

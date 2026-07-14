import React, { useEffect, useState, useRef } from "react";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  FlashBanner,
  Modal,
  DeleteConfirmModal,
  inputCls,
  textareaCls,
  Toggle,
  DragHandle,
} from "@/pages/admin/components/AdminUI";
import {
  fetchUsefulLinks,
  createUsefulLink,
  updateUsefulLink,
  deleteUsefulLink,
  reorderUsefulLinks,
  type UsefulLink,
  type UsefulLinkDraft,
} from "@/lib/siteSettings";

const BLANK_DRAFT: UsefulLinkDraft = {
  switch: 1,
  order: 0,
  label: "",
  url: "",
  description: "",
};

// ─── Edit modal ───────────────────────────────────────────────────────────────
function LinkModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: UsefulLinkDraft;
  onClose: () => void;
  onSave: (draft: UsefulLinkDraft) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<UsefulLinkDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof UsefulLinkDraft, val: string | number) =>
    setDraft((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!draft.label.trim()) e.label = "Label is required.";
    if (!draft.url.trim()) e.url = "URL is required.";
    else if (
      !draft.url.startsWith("http") &&
      !draft.url.startsWith("/") &&
      !draft.url.startsWith("#")
    )
      e.url = "Must be a valid URL (https://...) or anchor (#...).";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onSave(draft);
  };

  return (
    <Modal
      title={initial.label ? `Edit: ${initial.label}` : "Add Useful Link"}
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Visibility */}
        <Toggle
          value={draft.switch}
          onChange={(v) => set("switch", v)}
          label="Visibility"
        />
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Link Label <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={draft.label}
            onChange={(e) => set("label", e.target.value)}
            className={inputCls + (errors.label ? " border-red-500" : "")}
            placeholder="e.g. NJ State Police FAQ"
          />
          {errors.label && (
            <p className="text-xs text-red-400 mt-1">{errors.label}</p>
          )}
        </div>
        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            URL <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={draft.url}
            onChange={(e) => set("url", e.target.value)}
            className={
              inputCls + " font-mono" + (errors.url ? " border-red-500" : "")
            }
            placeholder="https://example.com"
          />
          {errors.url && (
            <p className="text-xs text-red-400 mt-1">{errors.url}</p>
          )}
        </div>
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Brief Description
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            className={textareaCls}
            rows={2}
            placeholder="One-line description shown below the link."
          />
        </div>
        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition border border-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold transition"
          >
            {saving ? "Saving…" : "Save Link"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UsefulLinksManager() {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");
  const [editTarget, setEditTarget] = useState<UsefulLink | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UsefulLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Drag-and-drop state
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 4000);
  };

  const reload = () =>
    fetchUsefulLinks().then((rows) => {
      setLinks(rows);
      setLoading(false);
    });

  useEffect(() => {
    reload();
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async (draft: UsefulLinkDraft) => {
    setSaving(true);
    const withOrder: UsefulLinkDraft = { ...draft, order: links.length };
    const { error } = await createUsefulLink(withOrder);
    setSaving(false);
    if (error) {
      showFlash(`Failed to create: ${error}`, "error");
    } else {
      setShowAdd(false);
      showFlash("Link added.");
      reload();
    }
  };

  const handleUpdate = async (draft: UsefulLinkDraft) => {
    if (!editTarget) return;
    setSaving(true);
    const { error } = await updateUsefulLink(editTarget.id, draft);
    setSaving(false);
    if (error) {
      showFlash(`Failed to update: ${error}`, "error");
    } else {
      setEditTarget(null);
      showFlash("Link updated.");
      reload();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteUsefulLink(deleteTarget.id);
    setDeleting(false);
    if (error) {
      showFlash(`Failed to delete: ${error}`, "error");
    } else {
      setDeleteTarget(null);
      showFlash("Link deleted.");
      reload();
    }
  };

  const handleToggleVisible = async (link: UsefulLink) => {
    const { error } = await updateUsefulLink(link.id, {
      switch: link.switch === 1 ? 0 : 1,
    });
    if (error) showFlash(`Failed to update visibility: ${error}`, "error");
    else reload();
  };

  // ── Drag-and-drop reorder ─────────────────────────────────────────────────
  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOver(idx);
  };

  const handleDrop = async (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === dropIdx) {
      dragIdx.current = null;
      setDragOver(null);
      return;
    }
    const reordered = [...links];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIdx, 0, moved);
    setLinks(reordered);
    dragIdx.current = null;
    setDragOver(null);
    const { error } = await reorderUsefulLinks(reordered);
    if (error) showFlash(`Reorder failed: ${error}`, "error");
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOver(null);
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 animate-pulse text-sm">
            Loading useful links…
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Useful Links</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage the &ldquo;Useful&rdquo; column in the site footer. Drag
              rows to reorder. Toggle visibility per link.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition shrink-0"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Link
          </button>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        {/* DB missing notice */}
        {links.length === 0 && !loading && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-5">
            <p className="text-amber-300 text-sm font-semibold mb-1">
              No links yet — or database table not found.
            </p>
            <p className="text-amber-200/70 text-xs">
              If you haven&#39;t run the migration, execute{" "}
              <code className="bg-amber-900/40 px-1 rounded">
                docs/migrations/002_site_settings.sql
              </code>{" "}
              in Supabase, then add your first link above.
            </p>
          </div>
        )}

        {/* Link list */}
        {links.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                {links.length} link{links.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-slate-500">
                Drag rows to reorder
              </span>
            </div>
            <div className="divide-y divide-slate-700/60">
              {links.map((link, idx) => (
                <div
                  key={link.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-grab active:cursor-grabbing group ${
                    dragOver === idx
                      ? "bg-amber-900/30 border-l-2 border-amber-500"
                      : "hover:bg-slate-700/30"
                  }`}
                >
                  {/* Drag handle */}
                  <span className="shrink-0 text-slate-600 group-hover:text-slate-400 transition">
                    <DragHandle />
                  </span>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(link)}
                    title={
                      link.switch === 1
                        ? "Visible — click to hide"
                        : "Hidden — click to show"
                    }
                    className={`w-2 h-2 rounded-full shrink-0 mt-0.5 transition ${
                      link.switch === 1
                        ? "bg-green-400 hover:bg-green-300"
                        : "bg-slate-600 hover:bg-slate-400"
                    }`}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {link.label}
                    </p>
                    <p className="text-xs text-slate-400 font-mono truncate">
                      {link.url}
                    </p>
                    {link.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {link.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditTarget(link)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title="Edit"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(link)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition"
                      title="Delete"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <LinkModal
          initial={BLANK_DRAFT}
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {editTarget && (
        <LinkModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.label}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </AdminShell>
  );
}

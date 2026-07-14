import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  Modal,
  Field,
  inputCls,
  textareaCls,
  Toggle,
  OrderInput,
  StatusBadge,
  FlashBanner,
  DeleteConfirmModal,
} from "@/pages/admin/components/AdminUI";

type ReasonDraft = {
  switch: number;
  order: number;
  headline: string;
  message: string;
};

function blankDraft(maxOrder = 0): ReasonDraft {
  return {
    switch: 1,
    order: maxOrder + 1,
    headline: "",
    message: "",
  };
}

function ReasonPreview({
  headline,
  message,
}: {
  headline: string;
  message: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg
            className="w-4 h-4 text-amber-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-slate-800 mb-1">
            {headline || "Headline here"}
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {message || "Message text will appear here."}
          </p>
        </div>
      </div>
    </div>
  );
}

type EditModalProps = {
  title: string;
  initial: ReasonDraft;
  onClose: () => void;
  onSave: (draft: ReasonDraft) => Promise<void>;
  saving: boolean;
};

function ReasonEditModal({
  title,
  initial,
  onClose,
  onSave,
  saving,
}: EditModalProps) {
  const [draft, setDraft] = useState<ReasonDraft>(initial);
  const [err, setErr] = useState("");

  const set = <K extends keyof ReasonDraft>(k: K, v: ReasonDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.headline.trim()) {
      setErr("Headline is required.");
      return;
    }
    if (!draft.message.trim()) {
      setErr("Message is required.");
      return;
    }
    try {
      await onSave(draft);
    } catch {
      setErr("Failed to save. Please try again.");
    }
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="flex flex-col lg:flex-row gap-6">
        <form onSubmit={handleSave} className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-4 bg-slate-700/40 rounded-lg px-4 py-3 border border-slate-600/60">
            <Toggle
              value={draft.switch}
              onChange={(v) => set("switch", v)}
              label="Visibility"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Order:</span>
              <OrderInput
                value={draft.order}
                onChange={(v) => set("order", v)}
              />
            </div>
          </div>

          <Field label="Headline">
            <input
              type="text"
              value={draft.headline}
              onChange={(e) => set("headline", e.target.value)}
              className={inputCls}
              placeholder="e.g. Expert Instructors"
              required
            />
          </Field>

          <Field label="Message">
            <textarea
              value={draft.message}
              onChange={(e) => set("message", e.target.value)}
              className={textareaCls}
              rows={4}
              placeholder="Describe this feature/benefit…"
              required
            />
          </Field>

          {err && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
              <svg
                className="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {err}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition border border-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-semibold transition"
            >
              {saving ? "Saving…" : "Save Reason"}
            </button>
          </div>
        </form>

        <div className="lg:w-72 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Live Preview
          </p>
          <ReasonPreview headline={draft.headline} message={draft.message} />
        </div>
      </div>
    </Modal>
  );
}

export default function WhyUsReasonsManager() {
  const [reasons, setReasons] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchReasons = async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("WhyUsReason")
      .select("*")
      .order("order", { ascending: true });
    if (error) {
      setFetchError(true);
    } else {
      setReasons(data ?? []);
    }
    setIsPending(false);
  };

  useEffect(() => {
    fetchReasons();
  }, []);

  const [editItem, setEditItem] = useState<{
    id: string;
    draft: ReasonDraft;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    headline: string;
  } | null>(null);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 3500);
  };

  const maxOrder = reasons ? Math.max(...reasons.map((r) => r.order), 0) : 0;

  const handleCreate = async (draft: ReasonDraft) => {
    try {
      setSaving(true);
      const { error } = await supabase.from("WhyUsReason").insert(draft);
      if (error) throw new Error(error.message);
      setCreating(false);
      showFlash("Reason created successfully.");
      await fetchReasons();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to create reason.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (draft: ReasonDraft) => {
    if (!editItem) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("WhyUsReason")
        .update(draft)
        .eq("id", editItem.id);
      if (error) throw new Error(error.message);
      setEditItem(null);
      showFlash("Reason updated.");
      await fetchReasons();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update reason.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("WhyUsReason")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("Reason deleted.");
      await fetchReasons();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete reason.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("WhyUsReason")
        .update({ switch: current === 1 ? 0 : 1 })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchReasons();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update visibility.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOrderChange = async (id: string, newOrder: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("WhyUsReason")
        .update({ order: newOrder })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchReasons();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to reorder.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Why Us — Reasons</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage feature/benefit bullets in the Why Us section
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
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
            Add Reason
          </button>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading reasons…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load reasons.
            </div>
          )}
          {!isPending && !fetchError && (!reasons || reasons.length === 0) && (
            <div className="px-6 py-12 text-center text-slate-400">
              No reasons yet. Add one above.
            </div>
          )}
          {!isPending && !fetchError && reasons && reasons.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium w-10">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Headline
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Message preview
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Visible</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {reasons.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs w-5 text-center">
                            {r.order}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() =>
                                handleOrderChange(r.id, r.order - 1)
                              }
                              disabled={r.order <= 0 || saving}
                              className="text-slate-500 hover:text-amber-400 disabled:opacity-30 transition"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleOrderChange(r.id, r.order + 1)
                              }
                              disabled={saving}
                              className="text-slate-500 hover:text-amber-400 transition"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-medium line-clamp-1 max-w-xs">
                          {r.headline}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell max-w-[240px]">
                        <span className="line-clamp-2">{r.message}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(r.id, r.switch)}
                          disabled={saving}
                          className="focus:outline-none"
                        >
                          <StatusBadge on={r.switch === 1} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setEditItem({
                                id: r.id,
                                draft: {
                                  switch: r.switch,
                                  order: r.order,
                                  headline: r.headline,
                                  message: r.message,
                                },
                              })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                id: r.id,
                                headline: r.headline,
                              })
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
      </div>

      {creating && (
        <ReasonEditModal
          title="Add New Reason"
          initial={blankDraft(maxOrder)}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {editItem && (
        <ReasonEditModal
          title="Edit Reason"
          initial={editItem.draft}
          onClose={() => setEditItem(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.headline}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={saving}
        />
      )}
    </AdminShell>
  );
}

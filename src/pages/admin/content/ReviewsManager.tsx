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

// ── Color palette for avatar picker ──────────────────────────────────────────
const AVATAR_COLORS = [
  { label: "Sky", value: "bg-sky-100 text-sky-800" },
  { label: "Amber", value: "bg-amber-100 text-amber-800" },
  { label: "Green", value: "bg-green-100 text-green-800" },
  { label: "Rose", value: "bg-rose-100 text-rose-800" },
  { label: "Violet", value: "bg-violet-100 text-violet-800" },
  { label: "Teal", value: "bg-teal-100 text-teal-800" },
  { label: "Orange", value: "bg-orange-100 text-orange-800" },
  { label: "Slate", value: "bg-slate-200 text-slate-800" },
];

type ReviewDraft = {
  switch: number;
  order: number;
  name: string;
  role: string;
  text: string;
  initials: string;
  color: string;
  rating: number;
};

function blankDraft(maxOrder = 0): ReviewDraft {
  return {
    switch: 1,
    order: maxOrder + 1,
    name: "",
    role: "",
    text: "",
    initials: "",
    color: AVATAR_COLORS[0].value,
    rating: 5,
  };
}

// ── Inline testimonial card preview ──────────────────────────────────────────
function ReviewPreview({
  name,
  role,
  text,
  initials,
  color,
  rating,
}: Omit<ReviewDraft, "switch" | "order">) {
  const [bg, fg] = color.split(" ");
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
      {/* Stars */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg
            key={n}
            className={`w-4 h-4 ${n <= rating ? "text-amber-400" : "text-slate-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {/* Review text */}
      <p className="text-sm text-slate-600 leading-relaxed italic">
        &ldquo;{text || "Review text will appear here."}&rdquo;
      </p>
      {/* Author */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${bg} ${fg}`}
        >
          {initials || "??"}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {name || "Reviewer Name"}
          </p>
          <p className="text-xs text-slate-500">{role || "Role / Location"}</p>
        </div>
      </div>
    </div>
  );
}

// ── Edit / Create modal ───────────────────────────────────────────────────────
type EditModalProps = {
  title: string;
  initial: ReviewDraft;
  onClose: () => void;
  onSave: (draft: ReviewDraft) => Promise<void>;
  saving: boolean;
};

function ReviewEditModal({
  title,
  initial,
  onClose,
  onSave,
  saving,
}: EditModalProps) {
  const [draft, setDraft] = useState<ReviewDraft>(initial);
  const [err, setErr] = useState("");

  const set = <K extends keyof ReviewDraft>(k: K, v: ReviewDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  // Auto-derive initials from name when name changes
  const handleNameChange = (name: string) => {
    set("name", name);
    if (!draft.initials || draft.initials === deriveInitials(draft.name)) {
      set("initials", deriveInitials(name));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.name.trim()) {
      setErr("Name is required.");
      return;
    }
    if (!draft.text.trim()) {
      setErr("Review text is required.");
      return;
    }
    if (!draft.initials.trim()) {
      setErr("Initials are required (e.g. JS).");
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
        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 space-y-4 min-w-0">
          {/* Visibility + order row */}
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

          {/* Name + Role */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reviewer Name">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputCls}
                placeholder="e.g. Jane Smith"
                required
              />
            </Field>
            <Field label="Role / Location">
              <input
                type="text"
                value={draft.role}
                onChange={(e) => set("role", e.target.value)}
                className={inputCls}
                placeholder="e.g. Course Graduate, TX"
              />
            </Field>
          </div>

          {/* Review text */}
          <Field label="Review Text">
            <textarea
              value={draft.text}
              onChange={(e) => set("text", e.target.value)}
              className={textareaCls}
              rows={4}
              placeholder="Write the customer&#39;s review here…"
              required
            />
          </Field>

          {/* Star Rating */}
          <Field label="Star Rating">
            <div className="flex gap-1 py-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("rating", n)}
                  className="focus:outline-none"
                >
                  <svg
                    className={`w-7 h-7 transition-colors ${n <= draft.rating ? "text-amber-400" : "text-slate-500"}`}
                    fill={n <= draft.rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.977-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </Field>

          {/* Initials + Color */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <Field label="Avatar Initials" hint="2–3 characters, e.g. JS">
              <input
                type="text"
                value={draft.initials}
                onChange={(e) =>
                  set("initials", e.target.value.toUpperCase().slice(0, 3))
                }
                className={inputCls}
                placeholder="JS"
                maxLength={3}
              />
            </Field>
            <Field label="Avatar Color">
              <select
                value={draft.color}
                onChange={(e) => set("color", e.target.value)}
                className={inputCls}
              >
                {AVATAR_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Error */}
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

          {/* Actions */}
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
              {saving ? "Saving…" : "Save Review"}
            </button>
          </div>
        </form>

        {/* Live preview */}
        <div className="lg:w-72 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Live Preview
          </p>
          <ReviewPreview
            name={draft.name}
            role={draft.role}
            text={draft.text}
            initials={draft.initials}
            color={draft.color}
            rating={draft.rating}
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Helper to auto-derive initials ────────────────────────────────────────────
function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// ── Main ReviewsManager page ──────────────────────────────────────────────────
export default function ReviewsManager() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchReviews = async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("Review")
      .select("*")
      .order("order", { ascending: true });
    if (error) {
      setFetchError(true);
    } else {
      setReviews(data ?? []);
    }
    setIsPending(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const [editItem, setEditItem] = useState<{
    id: string;
    draft: ReviewDraft;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 3500);
  };

  const maxOrder = reviews ? Math.max(...reviews.map((r) => r.order), 0) : 0;

  const handleCreate = async (draft: ReviewDraft) => {
    try {
      setSaving(true);
      const { error } = await supabase.from("Review").insert(draft);
      if (error) throw new Error(error.message);
      setCreating(false);
      showFlash("Review created successfully.");
      await fetchReviews();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to create review.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (draft: ReviewDraft) => {
    if (!editItem) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Review")
        .update(draft)
        .eq("id", editItem.id);
      if (error) throw new Error(error.message);
      setEditItem(null);
      showFlash("Review updated.");
      await fetchReviews();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update review.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Review")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("Review deleted.");
      await fetchReviews();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete review.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Review")
        .update({ switch: current === 1 ? 0 : 1 })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchReviews();
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
        .from("Review")
        .update({ order: newOrder })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchReviews();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to reorder.", "error");
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
            <h2 className="text-xl font-bold text-white">
              Reviews &amp; Testimonials
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage customer reviews shown in the testimonials section
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
            Add Review
          </button>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        {/* Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading reviews…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load reviews.
            </div>
          )}
          {!isPending && !fetchError && (!reviews || reviews.length === 0) && (
            <div className="px-6 py-12 text-center text-slate-400">
              No reviews yet. Add one above.
            </div>
          )}
          {!isPending && !fetchError && reviews && reviews.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium w-10">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Reviewer
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Review preview
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Visible</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {reviews.map((r) => {
                    const [bg, fg] = r.color.split(" ");
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-700/30 transition"
                      >
                        {/* Order controls */}
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
                        {/* Reviewer */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${bg} ${fg}`}
                            >
                              {r.initials}
                            </div>
                            <div>
                              <p className="text-white font-medium leading-tight">
                                {r.name}
                              </p>
                              <p className="text-slate-400 text-xs">{r.role}</p>
                            </div>
                          </div>
                        </td>
                        {/* Preview */}
                        <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell max-w-[260px]">
                          <span className="line-clamp-2 italic">
                            &ldquo;{r.text}&rdquo;
                          </span>
                        </td>
                        {/* Toggle */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggle(r.id, r.switch)}
                            disabled={saving}
                            className="focus:outline-none"
                          >
                            <StatusBadge on={r.switch === 1} />
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setEditItem({
                                  id: r.id,
                                  draft: {
                                    switch: r.switch,
                                    order: r.order,
                                    name: r.name,
                                    role: r.role,
                                    text: r.text,
                                    initials: r.initials,
                                    color: r.color,
                                    rating: r.rating ?? 5,
                                  },
                                })
                              }
                              className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({ id: r.id, name: r.name })
                              }
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition border border-red-800/50"
                            >
                              Delete
                            </button>
                          </div>
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

      {creating && (
        <ReviewEditModal
          title="Add New Review"
          initial={blankDraft(maxOrder)}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {editItem && (
        <ReviewEditModal
          title="Edit Review"
          initial={editItem.draft}
          onClose={() => setEditItem(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}
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

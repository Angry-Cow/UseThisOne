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
import { AssetPickerField } from "@/pages/admin/components/AssetPicker";

type CardDraft = {
  switch: number;
  order: number;
  video_url: string;
  quote: string;
  name: string;
  role: string;
  initial: string;
};

function blankDraft(maxOrder = 0): CardDraft {
  return {
    switch: 1,
    order: maxOrder + 1,
    video_url: "",
    quote: "",
    name: "",
    role: "",
    initial: "",
  };
}

function CardPreview({ draft }: { draft: CardDraft }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Video placeholder */}
      <div className="relative aspect-video bg-slate-200 flex items-center justify-center">
        {draft.video_url ? (
          <video
            src={draft.video_url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        ) : (
          <div className="text-slate-400 text-xs">Video preview</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow">
            <svg
              className="w-5 h-5 text-slate-700 ml-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      </div>
      {/* Quote + attribution */}
      <div className="p-4">
        <p className="text-sm text-slate-600 italic leading-relaxed mb-3">
          "{draft.quote || "Quote text here…"}"
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-sm">
            {draft.initial || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {draft.name || "Name"}
            </p>
            <p className="text-xs text-slate-500">{draft.role || "Role"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type EditModalProps = {
  title: string;
  initial: CardDraft;
  onClose: () => void;
  onSave: (draft: CardDraft) => Promise<void>;
  saving: boolean;
};

function CardEditModal({
  title,
  initial,
  onClose,
  onSave,
  saving,
}: EditModalProps) {
  const [draft, setDraft] = useState<CardDraft>(initial);
  const [err, setErr] = useState("");

  const set = <K extends keyof CardDraft>(k: K, v: CardDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleNameChange = (name: string) => {
    set("name", name);
    if (name.trim()) {
      const parts = name.trim().split(" ");
      const initials =
        parts.length > 1
          ? parts[0][0] + parts[parts.length - 1][0]
          : parts[0][0];
      set("initial", initials.toUpperCase());
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.quote.trim()) {
      setErr("Quote is required.");
      return;
    }
    if (!draft.name.trim()) {
      setErr("Name is required.");
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

          {/* Video source via Asset Picker */}
          <AssetPickerField
            label="Video URL"
            value={draft.video_url}
            onChange={(url) => set("video_url", url)}
            defaultFolder="Videos"
            modalTitle="Select Video"
            placeholder="https://… or pick from bucket"
            hint="Select a video from the asset library or paste a direct URL."
          />

          <Field label="Quote">
            <textarea
              value={draft.quote}
              onChange={(e) => set("quote", e.target.value)}
              className={textareaCls}
              rows={3}
              placeholder="The testimonial/quote text…"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputCls}
                placeholder="e.g. John Smith"
                required
              />
            </Field>
            <Field label="Role/Title">
              <input
                type="text"
                value={draft.role}
                onChange={(e) => set("role", e.target.value)}
                className={inputCls}
                placeholder="e.g. Firearms Instructor"
              />
            </Field>
          </div>

          <Field label="Initial(s)">
            <input
              type="text"
              value={draft.initial}
              onChange={(e) =>
                set("initial", e.target.value.toUpperCase().slice(0, 2))
              }
              className={inputCls}
              placeholder="e.g. JS"
              maxLength={2}
            />
            <p className="text-xs text-slate-500 mt-1">
              Auto-generated from name; override if needed.
            </p>
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
              {saving ? "Saving…" : "Save Card"}
            </button>
          </div>
        </form>

        <div className="lg:w-72 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Live Preview
          </p>
          <CardPreview draft={draft} />
        </div>
      </div>
    </Modal>
  );
}

export default function WhyUsCardManager() {
  const [cards, setCards] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCards = async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("WhyUsCard")
      .select("*")
      .order("order", { ascending: true });
    if (error) {
      setFetchError(true);
    } else {
      setCards(data ?? []);
    }
    setIsPending(false);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const [editItem, setEditItem] = useState<{
    id: string;
    draft: CardDraft;
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

  const maxOrder = cards ? Math.max(...cards.map((c) => c.order), 0) : 0;

  const handleCreate = async (draft: CardDraft) => {
    try {
      setSaving(true);
      const { error } = await supabase.from("WhyUsCard").insert(draft);
      if (error) throw new Error(error.message);
      setCreating(false);
      showFlash("Card created successfully.");
      await fetchCards();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to create card.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (draft: CardDraft) => {
    if (!editItem) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("WhyUsCard")
        .update(draft)
        .eq("id", editItem.id);
      if (error) throw new Error(error.message);
      setEditItem(null);
      showFlash("Card updated.");
      await fetchCards();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update card.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("WhyUsCard")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("Card deleted.");
      await fetchCards();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete card.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("WhyUsCard")
        .update({ switch: current === 1 ? 0 : 1 })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchCards();
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
        .from("WhyUsCard")
        .update({ order: newOrder })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchCards();
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
            <h2 className="text-xl font-bold text-white">
              Why Us — Media Card
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage video + quote card in the Why Us section
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
            Add Card
          </button>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading cards…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load cards.
            </div>
          )}
          {!isPending && !fetchError && (!cards || cards.length === 0) && (
            <div className="px-6 py-12 text-center text-slate-400">
              No cards yet. Add one above.
            </div>
          )}
          {!isPending && !fetchError && cards && cards.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium w-10">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Quote preview
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Visible</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {cards.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs w-5 text-center">
                            {c.order}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() =>
                                handleOrderChange(c.id, c.order - 1)
                              }
                              disabled={c.order <= 0 || saving}
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
                                handleOrderChange(c.id, c.order + 1)
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
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs shrink-0">
                            {c.initial}
                          </div>
                          <span className="text-white font-medium line-clamp-1">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell max-w-[240px]">
                        <span className="line-clamp-2 italic">"{c.quote}"</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(c.id, c.switch)}
                          disabled={saving}
                          className="focus:outline-none"
                        >
                          <StatusBadge on={c.switch === 1} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setEditItem({
                                id: c.id,
                                draft: {
                                  switch: c.switch,
                                  order: c.order,
                                  video_url: c.video_url ?? "",
                                  quote: c.quote,
                                  name: c.name,
                                  role: c.role,
                                  initial: c.initial,
                                },
                              })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({ id: c.id, name: c.name })
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
        <CardEditModal
          title="Add New Card"
          initial={blankDraft(maxOrder)}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {editItem && (
        <CardEditModal
          title="Edit Card"
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

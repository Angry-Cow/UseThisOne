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

type FaqDraft = {
  switch: number;
  order: number;
  question: string;
  answer: string;
  link: string;
  link_text: string;
};

function blankDraft(maxOrder = 0): FaqDraft {
  return {
    switch: 1,
    order: maxOrder + 1,
    question: "",
    answer: "",
    link: "",
    link_text: "",
  };
}

// ── Inline FAQ preview — mirrors the live FaqItem exactly ────────────────────
function FaqPreview({
  question,
  answer,
  link,
  linktext,
}: {
  question: string;
  answer: string;
  link: string;
  linktext: string;
}) {
  const [open, setOpen] = useState(false);
  const hasLink = link.trim() !== "" && linktext.trim() !== "";
  return (
    // Outer wrapper matches the live section container: rounded-2xl overflow-hidden border border-slate-200 shadow-sm
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div
        className={`border-b border-slate-200 transition-colors duration-200 ${open ? "bg-sky-50/60" : "bg-white hover:bg-slate-50"}`}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
        >
          <span
            className={`text-base font-semibold leading-snug transition-colors duration-200 ${open ? "text-sky-900" : "text-slate-800 group-hover:text-sky-900"}`}
          >
            {question || "Question text will appear here"}
          </span>
          <span
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${open ? "bg-sky-900 rotate-45" : "bg-slate-100 group-hover:bg-sky-100"}`}
          >
            <svg
              className={`w-3.5 h-3.5 transition-colors duration-300 ${open ? "text-white" : "text-slate-500 group-hover:text-sky-700"}`}
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="px-6 pb-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              {answer || "Answer text will appear here."}
            </p>
            {hasLink && (
              <span className="inline-block mt-3 text-sm font-semibold text-amber-600">
                {linktext} →
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type EditModalProps = {
  title: string;
  initial: FaqDraft;
  onClose: () => void;
  onSave: (draft: FaqDraft) => Promise<void>;
  saving: boolean;
};

function FaqEditModal({
  title,
  initial,
  onClose,
  onSave,
  saving,
}: EditModalProps) {
  const [draft, setDraft] = useState<FaqDraft>(initial);
  const [err, setErr] = useState("");

  const set = <K extends keyof FaqDraft>(k: K, v: FaqDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.question.trim()) {
      setErr("Question is required.");
      return;
    }
    if (!draft.answer.trim()) {
      setErr("Answer is required.");
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

          <Field label="Question">
            <input
              type="text"
              value={draft.question}
              onChange={(e) => set("question", e.target.value)}
              className={inputCls}
              placeholder="e.g. What should I bring to class?"
              required
            />
          </Field>

          <Field label="Answer">
            <textarea
              value={draft.answer}
              onChange={(e) => set("answer", e.target.value)}
              className={textareaCls}
              rows={4}
              placeholder="Write the full answer here…"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Link URL (optional)">
              <input
                type="text"
                value={draft.link}
                onChange={(e) => set("link", e.target.value)}
                className={inputCls}
                placeholder="https://…"
              />
            </Field>
            <Field label="Link Text (optional)">
              <input
                type="text"
                value={draft.link_text}
                onChange={(e) => set("link_text", e.target.value)}
                className={inputCls}
                placeholder="e.g. Learn more"
              />
            </Field>
          </div>

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
              {saving ? "Saving…" : "Save FAQ"}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="lg:w-80 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Live Preview{" "}
            <span className="text-slate-500 normal-case font-normal">
              (click to expand)
            </span>
          </p>
          <FaqPreview
            question={draft.question}
            answer={draft.answer}
            link={draft.link}
            linktext={draft.link_text}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function FaqsManager() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("Faq")
      .select("*")
      .order("order", { ascending: true });
    if (error) {
      setFetchError(true);
    } else {
      setFaqs(data ?? []);
    }
    setIsPending(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const [editItem, setEditItem] = useState<{
    id: string;
    draft: FaqDraft;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    question: string;
  } | null>(null);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 3500);
  };

  const maxOrder = faqs ? Math.max(...faqs.map((f) => f.order), 0) : 0;

  const handleCreate = async (draft: FaqDraft) => {
    try {
      setSaving(true);
      const { error } = await supabase.from("Faq").insert(draft);
      if (error) throw new Error(error.message);
      setCreating(false);
      showFlash("FAQ created successfully.");
      await fetchFaqs();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to create FAQ.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (draft: FaqDraft) => {
    if (!editItem) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Faq")
        .update(draft)
        .eq("id", editItem.id);
      if (error) throw new Error(error.message);
      setEditItem(null);
      showFlash("FAQ updated.");
      await fetchFaqs();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update FAQ.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Faq")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("FAQ deleted.");
      await fetchFaqs();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete FAQ.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Faq")
        .update({ switch: current === 1 ? 0 : 1 })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchFaqs();
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
        .from("Faq")
        .update({ order: newOrder })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchFaqs();
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
            <h2 className="text-xl font-bold text-white">FAQs</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage frequently asked questions
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
            Add FAQ
          </button>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading FAQs…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load FAQs.
            </div>
          )}
          {!isPending && !fetchError && (!faqs || faqs.length === 0) && (
            <div className="px-6 py-12 text-center text-slate-400">
              No FAQs yet. Add one above.
            </div>
          )}
          {!isPending && !fetchError && faqs && faqs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium w-10">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Question
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Answer preview
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Visible</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {faqs.map((faq) => (
                    <tr
                      key={faq.id}
                      className="hover:bg-slate-700/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs w-5 text-center">
                            {faq.order}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() =>
                                handleOrderChange(faq.id, faq.order - 1)
                              }
                              disabled={faq.order <= 0 || saving}
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
                                handleOrderChange(faq.id, faq.order + 1)
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
                        <span className="text-white font-medium line-clamp-2 max-w-xs">
                          {faq.question}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell max-w-[240px]">
                        <span className="line-clamp-2">{faq.answer}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(faq.id, faq.switch)}
                          disabled={saving}
                          className="focus:outline-none"
                        >
                          <StatusBadge on={faq.switch === 1} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setEditItem({
                                id: faq.id,
                                draft: {
                                  switch: faq.switch,
                                  order: faq.order,
                                  question: faq.question,
                                  answer: faq.answer,
                                  link: faq.link ?? "",
                                  link_text: faq.link_text ?? "",
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
                                id: faq.id,
                                question: faq.question,
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
        <FaqEditModal
          title="Add New FAQ"
          initial={blankDraft(maxOrder)}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {editItem && (
        <FaqEditModal
          title="Edit FAQ"
          initial={editItem.draft}
          onClose={() => setEditItem(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.question}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={saving}
        />
      )}
    </AdminShell>
  );
}

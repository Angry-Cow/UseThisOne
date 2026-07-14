import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  Modal,
  Field,
  inputCls,
  Toggle,
  OrderInput,
  StatusBadge,
  FlashBanner,
} from "@/pages/admin/components/AdminUI";
import { CourseInvestmentItem } from "@/sections/BookingSection/components/CourseInvestmentItem";

type InvestmentDraft = {
  switch: number;
  order: number;
  title: string;
  group_price: string;
  group_price_note: string;
  private_price: string;
  private_price_note: string;
  duration: string;
  button1_text: string;
  button2_text: string;
};

type EditModalProps = {
  courseTitle: string;
  initial: InvestmentDraft;
  onClose: () => void;
  onSave: (draft: Omit<InvestmentDraft, "title">) => Promise<void>;
  saving: boolean;
};

function InvestmentEditModal({
  courseTitle,
  initial,
  onClose,
  onSave,
  saving,
}: EditModalProps) {
  const [draft, setDraft] = useState<InvestmentDraft>(initial);
  const [err, setErr] = useState("");

  const set = <K extends keyof InvestmentDraft>(k: K, v: InvestmentDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.group_price.trim()) {
      setErr("Group Price is required.");
      return;
    }
    try {
      const { title: _title, ...fields } = draft;
      await onSave(fields);
    } catch {
      setErr("Failed to save. Please try again.");
    }
  };

  return (
    <Modal title={`Edit Investment — ${courseTitle}`} onClose={onClose} wide>
      <div className="flex flex-col lg:flex-row gap-6">
        <form onSubmit={handleSave} className="flex-1 space-y-4 min-w-0">
          <div className="bg-slate-700/30 rounded-lg px-4 py-3 border border-slate-600/40">
            <p className="text-xs text-slate-400 mb-0.5 font-medium uppercase tracking-wide">
              Course (read-only here)
            </p>
            <p className="text-white font-semibold text-sm">{courseTitle}</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Edit the title and category in the Courses manager.
            </p>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Group Price">
              <input
                type="text"
                value={draft.group_price}
                onChange={(e) => set("group_price", e.target.value)}
                className={inputCls}
                placeholder="e.g. $49"
                required
              />
            </Field>
            <Field label="Group Price Note">
              <input
                type="text"
                value={draft.group_price_note}
                onChange={(e) => set("group_price_note", e.target.value)}
                className={inputCls}
                placeholder="e.g. per person"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Private Price">
              <input
                type="text"
                value={draft.private_price}
                onChange={(e) => set("private_price", e.target.value)}
                className={inputCls}
                placeholder="e.g. $200"
              />
            </Field>
            <Field label="Private Price Note">
              <input
                type="text"
                value={draft.private_price_note}
                onChange={(e) => set("private_price_note", e.target.value)}
                className={inputCls}
                placeholder="e.g. private session"
              />
            </Field>
          </div>

          <Field
            label="Duration / Scheduling Note"
            hint="Displayed below the price on the Course Investment list."
          >
            <input
              type="text"
              value={draft.duration}
              onChange={(e) => set("duration", e.target.value)}
              className={inputCls}
              placeholder="e.g. 4 Hours • Contact us to arrange a class (Minimum 4 Attendees)"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary Button" hint="Usually &#39;Contact Now&#39;">
              <input
                type="text"
                value={draft.button1_text}
                onChange={(e) => set("button1_text", e.target.value)}
                className={inputCls}
                placeholder="Contact Now"
              />
            </Field>
            <Field label="Secondary Button" hint="Usually &#39;Group Rate&#39;">
              <input
                type="text"
                value={draft.button2_text}
                onChange={(e) => set("button2_text", e.target.value)}
                className={inputCls}
                placeholder="Group Rate"
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
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

        <div className="lg:w-[480px] shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Live Preview
          </p>
          <div className="bg-white p-3 rounded-2xl" style={{ minWidth: 480 }}>
            <CourseInvestmentItem
              title={draft.title || "Course Title"}
              duration={draft.duration || "2 Hours"}
              groupPrice={draft.group_price || "$0"}
              groupPriceNote={draft.group_price_note || undefined}
              privatePrice={draft.private_price || undefined}
              privatePriceNote={draft.private_price_note || undefined}
              buttonText={draft.button1_text || "Contact Now"}
              courseValue={draft.title || ""}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Primary button scrolls to booking form on live site
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default function OfferingsManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("Course")
      .select("*")
      .order("order", { ascending: true });
    if (error) {
      setFetchError(true);
    } else {
      setCourses(data ?? []);
    }
    setIsPending(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const [editItem, setEditItem] = useState<{
    id: string;
    draft: InvestmentDraft;
  } | null>(null);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 3500);
  };

  const reorderCourses = async (
    movedId: string,
    oldOrder: number,
    newOrder: number,
    fields: Omit<InvestmentDraft, "title">,
  ) => {
    if (oldOrder === newOrder) {
      const { error } = await supabase
        .from("Course")
        .update(fields)
        .eq("id", movedId);
      if (error) throw new Error(error.message);
      return;
    }
    const shifts: Promise<any>[] = [];
    if (newOrder < oldOrder) {
      for (const c of courses) {
        if (c.id !== movedId && c.order >= newOrder && c.order < oldOrder) {
          shifts.push(
            supabase
              .from("Course")
              .update({ order: c.order + 1 })
              .eq("id", c.id),
          );
        }
      }
    } else {
      for (const c of courses) {
        if (c.id !== movedId && c.order > oldOrder && c.order <= newOrder) {
          shifts.push(
            supabase
              .from("Course")
              .update({ order: c.order - 1 })
              .eq("id", c.id),
          );
        }
      }
    }
    await Promise.all(shifts);
    const { error } = await supabase
      .from("Course")
      .update(fields)
      .eq("id", movedId);
    if (error) throw new Error(error.message);
  };

  const handleUpdate = async (fields: Omit<InvestmentDraft, "title">) => {
    if (!editItem) return;
    try {
      setSaving(true);
      await reorderCourses(
        editItem.id,
        editItem.draft.order,
        fields.order,
        fields,
      );
      setEditItem(null);
      showFlash("Investment details updated.");
      await fetchCourses();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Course")
        .update({ switch: current === 1 ? 0 : 1 })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchCourses();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update visibility.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOrderChange = async (id: string, newOrder: number) => {
    const target = courses.find((c) => c.id === id);
    if (!target) return;
    try {
      setSaving(true);
      const displaced = courses.find(
        (c) => c.id !== id && c.order === newOrder,
      );
      if (displaced) {
        const { error: e1 } = await supabase
          .from("Course")
          .update({ order: target.order })
          .eq("id", displaced.id);
        if (e1) throw new Error(e1.message);
      }
      const { error: e2 } = await supabase
        .from("Course")
        .update({ order: newOrder })
        .eq("id", id);
      if (e2) throw new Error(e2.message);
      await fetchCourses();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to reorder.", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: NonNullable<typeof courses>[number]) => {
    setEditItem({
      id: c.id,
      draft: {
        switch: c.switch,
        order: c.order,
        title: c.title,
        group_price: c.group_price ?? (c as any).price ?? "",
        group_price_note: c.group_price_note ?? (c as any).priceNote ?? "",
        private_price: c.private_price ?? "",
        private_price_note: c.private_price_note ?? "",
        duration: c.duration ?? "",
        button1_text: c.button1_text ?? "Contact Now",
        button2_text: c.button2_text ?? "Group Rate",
      },
    });
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-white">
              Course Investment List
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Edit pricing, duration, and CTA buttons for the investment display
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-slate-700/40 border border-slate-600/60 rounded-xl px-4 py-3 mb-5 text-sm text-slate-300">
          <svg
            className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            This view edits{" "}
            <span className="text-white font-medium">
              pricing and CTA fields
            </span>{" "}
            on the Course records. To add, remove, or rename courses, use the{" "}
            <a
              href="/admin/content/courses"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              Courses manager
            </a>
            .
          </span>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load courses.
            </div>
          )}
          {!isPending && !fetchError && (!courses || courses.length === 0) && (
            <div className="px-6 py-12 text-center text-slate-400">
              No courses found. Add courses in the Courses manager.
            </div>
          )}
          {!isPending && !fetchError && courses && courses.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium w-10">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Course</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Group Price
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Private Price
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                      Duration
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                      Buttons
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Visible</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {courses.map((c) => (
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
                      <td className="px-4 py-3 text-white font-medium">
                        {c.title}
                      </td>
                      <td className="px-4 py-3 text-slate-300 hidden md:table-cell">
                        {c.group_price ?? (c as any).price}
                        {(c.group_price_note ?? (c as any).priceNote) && (
                          <span className="text-slate-500 text-xs ml-1">
                            {c.group_price_note ?? (c as any).priceNote}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 hidden md:table-cell">
                        {c.private_price ? (
                          <>
                            {c.private_price}
                            {c.private_price_note && (
                              <span className="text-slate-500 text-xs ml-1">
                                {c.private_price_note}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-600 text-xs italic">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell max-w-[200px] truncate">
                        {c.duration}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-300 border border-amber-700/40">
                            {c.button1_text ?? "Contact Now"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                            {c.button2_text ?? "Group Rate"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(c.id, c.switch)}
                          disabled={saving}
                          className="focus:outline-none"
                          title="Toggle visibility"
                        >
                          <StatusBadge on={c.switch === 1} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editItem && (
        <InvestmentEditModal
          courseTitle={editItem.draft.title}
          initial={editItem.draft}
          onClose={() => setEditItem(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}
    </AdminShell>
  );
}

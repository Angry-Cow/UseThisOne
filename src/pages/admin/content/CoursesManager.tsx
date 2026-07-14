import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  Modal,
  Field,
  inputCls,
  textareaCls,
  Toggle,
  DraggableChipList,
  OrderInput,
  StatusBadge,
  FlashBanner,
  DeleteConfirmModal,
} from "@/pages/admin/components/AdminUI";
import { CourseCard } from "@/sections/CoursesSection/components/CourseCard";

type CourseDraft = {
  switch: number;
  order: number;
  title: string;
  category: string;
  group_price: string;
  group_price_note: string;
  private_price: string;
  private_price_note: string;
  duration: string;
  description: string;
  features: string;
  button_text: string;
  button1_text: string;
  button2_text: string;
};

// Categories loaded dynamically from DB — see CategoriesManager
const FALLBACK_CATEGORY_OPTIONS = [
  "First Aid",
  "Personal Defense",
  "Personal Awareness",
];

/** Returns the category value to use in the draft — falls back to first option if the stored value no longer exists */
function resolveCategoryValue(stored: string, options: string[]): string {
  if (options.includes(stored)) return stored;
  return options[0] ?? stored;
}

function blankDraft(maxOrder = 0): CourseDraft {
  return {
    switch: 1,
    order: maxOrder + 1,
    title: "",
    category: "First Aid",
    group_price: "",
    group_price_note: "",
    private_price: "",
    private_price_note: "",
    duration: "",
    description: "",
    features: "",
    button_text: "Contact Us Now To Schedule",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  };
}

function parseFeatures(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p.map(String);
  } catch {
    // not json
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeFeatures(chips: string[]): string {
  return chips.join(",");
}

type EditModalProps = {
  initial: CourseDraft | null;
  title: string;
  onClose: () => void;
  onSave: (draft: CourseDraft) => Promise<void>;
  saving: boolean;
  categoryOptions: string[];
};

function CourseEditModal({
  initial,
  title,
  onClose,
  onSave,
  saving,
  categoryOptions,
}: EditModalProps) {
  const [draft, setDraft] = useState<CourseDraft>(initial ?? blankDraft());
  const [chips, setChips] = useState<string[]>(
    parseFeatures(initial?.features ?? ""),
  );
  const [err, setErr] = useState("");

  const set = <K extends keyof CourseDraft>(k: K, v: CourseDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.title.trim()) {
      setErr("Title is required.");
      return;
    }
    if (!draft.group_price.trim()) {
      setErr("Group Price is required.");
      return;
    }
    const final: CourseDraft = { ...draft, features: serializeFeatures(chips) };
    try {
      await onSave(final);
    } catch {
      setErr("Failed to save. Please try again.");
    }
  };

  const previewFeatures =
    chips.length > 0 ? chips : parseFeatures(draft.features);

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Form ── */}
        <form onSubmit={handleSave} className="flex-1 space-y-4 min-w-0">
          {/* Switch + Order row */}
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

          <Field label="Course Title">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="e.g. Stop The Bleed"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={draft.category}
                onChange={(e) => set("category", e.target.value)}
                className={inputCls}
              >
                {categoryOptions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Duration">
              <input
                type="text"
                value={draft.duration}
                onChange={(e) => set("duration", e.target.value)}
                className={inputCls}
                placeholder="e.g. 4 Hours"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Group Price">
              <input
                type="text"
                value={draft.group_price}
                onChange={(e) => set("group_price", e.target.value)}
                className={inputCls}
                placeholder="e.g. $125"
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
            label="Features"
            hint="Drag rows to reorder. Type a feature and press Enter to add."
          >
            <DraggableChipList
              chips={chips}
              onChange={setChips}
              placeholder="Add feature…"
            />
          </Field>

          <Field
            label="Description"
            hint="Press Enter to start a new line or paragraph."
          >
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className={textareaCls}
              rows={5}
              placeholder="Brief summary of the course…"
            />
          </Field>

          <Field
            label="Button Text"
            hint="Shown on the course card in the Courses section."
          >
            <input
              type="text"
              value={draft.button_text}
              onChange={(e) => set("button_text", e.target.value)}
              className={inputCls}
              placeholder="e.g. Contact Us Now To Schedule"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Investment CTA (Primary)"
              hint="Shown on the Course Investment list — &#39;Contact Now&#39; button."
            >
              <input
                type="text"
                value={draft.button1_text}
                onChange={(e) => set("button1_text", e.target.value)}
                className={inputCls}
                placeholder="Contact Now"
              />
            </Field>
            <Field
              label="Investment CTA (Secondary)"
              hint="Shown on the Course Investment list — &#39;Group Rate&#39; button."
            >
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
              {saving ? "Saving…" : "Save Course"}
            </button>
          </div>
        </form>

        {/* ── Live Preview ── */}
        <div className="lg:w-72 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Live Preview
          </p>
          <div
            className="scale-[0.85] origin-top-left"
            style={{ width: "118%" }}
          >
            <CourseCard
              title={draft.title || "Course Title"}
              groupPrice={draft.group_price || "$0"}
              groupPriceNote={draft.group_price_note || ""}
              privatePrice={draft.private_price || undefined}
              privatePriceNote={draft.private_price_note || undefined}
              features={
                previewFeatures.length > 0
                  ? previewFeatures
                  : ["Feature 1", "Feature 2"]
              }
              description={
                draft.description || "Course description will appear here."
              }
              buttonText={draft.button_text || "Book Now"}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function CoursesManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const categoryOptions =
    dbCategories.length > 0
      ? dbCategories.map((c: any) => c.name)
      : FALLBACK_CATEGORY_OPTIONS;

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

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("CourseCategory")
      .select("*")
      .eq("switch", 1)
      .order("order", { ascending: true });
    setDbCategories(data ?? []);
  };

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const [editItem, setEditItem] = useState<{
    id: string;
    draft: CourseDraft;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [flash, setFlash] = useState("");
  const [flashType, setFlashType] = useState<"success" | "error">("success");

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(""), 3500);
  };

  const maxOrder = courses ? Math.max(...courses.map((c) => c.order), 0) : 0;

  // Smart reorder: when a card moves to a new position, shift all items in between by ±1.
  const reorderCourses = async (
    movedId: string,
    oldOrder: number,
    newOrder: number,
    draft: CourseDraft,
  ) => {
    if (oldOrder === newOrder) {
      const { error } = await supabase
        .from("Course")
        .update(draft)
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
      .update(draft)
      .eq("id", movedId);
    if (error) throw new Error(error.message);
  };

  const handleCreate = async (draft: CourseDraft) => {
    try {
      setSaving(true);
      const { error } = await supabase.from("Course").insert(draft);
      if (error) throw new Error(error.message);
      setCreating(false);
      showFlash("Course created successfully.");
      await fetchCourses();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to create course.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (draft: CourseDraft) => {
    if (!editItem) return;
    try {
      setSaving(true);
      await reorderCourses(
        editItem.id,
        editItem.draft.order,
        draft.order,
        draft,
      );
      setEditItem(null);
      showFlash("Course updated.");
      await fetchCourses();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update course.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Course")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("Course deleted.");
      await fetchCourses();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete course.", "error");
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

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Courses</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage training course listings
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
            Add Course
          </button>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        {/* Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading courses…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load courses.
            </div>
          )}
          {!isPending && !fetchError && (!courses || courses.length === 0) && (
            <div className="px-6 py-12 text-center text-slate-400">
              No courses yet. Add one above.
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
                    <th className="text-left px-4 py-3 font-medium">Title</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Group Price
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Private Price
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Visible</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="hover:bg-slate-700/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs w-5 text-center">
                            {course.order}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() =>
                                handleOrderChange(course.id, course.order - 1)
                              }
                              disabled={course.order <= 0 || saving}
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
                                handleOrderChange(course.id, course.order + 1)
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
                        <span className="text-white font-medium">
                          {course.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {(() => {
                          const isStale =
                            categoryOptions.length > 0 &&
                            !categoryOptions.includes(course.category);
                          return (
                            <span
                              title={
                                isStale
                                  ? `"${course.category}" is no longer a valid category — edit this course to update it`
                                  : undefined
                              }
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                isStale
                                  ? "bg-orange-900/40 text-orange-300 border-orange-700/60"
                                  : "bg-slate-700 text-slate-400 border-slate-600"
                              }`}
                            >
                              {course.category}
                              {isStale && (
                                <span
                                  className="ml-1 text-orange-400"
                                  title="Stale category"
                                >
                                  ⚠
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-slate-300 hidden md:table-cell">
                        {course.group_price}
                        {course.group_price_note && (
                          <span className="text-slate-500 text-xs ml-1">
                            {course.group_price_note}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 hidden md:table-cell">
                        {course.private_price ? (
                          <>
                            {course.private_price}
                            {course.private_price_note && (
                              <span className="text-slate-500 text-xs ml-1">
                                {course.private_price_note}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-600 text-xs italic">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(course.id, course.switch)}
                          disabled={saving}
                          className="focus:outline-none"
                          title="Toggle visibility"
                        >
                          <StatusBadge on={course.switch === 1} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setEditItem({
                                id: course.id,
                                draft: {
                                  switch: course.switch,
                                  order: course.order,
                                  title: course.title,
                                  category: resolveCategoryValue(
                                    course.category,
                                    categoryOptions,
                                  ),
                                  group_price: course.group_price ?? "",
                                  group_price_note:
                                    course.group_price_note ?? "",
                                  private_price: course.private_price ?? "",
                                  private_price_note:
                                    course.private_price_note ?? "",
                                  duration: course.duration ?? "",
                                  description: course.description,
                                  features: course.features,
                                  button_text:
                                    course.button_text ??
                                    "Contact Us Now To Schedule",
                                  button1_text:
                                    course.button1_text ?? "Contact Now",
                                  button2_text:
                                    course.button2_text ?? "Group Rate",
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
                                id: course.id,
                                title: course.title,
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

      {/* Create modal */}
      {creating && (
        <CourseEditModal
          title="Add New Course"
          initial={blankDraft(maxOrder)}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
          saving={saving}
          categoryOptions={categoryOptions}
        />
      )}

      {/* Edit modal */}
      {editItem && (
        <CourseEditModal
          title="Edit Course"
          initial={editItem.draft}
          onClose={() => setEditItem(null)}
          onSave={handleUpdate}
          saving={saving}
          categoryOptions={categoryOptions}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={saving}
        />
      )}
    </AdminShell>
  );
}

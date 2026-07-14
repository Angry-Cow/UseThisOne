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
  DeleteConfirmModal,
} from "@/pages/admin/components/AdminUI";

type CategoryDraft = {
  switch: number;
  order: number;
  name: string;
};

function blankDraft(maxOrder = 0): CategoryDraft {
  return { switch: 1, order: maxOrder + 1, name: "" };
}

type EditModalProps = {
  initial: CategoryDraft;
  title: string;
  onClose: () => void;
  onSave: (draft: CategoryDraft) => Promise<void>;
  saving: boolean;
};

function CategoryEditModal({
  initial,
  title,
  onClose,
  onSave,
  saving,
}: EditModalProps) {
  const [draft, setDraft] = useState<CategoryDraft>(initial);
  const [err, setErr] = useState("");

  const set = <K extends keyof CategoryDraft>(k: K, v: CategoryDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.name.trim()) {
      setErr("Category name is required.");
      return;
    }
    try {
      await onSave(draft);
    } catch {
      setErr("Failed to save. Please try again.");
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center justify-between gap-4 bg-slate-700/40 rounded-lg px-4 py-3 border border-slate-600/60">
          <Toggle
            value={draft.switch}
            onChange={(v) => set("switch", v)}
            label="Visible"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Order:</span>
            <OrderInput value={draft.order} onChange={(v) => set("order", v)} />
          </div>
        </div>

        <Field
          label="Category Name"
          hint="Shown as a filter tab on the Courses section of the site."
        >
          <input
            type="text"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls}
            placeholder="e.g. Personal Defense"
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
            {saving ? "Saving…" : "Save Category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("CourseCategory")
      .select("*")
      .order("order", { ascending: true });
    if (error) {
      setFetchError(true);
    } else {
      setCategories(data ?? []);
    }
    setIsPending(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const [editItem, setEditItem] = useState<{
    id: string;
    draft: CategoryDraft;
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

  const maxOrder = categories
    ? Math.max(...categories.map((c) => c.order), 0)
    : 0;

  const handleCreate = async (draft: CategoryDraft) => {
    try {
      setSaving(true);
      const { error } = await supabase.from("CourseCategory").insert(draft);
      if (error) throw new Error(error.message);
      setCreating(false);
      showFlash("Category created.");
      await fetchCategories();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to create category.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (draft: CategoryDraft) => {
    if (!editItem) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("CourseCategory")
        .update(draft)
        .eq("id", editItem.id);
      if (error) throw new Error(error.message);
      setEditItem(null);
      showFlash("Category updated.");
      await fetchCategories();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update category.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("CourseCategory")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("Category deleted.");
      await fetchCategories();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete category.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("CourseCategory")
        .update({ switch: current === 1 ? 0 : 1 })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchCategories();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update visibility.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOrderChange = async (id: string, newOrder: number) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    try {
      setSaving(true);
      const displaced = categories.find(
        (c) => c.id !== id && c.order === newOrder,
      );
      if (displaced) {
        const { error: e1 } = await supabase
          .from("CourseCategory")
          .update({ order: target.order })
          .eq("id", displaced.id);
        if (e1) throw new Error(e1.message);
      }
      const { error: e2 } = await supabase
        .from("CourseCategory")
        .update({ order: newOrder })
        .eq("id", id);
      if (e2) throw new Error(e2.message);
      await fetchCategories();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to reorder.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Course Categories</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage the filter tabs shown on the Courses section. Categories
              are also available in the Course editor.
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
            Add Category
          </button>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading categories…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load categories.
            </div>
          )}
          {!isPending &&
            !fetchError &&
            (!categories || categories.length === 0) && (
              <div className="px-6 py-12 text-center text-slate-400">
                No categories yet. Add one above.
              </div>
            )}
          {!isPending && !fetchError && categories && categories.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium w-10">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Visible</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                      Created
                    </th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-700/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs w-5 text-center">
                            {cat.order}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() =>
                                handleOrderChange(cat.id, cat.order - 1)
                              }
                              disabled={cat.order <= 0 || saving}
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
                                handleOrderChange(cat.id, cat.order + 1)
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
                          {cat.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(cat.id, cat.switch)}
                          disabled={saving}
                          className="focus:outline-none"
                          title="Toggle visibility"
                        >
                          <StatusBadge on={cat.switch === 1} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                        {new Date(cat.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setEditItem({
                                id: cat.id,
                                draft: {
                                  switch: cat.switch,
                                  order: cat.order,
                                  name: cat.name,
                                },
                              })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({ id: cat.id, name: cat.name })
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
        <CategoryEditModal
          title="Add Category"
          initial={blankDraft(maxOrder)}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {editItem && (
        <CategoryEditModal
          title="Edit Category"
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

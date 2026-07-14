import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  Modal,
  Field,
  inputCls,
  textareaCls,
  Toggle,
  ChipInput,
  OrderInput,
  StatusBadge,
  FlashBanner,
  DeleteConfirmModal,
} from "@/pages/admin/components/AdminUI";
import { AssetPickerField } from "@/pages/admin/components/AssetPicker";
import { ServiceCard } from "@/sections/ServicesSection/components/ServiceCard";
import { ICON_6, ICON_7, ICON_8, ICON_9, ICON_10 } from "@/assets";

const ASSET_MAP: Record<string, string> = {
  ICON_6,
  ICON_7,
  ICON_8,
  ICON_9,
  ICON_10,
};
const resolveAsset = (token: string) => ASSET_MAP[token] ?? token;

type ServiceDraft = {
  switch: number;
  order: number;
  title: string;
  description: string;
  icon_src: string;
  card_image_src: string;
  card_image_alt: string;
  list_items: string;
};

function blankDraft(maxOrder = 0): ServiceDraft {
  return {
    switch: 1,
    order: maxOrder + 1,
    title: "",
    description: "",
    icon_src: "",
    card_image_src: "",
    card_image_alt: "",
    list_items: "",
  };
}

function parseListItems(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p.map(String);
  } catch {
    /* not json */
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeListItems(chips: string[]): string {
  return chips.join(",");
}

type EditModalProps = {
  title: string;
  initial: ServiceDraft;
  onClose: () => void;
  onSave: (draft: ServiceDraft) => Promise<void>;
  saving: boolean;
};

function ServiceEditModal({
  title,
  initial,
  onClose,
  onSave,
  saving,
}: EditModalProps) {
  const [draft, setDraft] = useState<ServiceDraft>(initial);
  const [chips, setChips] = useState<string[]>(
    parseListItems(initial.list_items),
  );
  const [err, setErr] = useState("");

  const set = <K extends keyof ServiceDraft>(k: K, v: ServiceDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.title.trim()) {
      setErr("Title is required.");
      return;
    }
    try {
      await onSave({ ...draft, list_items: serializeListItems(chips) });
    } catch {
      setErr("Failed to save. Please try again.");
    }
  };

  const previewListItems =
    chips.length > 0 ? chips : ["Item 1", "Item 2", "Item 3"];

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

          <Field label="Service Title">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="e.g. First Aid, CPR & Bleeding Control"
              required
            />
          </Field>

          <Field label="Description">
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className={textareaCls}
              placeholder="Describe this service…"
            />
          </Field>

          <Field
            label="List Items"
            hint="Type an item and press Enter to add it as a tag."
          >
            <ChipInput
              chips={chips}
              onChange={setChips}
              placeholder="Add list item…"
            />
          </Field>

          <AssetPickerField
            label="Card Image"
            value={resolveAsset(draft.card_image_src)}
            onChange={(url) => set("card_image_src", url)}
            defaultFolder="Images"
            modalTitle="Select Card Image"
            showPreview
          />

          <Field label="Card Image Alt Text">
            <input
              type="text"
              value={draft.card_image_alt}
              onChange={(e) => set("card_image_alt", e.target.value)}
              className={inputCls}
              placeholder="Descriptive alt text for the image"
            />
          </Field>

          <AssetPickerField
            label="Icon URL"
            value={draft.icon_src}
            onChange={(url) => set("icon_src", url)}
            defaultFolder="Logos"
            modalTitle="Select Icon"
            hint="URL or asset token for the service icon (e.g. ICON_6)"
          />

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
              {saving ? "Saving…" : "Save Service"}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="lg:w-64 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Live Preview
          </p>
          <div
            className="scale-[0.78] origin-top-left"
            style={{ width: "128%" }}
          >
            <ServiceCard
              iconSrc={resolveAsset(draft.icon_src) || ICON_6}
              title={draft.title || "Service Title"}
              description={draft.description || "Description will appear here."}
              listItems={previewListItems}
              buttonText="Learn More"
              cardImageSrc={
                resolveAsset(draft.card_image_src) ||
                "https://placehold.co/400x240/1e293b/64748b?text=No+Image"
              }
              cardImageAlt={draft.card_image_alt || "Service image"}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function ServicesManager() {
  const [services, setServices] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("Service")
      .select("*")
      .order("order", { ascending: true });
    if (error) {
      setFetchError(true);
    } else {
      setServices(data ?? []);
    }
    setIsPending(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const [editItem, setEditItem] = useState<{
    id: string;
    draft: ServiceDraft;
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

  const maxOrder = services ? Math.max(...services.map((s) => s.order), 0) : 0;

  const handleCreate = async (draft: ServiceDraft) => {
    try {
      setSaving(true);
      const { error } = await supabase.from("Service").insert(draft);
      if (error) throw new Error(error.message);
      setCreating(false);
      showFlash("Service created successfully.");
      await fetchServices();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to create service.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (draft: ServiceDraft) => {
    if (!editItem) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Service")
        .update(draft)
        .eq("id", editItem.id);
      if (error) throw new Error(error.message);
      setEditItem(null);
      showFlash("Service updated.");
      await fetchServices();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update service.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Service")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("Service deleted.");
      await fetchServices();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete service.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Service")
        .update({ switch: current === 1 ? 0 : 1 })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchServices();
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
        .from("Service")
        .update({ order: newOrder })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await fetchServices();
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
            <h2 className="text-xl font-bold text-white">Services</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage service category cards
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
            Add Service
          </button>
        </div>

        <FlashBanner msg={flash} type={flashType} />

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading services…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load services.
            </div>
          )}
          {!isPending &&
            !fetchError &&
            (!services || services.length === 0) && (
              <div className="px-6 py-12 text-center text-slate-400">
                No services yet. Add one above.
              </div>
            )}
          {!isPending && !fetchError && services && services.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium w-10">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                      Image
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Title</th>
                    <th className="text-left px-4 py-3 font-medium">Visible</th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {services.map((svc) => (
                    <tr
                      key={svc.id}
                      className="hover:bg-slate-700/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs w-5 text-center">
                            {svc.order}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() =>
                                handleOrderChange(svc.id, svc.order - 1)
                              }
                              disabled={svc.order <= 0 || saving}
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
                                handleOrderChange(svc.id, svc.order + 1)
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
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
                          {svc.card_image_src ? (
                            <img
                              src={resolveAsset(svc.card_image_src)}
                              alt={svc.card_image_alt}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                              No img
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">
                          {svc.title}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(svc.id, svc.switch)}
                          disabled={saving}
                          className="focus:outline-none"
                        >
                          <StatusBadge on={svc.switch === 1} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setEditItem({
                                id: svc.id,
                                draft: {
                                  switch: svc.switch,
                                  order: svc.order,
                                  title: svc.title,
                                  description: svc.description,
                                  icon_src: svc.icon_src ?? "",
                                  card_image_src: svc.card_image_src ?? "",
                                  card_image_alt: svc.card_image_alt ?? "",
                                  list_items:
                                    typeof svc.list_items === "string"
                                      ? svc.list_items
                                      : "",
                                },
                              })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({ id: svc.id, title: svc.title })
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
        <ServiceEditModal
          title="Add New Service"
          initial={blankDraft(maxOrder)}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {editItem && (
        <ServiceEditModal
          title="Edit Service"
          initial={editItem.draft}
          onClose={() => setEditItem(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}
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

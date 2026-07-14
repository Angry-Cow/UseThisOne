import React, { useEffect, useState, useCallback } from "react";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  Modal,
  Field,
  inputCls,
  textareaCls,
  FlashBanner,
  DeleteConfirmModal,
} from "@/pages/admin/components/AdminUI";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
// Field names match actual Supabase DB column names (snake_case)
type GroupBooking = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  course: string;
  number_of_attendees: string | null;
  training_location: string | null;
  preferred_dates: string | null;
  notes: string | null;
  contacted: string;
  scheduled: string;
  paid?: string;
  completed?: string;
  admin_notes: string | null;
};

type EditForm = {
  full_name: string;
  email: string;
  phone: string;
  course: string;
  number_of_attendees: string;
  training_location: string;
  preferred_dates: string;
  notes: string;
  contacted: string;
  scheduled: string;
  paid: string;
  completed: string;
  admin_notes: string;
};

const emptyForm = (): EditForm => ({
  full_name: "",
  email: "",
  phone: "",
  course: "",
  number_of_attendees: "",
  training_location: "",
  preferred_dates: "",
  notes: "",
  contacted: "no",
  scheduled: "no",
  paid: "no",
  completed: "no",
  admin_notes: "",
});

// ─── Status pill badge ────────────────────────────────────────────────────────
function CrmBadge({ value, label }: { value: string; label: string }) {
  const yes = value === "yes";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        yes
          ? "bg-green-900/40 text-green-300 border-green-700/60"
          : "bg-slate-700 text-slate-400 border-slate-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${yes ? "bg-green-400" : "bg-slate-500"}`}
      />
      {label}: {yes ? "Yes" : "No"}
    </span>
  );
}

// ─── Yes/No toggle pill ───────────────────────────────────────────────────────
function YesNoToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg overflow-hidden border border-slate-600">
      {(["no", "yes"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 text-sm font-medium transition ${
            value === opt
              ? opt === "yes"
                ? "bg-green-700 text-white"
                : "bg-slate-600 text-white"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
          }`}
        >
          {opt === "yes" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GroupBookingsManager() {
  const [records, setRecords] = useState<GroupBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [flash, setFlash] = useState<{
    msg: string;
    type: "success" | "error";
  }>({ msg: "", type: "success" });
  const [tab, setTab] = useState<"all" | "not_contacted" | "not_scheduled">(
    "all",
  );

  // Edit state
  const [editTarget, setEditTarget] = useState<GroupBooking | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<GroupBooking | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showFlash = (msg: string, type: "success" | "error" = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash({ msg: "", type: "success" }), 4000);
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    const { data, error } = await supabase
      .from("BookingGroup")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(error.message);
    } else {
      setRecords((data as GroupBooking[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ── Filtered views ──────────────────────────────────────────────────────────
  const filtered = records.filter((r) => {
    if (tab === "not_contacted") return r.contacted !== "yes";
    if (tab === "not_scheduled") return r.scheduled !== "yes";
    return true;
  });

  const countNotContacted = records.filter((r) => r.contacted !== "yes").length;
  const countNotScheduled = records.filter((r) => r.scheduled !== "yes").length;

  // ── Edit helpers ────────────────────────────────────────────────────────────
  const openEdit = (rec: GroupBooking) => {
    setEditTarget(rec);
    setEditForm({
      full_name: rec.full_name ?? "",
      email: rec.email ?? "",
      phone: rec.phone ?? "",
      course: rec.course ?? "",
      number_of_attendees: rec.number_of_attendees ?? "",
      training_location: rec.training_location ?? "",
      preferred_dates: rec.preferred_dates ?? "",
      notes: rec.notes ?? "",
      contacted: rec.contacted ?? "no",
      scheduled: rec.scheduled ?? "no",
      paid: rec.paid ?? "no",
      completed: rec.completed ?? "no",
      admin_notes: rec.admin_notes ?? "",
    });
  };

  const patchForm = (key: keyof EditForm, value: string) =>
    setEditForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!editTarget) return;
    if (!editForm.full_name.trim() || !editForm.email.trim()) {
      showFlash("Name and email are required.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("BookingGroup")
      .update({
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        course: editForm.course.trim(),
        number_of_attendees: editForm.number_of_attendees.trim() || null,
        training_location: editForm.training_location.trim() || null,
        preferred_dates: editForm.preferred_dates.trim() || null,
        notes: editForm.notes.trim() || null,
        contacted: editForm.contacted,
        scheduled: editForm.scheduled,
        paid: editForm.paid,
        completed: editForm.completed,
        admin_notes: editForm.admin_notes.trim() || null,
      })
      .eq("id", editTarget.id);
    setSaving(false);
    if (error) {
      showFlash("Failed to save: " + error.message, "error");
    } else {
      showFlash("Group request updated successfully.");
      setEditTarget(null);
      fetchRecords();
    }
  };

  // ── Delete helpers ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("BookingGroup")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      showFlash("Failed to delete: " + error.message, "error");
    } else {
      showFlash("Group request deleted.");
      setDeleteTarget(null);
      fetchRecords();
    }
  };

  // ── Date formatting ─────────────────────────────────────────────────────────
  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AdminShell>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">
              Group Rate Requests
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium">
              {records.length} total
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage incoming group training inquiries
          </p>
        </div>
      </div>

      <FlashBanner msg={flash.msg} type={flash.type} />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-slate-800/60 p-1 rounded-xl w-fit border border-slate-700">
        {(
          [
            { key: "all", label: "All", count: records.length },
            {
              key: "not_contacted",
              label: "Not Contacted",
              count: countNotContacted,
            },
            {
              key: "not_scheduled",
              label: "Not Scheduled",
              count: countNotScheduled,
            },
          ] as { key: typeof tab; label: string; count: number }[]
        ).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === key
                ? "bg-amber-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            {label}{" "}
            <span
              className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                tab === key
                  ? "bg-amber-700/60 text-amber-100"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            <svg
              className="w-5 h-5 animate-spin mr-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Loading group requests…
          </div>
        ) : fetchError ? (
          <div className="py-20 text-center text-red-400 text-sm">
            {fetchError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No group requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50 border-b border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">
                    Course
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">
                    Attendees
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">
                    Location
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">
                    Submitted
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden xl:table-cell">
                    Contacted
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden xl:table-cell">
                    Scheduled
                  </th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filtered.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-white font-medium leading-tight">
                        {rec.full_name}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {rec.email}
                      </div>
                      {rec.phone && (
                        <div className="text-slate-500 text-xs">
                          {rec.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 hidden sm:table-cell">
                      {rec.course || (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell">
                      {rec.number_of_attendees || (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 hidden lg:table-cell">
                      {rec.training_location || (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">
                      {fmtDate(rec.created_at)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <CrmBadge value={rec.contacted} label="Contacted" />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <CrmBadge value={rec.scheduled} label="Scheduled" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(rec)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 border border-slate-600 hover:border-amber-700/50 transition"
                        >
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rec)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-red-700/20 text-slate-300 hover:text-red-400 border border-slate-600 hover:border-red-700/50 transition"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
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

      {/* ── Edit Modal ── */}
      {editTarget && (
        <Modal
          title={`Edit Request — ${editTarget.full_name}`}
          onClose={() => setEditTarget(null)}
          wide
        >
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                Customer Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => patchForm("full_name", e.target.value)}
                    className={inputCls}
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => patchForm("email", e.target.value)}
                    className={inputCls}
                    placeholder="email@example.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => patchForm("phone", e.target.value)}
                    className={inputCls}
                    placeholder="(555) 000-0000"
                  />
                </Field>
              </div>
            </div>

            {/* Request Details */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                Request Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Course">
                  <input
                    type="text"
                    value={editForm.course}
                    onChange={(e) => patchForm("course", e.target.value)}
                    className={inputCls}
                    placeholder="Course name"
                  />
                </Field>
                <Field label="Number of Attendees">
                  <input
                    type="text"
                    value={editForm.number_of_attendees}
                    onChange={(e) =>
                      patchForm("number_of_attendees", e.target.value)
                    }
                    className={inputCls}
                    placeholder="e.g. 5-12"
                  />
                </Field>
                <Field label="Training Location">
                  <input
                    type="text"
                    value={editForm.training_location}
                    onChange={(e) =>
                      patchForm("training_location", e.target.value)
                    }
                    className={inputCls}
                    placeholder="e.g. Client Location"
                  />
                </Field>
                <Field label="Preferred Date(s)">
                  <input
                    type="text"
                    value={editForm.preferred_dates}
                    onChange={(e) =>
                      patchForm("preferred_dates", e.target.value)
                    }
                    className={inputCls}
                    placeholder="Free text"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Notes">
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => patchForm("notes", e.target.value)}
                      className={textareaCls}
                      placeholder="Customer notes or special requests…"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Status Tracking */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                Status Tracking
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contacted">
                  <YesNoToggle
                    value={editForm.contacted}
                    onChange={(v) => patchForm("contacted", v)}
                  />
                </Field>
                <Field label="Scheduled">
                  <YesNoToggle
                    value={editForm.scheduled}
                    onChange={(v) => patchForm("scheduled", v)}
                  />
                </Field>
                <Field label="Paid">
                  <YesNoToggle
                    value={editForm.paid}
                    onChange={(v) => patchForm("paid", v)}
                  />
                </Field>
                <Field label="Completed">
                  <YesNoToggle
                    value={editForm.completed}
                    onChange={(v) => patchForm("completed", v)}
                  />
                </Field>
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                Admin Notes
              </h4>
              <Field
                label="Internal Notes"
                hint="Visible to admins only — never shown to the customer."
              >
                <textarea
                  value={editForm.admin_notes}
                  onChange={(e) => patchForm("admin_notes", e.target.value)}
                  className={textareaCls}
                  placeholder="Internal notes about this request…"
                  rows={3}
                />
              </Field>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition border border-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-semibold transition"
              >
                {saving ? "Saving…" : "Save Request"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.full_name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </AdminShell>
  );
}

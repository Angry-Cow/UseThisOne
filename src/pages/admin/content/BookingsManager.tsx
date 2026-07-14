import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/pages/admin/components/AdminShell";
import {
  Modal,
  Field,
  inputCls,
  textareaCls,
  FlashBanner,
  DeleteConfirmModal,
} from "@/pages/admin/components/AdminUI";

// ─── Types ────────────────────────────────────────────────────────────────────

type YesNo = "yes" | "no";

type BookingDraft = {
  switch: number;
  order: number;
  full_name: string;
  email: string;
  phone: string;
  course: string;
  preferred_date: string;
  notes: string;
  number_of_attendees: string;
  training_location: string;
  request_type: string;
  contacted: YesNo;
  scheduled: YesNo;
  paid: YesNo;
  completed: YesNo;
  admin_notes: string;
  created_at: string; //added this
};

function toFormDraft(b: any): BookingDraft {
  return {
    switch: b.switch ?? 1,
    order: b.order ?? 0,
    full_name: b.full_name ?? "",
    email: b.email ?? "",
    phone: b.phone ?? "",
    course: b.course ?? "",
    preferred_date: b.preferred_date ?? "",
    notes: b.notes ?? "",
    number_of_attendees: b.number_of_attendees ?? "",
    training_location: b.training_location ?? "",
    request_type: b.request_type ?? "individual",
    contacted: (b.contacted as YesNo) ?? "no",
    scheduled: (b.scheduled as YesNo) ?? "no",
    paid: (b.paid as YesNo) ?? "no",
    completed: (b.completed as YesNo) ?? "no",
    admin_notes: b.admin_notes ?? "",
  };
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function YesNoPill({ value }: { value: string }) {
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
      {yes ? "Yes" : "No"}
    </span>
  );
}

// ─── Yes/No inline selector ───────────────────────────────────────────────────

function YesNoSelect({
  value,
  onChange,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-slate-600">
      {(["yes", "no"] as YesNo[]).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 px-4 py-2 text-sm font-medium transition capitalize ${
            value === opt
              ? opt === "yes"
                ? "bg-green-700 text-white"
                : "bg-slate-600 text-white"
              : "bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterKey = "all" | "contacted" | "scheduled" | "paid" | "completed";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "contacted", label: "Not Contacted" },
  { key: "scheduled", label: "Not Scheduled" },
  { key: "paid", label: "Not Paid" },
  { key: "completed", label: "Not Completed" },
];

// ─── Edit Modal ───────────────────────────────────────────────────────────────

type EditModalProps = {
  initial: BookingDraft;
  onClose: () => void;
  onSave: (draft: BookingDraft) => Promise<void>;
  saving: boolean;
};

function BookingEditModal({
  initial,
  onClose,
  onSave,
  saving,
}: EditModalProps) {
  const [draft, setDraft] = useState<BookingDraft>(initial);
  const [err, setErr] = useState("");

  const set = <K extends keyof BookingDraft>(k: K, v: BookingDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!draft.full_name.trim()) {
      setErr("Full Name is required.");
      return;
    }
    if (!draft.email.trim()) {
      setErr("Email is required.");
      return;
    }
    try {
      await onSave(draft);
    } catch {
      setErr("Failed to save. Please try again.");
    }
  };

  return (
    <Modal title="Edit Booking" onClose={onClose} wide>
      <form onSubmit={handleSave} className="space-y-5">
        {/* ── Customer Info ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-700">
            Customer Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                type="text"
                value={draft.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={draft.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Phone">
              <input
                type="text"
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputCls}
                placeholder="Optional"
              />
            </Field>
            <Field label="Request Type">
              <select
                value={draft.request_type}
                onChange={(e) => set("request_type", e.target.value)}
                className={inputCls}
              >
                <option value="individual">Individual</option>
                <option value="group">Group</option>
              </select>
            </Field>
          </div>
        </div>

        {/* ── Booking Details ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-700">
            Booking Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Course">
              <input
                type="text"
                value={draft.course}
                onChange={(e) => set("course", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field
              label="Preferred Date"
              hint='Free text, e.g. "any weekend in June"'
            >
              <input
                type="text"
                value={draft.preferred_date}
                onChange={(e) => set("preferred_date", e.target.value)}
                className={inputCls}
                placeholder="e.g. any weekend in June"
              />
            </Field>
            <Field label="Number of Attendees">
              <input
                type="text"
                value={draft.number_of_attendees}
                onChange={(e) => set("number_of_attendees", e.target.value)}
                className={inputCls}
                placeholder="Optional"
              />
            </Field>
            <Field label="Training Location">
              <input
                type="text"
                value={draft.training_location}
                onChange={(e) => set("training_location", e.target.value)}
                className={inputCls}
                placeholder="Optional"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Customer Notes">
              <textarea
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
                className={textareaCls}
                placeholder="Customer&#39;s original notes or requests…"
              />
            </Field>
          </div>
        </div>

        {/* ── Status Tracking ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-700">
            Status Tracking
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contacted">
              <YesNoSelect
                value={draft.contacted}
                onChange={(v) => set("contacted", v)}
              />
            </Field>
            <Field label="Scheduled">
              <YesNoSelect
                value={draft.scheduled}
                onChange={(v) => set("scheduled", v)}
              />
            </Field>
            <Field label="Paid">
              <YesNoSelect
                value={draft.paid}
                onChange={(v) => set("paid", v)}
              />
            </Field>
            <Field label="Completed">
              <YesNoSelect
                value={draft.completed}
                onChange={(v) => set("completed", v)}
              />
            </Field>
          </div>
        </div>

        {/* ── Admin Notes ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-700">
            Admin Notes
          </p>
          <Field
            label="Internal Notes"
            hint="These notes are only visible to admins and are never shown to the customer."
          >
            <textarea
              value={draft.admin_notes}
              onChange={(e) => set("admin_notes", e.target.value)}
              className={textareaCls + " min-h-[100px]"}
              placeholder="Add any internal notes about this booking…"
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
            {saving ? "Saving…" : "Save Booking"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingsManager() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBookings = async () => {
    setIsPending(true);
    setFetchError(false);
    const { data, error } = await supabase
      .from("Booking")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(true);
    } else {
      setBookings(data ?? []);
    }
    setIsPending(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [editItem, setEditItem] = useState<{
    id: string;
    draft: BookingDraft;
  } | null>(null);
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

  const filtered = React.useMemo(() => {
    if (!bookings) return [];
    if (activeFilter === "all") return bookings;
    const key = activeFilter as keyof (typeof bookings)[0];
    return bookings.filter((b) => (b as any)[key] === "no");
  }, [bookings, activeFilter]);

  const handleUpdate = async (draft: BookingDraft) => {
    if (!editItem) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Booking")
        .update({
          full_name: draft.full_name,
          email: draft.email,
          phone: draft.phone,
          course: draft.course,
          preferred_date: draft.preferred_date,
          notes: draft.notes,
          number_of_attendees: draft.number_of_attendees,
          training_location: draft.training_location,
          request_type: draft.request_type,
          contacted: draft.contacted,
          scheduled: draft.scheduled,
          paid: draft.paid,
          completed: draft.completed,
          admin_notes: draft.admin_notes,
        })
        .eq("id", editItem.id);
      if (error) throw new Error(error.message);
      setEditItem(null);
      showFlash("Booking updated.");
      await fetchBookings();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to update booking.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("Booking")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      showFlash("Booking deleted.");
      await fetchBookings();
    } catch (e: any) {
      showFlash(e.message ?? "Failed to delete booking.", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: any) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Bookings</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              View and manage incoming booking requests
            </p>
          </div>
          {bookings.length > 0 && (
            <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
              {bookings.length} total
            </span>
          )}
        </div>

        <FlashBanner msg={flash} type={flashType} />

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                activeFilter === key
                  ? "bg-amber-600/20 text-amber-400 border-amber-700/50"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700"
              }`}
            >
              {label}
              {key !== "all" && bookings.length > 0 && (
                <span className="ml-1.5 text-slate-500">
                  ({bookings.filter((b) => (b as any)[key] === "no").length})
                </span>
              )}
              {key === "all" && bookings.length > 0 && (
                <span className="ml-1.5 text-slate-500">
                  ({bookings.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {isPending && (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading bookings…
            </div>
          )}
          {fetchError && (
            <div className="px-6 py-12 text-center text-red-400">
              Failed to load bookings.
            </div>
          )}
          {!isPending && !fetchError && filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400">
              {activeFilter === "all"
                ? "No bookings yet."
                : "No bookings match this filter."}
            </div>
          )}
          {!isPending && !fetchError && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                      Course
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                      Pref. Date
                    </th>
                    <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">
                      Attendees
                    </th>
                    <th className="text-center px-3 py-3 font-medium">
                      Contacted
                    </th>
                    <th className="text-center px-3 py-3 font-medium">
                      Scheduled
                    </th>
                    <th className="text-center px-3 py-3 font-medium">Paid</th>
                    <th className="text-center px-3 py-3 font-medium">
                      Completed
                    </th>
                    <th className="text-right px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filtered.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-slate-700/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium leading-snug">
                            {booking.full_name}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {booking.email}
                          </p>
                          {booking.request_type === "group" && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-800/40 mt-0.5 inline-block">
                              Group
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-slate-300 text-xs leading-snug line-clamp-2 max-w-[160px] block">
                          {booking.course || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-300 text-xs whitespace-nowrap">
                          {booking.preferred_date
                            ? booking.preferred_date
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-slate-400 text-xs">
                          {booking.number_of_attendees ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <YesNoPill value={booking.contacted} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <YesNoPill value={booking.scheduled} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <YesNoPill value={booking.paid} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <YesNoPill value={booking.completed} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setEditItem({
                                id: booking.id,
                                draft: toFormDraft(booking),
                              })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                id: booking.id,
                                name: booking.full_name,
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

      {/* Edit modal */}
      {editItem && (
        <BookingEditModal
          initial={editItem.draft}
          onClose={() => setEditItem(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
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

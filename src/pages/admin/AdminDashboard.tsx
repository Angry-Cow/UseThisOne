import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminShell from "@/pages/admin/components/AdminShell";
import { supabase } from "@/lib/supabase";

// ─── local types ──────────────────────────────────────────────────────────────
type AdminRecord = {
  id: string;
  fullname: string;
  username: string;
  ismain: number;
  switch: number;
  order: number;
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function EyeIcon({ show }: { show: boolean }) {
  return show ? (
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
        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-7s4.477-7 10-7 10 3.701 10 7a9.956 9.956 0 01-1.875 5.543"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ) : (
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
        d="M3 3l18 18M10.5 10.677A3 3 0 0013.828 14M6.343 6.343A9.956 9.956 0 002 12c0 2.523 4.477 7 10 7a9.956 9.956 0 005.657-1.757M9.878 4.121A9.956 9.956 0 0112 4c5.523 0 10 3.701 10 7a9.956 9.956 0 01-1.343 3.657"
      />
    </svg>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition pr-10 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
        >
          <EyeIcon show={show} />
        </button>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  // Auth guard is now handled entirely by AdminShell (Supabase session check)

  // ── Local data state ──
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    setIsPending(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("Admin")
      .select("*")
      .order("order", { ascending: true });
    if (qErr) setError(qErr.message);
    else if (data) setAdmins(data as AdminRecord[]);
    setIsPending(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // convenience alias keeps the rest of the JSX unchanged
  const mutating = saving;

  // ── Add admin modal state ──
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: "", authEmail: "" });
  const [addError, setAddError] = useState("");

  // ── Reset password modal state ──
  const [resetTarget, setResetTarget] = useState<{
    id: string;
    name: string;
    authUserId: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // ── Delete confirm state ──
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Status messages
  const [globalMsg, setGlobalMsg] = useState("");

  const flashMsg = (msg: string) => {
    setGlobalMsg(msg);
    setTimeout(() => setGlobalMsg(""), 3500);
  };

  // ── Add admin (display-name record only — Auth user must exist in Supabase first) ──
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.fullName.trim() || !addForm.authEmail.trim()) {
      setAddError("Full name and auth email are required.");
      return;
    }
    // Look up the auth_user_id by querying the auth.users view via a known email
    // We store auth_user_id as a nullable field — admin must first be created in Supabase Auth dashboard
    try {
      setSaving(true);
      const maxOrder = admins.length
        ? Math.max(...admins.map((a) => a.order))
        : 0;
      const { error: insErr } = await supabase.from("Admin").insert({
        fullname: addForm.fullName.trim(),
        username: addForm.authEmail.trim(),
        passwordhash: "supabase-auth",
        ismain: 0,
        switch: 1,
        order: maxOrder + 1,
      });
      if (insErr) throw insErr;
      await fetchAdmins();
      setShowAdd(false);
      setAddForm({ fullName: "", authEmail: "" });
      flashMsg(
        "Admin display record created. Remember to also create the matching auth user in the Supabase dashboard.",
      );
    } catch {
      setAddError("Failed to create admin record. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Reset password — updates the currently signed-in user's own password via Supabase Auth ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    if (!newPassword.trim()) {
      setResetError("Password is required.");
      return;
    }
    if (!resetTarget) return;
    try {
      setSaving(true);
      // supabase.auth.updateUser can only update the currently signed-in user.
      // For resetting another admin&#39;s password, use the Supabase dashboard or a service-role edge function.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && session.user.id === resetTarget.authUserId) {
        const { error: pwErr } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        });
        if (pwErr) throw pwErr;
        setResetSuccess("Password updated successfully.");
        setNewPassword("");
        setTimeout(() => {
          setResetTarget(null);
          setResetSuccess("");
        }, 1500);
      } else {
        setResetError(
          "You can only reset your own password here. Use the Supabase dashboard to reset other admins&#39; passwords.",
        );
      }
    } catch (err: any) {
      setResetError(err?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete admin ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const { error: delErr } = await supabase
        .from("Admin")
        .delete()
        .eq("id", deleteTarget.id);
      if (delErr) throw delErr;
      await fetchAdmins();
      setDeleteTarget(null);
      flashMsg("Admin account removed.");
    } catch {
      flashMsg("Failed to remove admin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        {/* Flash message */}
        {globalMsg && (
          <div className="mb-4 flex items-center gap-2 bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm">
            <svg
              className="w-4 h-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {globalMsg}
          </div>
        )}

        {/* Administrators card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
            <div>
              <h2 className="text-white font-semibold text-lg">
                Administrators
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Manage admin accounts
              </p>
            </div>
            <button
              onClick={() => {
                setShowAdd(true);
                setAddError("");
                setAddForm({ fullName: "", username: "", password: "" });
              }}
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
              Add Admin
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isPending ? (
              <div className="px-6 py-10 text-center text-slate-400">
                Loading…
              </div>
            ) : error !== null ? (
              <div className="px-6 py-10 text-center text-red-400">
                Failed to load admins.
              </div>
            ) : !admins?.length ? (
              <div className="px-6 py-10 text-center text-slate-400">
                No admins found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left px-6 py-3 font-medium">
                      Full Name
                    </th>
                    <th className="text-left px-6 py-3 font-medium">
                      Username
                    </th>
                    <th className="text-left px-6 py-3 font-medium hidden sm:table-cell">
                      Role
                    </th>
                    <th className="text-right px-6 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {admins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="hover:bg-slate-700/30 transition"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-700/40 border border-amber-700/60 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                            {(admin.fullname ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <span>{admin.fullname}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono">
                        {admin.username}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        {admin.ismain === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-300 border border-amber-700/50">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Main Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setResetTarget({
                                id: admin.id,
                                name: admin.fullname,
                                authUserId: "",
                              });
                              setNewPassword("");
                              setResetError("");
                              setResetSuccess("");
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition border border-slate-600"
                          >
                            Reset PW
                          </button>
                          {admin.ismain !== 1 && (
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  id: admin.id,
                                  name: admin.fullname,
                                })
                              }
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition border border-red-800/50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Admin Modal ── */}
      {showAdd && (
        <Modal title="Add New Administrator" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg px-4 py-3 text-xs text-amber-300">
              <strong>Before adding here:</strong> create the auth user in your
              Supabase dashboard under Authentication → Users with the email
              below. Then add their display name here to complete the record.
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={addForm.fullName}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, fullName: e.target.value }))
                }
                required
                placeholder="e.g. Jane Smith"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Auth Email
              </label>
              <input
                type="email"
                value={addForm.authEmail}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, authEmail: e.target.value }))
                }
                required
                placeholder="e.g. jane@tolr.admin"
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-mono"
              />
            </div>
            {addError && (
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
                {addError}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition border border-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutating}
                className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-semibold transition"
              >
                {mutating ? "Creating…" : "Create Admin"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Reset Password Modal ── */}
      {resetTarget && (
        <Modal
          title={`Reset Password — ${resetTarget.name}`}
          onClose={() => setResetTarget(null)}
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Generate or type new password"
            />
            {resetError && (
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
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/30 border border-green-800 rounded-lg px-3 py-2">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {resetSuccess}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition border border-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutating}
                className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-semibold transition"
              >
                {mutating ? "Saving…" : "Update Password"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <Modal
          title="Remove Administrator"
          onClose={() => setDeleteTarget(null)}
        >
          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to remove{" "}
            <span className="text-white font-semibold">
              {deleteTarget.name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition border border-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={mutating}
              className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold transition"
            >
              {mutating ? "Removing…" : "Yes, Remove"}
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}

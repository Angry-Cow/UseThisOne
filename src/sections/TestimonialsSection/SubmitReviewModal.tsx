import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ── Supabase Edge Function — email notification ───────────────────────────────
// Fill in both values after completing Step 2 (deploy + secrets):
//   EDGE_FN_URL  → https://<your-project-ref>.supabase.co/functions/v1/send-email
//   SUPABASE_ANON_KEY → Project Settings → API → anon / public key
const EDGE_FN_URL =
  "https://fgfyfxgbsqirdenkwatl.supabase.co/functions/v1/send-email";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZnlmeGdic3FpcmRlbmt3YXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzIwOTQsImV4cCI6MjA5NDAwODA5NH0.BEbcW4ChcnxubhRcrizJhXCpxxxhaMlepQC2ENDn9zA";
type FormState = {
  firstName: string;
  initials: string;
  role: string;
  rating: number;
  comments: string;
};

const INITIAL: FormState = {
  firstName: "",
  initials: "",
  role: "",
  rating: 5,
  comments: "",
};

// ── Colour palettes cycled by submission order so each card looks unique ──────
const AVATAR_COLORS = [
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-green-100 text-green-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800",
  "bg-slate-200 text-slate-800",
];

// ── Star rating input ─────────────────────────────────────────────────────────
function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <svg
              className={`w-8 h-8 transition-colors ${filled ? "text-amber-500" : "text-gray-300"}`}
              fill={filled ? "currentColor" : "none"}
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
        );
      })}
    </div>
  );
}

// ── Modal component ───────────────────────────────────────────────────────────
type Props = { onClose: () => void };

export function SubmitReviewModal({ onClose }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [maxExistingOrder, setMaxExistingOrder] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("Review")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setMaxExistingOrder(data[0].order ?? 0);
      });
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required.";
    if (!form.initials.trim()) errs.initials = "Initials are required.";
    if (!form.comments.trim()) errs.comments = "Please share your experience.";
    if (form.rating < 1) errs.rating = "Please select a rating.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const nextOrder = maxExistingOrder + 1;
      const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
      const color = AVATAR_COLORS[colorIndex];

      if (!supabase) throw new Error("Supabase is not configured.");

      // Write to DB — switch: 0 so it's hidden until approved
      const { error: insertError } = await supabase.from("Review").insert({
        switch: 0,
        order: nextOrder,
        name: form.firstName.trim(),
        role: form.role.trim() || "T.O.L.R. Student",
        text: form.comments.trim(),
        initials: form.initials.trim().toUpperCase().slice(0, 2),
        color,
        rating: form.rating,
      });

      if (insertError) throw new Error(insertError.message);

      // Send email notification via Supabase Edge Function — best-effort, non-blocking
      if (
        EDGE_FN_URL !== "YOUR_EDGE_FUNCTION_URL" &&
        SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
      ) {
        try {
          const now = new Date();
          const dateStr = now.toLocaleString("en-US", {
            timeZone: "America/New_York",
            dateStyle: "full",
            timeStyle: "short",
          });

          const subject = `New T.O.L.R. Review from ${form.firstName.trim()}`;
          const html = `<h2>New Review Submitted</h2>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Name</td><td>${form.firstName.trim()} (${form.initials.trim().toUpperCase().slice(0, 2)})</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Role / Location</td><td>${form.role.trim() || "T.O.L.R. Student"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Rating</td><td>${form.rating} / 5</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Submitted</td><td>${dateStr}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;vertical-align:top">Review</td><td>${form.comments.trim().replace(/\n/g, "<br>")}</td></tr>
</table>
<p style="margin-top:16px;font-size:12px;color:#666">Log in to the admin panel to approve or reject this review.</p>`;
          const text = `New Review from ${form.firstName.trim()} (${form.initials.trim().toUpperCase().slice(0, 2)})\nRole: ${form.role.trim() || "T.O.L.R. Student"}\nRating: ${form.rating}/5\nSubmitted: ${dateStr}\n\n${form.comments.trim()}`;

          // Fire-and-forget — do NOT await so the success screen shows immediately
          fetch(EDGE_FN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ to: "info@tolr.net", subject, html, text }),
          })
            .then((res) =>
              res.text().then((body) => {
                if (!res.ok) {
                  console.warn(
                    "[SubmitReviewModal] Edge Function non-OK:",
                    res.status,
                    body,
                  );
                } else {
                  console.log("[SubmitReviewModal] Email sent:", body);
                }
              }),
            )
            .catch((emailErr) => {
              console.warn(
                "[SubmitReviewModal] Email notification failed:",
                emailErr,
              );
            });
        } catch (emailErr) {
          console.warn(
            "[SubmitReviewModal] Email notification failed (outer catch):",
            emailErr,
          );
        }
      }

      setSubmitted(true);
    } catch (err: unknown) {
      console.error("[SubmitReviewModal] create() failed:", err);
      if (err instanceof Error) {
        console.error("[SubmitReviewModal] Error message:", err.message);
        console.error("[SubmitReviewModal] Error stack:", err.stack);
      } else {
        console.error(
          "[SubmitReviewModal] Non-Error thrown:",
          JSON.stringify(err),
        );
      }
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Overlay backdrop ────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold font-inter text-gray-900">
            Share Your Experience
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
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

        {/* ── Success state ── */}
        {submitted ? (
          <div className="px-8 pb-8 flex flex-col items-center text-center gap-5 py-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-6 py-4 w-full">
              <p className="font-semibold text-base">Review Submitted!</p>
              <p className="text-sm mt-1 text-green-700">
                Thank you for your feedback. Your review will be visible on the
                site after our team reviews it.
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-10 py-3 rounded-full transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form
            onSubmit={handleSubmit}
            noValidate
            className="px-8 pb-8 space-y-5"
          >
            {/* First Name */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                First Name <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="e.g. Maria"
                className={`w-full h-11 border rounded-xl px-4 text-sm outline-none transition-colors ${errors.firstName ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-amber-500 bg-white"}`}
              />
              <p className="text-xs text-gray-400 mt-1">
                First name and last initial only please.
              </p>
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Initials */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                Initials <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={form.initials}
                onChange={(e) =>
                  set("initials", e.target.value.toUpperCase().slice(0, 2))
                }
                maxLength={2}
                placeholder="e.g. MS"
                className={`w-full h-11 border rounded-xl px-4 text-sm outline-none transition-colors uppercase tracking-widest ${errors.initials ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-amber-500 bg-white"}`}
              />
              {errors.initials && (
                <p className="text-red-500 text-xs mt-1">{errors.initials}</p>
              )}
            </div>

            {/* Location or Role */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                Location or Role
              </label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="e.g. South Plainfield, NJ or Course Graduate"
                className="w-full h-11 border border-gray-200 focus:border-amber-500 bg-white rounded-xl px-4 text-sm outline-none transition-colors"
              />
            </div>

            {/* Star Rating */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-2">
                Rating <span className="text-amber-600">*</span>
              </label>
              <StarRatingInput
                value={form.rating}
                onChange={(n) => set("rating", n)}
              />
              {errors.rating && (
                <p className="text-red-500 text-xs mt-1">{errors.rating}</p>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                Comments <span className="text-amber-600">*</span>
              </label>
              <textarea
                value={form.comments}
                onChange={(e) => set("comments", e.target.value)}
                rows={4}
                placeholder="Tell us about your experience with T.O.L.R. training…"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none ${errors.comments ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-amber-500 bg-white"}`}
              />
              {errors.comments && (
                <p className="text-red-500 text-xs mt-1">{errors.comments}</p>
              )}
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 rounded-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Submitting…
                  </span>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const EDGE_FN_URL =
  "https://fgfyfxgbsqirdenkwatl.supabase.co/functions/v1/send-email";
const LLAAMAS_BOOKING_URL =
  "https://gnqbdwswwiiljsafgkwm.supabase.co/functions/v1/course-booking?business_id=0055cb17-80d8-4d64-bc97-471183f18be0";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZnlmeGdic3FpcmRlbmt3YXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzIwOTQsImV4cCI6MjA5NDAwODA5NH0.BEbcW4ChcnxubhRcrizJhXCpxxxhaMlepQC2ENDn9zA";
const ADMIN_EMAIL = "info@tolr.net";

type CourseOption = { value: string; label: string; price?: string };

type GroupFormState = {
  fullName: string;
  email: string;
  phone: string;
  course: string;
  numberOfAttendees: string;
  trainingLocation: string;
  preferred_dates: string;
  notes: string;
};

const INITIAL = (initialCourse: string): GroupFormState => ({
  fullName: "",
  email: "",
  phone: "",
  course: initialCourse || "",
  numberOfAttendees: "",
  trainingLocation: "",
  preferred_dates: "",
  notes: "",
});

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialCourse?: string;
};

export const GroupRateModal = ({ isOpen, onClose, initialCourse }: Props) => {
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("Course")
        .select("title, group_price")
        .eq("switch", 1)
        .order("order", { ascending: true });

      if (error) return;

      if (data && data.length > 0) {
        const options = data.map(
          (c: { title: string; group_price?: string }) => ({
            value: c.title,
            label: c.group_price ? `${c.title} — ${c.group_price}` : c.title,
            price: c.group_price || undefined,
          }),
        );
        setCourseOptions(options);
      }
    };

    fetchCourses();
  }, []);

  const resolvedInitialCourse = initialCourse || "";

  const [form, setForm] = useState<GroupFormState>(
    INITIAL(resolvedInitialCourse),
  );
  const [errors, setErrors] = useState<Partial<GroupFormState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync initialCourse when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL(initialCourse || ""));
      setErrors({});
      setSubmitted(false);
      setSubmitError(null);
    }
  }, [isOpen, initialCourse]);

  // Escape key close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof GroupFormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errs: Partial<GroupFormState> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email.";
    }
    if (!form.course) errs.course = "Please select a course.";
    if (!form.numberOfAttendees)
      errs.numberOfAttendees = "Please select a group size.";
    if (!form.trainingLocation)
      errs.trainingLocation = "Please select a location.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!supabase) {
      setSubmitError("Configuration error. Please call us directly.");
      return;
    }
    setSubmitError(null);
    setIsPending(true);

    try {
      const { error: insertError } = await supabase
        .from("BookingGroup")
        .insert([
          {
            full_name: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            course: form.course,
            number_of_attendees: form.numberOfAttendees || null,
            training_location: form.trainingLocation || null,
            preferred_dates:
              form.preferred_dates.trim() !== ""
                ? form.preferred_dates.trim()
                : null,
            notes: form.notes.trim() || null,
            contacted: "no",
            scheduled: "no",
            paid: "no",
            completed: "no",
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      // Mirror to LLAAMAS course bookings (fire-and-forget)
      const nameParts = form.fullName.trim().split(/\s+/);
      fetch(LLAAMAS_BOOKING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || null,
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          course: form.course,
          unit_cost:
            courseOptions.find((o) => o.value === form.course)?.price ?? null,
          number_of_attendees: form.numberOfAttendees || null,
          training_location: form.trainingLocation || null,
          preferred_dates: form.preferred_dates.trim() || null,
          notes: form.notes.trim() || null,
          booking_type: "group",
          source_form: "tolr-group-rate-modal",
        }),
      }).catch(() => {});

      const timestamp = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
      });

      // Confirmation email to submitter (fire-and-forget)
      fetch(EDGE_FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: form.email.trim(),
          subject: `Group Rate Request Received — ${form.course}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b"><div style="background:#0c4a6e;padding:24px 32px;border-radius:12px 12px 0 0"><h1 style="color:#fff;margin:0;font-size:22px">TOLR — Tools Of Last Resort</h1></div><div style="padding:32px;background:#f8fafc;border-radius:0 0 12px 12px"><h2 style="margin-top:0">Thanks, ${form.fullName.trim()}!</h2><p>We&#39;ve received your group rate request and will get back to you with pricing within 24 hours.</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;width:40%;border-radius:4px">Course</td><td style="padding:8px 12px">${form.course}</td></tr><tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;border-radius:4px">Group Size</td><td style="padding:8px 12px">${form.numberOfAttendees || "—"}</td></tr><tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;border-radius:4px">Location</td><td style="padding:8px 12px">${form.trainingLocation || "—"}</td></tr>${form.preferred_dates.trim() ? `<tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;border-radius:4px">Preferred Date(s)</td><td style="padding:8px 12px">${form.preferred_dates.trim()}</td></tr>` : ""}${form.phone.trim() ? `<tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;border-radius:4px">Phone</td><td style="padding:8px 12px">${form.phone.trim()}</td></tr>` : ""}${form.notes.trim() ? `<tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;border-radius:4px">Notes</td><td style="padding:8px 12px">${form.notes.trim()}</td></tr>` : ""}</table><p style="color:#64748b;font-size:14px">If you have any questions in the meantime, reply to this email or call us directly.</p></div></div>`,
          text: `Hi ${form.fullName.trim()}, we received your group rate request for ${form.course} (${form.numberOfAttendees || "unspecified size"}). We'll be in touch within 24 hours.`,
        }),
      }).catch(() => {});

      // Admin notification email (awaited, failures silent)
      try {
        await fetch(EDGE_FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: ADMIN_EMAIL,
            subject: `New Group Rate Request — ${form.course}`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b"><h2 style="color:#0c4a6e">New Group Rate Request</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;width:40%">Name</td><td style="padding:8px 12px">${form.fullName.trim()}</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Email</td><td style="padding:8px 12px">${form.email.trim()}</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Phone</td><td style="padding:8px 12px">${form.phone.trim() || "—"}</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Course</td><td style="padding:8px 12px">${form.course}</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Attendees</td><td style="padding:8px 12px">${form.numberOfAttendees || "—"}</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Location</td><td style="padding:8px 12px">${form.trainingLocation || "—"}</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Preferred Date(s)</td><td style="padding:8px 12px">${form.preferred_dates.trim() || "—"}</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Notes</td><td style="padding:8px 12px">${form.notes.trim() || "—"}</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Submitted</td><td style="padding:8px 12px">${timestamp} ET</td></tr></table></div>`,
            text: `New group request from ${form.fullName.trim()} (${form.email.trim()}) for ${form.course}, ${form.numberOfAttendees || "unspecified"} attendees. Submitted: ${timestamp} ET`,
          }),
        });
      } catch (_) {}

      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as {
        message?: string;
        code?: string;
        details?: string;
        hint?: string;
      };
      const msg = [
        e.code ? `[${e.code}]` : null,
        e.message || "Unknown error",
        e.details ? `— ${e.details}` : null,
        e.hint ? `(${e.hint})` : null,
      ]
        .filter(Boolean)
        .join(" ");
      setSubmitError(`Submission failed: ${msg}`);
    } finally {
      setIsPending(false);
    }
  };

  const inputClass = (field: keyof GroupFormState) =>
    `text-sm h-12 outline-none w-full border px-4 py-2 rounded-lg transition-colors bg-white ${
      errors[field]
        ? "border-red-400 bg-red-50"
        : "border-gray-200 focus:border-sky-400"
    }`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-start justify-between p-8 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-sky-900 font-inter">
              Group Rate Request
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Fill out this form and we&#39;ll contact you with group pricing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors ml-4 mt-1 shrink-0"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center text-center px-8 pb-10 gap-5 pt-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
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
            <h3 className="text-xl font-bold">Request Received!</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Thank you, <strong>{form.fullName}</strong>! We&#39;ll reach out
              with group pricing for <strong>{form.course}</strong> within 24
              hours.
            </p>
            <button
              onClick={onClose}
              className="bg-sky-900 text-white text-sm font-bold px-8 py-3 rounded-full hover:bg-sky-950 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="px-8 pb-8 pt-2 space-y-4"
          >
            {/* Full Name */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Full Name <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Jane Smith"
                value={form.fullName}
                onChange={handleChange}
                className={inputClass("fullName")}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Email Address <span className="text-amber-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={handleChange}
                className={inputClass("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="(609) 000-0000"
                value={form.phone}
                onChange={handleChange}
                className="text-sm h-12 outline-none w-full border border-gray-200 focus:border-sky-400 bg-white px-4 py-2 rounded-lg transition-colors"
              />
            </div>

            {/* Select Course */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Select Course <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  className={`appearance-none ${inputClass("course")}`}
                >
                  <option value="" disabled>
                    Select a course…
                  </option>
                  {courseOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {errors.course && (
                <p className="text-red-500 text-xs mt-1">{errors.course}</p>
              )}
            </div>

            {/* Number of Attendees */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Number of Attendees <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <select
                  name="numberOfAttendees"
                  value={form.numberOfAttendees}
                  onChange={handleChange}
                  className={`appearance-none ${inputClass("numberOfAttendees")}`}
                >
                  <option value="" disabled>
                    Please Select
                  </option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {errors.numberOfAttendees && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.numberOfAttendees}
                </p>
              )}
            </div>

            {/* Training Location */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Training Location <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <select
                  name="trainingLocation"
                  value={form.trainingLocation}
                  onChange={handleChange}
                  className={`appearance-none ${inputClass("trainingLocation")}`}
                >
                  <option value="" disabled>
                    Please Select
                  </option>
                  <option value="Client Location">Client Location</option>
                  <option value="SASSTAC Location">SASSTAC Location</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {errors.trainingLocation && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.trainingLocation}
                </p>
              )}
            </div>

            {/* Preferred Date */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Preferred Date(s)
              </label>
              <textarea
                name="preferred_dates"
                placeholder="Enter your preferred date(s) or date range"
                value={form.preferred_dates}
                onChange={handleChange}
                className="text-sm outline-none min-h-[80px] resize-none w-full border border-gray-200 focus:border-sky-400 bg-white px-4 py-3 rounded-lg transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                placeholder="Any specific requirements or questions?"
                value={form.notes}
                onChange={handleChange}
                className="text-sm outline-none min-h-[80px] resize-none w-full border border-gray-200 focus:border-sky-400 bg-white px-4 py-3 rounded-lg transition-colors"
              />
            </div>

            {submitError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <svg
                  className="w-5 h-5 mt-0.5 shrink-0 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-sky-900 text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-sky-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? "Sending..." : "Submit Group Request"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 text-sm font-semibold border border-gray-200 px-6 py-3 rounded-full hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

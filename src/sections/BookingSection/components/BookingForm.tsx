import { useState, useEffect, useRef, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { ICON_14 } from "@/assets";

const EDGE_FN_URL =
  "https://fgfyfxgbsqirdenkwatl.supabase.co/functions/v1/send-email";
const LLAAMAS_BOOKING_URL =
  "https://gnqbdwswwiiljsafgkwm.supabase.co/functions/v1/course-booking?business_id=0055cb17-80d8-4d64-bc97-471183f18be0";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZnlmeGdic3FpcmRlbmt3YXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzIwOTQsImV4cCI6MjA5NDAwODA5NH0.BEbcW4ChcnxubhRcrizJhXCpxxxhaMlepQC2ENDn9zA";
const ADMIN_EMAIL = "info@tolr.net";

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  course: string;
  preferred_date: string;
  notes: string;
};

const INITIAL: FormState = {
  full_name: "",
  email: "",
  phone: "",
  course: "",
  preferred_date: "",
  notes: "",
};

type CourseOption = { label: string; value: string; price?: string };

export const BookingForm = () => {
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("Course")
        .select("title, private_price")
        .eq("switch", 1)
        .order("order", { ascending: true });

      if (error) return;

      if (data && data.length > 0) {
        const options = data.map(
          (c: { title: string; private_price?: string }) => ({
            value: c.title,
            label: c.private_price
              ? c.title + " \u2014 " + c.private_price
              : c.title,
            price: c.private_price || undefined,
          }),
        );
        setCourseOptions(options);
      }
    };

    fetchCourses();
  }, []);

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pending course title from selectCourse event — applied once options are available
  const pendingCourse = useRef<string | null>(null);

  // Listen for selectCourse events from CourseCard and CourseInvestmentItem
  useEffect(() => {
    const handler = (e: Event) => {
      const title = (e as CustomEvent).detail;
      if (!title) return;
      const match = courseOptions.find(
        (o) => o.value.toLowerCase() === title.toLowerCase(),
      );
      if (match) {
        setForm((prev) => ({ ...prev, course: match.value }));
        setErrors((prev) => ({ ...prev, course: undefined }));
      } else {
        pendingCourse.current = title;
      }
    };
    window.addEventListener("selectCourse", handler);
    return () => window.removeEventListener("selectCourse", handler);
  }, [courseOptions]);

  // Once courseOptions resolves, apply any pending course title
  useEffect(() => {
    if (!pendingCourse.current || courseOptions.length === 0) return;
    const match = courseOptions.find(
      (o) => o.value.toLowerCase() === pendingCourse.current!.toLowerCase(),
    );
    if (match) {
      setForm((prev) => ({ ...prev, course: match.value }));
      setErrors((prev) => ({ ...prev, course: undefined }));
      pendingCourse.current = null;
    }
  }, [courseOptions]);

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required.";
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email.";
    }
    if (!form.course) errs.course = "Please select a course.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      if (!supabase) throw new Error("Supabase is not configured.");

      const { error: dbError } = await supabase.from("Booking").insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        course: form.course,
        preferred_date:
          form.preferred_date.trim() !== "" ? form.preferred_date.trim() : null,
        notes: form.notes.trim() || null,
        request_type: "private",
        contacted: "no",
        scheduled: "no",
        paid: "no",
        completed: "no",
      });

      if (dbError) {
        const detail = dbError.details ? ` — ${dbError.details}` : "";
        const hint = dbError.hint ? ` (${dbError.hint})` : "";
        throw new Error(`[${dbError.code}] ${dbError.message}${detail}${hint}`);
      }

      // Mirror to LLAAMAS course bookings (fire-and-forget)
      const nameParts = form.full_name.trim().split(/\s+/);
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
          number_of_attendees: "1",
          preferred_dates: form.preferred_date.trim() || null,
          notes: form.notes.trim() || null,
          booking_type: "private",
          source_form: "tolr-booking-form",
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
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          to: form.email.trim(),
          subject: "Booking Request Received \u2014 " + form.course,
          html:
            '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b"><div style="background:#0c4a6e;padding:24px 32px;border-radius:12px 12px 0 0"><h1 style="color:#fff;margin:0;font-size:22px">TOLR \u2014 Tools Of Last Resort</h1></div><div style="padding:32px;background:#f8fafc;border-radius:0 0 12px 12px"><h2 style="margin-top:0">Thanks, ' +
            form.full_name.trim() +
            '!</h2><p>We&#39;ve received your booking request and will get back to you within 24 hours.</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;width:40%;border-radius:4px">Course</td><td style="padding:8px 12px">' +
            form.course +
            "</td></tr>" +
            (form.preferred_date.trim()
              ? '<tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;border-radius:4px">Preferred Date(s)</td><td style="padding:8px 12px">' +
                form.preferred_date.trim() +
                "</td></tr>"
              : "") +
            (form.phone.trim()
              ? '<tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;border-radius:4px">Phone</td><td style="padding:8px 12px">' +
                form.phone.trim() +
                "</td></tr>"
              : "") +
            (form.notes.trim()
              ? '<tr><td style="padding:8px 12px;background:#e0f2fe;font-weight:600;border-radius:4px">Notes</td><td style="padding:8px 12px">' +
                form.notes.trim() +
                "</td></tr>"
              : "") +
            '</table><p style="color:#64748b;font-size:14px">If you have any questions in the meantime, reply to this email or call us directly.</p></div></div>',
          text:
            "Hi " +
            form.full_name.trim() +
            ", we received your booking request for " +
            form.course +
            ". We'll be in touch within 24 hours.",
        }),
      }).catch(() => {});

      // Admin notification email (awaited, failures silent)
      try {
        await fetch(EDGE_FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            to: ADMIN_EMAIL,
            subject: "New Private Booking \u2014 " + form.course,
            html:
              '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b"><h2 style="color:#0c4a6e">New Private Booking Request</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;width:40%">Name</td><td style="padding:8px 12px">' +
              form.full_name.trim() +
              '</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Email</td><td style="padding:8px 12px">' +
              form.email.trim() +
              '</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Phone</td><td style="padding:8px 12px">' +
              (form.phone.trim() || "\u2014") +
              '</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Course</td><td style="padding:8px 12px">' +
              form.course +
              '</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Preferred Date(s)</td><td style="padding:8px 12px">' +
              (form.preferred_date.trim() || "\u2014") +
              '</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Notes</td><td style="padding:8px 12px">' +
              (form.notes.trim() || "\u2014") +
              '</td></tr><tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600">Submitted</td><td style="padding:8px 12px">' +
              timestamp +
              " ET</td></tr></table></div>",
            text:
              "New private booking from " +
              form.full_name.trim() +
              " (" +
              form.email.trim() +
              ") for " +
              form.course +
              ". Submitted: " +
              timestamp +
              " ET",
          }),
        });
      } catch (_) {}

      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(
        msg || "Submission failed. Please try again or call us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL);
    setErrors({});
    setSubmitted(false);
    setSubmitError(null);
  };

  if (submitted) {
    return (
      <div className="text-center py-16 px-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
        <h3 className="text-2xl font-bold mb-3">Request Received!</h3>
        <p className="text-gray-500 mb-8">
          Thank you, {form.full_name}! We&#39;ll reach out within 24 hours to
          confirm your booking for {form.course}.
        </p>
        <button
          onClick={handleReset}
          className="text-white text-sm font-bold bg-sky-900 px-8 py-3 rounded-full hover:bg-sky-950 transition-colors"
        >
          Book Another Course
        </button>
      </div>
    );
  }

  return (
    <div id="booking-form-field">
      <h3 className="text-2xl font-bold mb-2">Book Your Course</h3>
      <p className="text-gray-500 mb-8">
        Fill out the form below and we&#39;ll get back to you within 24 hours.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="gap-x-6 grid grid-cols-1 gap-y-5 md:grid-cols-2">
          {/* Full Name */}
          <div className="md:col-span-1">
            <label className="text-sm font-semibold block leading-5 mb-2">
              Full Name <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              placeholder="John Doe"
              value={form.full_name}
              onChange={handleChange}
              className={`text-sm h-12 leading-5 outline-none w-full border px-4 py-2 rounded-lg transition-colors ${errors.full_name ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-sky-400 bg-white"}`}
            />
            {errors.full_name && (
              <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div className="md:col-span-1">
            <label className="text-sm font-semibold block leading-5 mb-2">
              Email Address <span className="text-amber-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              className={`text-sm h-12 leading-5 outline-none w-full border px-4 py-2 rounded-lg transition-colors ${errors.email ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-sky-400 bg-white"}`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold block leading-5 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="(609) 000-0000"
              value={form.phone}
              onChange={handleChange}
              className="text-sm h-12 leading-5 outline-none w-full border border-gray-200 focus:border-sky-400 bg-white px-4 py-2 rounded-lg transition-colors"
            />
          </div>

          {/* Course Select */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold block leading-5 mb-2">
              Select Course <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <select
                name="course"
                value={form.course}
                onChange={handleChange}
                className={`appearance-none text-sm h-12 outline-none w-full border px-4 py-2 rounded-lg transition-colors bg-white ${errors.course ? "border-red-400" : "border-gray-200 focus:border-sky-400"}`}
              >
                <option value="" disabled>
                  Select a course&hellip;
                </option>
                {courseOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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

          {/* Preferred Date */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold block leading-5 mb-2">
              Preferred Date
            </label>
            <textarea
              name="preferred_date"
              placeholder="Enter your preferred date(s) here"
              value={form.preferred_date}
              onChange={handleChange}
              className="text-sm outline-none min-h-[100px] resize-none w-full border border-gray-200 focus:border-sky-400 bg-white px-4 py-3 rounded-lg transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold block leading-5 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              placeholder="Any specific requirements or questions?"
              value={form.notes}
              onChange={handleChange}
              className="text-sm outline-none min-h-[100px] resize-none w-full border border-gray-200 focus:border-sky-400 bg-white px-4 py-3 rounded-lg transition-colors"
            />
          </div>
        </div>

        {submitError && (
          <div className="mt-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
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

        <div className="flex justify-end border-gray-100 mt-6 pt-6 border-t border-solid gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="text-white text-sm font-bold items-center bg-sky-900 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(11,74,111,0.2)_0px_10px_15px_-3px,rgba(11,74,111,0.2)_0px_4px_6px_-4px] gap-x-2 flex h-10 justify-center leading-5 text-nowrap px-8 py-3 rounded-full hover:bg-sky-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
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
                Sending...
              </span>
            ) : (
              "Request Booking"
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-gray-500 text-sm font-semibold bg-transparent h-10 text-nowrap border border-gray-200 px-8 py-3 rounded-full hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="bg-rose-100 border border-amber-600/10 mt-10 p-8 rounded-3xl">
        <div className="items-center gap-x-3 flex gap-y-3 mb-4">
          <img src={ICON_14} alt="Icon" className="text-amber-600 h-6 w-6" />
          <h4 className="text-xl font-bold leading-7">Safety First Policy</h4>
        </div>
        <p className="text-gray-500 leading-[26px]">
          All training requires strict adherence to safety protocols. We reserve
          the right to remove any participant who compromises the safety of the
          class.
        </p>
      </div>
    </div>
  );
};

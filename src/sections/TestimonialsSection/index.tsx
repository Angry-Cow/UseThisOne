import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SubmitReviewModal } from "./SubmitReviewModal";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

type Testimonial = {
  name: string;
  role: string;
  text: string;
  initials: string;
  color: string;
  rating: number;
};

const StarRow = ({ rating = 5 }: { rating?: number }) => (
  <div className="flex gap-0.5 mb-4">
    {[1, 2, 3, 4, 5].map((n) => (
      <svg
        key={n}
        className={`w-4 h-4 ${n <= rating ? "text-amber-500" : "text-gray-200"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const TestimonialsSection = () => {
  const { ref, visible } = useScrollReveal();
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [textFields, setTextFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("Review")
      .select("name, role, text, initials, color, rating")
      .eq("switch", 1)
      .order("order", { ascending: true })
      .then(({ data }) => {
        if (data) setReviews(data);
      });
    fetchSectionText("testimonials").then(setTextFields);
  }, []);

  const testimonials: Testimonial[] = reviews.map((r) => ({
    name: r.name,
    role: r.role,
    text: r.text,
    initials: r.initials,
    color: r.color,
    rating: r.rating ?? 5,
  }));

  return (
    <section className="bg-white py-24" id="testimonials">
      <div className="max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
        <div
          ref={ref}
          className={`mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <p className="text-sky-900 text-sm font-bold tracking-[2.8px] uppercase mb-4 text-center">
            {kv(textFields, "testimonials_eyebrow", "Student Experiences")}
          </p>
          {/* Title row with "Submit Review" button */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
            <h2 className="text-4xl font-bold font-inter leading-tight md:text-5xl text-center sm:text-left">
              {kv(textFields, "testimonials_heading", "What Our Students Say")}
            </h2>
            <button
              onClick={() => setShowReviewModal(true)}
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-colors shadow-md shadow-amber-600/20 whitespace-nowrap"
            >
              Submit Review
            </button>
          </div>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed text-center mt-4">
            {kv(
              textFields,
              "testimonials_subtext",
              "Real feedback from real people who trained with us. Safety skills change lives — here's proof.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} delay={i * 80} />
          ))}
        </div>
      </div>

      {showReviewModal && (
        <SubmitReviewModal onClose={() => setShowReviewModal(false)} />
      )}
    </section>
  );
};

const TestimonialCard = ({
  testimonial,
  delay,
}: {
  testimonial: Testimonial;
  delay: number;
}) => {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`bg-slate-50 border border-gray-100 rounded-3xl p-8 flex flex-col gap-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <StarRow rating={testimonial.rating} />
      <p
        className="text-gray-700 leading-relaxed flex-grow"
        dangerouslySetInnerHTML={{
          __html: `&#8220;${testimonial.text}&#8221;`,
        }}
      />
      <div className="flex items-center gap-3 mt-2">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${testimonial.color}`}
        >
          {testimonial.initials}
        </div>
        <div>
          <p
            className="font-bold text-sm leading-tight"
            dangerouslySetInnerHTML={{ __html: testimonial.name }}
          />
          <p
            className="text-gray-400 text-xs"
            dangerouslySetInnerHTML={{ __html: testimonial.role }}
          />
        </div>
      </div>
    </div>
  );
};

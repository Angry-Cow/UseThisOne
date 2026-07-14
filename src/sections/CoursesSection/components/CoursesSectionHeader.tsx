import { useState, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

export const CoursesSectionHeader = () => {
  const { ref, visible } = useScrollReveal();
  const [fields, setFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    fetchSectionText("courses").then(setFields);
  }, []);

  const eyebrow = kv(fields, "courses_eyebrow", "Course Catalog");
  const heading = kv(fields, "courses_heading", "Find the Right Course");
  const subtext = kv(
    fields,
    "courses_subtext",
    "From first aid to firearms — explore all available training programs and select the one that fits your needs.",
  );

  return (
    <div
      ref={ref}
      className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <p className="text-sky-900 text-sm font-bold tracking-[2.8px] uppercase mb-4">
        {eyebrow}
      </p>
      <h2 className="text-4xl font-bold font-inter leading-tight mb-4 md:text-5xl">
        {heading}
      </h2>
      <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
        {subtext}
      </p>
    </div>
  );
};

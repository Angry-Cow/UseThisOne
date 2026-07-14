import { useState, useEffect } from "react";
import { CourseInvestmentList } from "@/sections/BookingSection/components/CourseInvestmentList";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

export const CourseInvestment = () => {
  const [fields, setFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    fetchSectionText("investment").then(setFields);
  }, []);

  const eyebrow = kv(fields, "investment_eyebrow", "Course Investment");
  const heading = kv(
    fields,
    "investment_heading",
    "Ready to Start Your Training?",
  );
  const alertText = kv(fields, "investment_alert_text", "");

  return (
    <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
      <h2 className="text-sky-900 text-sm font-bold box-border caret-transparent tracking-[2.8px] leading-5 uppercase mb-4">
        {eyebrow}
      </h2>
      <p className="text-4xl font-bold box-border caret-transparent leading-10 mb-4 font-inter">
        {heading}
      </p>
      {alertText && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3 mb-6 leading-relaxed">
          {alertText}
        </div>
      )}
      <CourseInvestmentList />
    </div>
  );
};

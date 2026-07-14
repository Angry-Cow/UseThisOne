import { useState, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

export const ServicesSectionHeader = () => {
  const { ref, visible } = useScrollReveal();
  const [fields, setFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    fetchSectionText("services").then(setFields);
  }, []);

  const eyebrow = kv(fields, "services_eyebrow", "Our Expertise");
  const heading = kv(
    fields,
    "services_heading",
    "Comprehensive Firearms Training",
  );
  const subtext = kv(
    fields,
    "services_subtext",
    "If you are new to firearms, or just considering if it is for you - T.O.L.R.™ will work with you from the beginning to see if it fits you. If it does, we help build you into a Safe, Confident, and Effective Defender of yourself and your family.\n\nIf you are not new, but maybe returning or reconsidering firearms as a tool of last resort, T.O.L.R.™ will work to bring you back up to speed with the skills and information you need.",
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
      <p className="text-gray-500 text-lg max-w-3xl mx-auto leading-relaxed whitespace-pre-line">
        {subtext}
      </p>
    </div>
  );
};

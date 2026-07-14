import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";
import { WhyUsFeature } from "@/sections/WhyUsSection/components/WhyUsFeature";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

const FALLBACK_REASONS = [
  {
    id: "f1",
    headline: "Safety-First Priorities",
    message:
      "All training begins and ends with safety. Your competence and effectiveness with lifesaving skills or situational awareness relies on that.",
  },
  {
    id: "f2",
    headline: "Small Classes & Hands-on Practice",
    message:
      "Personalized instruction ensures you master every skill through practical application.",
  },
  {
    id: "f3",
    headline: "Certified & NJ-Compliant Permit To Carry Program",
    message:
      "Our NJ PTC (permit to carry) instructors are NRA certified and our curriculum meets all NJ state requirements.",
  },
  {
    id: "f4",
    headline: "Training at YOUR Office, Home or Facility",
    message:
      "In nearly all cases we can bring the training to you or your group, with the exception of actual range time. That needs to happen on a range.",
  },
];

export const WhyUsContent = () => {
  const [reasons, setReasons] = useState<
    { id: string; headline: string; message: string }[] | null
  >(null);
  const [textFields, setTextFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("WhyUsReason")
      .select("id, headline, message")
      .eq("switch", 1)
      .order("order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setReasons(data);
      });
    fetchSectionText("whyus").then(setTextFields);
  }, []);

  const items = reasons && reasons.length > 0 ? reasons : FALLBACK_REASONS;
  const eyebrow = kv(textFields, "whyus_eyebrow", "The Difference");
  const heading = kv(textFields, "whyus_heading", "Why Choose T.O.L.R.™?");

  return (
    <div className="box-border caret-transparent min-h-[auto] min-w-[auto] w-auto md:w-6/12">
      <h2 className="text-sky-900 text-sm font-bold box-border caret-transparent tracking-[2.8px] leading-5 uppercase mb-4">
        {eyebrow}
      </h2>
      <p className="text-4xl font-bold box-border caret-transparent leading-10 mb-8 font-inter">
        {heading}
      </p>
      <div className="box-border caret-transparent">
        {items.map((item, idx) => (
          <WhyUsFeature
            key={item.id}
            title={item.headline}
            description={item.message}
            className={idx > 0 ? "mt-8" : undefined}
          />
        ))}
      </div>
    </div>
  );
};

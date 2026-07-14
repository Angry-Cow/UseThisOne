import { useState, useEffect } from "react";
import { CTA_BG_URL } from "@/assets";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

export const CtaSection = () => {
  const [fields, setFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    fetchSectionText("cta").then(setFields);
  }, []);

  const heading = kv(
    fields,
    "cta_heading",
    "Empower Yourself with Life‑Saving Skills Today.",
  );
  const subtext = kv(
    fields,
    "cta_subtext",
    "Don't wait for an emergency to realize you're unprepared. Join our next training session and gain the confidence to protect yourself and others.",
  );
  const btnText = kv(fields, "cta_button_text", "Book Your Course Now");
  const btnHref = kv(fields, "cta_button_target", "#booking-form");

  const handleClick = () => {
    const id = btnHref.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (btnHref.startsWith("http")) window.open(btnHref, "_blank");
  };

  return (
    <section className="relative box-border caret-transparent overflow-hidden py-32">
      <div className="absolute box-border caret-transparent z-0 inset-0">
        <img
          src={CTA_BG_URL}
          alt="Medical Gear"
          className="box-border caret-transparent h-full max-w-full object-cover w-full"
        />
        <div className="absolute bg-sky-900/90 box-border caret-transparent inset-0"></div>
      </div>
      <div className="relative box-border caret-transparent max-w-none text-center w-full z-10 mx-auto px-6 md:max-w-screen-xl">
        <h2 className="text-white text-4xl font-bold box-border caret-transparent leading-10 max-w-4xl mb-8 mx-auto font-inter md:text-6xl md:leading-[60px]">
          {heading}
        </h2>
        <p className="text-white/70 text-xl box-border caret-transparent leading-7 max-w-2xl mb-12 mx-auto">
          {subtext}
        </p>
        <button
          onClick={handleClick}
          className="text-white text-xl font-bold bg-amber-600 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(217,130,43,0.4)_0px_25px_50px_-12px] leading-7 px-12 py-5 rounded-full hover:bg-amber-600/90 transition-colors"
        >
          {btnText}
        </button>
      </div>
    </section>
  );
};

import { useState, useEffect } from "react";
import { ICON_3, ICON_4 } from "@/assets";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

export const HeroContent = () => {
  const [fields, setFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    fetchSectionText("hero").then(setFields);
  }, []);

  const badgeText = kv(
    fields,
    "hero_badge_text",
    "Training at YOUR Office, Home or Facility",
  );
  const badgeHighlight = kv(fields, "hero_badge_highlight", "YOUR");
  const headline1 = kv(fields, "hero_h1_line1", "Be Aware.");
  const headline2 = kv(fields, "hero_h1_line2", "Be Benchmarked.");
  const headline3 = kv(fields, "hero_h1_line3", "Be Committed.");
  const paragraph = kv(
    fields,
    "hero_paragraph",
    'T.O.L.R.™ = Tools Of Last Resort: T.O.L.R.™ are firearms. When nothing else will work - When we are presented with deadly force - When it is either you, your family, or the "bad guy". T.O.L.R.™ will prepare you to act confidently.',
  );
  const btn1Text = kv(fields, "hero_btn1_text", "Book a Course");
  const btn1Href = kv(fields, "hero_btn1_target", "#booking-form");
  const btn2Text = kv(fields, "hero_btn2_text", "View Courses");
  const btn2Href = kv(fields, "hero_btn2_target", "#courses");

  const handleClick = (href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (href.startsWith("http")) window.open(href, "_blank");
  };

  // Build badge text: replace the highlight word with a colored span
  const renderBadge = () => {
    if (!badgeHighlight || !badgeText.includes(badgeHighlight)) {
      return (
        <span className="text-white text-sm font-bold box-border caret-transparent block tracking-[0.6px] leading-4 min-h-[auto] min-w-[auto] uppercase">
          {badgeText}
        </span>
      );
    }
    const [before, after] = badgeText.split(badgeHighlight);
    return (
      <span className="text-white text-sm font-bold box-border caret-transparent block tracking-[0.6px] leading-4 min-h-[auto] min-w-[auto] uppercase">
        {before}
        <span className="text-amber-400">{badgeHighlight}</span>
        {after}
      </span>
    );
  };

  return (
    <div className="box-border caret-transparent max-w-screen-md">
      {/* Badge */}
      <div className="items-center backdrop-blur-md bg-sky-900 box-border caret-transparent gap-x-2 inline-flex gap-y-2 border mb-6 px-4 py-2 rounded-full border-solid border-sky-700">
        <div className="text-amber-600 box-border caret-transparent flex min-h-[auto] min-w-[auto]">
          {[0, 1, 2, 3, 4].map((i) => (
            <img
              key={i}
              src={ICON_3}
              alt="Star"
              className="box-border caret-transparent h-3.5 w-3.5"
            />
          ))}
        </div>
        {renderBadge()}
      </div>

      {/* Headlines */}
      <h1 className="text-white text-2xl font-bold box-border caret-transparent leading-[26.4px] mb-6 font-inter md:text-3xl md:leading-9">
        <span className="text-2xl box-border caret-transparent leading-[26.4px] md:text-3xl md:leading-9">
          {headline1}
        </span>
        <br />
        <span className="text-orange-300 text-2xl box-border caret-transparent leading-[26.4px] md:text-3xl md:leading-9">
          {headline2}
        </span>
        <br />
        <span className="text-amber-600 text-2xl box-border caret-transparent leading-[26.4px] md:text-3xl md:leading-9">
          {headline3}
        </span>
      </h1>

      {/* Paragraph */}
      <p className="text-white/90 text-xl box-border caret-transparent leading-[32.5px] max-w-2xl mb-10 font-roboto">
        {paragraph}
      </p>

      {/* Buttons */}
      <div className="box-border caret-transparent gap-x-4 flex flex-col gap-y-4 md:flex-row">
        <button
          onClick={() => handleClick(btn1Href)}
          className="text-white text-lg font-bold items-center bg-amber-600 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(217,130,43,0.3)_0px_20px_25px_-5px,rgba(217,130,43,0.3)_0px_8px_10px_-6px] caret-transparent gap-x-2 flex justify-center leading-7 min-h-[auto] min-w-[auto] gap-y-2 text-center px-10 py-4 rounded-full hover:bg-amber-600/90 transition-colors"
        >
          <span className="box-border caret-transparent block min-h-[auto] min-w-[auto]">
            {btn1Text}
          </span>
          <img
            src={ICON_4}
            alt="Icon"
            className="box-border caret-transparent h-5 w-5"
          />
        </button>
        <button
          onClick={() => handleClick(btn2Href)}
          className="text-white text-lg font-bold backdrop-blur-md bg-white/10 box-border caret-transparent leading-7 min-h-[auto] min-w-[auto] text-center border px-10 py-4 rounded-full border-solid border-white/30 hover:bg-white/20 transition-colors"
        >
          <span className="box-border caret-transparent">{btn2Text}</span>
        </button>
      </div>
    </div>
  );
};

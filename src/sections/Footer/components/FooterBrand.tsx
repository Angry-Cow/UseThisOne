import { useState, useEffect } from "react";
import { LOGO_URL } from "@/assets";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

export const FooterBrand = () => {
  const [fields, setFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    fetchSectionText("footer").then(setFields);
  }, []);

  const brandName = kv(fields, "footer_brand_name", "T.O.L.R.™");
  const brandTagline = kv(
    fields,
    "footer_brand_tagline",
    "Tools Of Last Resort",
  );
  const brandDesc = kv(
    fields,
    "footer_brand_description",
    "Providing personal awareness and defense, NJ CCW, and life-saving medical training in South Plainfield, NJ. Our mission is to empower the community through safety-first instruction.",
  );

  return (
    <div className="box-border caret-transparent col-end-auto col-start-auto min-h-[auto] min-w-[auto] md:col-end-[span_2] md:col-start-[span_2]">
      <div className="items-center box-border caret-transparent gap-x-3 flex gap-y-3 mb-6">
        <img
          src={LOGO_URL}
          alt="TOLR — Tools Of Last Resort"
          className="box-border caret-transparent h-20 max-w-full min-h-[auto] min-w-[auto] object-contain"
        />
        <div className="flex flex-col">
          <span className="text-2xl font-bold leading-tight font-inter tracking-widest text-white">
            {brandName}
          </span>
          <span className="text-sm font-normal text-white/70 leading-snug font-inter">
            {brandTagline}
          </span>
        </div>
      </div>
      <p className="text-white/50 box-border caret-transparent leading-[26px] max-w-md">
        {brandDesc}
      </p>
    </div>
  );
};

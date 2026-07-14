import { useState, useEffect } from "react";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

export const FooterCopyright = () => {
  const [fields, setFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    fetchSectionText("footer").then(setFields);
  }, []);

  const copyright = kv(
    fields,
    "footer_copyright_text",
    `© ${new Date().getFullYear()} Safe and Secure Services. All rights reserved.`,
  );

  return (
    <div className="text-white/40 text-sm items-center box-border caret-transparent gap-x-6 flex flex-col justify-between leading-5 gap-y-6 pt-8 border-t border-solid border-white/10 md:flex-row">
      <p className="box-border caret-transparent min-h-[auto] min-w-[auto]">
        {copyright}
      </p>
    </div>
  );
};

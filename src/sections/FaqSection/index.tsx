import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchSectionText, type SectionTextField } from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

type FaqItemProps = {
  question: string;
  answer: string;
  link?: string;
  linktext?: string;
  index: number;
  id?: string;
};

const FaqItem = ({
  question,
  answer,
  link,
  linktext,
  index,
  id,
}: FaqItemProps) => {
  const [open, setOpen] = useState(false);

  const slug = id ? toSlug(id) : toSlug(question);
  const buttonId = `faq-btn-item-${slug}`;

  const hasLink =
    link && link.trim() !== "" && linktext && linktext.trim() !== "";

  return (
    <div
      className={`border-b border-slate-200 transition-colors duration-200 ${open ? "bg-sky-50/60" : "bg-white hover:bg-slate-50"}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        id={buttonId}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span
          className={`text-base font-semibold leading-snug transition-colors duration-200 ${
            open ? "text-sky-900" : "text-slate-800 group-hover:text-sky-900"
          }`}
        >
          {question}
        </span>
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
            open
              ? "bg-sky-900 rotate-45"
              : "bg-slate-100 group-hover:bg-sky-100"
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-colors duration-300 ${open ? "text-white" : "text-slate-500 group-hover:text-sky-700"}`}
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-6 pb-5">
          <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
          {hasLink && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm font-semibold text-amber-600 hover:text-amber-700 hover:underline underline-offset-2 transition-colors duration-150"
            >
              {linktext}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const FaqSection = () => {
  const { ref, visible } = useScrollReveal();

  const [faqs, setFaqs] = useState<
    {
      id: string;
      question: string;
      answer: string;
      link?: string;
      link_text?: string;
    }[]
  >([]);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState(false);
  const [textFields, setTextFields] = useState<SectionTextField[]>([]);

  useEffect(() => {
    if (!supabase) {
      setIsPending(false);
      return;
    }
    supabase
      .from("Faq")
      .select("id, question, answer, link, link_text")
      .eq("switch", 1)
      .order("order", { ascending: true })
      .then(({ data, error: err }) => {
        if (err) setError(true);
        else setFaqs(data ?? []);
        setIsPending(false);
      });
    fetchSectionText("faq").then(setTextFields);
  }, []);

  return (
    <section id="faq" className="bg-slate-50 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6">
        <div
          ref={ref}
          className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">
            {kv(textFields, "faq_eyebrow", "Got Questions?")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-sky-900 leading-tight mb-4">
            {kv(textFields, "faq_heading", "Frequently Asked Questions")}
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            {kv(
              textFields,
              "faq_intro_text",
              "Everything you need to know before you book. Can't find your answer here?",
            )}{" "}
            <button
              onClick={() => {
                const linkHref = kv(textFields, "faq_link_target", "#contact");
                const id = linkHref.replace("#", "");
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: "smooth" });
                else if (linkHref.startsWith("http"))
                  window.open(linkHref, "_blank");
              }}
              className="text-amber-600 font-semibold hover:underline underline-offset-2"
            >
              {kv(textFields, "faq_link_text", "Reach out directly.")}
            </button>
          </p>
        </div>

        {isPending && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading FAQs…
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-400 text-sm">
            Unable to load FAQs at this time. Please try again later.
          </div>
        )}

        {!isPending && !error && faqs.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            {faqs.map((faq, i) => (
              <FaqItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                link={faq.link}
                linktext={faq.link_text}
                index={i}
                id={faq.id}
              />
            ))}
          </div>
        )}

        {!isPending && !error && faqs.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No FAQs available right now.
          </div>
        )}
      </div>
    </section>
  );
};

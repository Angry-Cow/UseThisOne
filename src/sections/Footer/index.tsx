import { useState, useEffect } from "react";
import { FooterBrand } from "@/sections/Footer/components/FooterBrand";
import { FooterLinks } from "@/sections/Footer/components/FooterLinks";
import { FooterCopyright } from "@/sections/Footer/components/FooterCopyright";
import { LegalModal } from "@/components/LegalModal";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";
import { TermsOfServiceContent } from "@/components/TermsOfServiceContent";
import { AccessibilityContent } from "@/components/AccessibilityContent";
import {
  fetchSiteSettings,
  fetchSectionText,
  fetchUsefulLinks,
  type NavItem,
  type SectionTextField,
  type UsefulLink,
} from "@/lib/siteSettings";

const kv = (fields: SectionTextField[], key: string, fallback: string) =>
  fields.find((f) => f.field_key === key)?.value || fallback;

type ModalType = "privacy" | "terms" | "accessibility" | null;

const FALLBACK_QUICK_LINKS: NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Courses", href: "#courses" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

const ContactItem = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <li className="flex items-start gap-3 text-white/60 text-sm leading-relaxed">
    <span className="mt-0.5 shrink-0 text-amber-500">{icon}</span>
    <span>{children}</span>
  </li>
);

export const Footer = () => {
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [quickLinks, setQuickLinks] = useState<NavItem[]>(FALLBACK_QUICK_LINKS);
  const [footerFields, setFooterFields] = useState<SectionTextField[]>([]);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([]);

  useEffect(() => {
    fetchSectionText("footer").then(setFooterFields);
    fetchUsefulLinks().then((rows) =>
      setUsefulLinks(rows.filter((r) => r.switch === 1)),
    );
    fetchSiteSettings().then((s) => {
      if (s.navbar_items?.length) {
        const hasHome = s.navbar_items.some(
          (i) => i.href === "#home" || i.label.toLowerCase() === "home",
        );
        setQuickLinks(
          hasHome
            ? s.navbar_items
            : [{ label: "Home", href: "#home" }, ...s.navbar_items],
        );
      }
    });
  }, []);

  return (
    <>
      <footer className="text-white bg-slate-900 box-border caret-transparent pt-20 pb-0">
        <div className="box-border caret-transparent max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
          {/* ── Top grid ───────────────────────────────────────────── */}
          <div
            className={`box-border caret-transparent gap-x-12 grid grid-cols-1 gap-y-12 mb-16 ${usefulLinks.length > 0 ? "md:grid-cols-5" : "md:grid-cols-4"}`}
          >
            {/* Brand — spans 2 cols when 4-col, 1 col when 5-col */}
            <div
              className={
                usefulLinks.length > 0 ? "md:col-span-1" : "md:col-span-2"
              }
            >
              <FooterBrand />
            </div>
            <FooterLinks
              title="Quick Links"
              links={quickLinks.map((item) => ({
                label: item.label,
                href: item.href,
              }))}
            />
            {usefulLinks.length > 0 && (
              <FooterLinks
                title="Useful"
                links={usefulLinks.map((link) => ({
                  label: link.label,
                  href: link.url,
                }))}
              />
            )}
            <FooterLinks
              title="Legal"
              links={[
                {
                  label: "Privacy Policy",
                  onClick: () => setOpenModal("privacy"),
                },
                {
                  label: "Terms of Service",
                  onClick: () => setOpenModal("terms"),
                },
                {
                  label: "Accessibility",
                  onClick: () => setOpenModal("accessibility"),
                },
              ]}
            />
            <div className="min-h-[auto] min-w-[auto]">
              <h5 className="text-amber-600 font-bold mb-6">Contact Us</h5>
              <ul className="flex flex-col gap-4 list-none pl-0">
                <ContactItem
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  }
                >
                  {kv(
                    footerFields,
                    "footer_contact_address",
                    "South Plainfield, NJ",
                  )}
                </ContactItem>
                <ContactItem
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  }
                >
                  <a
                    href={`tel:+19087584894`}
                    className="hover:text-white transition-colors"
                  >
                    {kv(footerFields, "footer_contact_phone", "(908) 758-4894")}
                  </a>
                </ContactItem>
                <ContactItem
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  }
                >
                  <a
                    href={`mailto:${kv(footerFields, "footer_contact_email", "info@tolr.net")}`}
                    className="hover:text-white transition-colors"
                  >
                    {kv(footerFields, "footer_contact_email", "info@tolr.net")}
                  </a>
                </ContactItem>
                <ContactItem
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                >
                  {kv(
                    footerFields,
                    "footer_contact_hours",
                    "Mon–Sat: 8am – 7pm",
                  )}
                </ContactItem>
              </ul>
            </div>
          </div>

          {/* ── Google Maps embed ──────────────────────────────────── */}
          <div className="mb-0">
            <h5 className="text-amber-600 font-bold mb-4">
              {kv(footerFields, "footer_findus_heading", "Find Us")}
            </h5>
            <div
              className="overflow-hidden rounded-2xl border border-white/10 w-full"
              style={{ height: "280px" }}
            >
              <iframe
                title="Safe and Secure Services location — South Plainfield, NJ"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3030.6783241944!2d-74.41338172347483!3d40.57760897143824!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c3b3e7e3f5dceb%3A0x4b6ff7f3b0e5a3c4!2sSouth%20Plainfield%2C%20NJ!5e0!3m2!1sen!2sus!4v1711379200000!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-white/40 text-xs mt-2 mb-0">
              {kv(
                footerFields,
                "footer_map_caption",
                "Serving South Plainfield, NJ and surrounding communities. In-person and on-location training available.",
              )}
            </p>
          </div>

          <div className="pt-8 pb-8">
            <FooterCopyright />
          </div>
        </div>
      </footer>

      {openModal === "privacy" && (
        <LegalModal title="Privacy Policy" onClose={() => setOpenModal(null)}>
          <PrivacyPolicyContent />
        </LegalModal>
      )}
      {openModal === "terms" && (
        <LegalModal title="Terms of Service" onClose={() => setOpenModal(null)}>
          <TermsOfServiceContent />
        </LegalModal>
      )}
      {openModal === "accessibility" && (
        <LegalModal
          title="Accessibility Statement"
          onClose={() => setOpenModal(null)}
        >
          <AccessibilityContent />
        </LegalModal>
      )}
    </>
  );
};

import { useState, useEffect, useCallback } from "react";
import { NavbarBrand } from "@/sections/Navbar/components/NavbarBrand";
import { NavbarLinks } from "@/sections/Navbar/components/NavbarLinks";
import { NavbarMobileButton } from "@/sections/Navbar/components/NavbarMobileButton";
import {
  fetchSiteSettings,
  SITE_SETTINGS_DEFAULTS,
  type NavItem,
} from "@/lib/siteSettings";

const FALLBACK_NAV_ITEMS: NavItem[] = [
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#why-us" },
  { label: "Courses", href: "#courses" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [navItems, setNavItems] = useState<NavItem[]>(FALLBACK_NAV_ITEMS);
  const [ctaText, setCtaText] = useState("Book Now");
  const [ctaHref, setCtaHref] = useState("#contact");
  const [mobileCta, setMobileCta] = useState("Book a Course");

  const [siteName, setSiteName] = useState("T.O.L.R.");
  const [siteTagline, setSiteTagline] = useState("Tools Of Last Resort");

  // Load dynamic settings once on mount
  useEffect(() => {
    fetchSiteSettings().then((s) => {
      if (s.navbar_items?.length) setNavItems(s.navbar_items);
      if (s.navbar_cta_text) setCtaText(s.navbar_cta_text);
      if (s.navbar_cta_href) setCtaHref(s.navbar_cta_href);
      if (s.navbar_mobile_cta_text) setMobileCta(s.navbar_mobile_cta_text);
      if (s.site_name) setSiteName(s.site_name);
      if (s.site_tagline) setSiteTagline(s.site_tagline);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const onIntersect =
      (id: string) => (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting) setActiveSection(id);
      };

    const SECTION_IDS = navItems.map((item) => item.href.replace("#", ""));
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(onIntersect(id), {
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      });
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [navItems]);

  const handleNavClick = useCallback((href: string) => {
    setMenuOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 top-0 transition-shadow duration-300 border-b-[5px] border-sky-700 ${
        scrolled
          ? "bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.1)_0px_4px_6px_-1px]"
          : "bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.05)_0px_1px_2px_0px]"
      }`}
    >
      <div className="items-center box-border caret-transparent flex justify-between max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
        <div className="flex items-center gap-4">
          <NavbarBrand />
          <div className="hidden sm:flex flex-col justify-center leading-snug">
            <span className="text-amber-600 font-bold text-3xl md:text-4xl tracking-wide">
              {siteName}
            </span>
            <span className="text-amber-600 font-semibold text-sm md:text-base tracking-widest uppercase">
              {siteTagline}
            </span>
          </div>
        </div>
        <NavbarLinks
          items={navItems}
          ctaText={ctaText}
          ctaHref={ctaHref}
          onNavClick={handleNavClick}
          activeSection={activeSection}
        />
        <NavbarMobileButton
          open={menuOpen}
          onToggle={() => setMenuOpen((o) => !o)}
        />
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-gray-100 ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-4">
          {navItems.map((item) => {
            const isActive = activeSection === item.href.replace("#", "");
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`text-sm font-semibold text-left transition-colors py-1 ${
                  isActive
                    ? "text-amber-600"
                    : "text-gray-800 hover:text-amber-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => handleNavClick(ctaHref)}
            className="text-white text-sm font-bold bg-amber-600 rounded-full px-6 py-2.5 mt-2 hover:bg-amber-600/90 transition-colors"
          >
            {mobileCta}
          </button>
        </div>
      </div>
    </nav>
  );
};

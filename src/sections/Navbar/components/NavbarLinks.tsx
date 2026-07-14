type NavItem = { label: string; href: string };

type NavbarLinksProps = {
  items: NavItem[];
  ctaText?: string;
  ctaHref?: string;
  onNavClick: (href: string) => void;
  activeSection?: string;
};

export const NavbarLinks = ({
  items,
  ctaText = "Book Now",
  ctaHref = "#contact",
  onNavClick,
  activeSection,
}: NavbarLinksProps) => {
  return (
    <div className="items-center box-border caret-transparent gap-x-8 hidden min-h-0 min-w-0 gap-y-8 md:flex md:min-h-[auto] md:min-w-[auto]">
      {items.map((item) => {
        const isActive = activeSection === item.href.replace("#", "");
        return (
          <button
            key={item.href}
            onClick={() => onNavClick(item.href)}
            className={`relative text-sm font-semibold leading-5 bg-transparent p-0 transition-colors ${
              isActive ? "text-amber-600" : "text-gray-800 hover:text-amber-600"
            }`}
          >
            {item.label}
            {isActive && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-amber-600 transition-all duration-300" />
            )}
          </button>
        );
      })}
      <button
        onClick={() => onNavClick(ctaHref)}
        className="text-white text-sm font-bold bg-sky-900 rounded-full px-5 py-2 hover:bg-sky-950 transition-colors"
      >
        {ctaText}
      </button>
    </div>
  );
};

type NavbarMobileButtonProps = {
  open: boolean;
  onToggle: () => void;
};

export const NavbarMobileButton = ({ open, onToggle }: NavbarMobileButtonProps) => {
  return (
    <button
      onClick={onToggle}
      aria-label={open ? "Close menu" : "Open menu"}
      className="bg-transparent p-1 md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 group"
    >
      <span
        className={`block h-0.5 w-6 bg-gray-800 rounded transition-all duration-300 ${
          open ? "rotate-45 translate-y-2" : ""
        }`}
      />
      <span
        className={`block h-0.5 bg-gray-800 rounded transition-all duration-300 ${
          open ? "w-0 opacity-0" : "w-6"
        }`}
      />
      <span
        className={`block h-0.5 w-6 bg-gray-800 rounded transition-all duration-300 ${
          open ? "-rotate-45 -translate-y-2" : ""
        }`}
      />
    </button>
  );
};

import { ICON_15 } from "@/assets";

export const MobileFloatingButton = () => {
  const scrollToContact = () => {
    const el = document.getElementById("booking-form");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fixed z-40 right-6 bottom-6 md:hidden flex flex-col items-end gap-3">
      <button
        onClick={scrollToContact}
        aria-label="Book a Course"
        className="text-white bg-amber-600 shadow-[rgba(217,130,43,0.5)_0px_25px_50px_-12px] p-4 rounded-full hover:bg-amber-700 transition-colors active:scale-95"
      >
        <img
          src={ICON_15}
          alt="Book a Course"
          className="h-6 w-6"
        />
      </button>
    </div>
  );
};

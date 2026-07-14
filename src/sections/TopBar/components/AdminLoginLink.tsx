import { ICON_1 } from "@/assets";

export const AdminLoginLink = () => {
  return (
    <a
      href="/admin"
      className="text-gray-300 text-[10px] font-bold items-center box-border caret-transparent gap-x-1 flex leading-[15px] min-h-[auto] min-w-[auto] gap-y-1 md:text-xs md:gap-x-1.5 md:leading-4 md:gap-y-1.5 hover:text-gray-400"
    >
      <img
        src={ICON_1}
        alt="Icon"
        className="text-[10px] box-border caret-transparent h-2.5 leading-[15px] w-2.5 md:text-xs md:h-3 md:leading-4 md:w-3"
      />
      <span className="text-[10px] box-border caret-transparent hidden leading-[15px] min-h-0 min-w-0 md:text-xs md:block md:leading-4 md:min-h-[auto] md:min-w-[auto]">
        Admin Login
      </span>
      <span className="text-[10px] box-border caret-transparent block leading-[15px] min-h-[auto] min-w-[auto] md:text-xs md:hidden md:leading-4 md:min-h-0 md:min-w-0">
        Login
      </span>
    </a>
  );
};

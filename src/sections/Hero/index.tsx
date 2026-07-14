import { HeroContent } from "@/sections/Hero/components/HeroContent";
import { HERO_BG_URL, ICON_5 } from "@/assets";

export const Hero = () => {
  return (
    <section
      className="relative items-center bg-no-repeat bg-cover box-border caret-transparent flex h-[1000px] min-h-[700px] overflow-hidden bg-center"
      style={{ backgroundImage: `url('${HERO_BG_URL}')` }}
    >
      <div className="absolute box-border caret-transparent z-0 inset-0">
        <div className="absolute bg-[linear-gradient(rgba(11,74,111,0.4),rgba(11,74,111,0.6),rgba(11,74,111,0.8))] box-border caret-transparent inset-0"></div>
      </div>
      <div className="relative box-border caret-transparent max-w-none min-h-[auto] min-w-[auto] w-full z-10 mx-auto px-6 md:max-w-screen-xl">
        <HeroContent />
      </div>
      <div className="absolute text-white/50 box-border caret-transparent translate-x-[-50.0%] left-2/4 bottom-10">
        <img
          src={ICON_5}
          alt="Icon"
          className="box-border caret-transparent h-8 rotate-90 w-8"
        />
      </div>
    </section>
  );
};

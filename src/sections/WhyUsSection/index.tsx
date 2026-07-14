import { WhyUsContent } from "@/sections/WhyUsSection/components/WhyUsContent";
import { WhyUsMedia } from "@/sections/WhyUsSection/components/WhyUsMedia";

export const WhyUsSection = () => {
  return (
    <section className="bg-slate-50 box-border caret-transparent overflow-hidden py-24">
      <div className="box-border caret-transparent max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
        <div className="items-center box-border caret-transparent gap-x-16 flex flex-col gap-y-16 md:flex-row">
          <WhyUsContent />
          <WhyUsMedia />
        </div>
      </div>
    </section>
  );
};

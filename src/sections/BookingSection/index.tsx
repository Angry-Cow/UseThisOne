import { CourseInvestment } from "@/sections/BookingSection/components/CourseInvestment";
import { BookingForm } from "@/sections/BookingSection/components/BookingForm";

export const BookingSection = () => {
  return (
    <section id="booking-form" className="bg-white box-border caret-transparent py-24">
      <div className="box-border caret-transparent max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
        <div className="box-border caret-transparent gap-x-16 grid grid-cols-[repeat(1,minmax(0px,1fr))] gap-y-16 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
          <CourseInvestment />
          <BookingForm />
        </div>
      </div>
    </section>
  );
};

import { useState } from "react";
import { GroupRateModal } from "@/sections/BookingSection/components/GroupRateModal";

export type CourseInvestmentItemProps = {
  title: string;
  duration: string;
  groupPrice: string;
  groupPriceNote?: string;
  privatePrice?: string;
  privatePriceNote?: string;
  buttonText: string;
  courseValue: string;
  containerClassName?: string;
};

export const CourseInvestmentItem = (props: CourseInvestmentItemProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const scrollToForm = () => {
    window.dispatchEvent(
      new CustomEvent("selectCourse", { detail: props.courseValue }),
    );
    const el = document.getElementById("booking-form-field");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div
        className={`items-center flex justify-between border border-gray-100 p-6 rounded-2xl hover:border-amber-600/30 hover:bg-amber-50/30 transition-colors ${props.containerClassName || ""}`}
      >
        <div>
          <h4 className="text-xl font-bold leading-7 mb-1">{props.title}</h4>
          <p className="text-gray-500 text-sm leading-5">{props.duration}</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          {/* Private price row — shown above group price */}
          {props.privatePrice && (
            <p className="text-sky-900 font-bold text-[0.9em]">
              {props.privatePrice}
              {props.privatePriceNote && (
                <span className="text-xs font-normal text-gray-500 ml-1">
                  {props.privatePriceNote}
                </span>
              )}
            </p>
          )}

          {/* Spacer between private and group rows when both present */}
          {props.privatePrice && <div className="h-2" />}

          {/* Group price row */}
          <p className="text-sky-900 font-bold text-[0.9em]">
            {props.groupPrice}
            {props.groupPriceNote && (
              <span className="text-xs font-normal text-gray-500 ml-1">
                {props.groupPriceNote}
              </span>
            )}
          </p>

          {/* CTA buttons — 10% smaller text */}
          <button
            onClick={scrollToForm}
            className="text-amber-600 font-bold tracking-[0.6px] leading-4 uppercase mt-1 hover:text-amber-700 transition-colors block text-[0.675rem]"
          >
            {props.buttonText}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="text-sky-700 font-semibold tracking-[0.5px] leading-4 uppercase mt-1 hover:text-sky-900 transition-colors block text-[0.675rem]"
          >
            Group Rate
          </button>
        </div>
      </div>

      <GroupRateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialCourse={props.courseValue}
      />
    </>
  );
};

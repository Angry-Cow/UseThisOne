import { useState } from "react";
import { ICON_12 } from "@/assets";
import { GroupRateModal } from "@/sections/BookingSection/components/GroupRateModal";

export type CourseCardProps = {
  title: string;
  groupPrice: string;
  groupPriceNote: string;
  privatePrice?: string;
  privatePriceNote?: string;
  features: string[];
  description: string;
  buttonText: string;
};

export const CourseCard = (props: CourseCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white box-border caret-transparent flex flex-col min-h-[auto] min-w-[auto] border border-gray-100 p-10 rounded-[40px] border-solid">
        <h4 className="text-sky-900 text-xl font-bold box-border caret-transparent leading-7 min-h-[auto] min-w-[auto] mb-4">
          <span className="box-border caret-transparent">{props.title}</span>
        </h4>

        {/* Price block — private above, group below, with gap between */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Private price row */}
          {props.privatePrice && (
            <div className="items-baseline box-border caret-transparent gap-x-1 flex min-h-[auto] min-w-[auto]">
              <span className="text-[33.6px] font-bold box-border caret-transparent block leading-[1.1] min-h-[auto] min-w-[auto] font-inter text-sky-900">
                {props.privatePrice}
              </span>
              <span className="text-gray-500 text-sm box-border caret-transparent block leading-5 min-h-[auto] min-w-[auto]">
                {props.privatePriceNote}
              </span>
            </div>
          )}

          {/* Group price row */}
          <div className="items-baseline box-border caret-transparent gap-x-1 flex min-h-[auto] min-w-[auto]">
            <span className="text-[33.6px] font-bold box-border caret-transparent block leading-[1.1] min-h-[auto] min-w-[auto] font-inter text-sky-900">
              <span className="box-border caret-transparent">
                {props.groupPrice}
              </span>
            </span>
            <span className="text-gray-500 text-sm box-border caret-transparent block leading-5 min-h-[auto] min-w-[auto]">
              <span className="box-border caret-transparent">
                {props.groupPriceNote}
              </span>
            </span>
          </div>
        </div>

        <ul className="box-border caret-transparent grow list-none min-h-[auto] min-w-[auto] mb-10 pl-0">
          {props.features.map((feature, index) => (
            <li
              key={index}
              className={`text-sm items-center box-border caret-transparent gap-x-3 flex leading-5 gap-y-3${index > 0 ? " mt-4" : ""}`}
            >
              <img
                src={ICON_12}
                alt="Icon"
                className="text-green-600 box-border caret-transparent h-[18px] w-[18px]"
              />
              <span className="box-border caret-transparent block min-h-[auto] min-w-[auto]">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <div className="text-gray-500 text-sm italic bg-gray-50 box-border caret-transparent leading-[22.75px] min-h-[auto] min-w-[auto] border border-gray-100 mb-6 p-4 rounded-xl border-solid">
          {props.description.split("\n").map((line, i, arr) => (
            <span key={i} className="box-border caret-transparent">
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </div>

        <button
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("selectCourse", { detail: props.title }),
            );
            const el = document.getElementById("booking-form-field");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="text-amber-600 font-bold bg-amber-50 block text-center w-full px-0 py-4 rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors"
        >
          {props.buttonText}
        </button>

        <button
          onClick={() => setModalOpen(true)}
          className="text-sky-700 font-semibold bg-sky-50 block text-center w-full px-0 py-4 rounded-full hover:bg-sky-100 hover:text-sky-900 transition-colors mt-3"
        >
          Request A Group Rate
        </button>
      </div>

      <GroupRateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialCourse={props.title}
      />
    </>
  );
};

import { ICON_7 } from "@/assets";

export type ServiceCardProps = {
  iconSrc: string;
  title: string;
  description: string;
  listItems: string[];
  buttonText: string;
  cardImageSrc: string;
  cardImageAlt: string;
};

export const ServiceCard = (props: ServiceCardProps) => {
  return (
    <div className="box-border caret-transparent flex flex-col h-full">
      <div className="bg-slate-50 box-border caret-transparent flex flex-col flex-1 min-h-[auto] min-w-[auto] border border-gray-100 p-8 rounded-3xl border-solid">
        <div className="items-center bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.05)_0px_1px_2px_0px] box-border caret-transparent flex h-16 justify-center w-16 mb-6 rounded-2xl">
          <img
            src={props.iconSrc}
            alt="Icon"
            className="text-sky-900 box-border caret-transparent h-8 w-8"
          />
        </div>
        <h3 className="text-2xl font-bold box-border caret-transparent leading-8 mb-4 font-inter">
          <span className="box-border caret-transparent">{props.title}</span>
        </h3>
        <p className="text-gray-500 box-border caret-transparent leading-[26px] mb-6">
          <span className="box-border caret-transparent">
            {props.description}
          </span>
        </p>
        <ul className="box-border caret-transparent list-none mb-8 pl-0 flex-1">
          {props.listItems.map((item, index) => (
            <li
              key={index}
              className={`text-sm font-medium items-center box-border caret-transparent gap-x-2 flex leading-5 gap-y-2${index > 0 ? " mt-3" : ""}`}
            >
              <div className="bg-amber-600 box-border caret-transparent h-1.5 min-h-[auto] min-w-[auto] w-1.5 rounded-full"></div>
              <span className="box-border caret-transparent block min-h-[auto] min-w-[auto]">
                {item}
              </span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            const el = document.getElementById("courses");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="text-sky-900 font-bold items-center bg-transparent caret-transparent gap-x-2 flex gap-y-2 text-center p-0 hover:text-amber-600 transition-colors mt-auto"
        >
          <span className="box-border caret-transparent block min-h-[auto] min-w-[auto]">
            {props.buttonText}
          </span>
          <img
            src={ICON_7}
            alt="Icon"
            className="box-border caret-transparent h-[18px] w-[18px]"
          />
        </button>
      </div>
      <div className="shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.1)_0px_10px_15px_-3px,rgba(0,0,0,0.1)_0px_4px_6px_-4px] box-border caret-transparent min-h-[auto] min-w-[auto] mt-6 rounded-3xl">
        <img
          src={props.cardImageSrc}
          alt={props.cardImageAlt}
          className="box-border caret-transparent w-full block rounded-3xl"
        />
      </div>
    </div>
  );
};

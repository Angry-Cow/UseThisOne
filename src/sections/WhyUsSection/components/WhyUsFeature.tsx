import { ICON_11 } from "@/assets";

export type WhyUsFeatureProps = {
  title: string;
  description: string;
  iconSrc?: string;
  className?: string;
};

export const WhyUsFeature = (props: WhyUsFeatureProps) => {
  return (
    <div
      className={`box-border caret-transparent gap-x-4 flex gap-y-4 ${props.className || ""}`}
    >
      <div className="text-amber-600 items-center bg-amber-600/10 box-border caret-transparent flex shrink-0 h-12 justify-center min-h-[auto] min-w-[auto] w-12 rounded-xl">
        <img
          src={props.iconSrc || ICON_11}
          alt="Icon"
          className="box-border caret-transparent h-6 w-6"
        />
      </div>
      <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
        <h4 className="text-xl font-bold box-border caret-transparent leading-7 mb-1">
          <span className="box-border caret-transparent">{props.title}</span>
        </h4>
        <p className="text-gray-500 box-border caret-transparent">
          <span className="box-border caret-transparent">
            {props.description}
          </span>
        </p>
      </div>
    </div>
  );
};

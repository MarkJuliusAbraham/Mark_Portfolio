import {FadeInComponent} from "@/components/custom/Animated/FadeInComponent.jsx";


export const ThreeTierInfo = (
  { toner="00",
    title="Title",
    readable="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
  }) => {

  return (
    <FadeInComponent
      className="box-border flex w-full flex-col gap-2 py-4 px-2  overflow-hidden"
    >
      <div className="typeset-card-toner text-gray-600">
        {toner}
      </div>

      <div className="typeset-card-title">
        {title}
      </div>

      <div className="typeset-card-readable">
        {readable}
      </div>
    </FadeInComponent>
  );
};

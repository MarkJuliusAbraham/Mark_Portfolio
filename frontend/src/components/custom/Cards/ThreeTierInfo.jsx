import {FadeInComponent} from "@/components/custom/Animated/FadeInComponent.jsx";


export const ThreeTierInfo = ({ toner, title, readable }) => {

  return (
    <FadeInComponent
      className="box-border flex h-full w-full flex-col gap-4 py-4 px-2  overflow-hidden"
    >
      <div className="typeset-card-toner ">
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

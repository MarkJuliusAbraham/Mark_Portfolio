import {PopInComponent} from "@/components/custom/Animated/PopInComponent.jsx";

export const TitledCard = ({title = "Default Title", children}) => {
  return (
    <div className="flex flex-col gap-8 overflow-hidden pt-40">
      <PopInComponent className="typeset-title">
        {title}
      </PopInComponent>
      <div>
        {children}
      </div>
    </div>

  );
}
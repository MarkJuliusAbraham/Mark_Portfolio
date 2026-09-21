import {ThreeTierInfo} from "@/components/custom/Cards/ThreeTierInfo.jsx";

export const QuadDisplay = ({children}) => {
  return (
    <div className="@container box-border w-full p-4">
      <div className="grid grid-cols-2 gap-4 @min-[780px]:grid-cols-4">
        {children}
      </div>
    </div>
  );
}
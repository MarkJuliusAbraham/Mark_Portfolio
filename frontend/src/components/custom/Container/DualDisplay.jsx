export const DualDisplay = ({children}) => {
  return (
    <div className="@container box-border w-full p-4">
      <div className="grid grid-cols-1 gap-4 @min-[780px]:grid-cols-2">
        {children}
      </div>
    </div>
  );
}
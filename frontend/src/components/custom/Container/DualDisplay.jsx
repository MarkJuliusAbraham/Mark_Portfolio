export const DualDisplay = ({children}) => {
  return (
    <div className="@container box-border min-w-0 w-full">
      <div className="grid grid-cols-1 gap-8 @min-[720px]:grid-cols-2 @min-[720px]:gap-12">
        {children}
      </div>
    </div>
  );
}

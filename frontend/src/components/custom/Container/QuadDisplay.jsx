export const QuadDisplay = ({children}) => {
  return (
    <div className="@container box-border min-w-0 w-full">
      <div className="grid grid-cols-1 gap-4 @min-[460px]:grid-cols-2 @min-[960px]:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

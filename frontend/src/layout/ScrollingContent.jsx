export const ScrollingContent = ({ref, children}) => {
  return (
    <div ref={ref} className="
      ml-0
      w-full
      px-4
      py-10

      min-[1100px]:ml-80
    ">
      {children}
    </div>
  );
}
export const ScrollingContent = ({ref = null, children}) => {
  return (
    <main ref={ref} id="main-content" className="
      flex
      flex-col
      gap-20
      md:gap-28
      xl:gap-40
      min-w-0
      w-full
      max-w-400
      mx-auto
      px-4
      sm:px-6
      lg:px-8
      xl:px-12
      py-8
      sm:py-12
      pb-16
    ">
      {children}
    </main>
  );
}

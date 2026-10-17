// The page's spacing (its gutters, top and bottom space, and gaps between sections) is set by
// page-layout.css, on one fluid scale for every width.
export const ScrollingContent = ({ref = null, children}) => {
  return (
    <main ref={ref} id="main-content" className="page-content flex flex-col min-w-0 w-full max-w-400 mx-auto">
      {children}
    </main>
  );
}

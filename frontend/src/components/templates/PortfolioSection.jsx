import { SectionTitle } from "@/components/molecules/SectionTitle.jsx";

/**
 * A titled section of the page. With `actions`, controls for the section share its title's row:
 * the title moves to the left, the controls to the right. `titleEntrance` picks how the title
 * comes into view (see SectionTitle).
 */
export const PortfolioSection = ({ ref, title, titleEntrance, actions, children }) => (
  <section className="flex min-w-0 flex-col gap-6 sm:gap-8 md:gap-12">
    {actions ? (
      <div className="portfolio-section-head flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <SectionTitle ref={ref} word={title} align="start" entrance={titleEntrance} />
        {actions}
      </div>
    ) : (
      <SectionTitle ref={ref} word={title} entrance={titleEntrance} />
    )}
    {children}
  </section>
);

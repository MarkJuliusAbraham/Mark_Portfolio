import { SectionTitle } from "@/components/custom/Sections/SectionTitle.jsx";

export const PortfolioSection = ({ ref, title, children }) => (
  <section className="flex min-w-0 flex-col gap-6 sm:gap-8 md:gap-12">
    <SectionTitle ref={ref} word={title} />
    {children}
  </section>
);

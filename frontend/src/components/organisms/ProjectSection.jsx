import { useEffect, useRef, useState } from "react";
import { GalleryHorizontalEnd, LayoutGrid, List } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel.jsx";
import { CarouselDots } from "@/components/molecules/CarouselDots.jsx";
import { PortfolioSection } from "@/components/templates/PortfolioSection.jsx";
import { ProjectCard } from "@/components/molecules/ProjectCard.jsx";
import { ProjectRow } from "@/components/molecules/ProjectRow.jsx";
import { ProjectTile } from "@/components/molecules/ProjectTile.jsx";
import { projects } from "@/content/projects.js";
import { useCarouselSnap } from "@/hooks/useCarouselSnap.js";
import "./project-section.css";

const arrowClass = "static inset-auto my-0 size-11 shrink-0";

const views = [
  { name: "carousel", label: "Carousel", Icon: GalleryHorizontalEnd },
  { name: "grid", label: "Grid", Icon: LayoutGrid },
  { name: "list", label: "List", Icon: List },
];

/**
 * How much of the screen is left for the projects below their title row, when the section is
 * brought into view from the navigation. The grid and list keep within it, scrolling inside if
 * they must, so the whole section shows at once. Follows the window as it resizes.
 */
const useProjectsRoom = (headRef, view) => {
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const head = headRef.current?.parentElement;
    if (!head) return;
    const measure = () => {
      const title = head.querySelector("h2");
      const margin = parseFloat(getComputedStyle(title).scrollMarginTop) || 0;
      const gap = parseFloat(getComputedStyle(head.parentElement).rowGap) || 0;
      setRoom(Math.max(window.innerHeight - margin - head.offsetHeight - gap - 24, 320));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [headRef, view]);

  return room;
};

/**
 * The projects section: its title, sharing a row with the view switch, over the projects as a
 * carousel of full figure cards, a denser grid of brief tiles, or a list of index rows.
 * View changes are immediate.
 */
export const ProjectSection = ({ ref, title }) => {
  const [view, setView] = useState("carousel");
  const [api, setApi] = useState(null);
  const { count, current } = useCarouselSnap(api);
  const switchRef = useRef(null);
  const room = useProjectsRoom(switchRef, view);
  const numbered = projects.map((project, index) => ({ ...project, number: index + 1 }));

  const viewSwitch = (
    <div ref={switchRef} className="project-views" role="group" aria-label="Show projects as">
      {views.map(({ name, label, Icon }) => (
        <button
          key={name}
          type="button"
          className="project-view-button"
          aria-pressed={view === name}
          onClick={() => setView(name)}
        >
          <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <PortfolioSection ref={ref} title={title} titleEntrance="aberrate" actions={viewSwitch}>
      <div className="@container/projects min-w-0 w-full" style={room ? { "--projects-room": `${room}px` } : undefined}>

        {view === "carousel" ? (
          <Carousel setApi={setApi} className="min-w-0 w-full" opts={{ align: "start" }} aria-label="Solo projects">
            <CarouselContent>
              {numbered.map((project) => (
                <CarouselItem
                  key={project.id}
                  className="flex basis-full @min-[640px]/projects:basis-1/2 @min-[1050px]/projects:basis-1/3"
                >
                  <ProjectCard {...project} />
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="mt-4 flex items-center justify-between gap-3 px-2">
              <CarouselPrevious className={arrowClass} />
              <CarouselDots count={count} current={current} onSelect={(index) => api?.scrollTo(index)} />
              <CarouselNext className={arrowClass} />
            </div>
          </Carousel>
        ) : view === "grid" ? (
          <ul className="project-grid" aria-label="Solo projects">
            {numbered.map((project) => (
              <li key={project.id} className={project.featured ? "is-featured" : undefined}>
                <ProjectTile {...project} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="project-list" data-theme="inverse-card">
            <div className="project-list-head" aria-hidden="true">
              <span />
              <span>Figure</span>
              <span>Genre</span>
              <span className="project-row-stack">Stack</span>
              <span className="project-row-year">Year</span>
            </div>
            <ul aria-label="Solo projects">
              {numbered.map((project) => (
                <li key={project.id}>
                  <ProjectRow {...project} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PortfolioSection>
  );
};

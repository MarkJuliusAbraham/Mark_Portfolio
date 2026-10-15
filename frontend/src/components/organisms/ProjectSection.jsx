import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel.jsx";
import { CarouselDots } from "@/components/molecules/CarouselDots.jsx";
import { ProjectCard } from "@/components/molecules/ProjectCard.jsx";
import { projects } from "@/content/projects.js";
import { useCarouselSnap } from "@/hooks/useCarouselSnap.js";

const arrowClass = "static inset-auto my-0 size-11 shrink-0";

export const ProjectSection = () => {
  const [api, setApi] = useState(null);
  const { count, current } = useCarouselSnap(api);

  return (
    <div className="@container/projects min-w-0 w-full">
      <Carousel setApi={setApi} className="min-w-0 w-full" opts={{ align: "start" }} aria-label="Solo projects">
        <CarouselContent>
          {projects.map((project) => (
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
    </div>
  );
};

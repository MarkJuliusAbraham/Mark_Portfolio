import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel.jsx";
import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/custom/Cards/ProjectCard.jsx";

export const ProjectSection = () => {
  const projects = [
    {
      id: "project-1",
      title: "Computer Vision",
      description:
        "Using computer vision to make decisions based on hand movements or object classification.",
      techStack: ["Python", "OpenCV", "MediaPipe"],
    },
    {
      id: "project-2",
      title: "\"Papers Please\" Game Prototype",
      description:
        'A recreation of the game mechanics from the hit game "Papers Please" and more!',
      techStack: ["C#", "Godot", "OOD", "Yarn", "PixelArt"],
    },
    {
      id: "project-3",
      title: "AI-Parsed Groceries App",
      description:
        "A native application that uses a Local LLM to perform query classification to enrich groceries data.",
      techStack: [".NET", "JavaScript", "C#", "Electron"],
    },
  ];

  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    const updateCarousel = () => {
      setSnapCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };

    updateCarousel();

    api.on("select", updateCarousel);
    api.on("reInit", updateCarousel);

    return () => {
      api.off("select", updateCarousel);
      api.off("reInit", updateCarousel);
    };
  }, [api]);

  return (
    <div className="@container/projects min-w-0 w-full">
      <Carousel
        setApi={setApi}
        className="min-w-0 w-full"
        opts={{ align: "start" }}
        aria-label="Solo projects"
      >
        <CarouselContent>
          {projects.map((project, index) => (
            <CarouselItem
              key={index}
              className="flex basis-full @min-[640px]/projects:basis-1/2 @min-[1050px]/projects:basis-1/3"
            >
              <ProjectCard
                id={project.id}
                title={project.title}
                description={project.description}
                techStack={project.techStack}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="mt-4 flex items-center justify-between gap-3 px-2">
          <CarouselPrevious className="static inset-auto my-0 size-11 shrink-0" />
          <div className="flex items-center justify-center">
            {Array.from({ length: snapCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={current === index ? "true" : undefined}
                onClick={() => api?.scrollTo(index)}
                className="flex size-11 items-center justify-center rounded-md focus-visible:outline-2"
              >
                <span aria-hidden="true" className={`h-2 rounded-full transition-all duration-300 ${
                  current === index
                    ? "w-6 bg-foreground"
                    : "w-2 bg-foreground/30 hover:bg-foreground/50"
                }`} />
              </button>
            ))}
          </div>
          <CarouselNext className="static inset-auto my-0 size-11 shrink-0" />
        </div>
      </Carousel>
    </div>
  );
};

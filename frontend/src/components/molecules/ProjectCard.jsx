import { Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card.jsx";
import runGif from "@/gifs/MitsuhaRun.gif";
import rollGif from "@/gifs/MitsuhaRoll.gif";
import tragedyGif from "@/gifs/Tragedy.gif";
import meteorGif from "@/gifs/TakiGazeMeteor.gif";
import loversGif from "@/gifs/StarCrossedLovers.gif";
import chaseGif from "@/gifs/MitsuhaChaseMeteor.gif";

const gifs = [runGif, rollGif, tragedyGif, meteorGif, loversGif, chaseGif];

export const ProjectCard = ({
    id,
    title = "Default Title",
    description = "Using anime gifs as placeholders on the website.\n",
    techStack = ["default", "tech"],
  }) => {

  const [randomGif] = useState(() => gifs[Math.floor(Math.random() * gifs.length)]);

  return (

    <Link
      to={`/projects/${id}`}
      className="block h-full min-w-0 w-full rounded-none focus-visible:outline-2 focus-visible:outline-offset-2"
      viewTransition
    >
      <div className="h-full p-2">
        <Card data-theme="inverse-card" className="h-full min-h-112 overflow-hidden select-none gap-3 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-sm active:scale-[0.985]">
          <img
            src={randomGif}
            alt="Project preview"
            loading="lazy"
            className="aspect-[16/10] w-full shrink-0 object-cover"
            style={{
              viewTransitionName: `project-${id}`,
            }}
          />

          <CardTitle className="min-h-13 px-4 text-lg font-semibold wrap-break-word">
            {title}
          </CardTitle>

          <CardContent className="flex flex-1 flex-col px-4">
            <p className="text-sm text-muted-foreground wrap-break-word">
              {description}
            </p>
          </CardContent>

          <CardFooter className="mt-auto px-4 py-3">
            <p className="text-xs font-bold text-card-foreground wrap-break-word">
              {techStack.join(" · ")}
            </p>
          </CardFooter>
        </Card>
      </div>
    </Link>

  );
};

import {ProjectHeadliner} from "@/components/organisms/ProjectHeadliner.jsx";
import {ScrollingContent} from "@/components/templates/ScrollingContent.jsx";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import {WebGpuCanvas} from "@/components/organisms/WebGpuCanvas.jsx";
import projectPreview from "@/previews/MitsuhaRun.mp4";
import projectPoster from "@/previews/MitsuhaRun.jpg";

export const ProjectPage = () => {

  const { projectId } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [projectId]);

  return (
    <ScrollingContent>
      <ProjectHeadliner />
      <div>
        <video
          src={projectPreview}
          poster={projectPoster}
          aria-label="Project preview"
          className="block h-auto w-full max-w-3xl"
          muted
          loop
          playsInline
          autoPlay
        />
      </div>
      <WebGpuCanvas/>
      <div>
        {projectId}
      </div>
    </ScrollingContent>
  );
}

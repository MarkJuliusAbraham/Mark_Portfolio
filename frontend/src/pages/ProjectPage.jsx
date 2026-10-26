import {ProjectHeadliner} from "@/components/organisms/ProjectHeadliner.jsx";
import {ScrollingContent} from "@/components/templates/ScrollingContent.jsx";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import {WebGpuCanvas} from "@/components/organisms/WebGpuCanvas.jsx";
import projectPreview from "@/previews/MitsuhaRun.mp4";
import projectPoster from "@/previews/MitsuhaRun.jpg";
import { ThresholdCaseStudy } from "@/components/organisms/caseStudies/ThresholdCaseStudy.jsx";
import { ComputerVisionProject } from "@/components/organisms/caseStudies/ComputerVisionProject.jsx";
import { TreeSystemsCaseStudy } from "@/components/organisms/caseStudies/TreeSystemsCaseStudy.jsx";
import { WindSystemCaseStudy } from "@/components/organisms/caseStudies/WindSystemCaseStudy.jsx";

// Projects with a dedicated page show it in place of the placeholder preview.
const projectPages = { "project-1": ComputerVisionProject, "project-2": ThresholdCaseStudy, "tree-systems": TreeSystemsCaseStudy, "wind-system": WindSystemCaseStudy };

export const ProjectPage = () => {

  const { projectId } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [projectId]);

  const ProjectContent = projectPages[projectId];
  if (ProjectContent) return <ScrollingContent><ProjectContent /></ScrollingContent>;

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

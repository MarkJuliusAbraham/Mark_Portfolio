import { ComputerVisionProject } from "./ComputerVisionProject.jsx";
import { ThresholdCaseStudy } from "./ThresholdCaseStudy.jsx";
import { TreeSystemsCaseStudy } from "./TreeSystemsCaseStudy.jsx";
import { WindSystemCaseStudy } from "./WindSystemCaseStudy.jsx";
import { WaterSystemCaseStudy } from "./WaterSystemCaseStudy.jsx";
import { CaseRouteCaseStudy } from "./CaseRouteCaseStudy.jsx";

// Which project (by its id in content/projects.js) opens which case-study page. To add a case study,
// build its page beside these and register it here; projects without one show the placeholder page.
export const caseStudyPages = {
  "project-1": ComputerVisionProject,
  "project-2": ThresholdCaseStudy,
  "tree-systems": TreeSystemsCaseStudy,
  "wind-system": WindSystemCaseStudy,
  "water-system": WaterSystemCaseStudy,
  caseroute: CaseRouteCaseStudy,
};

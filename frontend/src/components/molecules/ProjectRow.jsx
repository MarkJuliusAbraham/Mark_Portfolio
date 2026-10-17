import { Link } from "react-router-dom";
import { figureNumber } from "@/lib/figures.js";
import { ProjectPreview } from "./ProjectPreview.jsx";
import "./project-card.css";

/**
 * A project as one row of an index, for the list view: a small framed preview, its figure number
 * and title, then its genre, stack and year in columns.
 */
export const ProjectRow = ({ id, number, title, genre, techStack = [], year, placeholder }) => (
  <Link to={`/projects/${id}`} className="project-row">
    <span className="project-figure-frame project-row-thumb">
      <ProjectPreview id={id} placeholder={placeholder} className="project-figure-image" />
    </span>
    <span className="project-row-name">
      <span className="project-figure-number">{figureNumber(number)}</span>
      <span className="project-row-title">{title}</span>
    </span>
    <span className="project-row-detail">{genre || "—"}</span>
    <span className="project-row-detail project-row-stack">{techStack.join(" · ") || "—"}</span>
    <span className="project-row-detail project-row-year">{year || "—"}</span>
  </Link>
);


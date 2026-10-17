import { Link } from "react-router-dom";
import { figureNumber } from "@/lib/figures.js";
import { ProjectPreview } from "./ProjectPreview.jsx";
import "./project-card.css";

/**
 * A project in brief, for the grid view: the same framed preview and figure caption as its full
 * card, with just the genre beneath; a `featured` one is a large tile that keeps its description.
 */
export const ProjectTile = ({ id, number, title, description, genre, placeholder, featured }) => (
  <Link to={`/projects/${id}`} className="project-figure-link">
    <figure className={`project-figure project-tile${featured ? " is-featured" : ""}`} data-theme="inverse-card">
      <div className="project-figure-frame">
        <ProjectPreview id={id} placeholder={placeholder} className="project-figure-image" />
      </div>
      <figcaption className="project-figure-caption">
        <span className="project-figure-number">{figureNumber(number)}</span>
        <span className="project-figure-title">{title}</span>
      </figcaption>
      {featured && <p className="project-figure-summary">{description}</p>}
      {genre && <p className="project-tile-genre">{genre}</p>}
    </figure>
  </Link>
);


import { ProjectLink } from "./ProjectLink.jsx";
import { figureNumber } from "@/lib/figures.js";
import { ProjectPreview } from "./ProjectPreview.jsx";
import "./project-card.css";

/**
 * A project as a numbered figure, like an entry in a technical manual: a framed preview, a caption
 * with its figure number and title, a short description, and a spec table. It sits on a panel in
 * the opposite theme, which sets the projects apart from the page. Specs without a value show a
 * dash, so the table keeps its shape while details are being filled in.
 */
export const ProjectCard = ({ id, number, title, description, genre, techStack = [], year, placeholder }) => {
  const specs = [
    ["Genre", genre],
    ["Stack", techStack.join(" · ")],
    ["Year", year],
  ];

  return (
    <ProjectLink id={id} placeholder={placeholder} className="project-figure-link">
      <figure className="project-figure" data-theme="inverse-card">
        <div className="project-figure-frame">
          <ProjectPreview id={id} placeholder={placeholder} className="project-figure-image" />
        </div>
        <figcaption className="project-figure-caption">
          <span className="project-figure-number">{figureNumber(number)}</span>
          <span className="project-figure-title">{title}</span>
        </figcaption>
        <p className="project-figure-summary">{description}</p>
        <dl className="project-figure-specs">
          {specs.map(([label, value]) => (
            <div key={label} className="project-figure-spec">
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </figure>
    </ProjectLink>
  );
};

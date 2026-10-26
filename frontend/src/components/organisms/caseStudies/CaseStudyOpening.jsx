import { useReadingMode } from "./readingMode.js";
import { SwapLabel } from "./SwapLabel.jsx";
import { ProjectPreview } from "@/components/molecules/ProjectPreview.jsx";
import { projects } from "@/content/projects.js";
import { figureNumber } from "@/lib/figures.js";
import "@/components/molecules/project-card.css";

/**
 * A project page's opening statement beside the same figure its project card shows: the framed
 * preview on an opposite-theme panel, its figure number and title, and its spec table. The page
 * opens on the figure the visitor just clicked. Text and figure stack on narrow screens.
 */
/** The ruled line with a diamond at its centre that divides a case study's parts. */
export const Separator = ({ className = "" }) => (
  <div className={`cs-separator ${className}`.trim()} role="separator" aria-hidden="true"><span /></div>
);

export const CaseStudyOpening = ({ id, summary, children }) => {
  const { simplified, setSimplified } = useReadingMode();

  const index = projects.findIndex((project) => project.id === id);
  const project = projects[index];
  const specs = project ? [
    ["Genre", project.genre],
    ["Stack", (project.techStack ?? []).join(" · ")],
    ["Year", project.year],
  ] : [];

  return (
    <>
    {/* Pinned while scrolling so a simplified reader always knows details are left out. The dock takes no
        height, so showing or hiding the notice never shifts the page. */}
    <div className="cs-simplified-dock" hidden={!simplified}>
      <aside className="cs-simplified-notice" aria-label="Reading mode">
        <span role="status">Page is currently simplified</span>
        <button type="button" className="cs-simplified-undo" aria-label="Show technical version" onClick={() => setSimplified(false)}>Details</button>
      </aside>
    </div>
    <header className="cs-opening">
      <div className="cs-prose">
        {children}
        {simplified && <p className="cs-opening-summary">{summary}</p>}
        <div className="cs-simplify">
          <span className="cs-simplify-prompt typeset-card-toner">
            {simplified ? "Want the full detail?" : "Not a technical person?"}
          </span>
          <button type="button" className="cs-simplify-button" aria-pressed={simplified}
            onClick={() => setSimplified((on) => !on)}>
            <SwapLabel on={simplified} onLabel="Show technical details" offLabel="Simplify" />
          </button>
        </div>
      </div>
      {project && (
        <figure className="project-figure cs-opening-figure" data-theme="inverse-card">
          <div className="project-figure-frame">
            <ProjectPreview id={id} className="project-figure-image" />
          </div>
          <figcaption className="project-figure-caption">
            <span className="project-figure-number">{figureNumber(index + 1)}</span>
            <span className="project-figure-title">{project.title}</span>
          </figcaption>
          <dl className="project-figure-specs">
            {specs.map(([label, value]) => (
              <div key={label} className="project-figure-spec">
                <dt>{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </figure>
      )}
    </header>
    {/* Separates the opening from the write-up below it. */}
    <Separator />
    </>
  );
};

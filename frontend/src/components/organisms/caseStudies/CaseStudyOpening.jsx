import { useEffect, useRef, useState } from "react";
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

const SIMPLIFIED_KEY = "case-study-simplified";
const NOTICE_FULL_MS = 4000;

const readSimplified = () => {
  try { return localStorage.getItem(SIMPLIFIED_KEY) === "1"; } catch { return false; }
};

export const CaseStudyOpening = ({ id, children }) => {
  const opening = useRef(null);
  const [simplified, setSimplified] = useState(readSimplified);
  // The notice shows in full when simplified mode starts, then shrinks to a small tag. Hovering or
  // focusing the tag opens it again.
  const [noticeFull, setNoticeFull] = useState(true);
  const [noticeHeld, setNoticeHeld] = useState(false);

  useEffect(() => {
    if (!simplified) return undefined;
    setNoticeFull(true);
    const timer = setTimeout(() => setNoticeFull(false), NOTICE_FULL_MS);
    return () => clearTimeout(timer);
  }, [simplified]);

  // Simplified mode hides the page's .cs-technical parts; the choice is remembered per browser.
  useEffect(() => {
    const page = opening.current?.closest("article, main") ?? document.body;
    page.toggleAttribute("data-simplified", simplified);
    try { localStorage.setItem(SIMPLIFIED_KEY, simplified ? "1" : "0"); } catch { /* storage off */ }
    return () => page.removeAttribute("data-simplified");
  }, [simplified]);

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
        height, so showing or hiding the notice never shifts the page; the notice slides in over it. */}
    <div className="cs-simplified-dock">
      <div
        className="cs-simplified-notice"
        role="status"
        data-open={simplified || undefined}
        data-compact={(!noticeFull && !noticeHeld) || undefined}
        inert={!simplified}
        onMouseEnter={() => setNoticeHeld(true)}
        onMouseLeave={() => setNoticeHeld(false)}
        onFocus={() => setNoticeHeld(true)}
        onBlur={() => setNoticeHeld(false)}
        tabIndex={-1}
      >
        <span className="cs-simplified-badge typeset-card-toner">Simplified</span>
        <span className="cs-simplified-short">Page is currently simplified</span>
        <span className="cs-simplified-detail">
          <span>You're reading a plain-language version. Technical details are hidden.</span>
          <button type="button" className="cs-simplified-undo" onClick={() => setSimplified(false)}>
            Show technical version
          </button>
        </span>
      </div>
    </div>
    <header className="cs-opening" ref={opening}>
      <div className="cs-prose">
        {children}
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

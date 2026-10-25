import { useEffect, useState } from "react";

// A section is an h2 directly inside one of the page's <section>s; its subsections are the h3s
// within that section. A heading can name itself for the outline with data-outline-label.
const SECTION_HEADINGS = "#main-content section > h2";
const SUBSECTION_HEADINGS = "h3";

// Match the heading's jump offset, including the mobile header. A small tolerance absorbs
// fractional scroll positions so a clicked heading counts as current when the jump settles.
const HEADING_TOLERANCE = 2;

const labelOf = (heading) => (heading.dataset.outlineLabel ?? heading.textContent).trim();

const slugOf = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Gives every outlined heading an id to jump to, without overwriting one it already has.
const ensureId = (heading, used) => {
  if (!heading.id) {
    let id = `outline-${slugOf(labelOf(heading))}`;
    for (let n = 2; used.has(id); n++) id = `outline-${slugOf(labelOf(heading))}-${n}`;
    heading.id = id;
  }
  used.add(heading.id);
  heading.setAttribute("data-outline-target", "");
  return heading.id;
};

const readOutline = () => {
  const used = new Set();
  // Headings hidden by the page (the simplified reading mode) stay out of the outline.
  // Content for the other reading mode is hidden: technical parts while simplified, simple-only
  // parts otherwise.
  const shown = (heading) =>
    !heading.closest("[data-simplified] .cs-technical") &&
    !(heading.closest(".cs-simple-block") && !heading.closest("[data-simplified]"));
  return [...document.querySelectorAll(SECTION_HEADINGS)].filter(shown).map((heading) => ({
    id: ensureId(heading, used),
    label: labelOf(heading),
    children: [...heading.parentElement.querySelectorAll(SUBSECTION_HEADINGS)]
      .filter((sub) => !sub.closest("figure, [role='tooltip']") && shown(sub))
      .map((sub) => ({ id: ensureId(sub, used), label: labelOf(sub) })),
  }));
};

const sameOutline = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The current page's sections and subsections, read from its headings, plus the id of the one
 * being read. Re-reads when the page's content changes (a project loading in, a new route).
 * Off (an empty outline) when `enabled` is false.
 */
export const usePageOutline = (enabled, pageKey) => {
  const [outline, setOutline] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setOutline([]);
      setActiveId(null);
      return undefined;
    }
    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readOutline();
        setOutline((current) => (sameOutline(current, next) ? current : next));
      });
    };
    refresh();
    const main = document.getElementById("main-content");
    const observer = new MutationObserver(refresh);
    if (main) observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-simplified"] });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [enabled, pageKey]);

  useEffect(() => {
    const ids = outline.flatMap((section) => [section.id, ...section.children.map((child) => child.id)]);
    if (!ids.length) return undefined;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const firstHeading = document.getElementById(ids[0]);
        const jumpOffset = firstHeading ? parseFloat(getComputedStyle(firstHeading).scrollMarginTop) || 0 : 0;
        const line = jumpOffset + HEADING_TOLERANCE;
        let current = ids[0];
        for (const id of ids) {
          const heading = document.getElementById(id);
          if (heading && heading.getBoundingClientRect().top <= line) current = id;
        }
        setActiveId(current);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [outline]);

  return { outline, activeId };
};

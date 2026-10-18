// A section with less scroll travel than this can't meaningfully show progress.
export const minScrollableSpan = 24;

const clampStarts = (starts, maxScroll) => starts.map((start) => Math.max(0, Math.min(start, maxScroll)));

/** How much scroll travel each section has, in CSS pixels, using the same spans as below. */
export function sectionSpans(starts, maxScroll) {
  const clamped = clampStarts(starts, maxScroll);
  return clamped.map((start, index) => (index < clamped.length - 1 ? clamped[index + 1] : maxScroll) - start);
}

/**
 * How far through each section the page is scrolled, from 0 to 1. A section runs from the scroll
 * position where it becomes active (`starts[i]`) to where the next one does; the last runs to the
 * bottom of the page. Starts past the bottom are pulled back to it, so a short final section,
 * which activates only once the page bottoms out, still completes the one before it.
 */
export function sectionProgress(starts, scrollY, maxScroll) {
  const clamped = clampStarts(starts, maxScroll);
  return clamped.map((start, index) => {
    const end = index < clamped.length - 1 ? clamped[index + 1] : maxScroll;
    if (end <= start) return scrollY >= start ? 1 : 0;
    return Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
  });
}

/** Overall progress through a page with no sections, such as a project page. */
export const pageProgress = (scrollY, maxScroll) => (maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 1);

// What was last written on each element, so a value that hasn't changed isn't written again.
const written = new WeakMap();

// Where the navbar reads the progress: its containers marked `data-section-progress`, or failing
// those, the root.
const progressScopes = () => {
  const scopes = document.querySelectorAll("[data-section-progress]");
  return scopes.length ? scopes : [document.documentElement];
};

/**
 * Publishes progress as `--section-progress-<index>`, for the navbar to draw, and
 * `--section-fixed-<index>` as 1 for sections too short to scroll through, 0 otherwise. Written
 * on the navbar's own containers, not the root, and only when changed: it runs every frame of a
 * scroll, and a property changed on the root makes the browser restyle the whole page.
 */
export function writeSectionProgress(values, spans = [], scopes = progressScopes()) {
  for (const scope of scopes) {
    const last = written.get(scope) ?? new Map();
    written.set(scope, last);
    const write = (name, value) => {
      if (last.get(name) === value) return;
      last.set(name, value);
      scope.style.setProperty(name, value);
    };
    values.forEach((value, index) => {
      write(`--section-progress-${index}`, value.toFixed(4));
      write(`--section-fixed-${index}`, (spans[index] ?? Infinity) < minScrollableSpan ? "1" : "0");
    });
  }
}

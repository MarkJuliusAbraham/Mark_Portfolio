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

/**
 * Publishes progress as `--section-progress-<index>` on the root, for the navbar to draw, and
 * `--section-fixed-<index>` as 1 for sections too short to scroll through, 0 otherwise.
 */
export function writeSectionProgress(values, spans = []) {
  values.forEach((value, index) => {
    const root = document.documentElement.style;
    root.setProperty(`--section-progress-${index}`, value.toFixed(4));
    root.setProperty(`--section-fixed-${index}`, (spans[index] ?? Infinity) < minScrollableSpan ? "1" : "0");
  });
}

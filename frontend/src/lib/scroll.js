export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scrolls an element to the top of the view, smoothly unless the visitor prefers reduced motion. */
export const scrollToElement = (element) => element?.scrollIntoView({
  behavior: prefersReducedMotion() ? "instant" : "smooth",
  block: "start",
  inline: "start",
});

import { channelMatrices, createChannelDirections, pulse } from "./chromaticTransition.js";
import { chromatic } from "./config.js";
import { appendSvg, svgNamespace } from "./svgFilters.js";

let sequence = 0;

/**
 * The color actually behind an element: the nearest background above it, or the page's. Never its
 * own, which is already part of what gets split, and would show as a box past a rounded shape.
 */
export const backgroundBehind = (element, view = window) => {
  // Without computed styles (outside a browser) there's nothing to read; split over nothing.
  if (typeof view.getComputedStyle !== "function") return "transparent";
  for (let node = element.parentElement; node; node = node.parentElement) {
    const color = view.getComputedStyle(node).backgroundColor;
    if (color && color !== "transparent" && !/rgba?\([^)]*,\s*0\)$/.test(color) && !/\/\s*0\)$/.test(color)) return color;
  }
  return view.getComputedStyle(element.ownerDocument.body).backgroundColor;
};

const levels = [...new Set(pulse.map(([, level]) => level).filter(Boolean))];

// The moment the page-wide switch shows the new theme; a single element flips here too.
export const switchPoint = pulse.find(([, level]) => level === Math.max(...levels))[0];

/** Keyframes that step one element's filter through the theme switch's pulse. */
export const createElementFrames = (prefix) => pulse.map(([offset, level]) => ({
  offset,
  filter: level ? `url("#${prefix}-${level}")` : "none",
  easing: "steps(1, end)",
}));

/**
 * The theme switch's chromatic aberration for a single element, optimised the same way as the
 * page-wide version: only the pulse's levels get filters, channels move by plain offsets rather
 * than a displacement map, and each filter region is sized to exactly the element plus its
 * furthest shift. Filters are built once and reused; each run only re-aims the offsets, and
 * `prepare` can do that ahead of time so the first frame pays for nothing.
 *
 * Like the page-wide switch, which splits the whole page background and all, the element is laid
 * over the color behind it before its channels split (`backdrop`, by default whatever is actually
 * behind it). Bare text split on its own would leave each slid channel alone, dark and muddy,
 * rather than a bright fringe against the background. The backdrop is kept only within reach of
 * the element's own shapes, so its edges never show.
 */
export function createElementGlitch(element, { doc = document, view = window, settings = chromatic, random = Math.random, backdrop = () => backgroundBehind(element, view) } = {}) {
  const prefix = `element-chromatic-${++sequence}`;
  const strength = Math.max(0, Math.min(24, Number.isFinite(settings.strength) ? settings.strength : 8));
  const duration = 360 / (settings.speed ?? 1);
  const supported = typeof element.animate === "function" && Boolean(view.CSS?.supports("filter", 'url("#chromatic")'));
  let svg = null;
  let filters = [];
  let stop = null;

  const build = () => {
    svg = doc.createElementNS(svgNamespace, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.style.pointerEvents = "none";
    const defs = appendSvg(doc, svg, "defs");
    filters = levels.map((level) => {
      const filter = appendSvg(doc, defs, "filter", {
        id: `${prefix}-${level}`,
        filterUnits: "userSpaceOnUse",
        primitiveUnits: "userSpaceOnUse",
        "color-interpolation-filters": "sRGB",
      });
      const shifted = {};
      const flood = appendSvg(doc, filter, "feFlood", { result: "backdrop" });
      appendSvg(doc, filter, "feComposite", { in: "SourceGraphic", in2: "backdrop", operator: "over", result: "source" });
      for (const [channel, values] of Object.entries(channelMatrices)) {
        appendSvg(doc, filter, "feColorMatrix", { in: "source", type: "matrix", values, result: channel });
        if (channel !== "green") shifted[channel] = appendSvg(doc, filter, "feOffset", { in: channel, result: `${channel}-shifted` });
      }
      appendSvg(doc, filter, "feComposite", {
        in: "red-shifted", in2: "green", operator: "arithmetic", k2: 1, k3: 1, result: "red-green",
      });
      appendSvg(doc, filter, "feComposite", {
        in: "red-green", in2: "blue-shifted", operator: "arithmetic", k2: 1, k3: 1, result: "rgb",
      });
      // Kept only as far from the element's own shapes as a channel can shift, so the backdrop's
      // edges, split like everything else, never show as colored lines around a box.
      appendSvg(doc, filter, "feMorphology", { in: "SourceAlpha", operator: "dilate", radius: Math.ceil(strength) + 1, result: "reach" });
      appendSvg(doc, filter, "feComposite", { in: "rgb", in2: "reach", operator: "in" });
      return { level, filter, flood, ...shifted };
    });
    doc.body.append(svg);
  };

  /** Sizes the filters to the element as it is now and picks fresh directions for the next run. */
  const prepare = () => {
    if (!supported) return;
    if (!svg) build();
    // Room for the furthest shift, plus a little for content drawn just outside the element.
    const padding = Math.ceil(strength) + 8;
    const { width, height } = element.getBoundingClientRect();
    const directions = createChannelDirections(settings, random);
    const behind = backdrop();
    for (const { level, filter, flood, red, blue } of filters) {
      flood.setAttribute("flood-color", behind);
      filter.setAttribute("x", -padding);
      filter.setAttribute("y", -padding);
      filter.setAttribute("width", Math.ceil(width) + padding * 2);
      filter.setAttribute("height", Math.ceil(height) + padding * 2);
      const shift = strength * level / 6;
      const direction = directions[level - 1];
      red.setAttribute("dx", shift * direction.x);
      red.setAttribute("dy", shift * direction.y);
      blue.setAttribute("dx", -shift * direction.x);
      blue.setAttribute("dy", -shift * direction.y);
    }
  };

  /**
   * Plays the aberration, calling `onSwitch` at the same peak where the page-wide switch shows its
   * new theme. Returns a function that stops early, still switching if it has not yet.
   * With reduced motion, or without SVG filter support, it switches straight away.
   */
  const run = (onSwitch) => {
    stop?.();
    if (!supported || view.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onSwitch();
      return () => {};
    }
    prepare();

    let switched = false;
    const doSwitch = () => {
      if (switched) return;
      switched = true;
      onSwitch();
    };
    const animation = element.animate(createElementFrames(prefix), { duration, easing: "linear" });
    const timer = view.setTimeout(doSwitch, duration * switchPoint);
    const current = () => {
      view.clearTimeout(timer);
      animation.cancel();
      doSwitch();
      if (stop === current) stop = null;
    };
    stop = current;
    animation.finished.then(() => {
      view.clearTimeout(timer);
      doSwitch();
      if (stop === current) stop = null;
    }, () => {});
    return current;
  };

  const dispose = () => {
    stop?.();
    svg?.remove();
    svg = null;
    filters = [];
  };

  return { prepare, run, dispose };
}

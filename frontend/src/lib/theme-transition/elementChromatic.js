import { channelMatrices, createChannelDirections, pulse } from "./chromaticTransition.js";
import { chromatic } from "./config.js";
import { appendSvg, svgNamespace } from "./svgFilters.js";

let sequence = 0;

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
 */
export function createElementGlitch(element, { doc = document, view = window, settings = chromatic, random = Math.random } = {}) {
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
      for (const [channel, values] of Object.entries(channelMatrices)) {
        appendSvg(doc, filter, "feColorMatrix", { in: "SourceGraphic", type: "matrix", values, result: channel });
        if (channel !== "green") shifted[channel] = appendSvg(doc, filter, "feOffset", { in: channel, result: `${channel}-shifted` });
      }
      appendSvg(doc, filter, "feComposite", {
        in: "red-shifted", in2: "green", operator: "arithmetic", k2: 1, k3: 1, result: "red-green",
      });
      appendSvg(doc, filter, "feComposite", {
        in: "red-green", in2: "blue-shifted", operator: "arithmetic", k2: 1, k3: 1,
      });
      return { level, filter, ...shifted };
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
    for (const { level, filter, red, blue } of filters) {
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

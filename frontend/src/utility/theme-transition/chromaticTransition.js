import { appendSvg, svgNamespace } from "./svgFilters.js";
import { appendFrameGlitchFilters, frameGlitchOptions, layerFrameGlitch } from "./frameGlitchTransition.js";

let sequence = 0;

const channelMatrices = {
  red: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  green: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
  blue: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
};

// Start with visible separation, switch at the early peak, then quickly settle.
const pulse = [[0, 2], [0.08, 4], [0.16, 6], [0.28, 4],
  [0.4, 5], [0.56, 2], [0.74, 1], [1, 0]];

export function createChromaticFrames(filterPrefix, incoming) {
  return pulse.map(([offset, level]) => ({
    offset,
    filter: level ? `url("#${filterPrefix}-${level}")` : "none",
    opacity: incoming ? Number(offset >= 0.16) : Number(offset < 0.16),
    easing: "steps(1, end)",
  }));
}

export function createRadialMap(width, height, strength) {
  // Neutral outermost pixels prevent the channels sampling beyond the viewport.
  const paddingX = Math.min(0.25, (strength + 2) / width);
  const paddingY = Math.min(0.25, (strength + 2) / height);
  const image = `<svg xmlns="${svgNamespace}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="r">
        <stop offset="0" stop-color="#800000"/>
        <stop offset="${paddingX}" stop-color="#000000"/>
        <stop offset="${1 - paddingX}" stop-color="#ff0000"/>
        <stop offset="1" stop-color="#800000"/>
      </linearGradient>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#008000"/>
        <stop offset="${paddingY}" stop-color="#000000"/>
        <stop offset="${1 - paddingY}" stop-color="#00ff00"/>
        <stop offset="1" stop-color="#008000"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#r)"/>
    <rect width="100%" height="100%" fill="url(#g)" style="mix-blend-mode:screen"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(image)}`;
}

function createFilters(doc, { width, height, strength, prefix, frameGlitch }) {
  const svg = doc.createElementNS(svgNamespace, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("data-chromatic-filters", "");
  svg.style.position = "absolute";
  svg.style.pointerEvents = "none";
  const defs = appendSvg(doc, svg, "defs");
  const map = createRadialMap(width, height, strength);

  for (let level = 1; level <= 6; level++) {
    const shift = strength * level / 6;
    const filter = appendSvg(doc, defs, "filter", {
      id: `${prefix}-${level}`,
      filterUnits: "userSpaceOnUse",
      primitiveUnits: "userSpaceOnUse",
      x: 0, y: 0, width, height,
      "color-interpolation-filters": "sRGB",
    });
    appendSvg(doc, filter, "feImage", {
      href: map, x: 0, y: 0, width, height, preserveAspectRatio: "none", result: "radial-map",
    });
    for (const [channel, values] of Object.entries(channelMatrices)) {
      appendSvg(doc, filter, "feColorMatrix", { in: "SourceGraphic", type: "matrix", values, result: channel });
      if (channel !== "green") appendSvg(doc, filter, "feDisplacementMap", {
        in: channel, in2: "radial-map", scale: channel === "red" ? shift * 2 : -shift * 2,
        xChannelSelector: "R", yChannelSelector: "G", result: `${channel}-shifted`,
      });
    }
    appendSvg(doc, filter, "feComposite", {
      in: "red-shifted", in2: "green", operator: "arithmetic", k2: 1, k3: 1, result: "red-green",
    });
    appendSvg(doc, filter, "feComposite", {
      in: "red-green", in2: "blue-shifted", operator: "arithmetic", k2: 1, k3: 1, result: "rgb",
    });
    // Retain the transparent holes occupied by independently captured media.
    appendSvg(doc, filter, "feComposite", { in: "rgb", in2: "SourceGraphic", operator: "in" });
  }

  if (frameGlitch) appendFrameGlitchFilters(doc, defs, { width, height, prefix, strength: frameGlitch.strength });
  doc.body.append(svg);
  return svg;
}

export function createChromaticEffect({ doc, view, settings }) {
  const options = settings.chromatic ?? {};
  const speed = options.speed ?? 1;
  const strength = Math.max(0, Math.min(24, Number.isFinite(options.strength) ? options.strength : 8));
  const frameGlitch = frameGlitchOptions(settings.frameGlitch);
  const snapshotDuration = 360 / speed;
  const duration = Math.max(snapshotDuration, frameGlitch?.duration ?? 0);
  const prefix = `theme-chromatic-${++sequence}`;
  const media = [];
  let svg = null;

  return {
    speed,
    supported: typeof doc.createElementNS === "function" && view.CSS?.supports("filter", 'url("#chromatic")'),
    prepare() {
      svg = createFilters(doc, { width: view.innerWidth, height: view.innerHeight, strength, prefix, frameGlitch });
      // Named snapshots leave holes in the UI snapshot and stay sharp above it.
      for (const [index, element] of [...doc.querySelectorAll("img, video, canvas, [data-theme-transition-media]")].entries()) {
        media.push({ element, name: element.style.getPropertyValue("view-transition-name"),
          priority: element.style.getPropertyPriority("view-transition-name") });
        element.style.setProperty("view-transition-name", `theme-media-${index}`, "important");
      }
    },
    animate: (root) => [false, true].map((incoming) => {
      const frames = createChromaticFrames(prefix, incoming);
      const layered = frameGlitch ? layerFrameGlitch(frames, { snapshotDuration, duration: frameGlitch.duration, prefix }) : frames;
      return root.animate(layered, {
        duration,
        fill: "both",
        easing: "linear",
        pseudoElement: incoming ? "::view-transition-new(root)" : "::view-transition-old(root)",
      });
    }),
    dispose() {
      for (const { element, name, priority } of media.splice(0)) {
        if (name) element.style.setProperty("view-transition-name", name, priority);
        else element.style.removeProperty("view-transition-name");
      }
      svg?.remove();
      svg = null;
    },
  };
}

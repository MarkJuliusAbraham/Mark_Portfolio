import { appendSvg, svgNamespace } from "./svgFilters.js";

const pulse = [[0, 1], [0.1, 2], [0.22, 3], [0.34, 4], [0.48, 5],
  [0.62, 6], [0.76, 7], [0.9, 8], [1, 0]];
const energy = [0.85, 1, 0.7, 1, 0.55, 0.8, 0.35, 0.15];

const noise = (frame, band) => {
  let seed = Math.imul(frame + 1, 92837111) ^ Math.imul(band + 1, 689287499);
  seed = Math.imul(seed ^ (seed >>> 13), 1274126177);
  return ((seed ^ (seed >>> 16)) >>> 0) / 4294967295;
};

export function frameGlitchOptions(settings) {
  if (!settings?.enabled) return null;
  const duration = Number.isFinite(settings.duration) ? settings.duration : 180;
  const strength = Math.max(0, Math.min(80, Number.isFinite(settings.strength) ? settings.strength : 20));
  const frameRate = Math.max(15, Math.min(120, Number.isFinite(settings.frameRate) ? settings.frameRate : 60));
  return duration > 0 && strength > 0 ? { duration, strength, frameRate } : null;
}

export function frameGlitchPulse(duration, frameRate = 60) {
  let lastTime = -Infinity;
  return pulse.filter(([offset]) => {
    const time = offset * duration;
    if (offset !== 1 && time - lastTime < 1000 / frameRate) return false;
    lastTime = time;
    return true;
  });
}

export function createFrameMap(width, height, frame) {
  const roll = Math.round(128 + (noise(frame, 19) - 0.5) * 10);
  const bands = Array.from({ length: 7 }, (_, band) => {
    const top = Math.floor(height * ((band / 7 + noise(frame, band) * 0.09 + frame * 0.035) % 1));
    const bandHeight = Math.max(2, Math.floor(height * (0.004 + noise(frame, band + 11) * 0.05)));
    const red = Math.round(28 + noise(frame, band + 29) * 200);
    const green = Math.round(128 + (noise(frame, band + 47) - 0.5) * 24);
    return `<rect x="0" y="${top}" width="${width}" height="${Math.min(bandHeight, height - top)}" fill="rgb(${red},${green},128)"/>`;
  }).join("");
  const image = `<svg xmlns="${svgNamespace}" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="rgb(128,${roll},128)"/>${bands}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(image)}`;
}

export function appendFrameGlitchFilters(doc, defs, {
  width, height, strength, prefix, levels = energy.map((_, index) => index + 1),
}) {
  for (const frame of new Set(levels)) {
    const filter = appendSvg(doc, defs, "filter", {
      id: `${prefix}-frame-${frame}`, filterUnits: "userSpaceOnUse", primitiveUnits: "userSpaceOnUse",
      x: 0, y: 0, width, height, "color-interpolation-filters": "sRGB",
    });
    appendSvg(doc, filter, "feImage", {
      href: createFrameMap(width, height, frame), x: 0, y: 0, width, height,
      preserveAspectRatio: "none", result: "signal-map",
    });
    appendSvg(doc, filter, "feDisplacementMap", {
      in: "SourceGraphic", in2: "signal-map", scale: strength * 2 * energy[frame - 1],
      xChannelSelector: "R", yChannelSelector: "G", result: "torn-frame",
    });
  }
}

export function layerFrameGlitch(frames, { snapshotDuration, duration, frameRate = 60, prefix }) {
  const total = Math.max(snapshotDuration, duration);
  const sampledPulse = frameGlitchPulse(duration, frameRate);
  const times = [...new Set([...frames.map((frame) => frame.offset * snapshotDuration),
    ...sampledPulse.map(([offset]) => offset * duration), total])].sort((a, b) => a - b);

  return times.map((time) => {
    const snapshot = frames.findLast((frame) => frame.offset * snapshotDuration <= time);
    const [, level] = sampledPulse.findLast(([offset]) => offset * duration <= time);
    const filters = [snapshot.filter, level ? `url("#${prefix}-frame-${level}")` : "none"];
    return {
      ...snapshot,
      offset: time / total,
      filter: snapshot.opacity ? filters.filter((filter) => filter !== "none").join(" ") || "none" : "none",
    };
  });
}

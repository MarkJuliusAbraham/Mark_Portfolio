export const gridPulses = {
  enabled: true,
  interval: [900, 2600], // Milliseconds between spawn attempts.
  maxActive: 4, // Pulses allowed on screen at once.
  cells: [6, 14], // Grid cells the light travels per pulse.
  speed: [60, 120], // Cruising speed in CSS pixels per second.
  thickness: 1, // Matches the 1px grid line.
  edgeBand: 0.18, // Lights start within this share of the screen from an edge, never mid-screen.
  burnout: 2000, // Milliseconds over which the light slows and dims to nothing together.
};

export const randomBetween = (random, [min, max]) => min + random() * (max - min);

const randomInt = (random, [min, max]) => Math.floor(min + random() * (max - min + 1));

const headings = {
  x: { 1: "to right", [-1]: "to left" },
  y: { 1: "to bottom", [-1]: "to top" },
};

// The burnout never takes more than this share of a pulse's life.
const maxBurnoutShare = 0.6;

// Share of a pulse's life spent brightening from nothing, so the light eases in.
const fadeInShare = 0.15;

/**
 * Picks a random visible point in the band along one screen edge, as an offset from the
 * center. Edges are chosen in proportion to their length so the band is evenly covered.
 * `along` is the screen direction of that edge.
 */
export function pickEdgePoint(random, width, height, band) {
  const vertical = random() * (width + height) < height;
  const side = random() < 0.5 ? -1 : 1;
  const depth = random() * band;
  const spread = random() - 0.5;
  return vertical
    ? { x: side * (0.5 - depth) * width, y: spread * height, along: { x: 0, y: 1 } }
    : { x: spread * width, y: side * (0.5 - depth) * height, along: { x: 1, y: 0 } };
}

/**
 * Places one pulse on a grid line that passes through a random point near a screen edge,
 * running along whichever grid axis lies closest to that edge.
 * `frame` is the visible grid box; `layerSize` is the rotated square the lines are drawn on,
 * centered on that box and turned by `angle` radians. The returned box covers the whole path
 * in layer pixels; `heading` points from where the light starts toward where it ends.
 * `timeline` holds when the burnout starts as a fraction of the pulse's life.
 */
export function createPulse(random, { width, height, layerSize, cellSize, angle }, options = gridPulses) {
  const { cells, speed, thickness, burnout, edgeBand } = { ...gridPulses, ...options };

  // Map an edge point into the unrotated layer (inverse of CSS rotate, y pointing down).
  const { x: px, y: py, along } = pickEdgePoint(random, width, height, edgeBand);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const point = {
    x: cos * px + sin * py + layerSize / 2,
    y: -sin * px + cos * py + layerSize / 2,
  };

  // On screen the layer's x axis points along (cos, sin) and its y axis along (-sin, cos).
  const alongX = Math.abs(cos * along.x + sin * along.y);
  const alongY = Math.abs(-sin * along.x + cos * along.y);
  const axis = alongX >= alongY ? "x" : "y";
  const cross = axis === "x" ? "y" : "x";
  const direction = random() < 0.5 ? 1 : -1;
  const travel = randomInt(random, cells) * cellSize;
  const cruiseTime = (travel / randomBetween(random, speed)) * 1000;

  // Slowing steadily to a halt covers half the distance cruising would in the same time.
  // Short pulses scale the burnout down so the light still gets to run at full brightness.
  const burnoutTime = Math.min(burnout, (cruiseTime * maxBurnoutShare) / (1 - maxBurnoutShare / 2));
  const duration = cruiseTime + burnoutTime / 2;
  const burnStart = 1 - burnoutTime / duration;
  const cruise = duration / cruiseTime; // Share of the path covered per unit of timeline while cruising.

  // Snap onto a line and start at an intersection so the path is centered on the point.
  const line = Math.round(point[cross] / cellSize) * cellSize;
  const origin = Math.round((point[axis] - (direction * travel) / 2) / cellSize) * cellSize;
  const start = direction > 0 ? origin : origin - travel;

  return {
    left: axis === "x" ? start : line,
    top: axis === "x" ? line : start,
    width: axis === "x" ? travel : thickness,
    height: axis === "x" ? thickness : travel,
    travel,
    duration,
    timeline: { burnStart, cruise },
    heading: headings[axis][direction],
  };
}

/** What is left of the light at `offset`: 1 until the burnout, then falling steadily to 0. */
export const burnRemaining = (offset, { burnStart }) =>
  offset <= burnStart ? 1 : 1 - (offset - burnStart) / (1 - burnStart);

/** Share of the path the light has covered at `offset`; its speed falls with what is left. */
export function headProgress(offset, timeline) {
  const { burnStart, cruise } = timeline;
  if (offset <= burnStart) return offset * cruise;
  const remaining = burnRemaining(offset, timeline);
  return burnStart * cruise + ((1 - burnStart) * cruise * (1 - remaining * remaining)) / 2;
}

// Keyframes interpolate linearly, so the slowdown is sampled to read as a smooth curve.
const burnoutSamples = 12;

/** The light cruises along the path, then slows to a halt as it burns out. */
export function pulseKeyframes({ travel, timeline }) {
  const { burnStart } = timeline;
  const samples = Array.from({ length: burnoutSamples - 1 }, (_, index) =>
    burnStart + ((index + 1) * (1 - burnStart)) / burnoutSamples);
  return [0, burnStart, ...samples, 1].map((offset) => ({
    offset,
    "--pulse-head": `${headProgress(offset, timeline) * travel}px`,
  }));
}

/** Eases in, then dims in step with the slowdown, reaching nothing as the light halts. */
export const pulseGlowKeyframes = ({ timeline }) => [
  { opacity: 0, easing: "ease-out" },
  { opacity: 1, offset: Math.min(fadeInShare, timeline.burnStart) },
  { opacity: 1, offset: timeline.burnStart },
  { opacity: 0 },
];

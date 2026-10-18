import { gridLightStops } from "./gridLighting.js";

// Scattered intersections sprout lines, each arm drawing at its own pace.
export const gridOpening = {
  // A clean sheet before the first line appears.
  blank: 120,
  // The window in which randomly chosen intersections start drawing.
  stagger: 180,
  // The longest an arm takes to reach its end; others take 60–100% of this time.
  grow: 360,
};

export const gridOpeningDuration = gridOpening.blank + gridOpening.stagger + gridOpening.grow;

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

// A fixed pseudo-random number from 0 to 1 per lattice point.
export const hash = (x, y, z) => {
  const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Each boundary gets one seed at a real intersection, preferring those inside the viewport. */
export const createOpeningLines = ({ count, span, grid, width, height, seed }) => {
  const intersections = [];
  const cosine = Math.cos(grid.angle);
  const sine = Math.sin(grid.angle);
  for (let row = 0; row <= count; row += 1) {
    for (let column = 0; column <= count; column += 1) {
      const x = column * grid.size - span / 2;
      const y = row * grid.size - span / 2;
      const screenX = grid.centerX + x * cosine - y * sine;
      const screenY = grid.centerY + x * sine + y * cosine;
      const visible = screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height;
      intersections.push({ row, column, x, y, visible, order: hash(column, row, seed) });
    }
  }
  intersections.sort((a, b) => Number(b.visible) - Number(a.visible) || a.order - b.order);

  const claimed = new Set();
  const lines = [];
  for (const point of intersections) {
    // A seed may grow a cross, or just the axis that hasn't already been drawn from elsewhere.
    const delay = lines.length === 0 ? 0 : hash(point.column, point.row, seed + 1) * gridOpening.stagger;
    for (const vertical of [true, false]) {
      const key = `${vertical ? "column" : "row"}:${vertical ? point.column : point.row}`;
      if (claimed.has(key)) continue;
      claimed.add(key);
      const armTime = (arm) => gridOpening.grow * (0.6 + 0.4 * hash(point.column + arm, point.row, seed + (vertical ? 2 : 3)));
      lines.push({
        vertical,
        at: vertical ? point.x : point.y,
        from: vertical ? point.y : point.x,
        delay,
        backward: armTime(1),
        forward: armTime(2),
      });
    }
    if (claimed.size === (count + 1) * 2) break;
  }
  return lines;
};

/**
 * A CSS color expression resolved to something a canvas can paint with, inside `scope` so its
 * variables apply there.
 */
export const resolveColor = (expression, scope = document.body) => {
  const probe = document.createElement("span");
  probe.style.color = expression;
  probe.style.display = "none";
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

/**
 * A resolved color (`rgb(…)`, `rgba(…)` or `color(…)`, as the browser gives them) split into the
 * same color fully opaque and its opacity, from 0 to 1.
 */
export const splitAlpha = (color) => {
  const parts = String(color).match(/^(rgba?|color)\((.*)\)$/);
  if (!parts) return { opaque: color, alpha: 1 };
  const [, name, body] = parts;
  const read = (value) => (value.trim().endsWith("%") ? parseFloat(value) / 100 : parseFloat(value));
  if (body.includes("/")) {
    const [channels, alpha] = body.split("/");
    return { opaque: `${name}(${channels.trim()})`, alpha: Number.isFinite(read(alpha)) ? read(alpha) : 1 };
  }
  const commas = body.split(",");
  if (commas.length === 4) {
    return { opaque: `rgb(${commas.slice(0, 3).map((part) => part.trim()).join(", ")})`, alpha: read(commas[3]) };
  }
  return { opaque: color, alpha: 1 };
};

/** Where the background grid sits, so the squares line up with its lines. */
export const readGrid = () => {
  const grid = document.querySelector(".body-grid");
  const layer = grid?.querySelector(".body-grid-layer");
  const style = grid ? getComputedStyle(grid) : null;
  const bounds = grid?.getBoundingClientRect();
  const centerStrength = parseFloat(style?.getPropertyValue("--body-grid-center"));
  const angle = parseFloat(style?.getPropertyValue("--body-grid-angle"));
  return {
    size: parseFloat(style?.getPropertyValue("--body-grid-size")) || 56,
    angle: (Number.isFinite(angle) ? angle : 28) * (Math.PI / 180),
    // Read the actual CSS layer: deriving it from a canvas that excludes a scrollbar can shift
    // every intersection at the handoff.
    span: layer ? parseFloat(getComputedStyle(layer).width) : 1.5 * Math.max(window.innerWidth, window.innerHeight),
    centerX: bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2,
    centerY: bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2,
    width: bounds?.width || window.innerWidth,
    height: bounds?.height || window.innerHeight,
    centerStrength: Number.isFinite(centerStrength) ? clamp01(centerStrength) : 0.05,
    lineStrength: parseFloat(style?.getPropertyValue("--body-grid-line-strength")) || 10,
  };
};

// How much the screen bulges, as a convex display does: a point at the screen's corner is drawn
// this share closer to the centre, and less so nearer the middle, so straight lines bow outward.
export const gridBulge = 0.11;

/**
 * Where a point on the flat grid (screen px) shows on the bulging screen. A grid with its own
 * `bulge` (0 for one drawn flat, as on a panel that isn't the screen's glass) uses that instead.
 */
export const bend = (grid, x, y) => {
  const bulge = grid.bulge ?? gridBulge;
  if (!bulge) return [x, y];
  const dx = x - grid.centerX;
  const dy = y - grid.centerY;
  const reach = Math.hypot(grid.width, grid.height) / 2;
  const scale = 1 - bulge * (dx * dx + dy * dy) / (reach * reach);
  return [grid.centerX + dx * scale, grid.centerY + dy * scale];
};

/** Where a point seen on the bulging screen (screen px) lies on the flat grid. */
export const unbend = (grid, x, y) => {
  if ((grid.bulge ?? gridBulge) === 0) return [x, y];
  let [flatX, flatY] = [x, y];
  // A few rounds of correcting by what the bend does there is plenty for so gentle a bulge.
  for (let round = 0; round < 4; round += 1) {
    const [shownX, shownY] = bend(grid, flatX, flatY);
    flatX += x - shownX;
    flatY += y - shownY;
  }
  return [flatX, flatY];
};

/**
 * Adds one of the grid's lines to `context`'s path, in screen px, as it shows on the bulging
 * screen: the line `at` across the rotated grid (a column if `vertical`, else a row), from `from`
 * to `to` along it, sampled every `step` px so the bend reads as a curve.
 */
export const traceGridLine = (context, grid, vertical, at, from, to, step = 24) => {
  const cosine = Math.cos(grid.angle);
  const sine = Math.sin(grid.angle);
  const steps = Math.max(1, Math.ceil(Math.abs(to - from) / step));
  for (let index = 0; index <= steps; index += 1) {
    const along = from + (to - from) * (index / steps);
    const x = vertical ? at : along;
    const y = vertical ? along : at;
    const [shownX, shownY] = bend(grid, grid.centerX + x * cosine - y * sine, grid.centerY + x * sine + y * cosine);
    if (index === 0) context.moveTo(shownX, shownY);
    else context.lineTo(shownX, shownY);
  }
};

/**
 * Adds one of the grid's squares to `context`'s path as a closed shape, in screen px, as it shows on
 * the bulging screen: the square from `left` to `right` and `top` to `bottom` across the rotated
 * grid, its edges sampled every `step` px so they bow with the lines around it.
 */
export const traceGridCell = (context, grid, left, top, right, bottom, step = 16) => {
  const cosine = Math.cos(grid.angle);
  const sine = Math.sin(grid.angle);
  const corners = [[left, top], [right, top], [right, bottom], [left, bottom]];
  corners.forEach(([fromX, fromY], side) => {
    const [toX, toY] = corners[(side + 1) % corners.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(toX - fromX, toY - fromY) / step));
    for (let index = 0; index < steps; index += 1) {
      const x = fromX + (toX - fromX) * (index / steps);
      const y = fromY + (toY - fromY) * (index / steps);
      const [shownX, shownY] = bend(grid, grid.centerX + x * cosine - y * sine, grid.centerY + x * sine + y * cosine);
      if (side === 0 && index === 0) context.moveTo(shownX, shownY);
      else context.lineTo(shownX, shownY);
    }
  });
  context.closePath();
};

/** The shared light falloff, optionally transparent so moving light can show behind the lines. */
export const createLinePaint = (context, grid, { width, height }, { emphasis = 1, transparent = false } = {}) => {
  // A screen with no size yet (a tab opened behind others, an embed laid out at nothing) has
  // nothing to light, and a texture of no size can't be made into a pattern.
  if (!width || !height) return "transparent";
  // Cache a small lighting texture once per measurement. A pattern can keep its own transform;
  // a gradient would inherit the rotated grid's transform when painted and lose the ellipse.
  const scale = 256 / Math.max(width, height);
  const surface = document.createElement("canvas");
  surface.width = Math.ceil(width * scale);
  surface.height = Math.ceil(height * scale);
  const light = surface.getContext("2d");
  // For a centered farthest-corner ellipse, each radius is sqrt(2) times its half-axis.
  const radiusX = grid.width / Math.SQRT2;
  const radiusY = grid.height / Math.SQRT2;
  light.setTransform(radiusX * scale, 0, 0, radiusY * scale, grid.centerX * scale, grid.centerY * scale);
  const paint = light.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const [position, strength] of gridLightStops) {
    const opacity = grid.centerStrength + (1 - grid.centerStrength) * strength;
    paint.addColorStop(position, resolveColor(`color-mix(in srgb, var(--nier-foreground) ${Math.min(100, grid.lineStrength * opacity * emphasis)}%, ${transparent ? "transparent" : "var(--background)"})`));
  }
  light.fillStyle = paint;
  light.fillRect(-grid.centerX / radiusX, -grid.centerY / radiusY, width / radiusX, height / radiusY);
  const pattern = context.createPattern(surface, "no-repeat");
  pattern.setTransform(new DOMMatrix()
    .rotate(-grid.angle * 180 / Math.PI)
    .translate(-grid.centerX, -grid.centerY)
    .scale(1 / scale));
  return pattern;
};


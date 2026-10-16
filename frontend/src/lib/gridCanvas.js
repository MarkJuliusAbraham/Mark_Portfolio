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

/** A CSS color expression resolved to something a canvas can paint with. */
export const resolveColor = (expression) => {
  const probe = document.createElement("span");
  probe.style.color = expression;
  probe.style.display = "none";
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
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

/** The shared light falloff, optionally transparent so moving light can show behind the lines. */
export const createLinePaint = (context, grid, { width, height }, { emphasis = 1, transparent = false } = {}) => {
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


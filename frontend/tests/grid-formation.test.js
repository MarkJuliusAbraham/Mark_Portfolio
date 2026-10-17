import test from "node:test";
import assert from "node:assert/strict";
import { createGridFormation, gridHandoff } from "../src/lib/gridFormation.js";
import { bend, gridBulge, gridOpening, gridOpeningDuration, readGrid, unbend } from "../src/lib/gridCanvas.js";

function environment(t) {
  let now = 0;
  let nextFrame = 0;
  let rectangles = [];
  // Lines are cut as stroked paths; each stroke keeps its lines (one per moveTo) as point lists.
  let strokes = [];
  let path = [];
  const frames = new Map();
  const listeners = new Map();
  const observers = new Set();
  const size = { width: 1425, height: 900 };
  const layer = {};
  const grid = { querySelector: () => layer, getBoundingClientRect: () => ({ left: 0, top: 0, ...size }) };
  const properties = { "--body-grid-size": "56px", "--body-grid-angle": "0deg", "--body-grid-center": "0.05", "--body-grid-line-strength": "6.5%" };
  const light = { setTransform() {}, fillRect() {}, createRadialGradient: () => ({ addColorStop() {} }) };
  const context = {
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    setTransform() {}, translate() {}, rotate() {},
    createPattern: () => ({ setTransform() {} }),
    lineWidth: 1,
    fillRect(...bounds) {
      if (bounds[0] === 0 && bounds[1] === 0 && bounds[2] === size.width && bounds[3] === size.height) {
        rectangles = [];
        strokes = [];
      }
      rectangles.push({ bounds, alpha: this.globalAlpha, operation: this.globalCompositeOperation });
    },
    beginPath() { path = []; },
    moveTo(x, y) { path.push([[x, y]]); },
    lineTo(x, y) { path.at(-1).push([x, y]); },
    stroke() {
      if (path.length) strokes.push({ lines: path, width: this.lineWidth, alpha: this.globalAlpha, operation: this.globalCompositeOperation });
    },
  };
  const canvas = { getContext: () => context, getBoundingClientRect: () => size };
  const globals = {
    performance: { now: () => now },
    requestAnimationFrame: (callback) => { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame: (id) => frames.delete(id),
    window: {
      innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1,
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
    document: {
      documentElement: {},
      querySelector: () => grid,
      createElement: (tag) => tag === "canvas" ? { getContext: () => light } : { style: {}, remove() {} },
      body: { append() {} },
    },
    getComputedStyle: (element) => element === grid ? { getPropertyValue: (key) => properties[key] } : element === layer ? { width: "2160px" } : { color: "#dedbc8" },
    DOMMatrix: class { rotate() { return this; } translate() { return this; } scale() { return this; } },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; }
      observe() { observers.add(this); }
      disconnect() { observers.delete(this); }
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }
  return {
    canvas, frames, listeners, observers,
    themeChange() { observers.forEach((observer) => observer.callback()); },
    get rectangles() { return rectangles; },
    get strokes() { return strokes.filter(({ operation }) => operation === "destination-out"); },
    get lines() { return this.strokes.flatMap(({ lines }) => lines); },
    get linePaint() { return rectangles.find(({ operation }) => operation === "destination-over"); },
    tick(time) {
      now = time;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(time));
    },
  };
}

test("formation starts blank and holds the completed grid without a running frame loop", async (t) => {
  const env = environment(t);
  const grid = createGridFormation(env.canvas);
  env.tick(gridOpening.blank - 1);
  assert.equal(env.rectangles.length, 1, "only the opaque background is painted during the blank lead-in");
  assert.equal(env.lines.length, 0, "no line is cut before the lead-in ends");
  env.tick(gridOpeningDuration);
  await grid.formed;
  assert.ok(env.lines.length > 20);
  assert.ok(env.strokes.every(({ width, alpha }) => width === 1 && alpha === 1), "only formed one-pixel strokes open the cover to the light beneath it");
  assert.equal(env.rectangles.at(-1), env.linePaint, "the shared tint paints into those openings once, after the cover is cut");
  assert.equal(env.frames.size, 0, "a slow asset request does not keep repainting a finished grid");
  grid.dispose();
});

test("settling dims the same grid without shrinking, moving, or revealing through its cover", async (t) => {
  const env = environment(t);
  const grid = createGridFormation(env.canvas);
  env.tick(gridOpeningDuration);
  await grid.formed;
  const before = env.lines;
  const settled = grid.settle();
  await Promise.resolve();
  env.tick(gridOpeningDuration + gridHandoff.settle / 2);
  assert.ok(env.linePaint.alpha < 1 && env.linePaint.alpha > 1 / gridHandoff.emphasis);
  assert.ok(env.strokes.every(({ alpha }) => alpha === 1), "dimming the line tint does not close its opening to the moving light");
  assert.equal(env.rectangles[0].alpha, 1, "the cover stays opaque until UI readiness");
  env.tick(gridOpeningDuration + gridHandoff.settle);
  await settled;
  assert.deepEqual(env.lines, before);
  assert.ok(Math.abs(env.linePaint.alpha - 1 / gridHandoff.emphasis) < 1e-9);
  assert.equal(env.frames.size, 0);
  env.themeChange();
  assert.deepEqual(env.lines, before, "a theme change repaints the persistent canvas without moving the grid");
  assert.equal(env.frames.size, 0, "theme updates do not restart formation");
  grid.dispose();
});

test("an early settle waits for formation, and disposal resolves pending work and removes listeners", async (t) => {
  const env = environment(t);
  const grid = createGridFormation(env.canvas);
  let finished = false;
  const settling = grid.settle().then(() => { finished = true; });
  env.tick(gridOpeningDuration - 1);
  await Promise.resolve();
  assert.equal(finished, false);
  grid.dispose();
  await settling;
  assert.equal(finished, true);
  assert.equal(env.frames.size, 0);
  assert.equal(env.listeners.size, 0);
  assert.equal(env.observers.size, 0);
});

test("reduced motion uses a static grid and geometry comes from the actual CSS layer", async (t) => {
  const env = environment(t);
  assert.equal(readGrid().span, 2160, "read CSS geometry even when the canvas excludes a scrollbar");
  assert.equal(readGrid().angle, 0, "zero degrees is a valid grid angle");
  const grid = createGridFormation(env.canvas, { animate: false });
  await grid.formed;
  await grid.settle();
  assert.ok(env.lines.length > 20);
  assert.equal(env.frames.size, 0);
  assert.ok([...env.rectangles, ...env.strokes].every(({ alpha }) => alpha === 1));
  grid.dispose();
  assert.equal(env.listeners.size, 0);
});

test("the screen bulges: lines bow outward, more toward the edges, and the centre stays put", async (t) => {
  const env = environment(t);
  const grid = readGrid();
  assert.deepEqual(bend(grid, grid.centerX, grid.centerY), [grid.centerX, grid.centerY], "the centre doesn't move");
  const corner = bend(grid, 0, 0);
  const reach = Math.hypot(grid.width, grid.height) / 2;
  assert.ok(Math.abs(Math.hypot(corner[0] - grid.centerX, corner[1] - grid.centerY) - reach * (1 - gridBulge)) < 1e-9, "a corner is drawn closer to the centre by the bulge");
  const seen = bend(grid, 200, 120);
  const [flatX, flatY] = unbend(grid, ...seen);
  assert.ok(Math.abs(flatX - 200) < 0.05 && Math.abs(flatY - 120) < 0.05, "unbend finds the flat point a shown one came from");

  const formation = createGridFormation(env.canvas, { animate: false });
  await formation.formed;
  // A column far from the middle, sampled down its length, leans in toward the centre at both ends.
  const sideways = (line) => Math.max(...line.map(([x]) => x)) - Math.min(...line.map(([x]) => x));
  const columns = env.lines.filter((line) => Math.abs(line[0][0] - line.at(-1)[0]) < 1);
  const outer = columns.reduce((far, line) => Math.abs(line[0][0] - grid.centerX) > Math.abs(far[0][0] - grid.centerX) ? line : far);
  const middle = columns.reduce((near, line) => Math.abs(line[0][0] - grid.centerX) < Math.abs(near[0][0] - grid.centerX) ? line : near);
  assert.ok(sideways(outer) > 5, "an outer line bows");
  assert.ok(sideways(middle) < sideways(outer), "a line through the middle bows least");
  formation.dispose();
});

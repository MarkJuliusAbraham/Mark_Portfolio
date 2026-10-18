import test from "node:test";
import assert from "node:assert/strict";
import { bend, traceGridCell } from "../src/lib/gridCanvas.js";

const recorder = () => {
  const points = [];
  let closed = false;
  return {
    points,
    get closed() { return closed; },
    moveTo(x, y) { points.push(["move", x, y]); },
    lineTo(x, y) { points.push(["line", x, y]); },
    closePath() { closed = true; },
  };
};

const grid = { angle: 0, centerX: 500, centerY: 400, width: 1000, height: 800 };

test("a square is traced as one closed shape starting at its corner on the bulging screen", () => {
  const path = recorder();
  traceGridCell(path, grid, 100, -300, 156, -244);
  assert.equal(path.points[0][0], "move");
  assert.equal(path.points.filter(([kind]) => kind === "move").length, 1, "one continuous outline");
  assert.ok(path.closed);
  const [, x, y] = path.points[0];
  const [expectedX, expectedY] = bend(grid, grid.centerX + 100, grid.centerY - 300);
  assert.ok(Math.abs(x - expectedX) < 1e-9 && Math.abs(y - expectedY) < 1e-9);
});

test("its edges bow with the lines, so a square away from the middle isn't drawn straight", () => {
  const path = recorder();
  // A tall square toward the screen's edge, so the bow along its side is plain to measure.
  traceGridCell(path, grid, 380, -350, 436, 350, 16);
  const right = path.points.filter(([, x]) => x > grid.centerX + 300);
  const xs = right.map(([, x]) => x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 1, "its far side curves rather than running straight");
});

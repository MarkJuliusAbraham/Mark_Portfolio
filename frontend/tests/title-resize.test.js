import test from "node:test";
import assert from "node:assert/strict";
import { dragScale, resistedScale, settledScale, titleScaleLimits } from "../src/components/organisms/Hero/accents/titleResize.js";

const box = { startScale: 1, width: 120, height: 24 };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test("dragging a corner away from the box grows it, toward the box shrinks it", () => {
  close(dragScale({ ...box, corner: "br", dx: 12, dy: 2.4 }), 1.1);
  close(dragScale({ ...box, corner: "br", dx: -12, dy: -2.4 }), 0.9);
  // Mirrored corners grow in their own outward directions.
  close(dragScale({ ...box, corner: "tl", dx: -12, dy: -2.4 }), 1.1);
  close(dragScale({ ...box, corner: "tr", dx: 12, dy: -2.4 }), 1.1);
  close(dragScale({ ...box, corner: "bl", dx: -12, dy: 2.4 }), 1.1);
});

test("a drag builds on the size the title already had", () => {
  close(dragScale({ ...box, startScale: 1.2, corner: "br", dx: 12, dy: 2.4 }), 1.32);
});

test("within the limits the box follows the pointer exactly", () => {
  assert.deepEqual(resistedScale(1.2), { scale: 1.2, limit: null });
  assert.deepEqual(resistedScale(titleScaleLimits.max), { scale: titleScaleLimits.max, limit: null });
});

test("past a limit it resists, and never stretches more than a little", () => {
  const justPast = resistedScale(1.5);
  assert.equal(justPast.limit, "max");
  close(justPast.scale, 1.415);
  assert.equal(resistedScale(5).scale, 1.45);
  const below = resistedScale(0.65);
  assert.equal(below.limit, "min");
  close(below.scale, 0.735);
  assert.equal(resistedScale(0).scale, 0.7);
});

test("letting go springs back inside the limits", () => {
  assert.equal(settledScale(1.45), 1.4);
  assert.equal(settledScale(0.7), 0.75);
  assert.equal(settledScale(1.1), 1.1);
});

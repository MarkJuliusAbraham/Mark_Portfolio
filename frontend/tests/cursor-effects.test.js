import test from "node:test";
import assert from "node:assert/strict";
import { getCursorGhost, getCursorMovement, getCursorSplit } from "../src/components/organisms/Sidebar/cursorEffects.js";

// Behavior tests use explicit options so editing the visual preset stays safe.
const chromatic = { maxOffset: 1.65, speedResponse: 2.5, opacity: 0.7 };
const ghosting = { enabled: true, maxDistance: 7.5, lag: 6, maxOpacity: 0.14, opacityResponse: 0.11 };

test("color separation follows travel and the ghost trails behind in every direction", () => {
  for (const [dx, dy] of [[0, 20], [0, -20], [20, 0], [-20, 0], [12, -16]]) {
    const movement = getCursorMovement(dx, dy, 16);
    const split = getCursorSplit(movement, chromatic);
    const ghost = getCursorGhost(movement, ghosting);
    assert.ok(split.x * dx + split.y * dy > 0);
    assert.ok(ghost.x * dx + ghost.y * dy < 0);
    assert.ok(Math.hypot(ghost.x, ghost.y) <= 7.5);
    assert.ok(ghost.opacity > 0 && ghost.opacity <= 0.14);
  }
});

test("ghost settings can independently change distance, visibility, response, or disable it", () => {
  const movement = getCursorMovement(0, 16, 16);
  assert.deepEqual(getCursorGhost(movement, { ...ghosting, maxDistance: 3, maxOpacity: 0.05 }), { x: -0, y: -3, opacity: 0.05 });
  assert.deepEqual(getCursorGhost(movement, { ...ghosting, lag: 2, opacityResponse: 0.04 }), { x: -0, y: -2, opacity: 0.04 });
  assert.deepEqual(getCursorGhost(movement, { ...ghosting, enabled: false }), { x: 0, y: 0, opacity: 0 });
  const stationary = getCursorGhost(getCursorMovement(0, 0, 16), ghosting);
  assert.equal(stationary.opacity, 0);
  assert.equal(Math.hypot(stationary.x, stationary.y), 0);
});

test("the same physical speed produces the same ghost at different frame rates", () => {
  const slowFrames = getCursorGhost(getCursorMovement(0, 16, 16), ghosting);
  const fastFrames = getCursorGhost(getCursorMovement(0, 8, 8), ghosting);
  assert.deepEqual(fastFrames, slowFrames);
});

import test from "node:test";
import assert from "node:assert/strict";
import { burnRemaining, createGlowSource, createPulse, headProgress, pickEdgePoint, pulseGlow, pulseGlowKeyframes, pulseHead, pulseKeyframes } from "../src/components/organisms/BodyGrid/gridPulses.js";
import { gridLightAt } from "../src/lib/gridLighting.js";

// Explicit options keep these checks independent of the visual preset.
const options = { cells: [4, 8], speed: [100, 200], thickness: 1, burnout: 1200, edgeBand: 0.18 };
const frame = { width: 1200, height: 800, layerSize: 2400, cellSize: 48 };

const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const isMultiple = (value, size) => Math.abs(value / size - Math.round(value / size)) < 1e-9;
const px = (value) => parseFloat(value);

test("pulse paths sit on a grid line between two intersections", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const pulse = createPulse(seeded(seed), { ...frame, angle: 0 }, options);
    const horizontal = pulse.height === 1;
    const { burnStart, cruise } = pulse.timeline;

    assert.ok(isMultiple(pulse.left, 48) && isMultiple(pulse.top, 48));
    assert.equal(horizontal ? pulse.width : pulse.height, pulse.travel);
    assert.ok(pulse.travel >= 4 * 48 && pulse.travel <= 8 * 48);
    assert.ok(horizontal ? /^to (left|right)$/.test(pulse.heading) : /^to (top|bottom)$/.test(pulse.heading));
    // Cruising speed stays inside the configured range.
    const cruiseSpeed = (cruise * pulse.travel) / (pulse.duration / 1000);
    assert.ok(cruiseSpeed >= 100 - 1e-6 && cruiseSpeed <= 200 + 1e-6);
    // The burnout never eats more than 60% of a pulse's life.
    assert.ok(burnStart >= 0.4 - 1e-9 && burnStart < 1);
    assert.ok(Math.abs(headProgress(1, pulse.timeline) - 1) < 1e-9);
  }
});

test("start points stay in the edge band and never land mid-screen", () => {
  for (let seed = 1; seed <= 500; seed++) {
    const { x, y, along } = pickEdgePoint(seeded(seed), 1200, 800, 0.18);
    const fromSide = 600 - Math.abs(x);
    const fromTop = 400 - Math.abs(y);
    assert.ok(fromSide >= 0 && fromTop >= 0, "inside the screen");
    // Along a side edge the point is near that side; along a top or bottom edge, near that one.
    if (along.y === 1) assert.ok(fromSide <= 0.18 * 1200 + 1e-9);
    else assert.ok(fromTop <= 0.18 * 800 + 1e-9);
  }
});

test("lights run along their edge in the band at any grid angle", () => {
  for (const degrees of [0, 30, 45, 90, -60]) {
    const angle = (degrees * Math.PI) / 180;
    for (let seed = 1; seed <= 100; seed++) {
      const pulse = createPulse(seeded(seed), { ...frame, angle }, options);
      // Path midpoint and direction, mapped back from layer to screen space.
      const lx = pulse.left + pulse.width / 2 - frame.layerSize / 2;
      const ly = pulse.top + pulse.height / 2 - frame.layerSize / 2;
      const sx = Math.cos(angle) * lx - Math.sin(angle) * ly;
      const sy = Math.sin(angle) * lx + Math.cos(angle) * ly;
      const horizontal = pulse.height === 1;
      const dx = horizontal ? Math.cos(angle) : -Math.sin(angle);
      const dy = horizontal ? Math.sin(angle) : Math.cos(angle);

      // Within a cell (snapping) of the band along a side edge or a top/bottom edge.
      const slack = frame.cellSize;
      const nearSide = Math.abs(sx) >= frame.width / 2 - 0.18 * frame.width - slack && Math.abs(sx) <= frame.width / 2 + slack;
      const nearTop = Math.abs(sy) >= frame.height / 2 - 0.18 * frame.height - slack && Math.abs(sy) <= frame.height / 2 + slack;
      assert.ok(nearSide || nearTop, `mid-screen at ${degrees}deg`);
      // The path leans along an edge rather than heading inward; 45deg is the tie.
      assert.ok(nearSide ? Math.abs(dy) >= Math.SQRT1_2 - 1e-9 || nearTop : Math.abs(dx) >= Math.SQRT1_2 - 1e-9 || nearSide);
    }
  }
});

// Cruising covers 0.6 * 1.25 = 75% of the path; slowing to a halt covers the last 25%.
const timeline = { burnStart: 0.6, cruise: 1.25 };
const pulse = { travel: 480, timeline };
const step = 1e-4;
const speedAt = (offset) => (headProgress(offset + step, timeline) - headProgress(offset, timeline)) / step;

test("the light cruises, then slows smoothly to a halt exactly as it burns out", () => {
  assert.equal(headProgress(0, timeline), 0);
  assert.equal(headProgress(0.6, timeline), 0.75);
  assert.ok(Math.abs(headProgress(1, timeline) - 1) < 1e-12);
  // No jolt where the burnout begins, and at rest by the end.
  assert.ok(Math.abs(speedAt(0.6 - step) - speedAt(0.6)) < 1e-3);
  assert.ok(speedAt(1 - step) < 1e-3);
});

test("speed and brightness fall at the same rate during the burnout", () => {
  const glow = pulseGlowKeyframes(pulse);
  const [from, to] = [glow.at(-2), glow.at(-1)];
  for (let offset = 0.6; offset < 1 - step; offset += 0.05) {
    const remaining = burnRemaining(offset, timeline);
    const opacity = from.opacity + ((to.opacity - from.opacity) * (offset - from.offset)) / (1 - from.offset);
    assert.ok(Math.abs(opacity - remaining) < 1e-9, "brightness");
    assert.ok(Math.abs(speedAt(offset) / speedAt(0.3) - remaining) < 1e-3, "speed");
  }
});

test("keyframes follow the light along the whole path in order", () => {
  const frames = pulseKeyframes(pulse);
  const offsets = frames.map((frame) => frame.offset);
  assert.deepEqual([offsets[0], offsets.at(-1)], [0, 1]);
  offsets.slice(1).forEach((offset, index) => assert.ok(offset > offsets[index]));
  frames.forEach((frame) => assert.ok(Math.abs(px(frame["--pulse-head"]) - headProgress(frame.offset, timeline) * 480) < 1e-9));
});

test("the light eases in rather than popping on", () => {
  const glow = pulseGlowKeyframes(pulse);
  assert.equal(glow[0].opacity, 0);
  assert.equal(glow[0].easing, "ease-out");
  assert.deepEqual([glow[1].offset, glow[1].opacity], [0.15, 1]);
});

test("a pulse's light, for the squares: brightness follows its glow, and its head runs its path", () => {
  const timeline = { burnStart: 0.7, cruise: 1.2 };
  assert.equal(pulseGlow(0, timeline), 0, "nothing at the start");
  assert.equal(pulseGlow(0.5, timeline), 1, "full while it cruises");
  assert.ok(pulseGlow(0.85, timeline) > 0 && pulseGlow(0.85, timeline) < 1, "dimming as it burns out");
  assert.equal(pulseGlow(1, timeline), 0, "nothing once it halts");
  assert.ok(pulseGlow(0.05, timeline) > 0 && pulseGlow(0.05, timeline) < 1, "easing in");

  const path = { left: 100, top: 300, width: 560, height: 1, travel: 560, timeline };
  const right = pulseHead({ ...path, heading: "to right" }, 0);
  const left = pulseHead({ ...path, heading: "to left" }, 0);
  assert.deepEqual(right, { x: 100, y: 300.5 }, "heading right, it starts at the path's left end, on the line's middle");
  assert.deepEqual(left, { x: 660, y: 300.5 }, "heading left, at its right end");
  assert.ok(pulseHead({ ...path, heading: "to right" }, 0.5).x > right.x, "and moves along it");
  const down = pulseHead({ left: 300, top: 100, width: 1, height: 560, travel: 560, timeline, heading: "to bottom" }, 0);
  assert.deepEqual(down, { x: 300.5, y: 100 });
});

test("the source lists each live pulse's light and tells listeners when one starts", () => {
  const source = createGlowSource();
  let heard = 0;
  const stop = source.subscribe(() => { heard += 1; });
  const live = () => ({ x: 1, y: 2, radius: 3, strength: 1 });
  const done = () => null;
  source.add(live);
  source.add(done);
  assert.equal(heard, 2);
  assert.deepEqual(source.list(), [{ x: 1, y: 2, radius: 3, strength: 1 }], "a finished one drops out");
  source.remove(live);
  assert.deepEqual(source.list(), []);
  stop();
  source.add(live);
  assert.equal(heard, 2, "a listener that stopped hears nothing more");
});

test("the squares fade toward the middle of the screen as the grid's light does", () => {
  assert.ok(Math.abs(gridLightAt(0, 0, 1200, 800, 0.05) - 0.05) < 1e-9, "only the centre share in the middle");
  assert.ok(Math.abs(gridLightAt(600, 400, 1200, 800, 0.05) - 1) < 1e-9, "full in the corners");
  assert.ok(gridLightAt(300, 0, 1200, 800, 0.05) < gridLightAt(550, 0, 1200, 800, 0.05), "rising outward");
});

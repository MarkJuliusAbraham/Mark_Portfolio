import test from "node:test";
import assert from "node:assert/strict";
import { createWaveFrames } from "../src/utility/theme-transition/waveGeometry.js";
import { createThemeTransition } from "../src/utility/theme-transition/themeTransition.js";
import { environment } from "./helpers/themeEnvironment.js";

const rectangles = (frame) => [...frame.clipPath.matchAll(/M([\d.]+),([\d.]+)H([\d.]+)V([\d.]+)H[\d.]+Z/g)]
  .map((match) => ({ left: +match[1], top: +match[2], right: +match[3], bottom: +match[4] }));

const contains = (frame, x, y) => rectangles(frame)
  .filter((rect) => x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom).length % 2 === 1;

test("the reveal starts empty, grows monotonically, and covers every viewport corner", () => {
  for (const [width, height] of [[390, 844], [1440, 900], [3840, 2160]]) {
    for (const origin of [{ x: 0, y: 0 }, { x: width, y: height }, { x: 120, y: height - 60 }]) {
      const frames = createWaveFrames({ width, height, origin, blockSize: 40 });
      const points = [[1, 1], [width - 1, 1], [1, height - 1], [width - 1, height - 1], [width / 2, height / 2]];
      for (const [x, y] of points) {
        assert.equal(contains(frames[0], x, y), false);
        assert.equal(contains(frames.at(-1), x, y), true);
        const visible = frames.map((frame) => contains(frame, x, y));
        const firstVisible = visible.indexOf(true);
        assert.ok(visible.slice(firstVisible).every(Boolean));
      }
    }
  }
});

test("volume changes block boundaries, including partial cells at screen edges", () => {
  for (const blockSize of [8, 40, 96, 1000]) {
    const width = 390;
    const height = 844;
    const frames = createWaveFrames({ width, height, origin: { x: 200, y: 32 }, blockSize });
    for (const frame of frames) {
      for (const rect of rectangles(frame)) {
        assert.ok(rect.left >= 0 && rect.right <= width);
        assert.ok(rect.top >= 0 && rect.bottom <= height);
        assert.equal(rect.left % (blockSize / 2), 0);
        assert.ok(rect.right === width || rect.right % (blockSize / 2) === 0);
        assert.equal(rect.top % (blockSize / 2), 0);
        assert.ok(rect.bottom === height || rect.bottom % (blockSize / 2) === 0);
      }
    }
    assert.equal(contains(frames.at(-1), width - 1, height - 1), true);
  }
});

test("the boundary has new-theme islands outside and old-theme holes inside", () => {
  const frames = createWaveFrames({ width: 640, height: 480, origin: { x: 0, y: 0 }, blockSize: 40 });
  const frame = frames[Math.floor(frames.length / 2)];
  const reach = 840 * frame.offset;
  let islands = 0;
  let holes = 0;
  for (let y = 10; y < 480; y += 20) {
    for (let x = 10; x < 640; x += 20) {
      const body = Math.hypot((Math.floor(x / 40) + 0.5) * 40, (Math.floor(y / 40) + 0.5) * 40) <= reach;
      const visible = contains(frame, x, y);
      if (!body && visible) islands++;
      if (body && !visible) holes++;
    }
  }
  assert.ok(islands > 0);
  assert.ok(holes > 0);
});

test("normal transitions commit once, animate the snapshot, and release their resources", async () => {
  const env = environment();
  const controller = createThemeTransition({ ...env, settings: { speed: 1, volume: 40 } });
  let commits = 0;
  await controller.run(() => { commits++; }, { x: 120, y: 780 });
  assert.equal(commits, 1);
  assert.equal(env.animations[0].options.pseudoElement, "::view-transition-new(root)");
  assert.equal(env.animations[0].options.duration, 550);
  assert.equal(env.attributes.size, 0);
  assert.equal(env.viewListeners.size + env.docListeners.size, 0);
});

test("speed controls travel time and volume controls the grid", async () => {
  for (const [speed, volume, duration] of [[2, 80, 275], [0.5, 24, 1100]]) {
    const env = environment();
    await createThemeTransition({ ...env, settings: { speed, volume } }).run(() => {});
    assert.equal(env.animations[0].options.duration, duration);
    assert.equal(rectangles(env.animations[0].frames[0])[0].bottom, volume);
  }
});

test("reduced motion and unsupported browsers switch immediately", async () => {
  for (const options of [{ reducedMotion: true }, { supported: false }]) {
    const env = environment(options);
    let commits = 0;
    await createThemeTransition(env).run(() => { commits++; });
    assert.equal(commits, 1);
    assert.equal(env.captures.length, 0);
    assert.equal(env.animations.length, 0);
    assert.equal(env.attributes.size, 0);
  }
});

test("failed captures preserve the selected mode and remove the mask", async () => {
  const env = environment({ rejectCapture: true });
  let commits = 0;
  await createThemeTransition(env).run(() => { commits++; });
  assert.equal(commits, 1);
  assert.equal(env.attributes.size, 0);
});

test("rapid toggles retain both intentions without stale cleanup hiding the latest wave", async () => {
  const env = environment({ holdCapture: true });
  const controller = createThemeTransition(env);
  let dark = false;
  let commits = 0;
  const update = () => { dark = !dark; commits++; };
  const first = controller.run(update);
  const second = controller.run(update);
  await first;
  assert.equal(commits, 1);
  assert.equal(env.attributes.has("data-theme-wave"), true);
  env.captures[1].commit();
  await second;
  assert.equal(commits, 2);
  assert.equal(dark, false);
  assert.equal(env.attributes.size, 0);
});

test("resizing finishes the chosen mode, while disposal does not update an unmounted owner", async () => {
  for (const action of ["resize", "dispose"]) {
    const env = environment({ holdCapture: true });
    const controller = createThemeTransition(env);
    let commits = 0;
    const pending = controller.run(() => { commits++; });
    if (action === "resize") env.viewListeners.get("resize")();
    else controller.dispose();
    await pending;
    assert.equal(commits, action === "resize" ? 1 : 0);
    assert.equal(env.attributes.size, 0);
    assert.equal(env.viewListeners.size + env.docListeners.size, 0);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { environment } from "./helpers/themeEnvironment.js";
import { pulse } from "../src/lib/theme-transition/chromaticTransition.js";
import { createElementFrames, createElementGlitch, switchPoint } from "../src/lib/theme-transition/elementChromatic.js";

// A page with a 200 × 120 item, timers, and animations that finish on demand.
function setup({ reducedMotion = false, randoms = [0.1, 0.3, 0.5, 0.7, 0.9, 0.2] } = {}) {
  const env = environment({ reducedMotion });
  const timers = [];
  env.view.setTimeout = (callback, delay) => {
    timers.push({ callback, delay });
    return timers.length;
  };
  env.view.clearTimeout = (id) => {
    if (timers[id - 1]) timers[id - 1].cleared = true;
  };
  const animations = [];
  const item = {
    getBoundingClientRect: () => ({ width: 200, height: 120 }),
    animate: (frames, options) => {
      let finish;
      const animation = { frames, options, cancelled: false, finished: new Promise((resolve) => { finish = resolve; }) };
      animation.cancel = () => { animation.cancelled = true; };
      animation.finish = finish;
      animations.push(animation);
      return animation;
    },
  };
  let index = 0;
  const random = () => randoms[index++ % randoms.length];
  const glitch = createElementGlitch(item, { doc: env.doc, view: env.view, settings: { speed: 1, strength: 8 }, random });
  const filters = () => env.doc.body.children[0]?.children[0]?.children ?? [];
  return { env, timers, animations, glitch, filters };
}

const attr = (node, name) => node.attributes.get(name);
const primitives = (filter) => filter.children.map((child) => child.tag);

test("builds filters only for the levels the pulse uses, with offsets instead of a displacement map", () => {
  const { glitch, filters } = setup();
  glitch.prepare();
  const used = new Set(pulse.map(([, level]) => level).filter(Boolean));
  assert.equal(filters().length, used.size);
  for (const filter of filters()) {
    assert.deepEqual(primitives(filter), ["feColorMatrix", "feOffset", "feColorMatrix", "feColorMatrix", "feOffset", "feComposite", "feComposite"]);
  }
});

test("each filter region is the item's exact size plus room for the furthest shift", () => {
  const { glitch, filters } = setup();
  glitch.prepare();
  // Strength 8, so 8px of shift plus 8px for content drawn just outside the item.
  for (const filter of filters()) {
    assert.equal(attr(filter, "filterUnits"), "userSpaceOnUse");
    assert.deepEqual(["x", "y", "width", "height"].map((name) => attr(filter, name)), [-16, -16, 232, 152]);
  }
});

test("filters are built once and reused; each run only re-aims the offsets", () => {
  const { env, glitch, filters, animations } = setup({ randoms: [0.1, 0.35, 0.6, 0.85, 0.15, 0.4, 0.65, 0.9, 0.25, 0.5, 0.75, 0.05] });
  glitch.prepare();
  const svg = env.doc.body.children[0];
  const before = filters().map((filter) => attr(filter.children[1], "dx"));
  glitch.run(() => {});
  animations[0].finish();
  assert.equal(env.doc.body.children.length, 1);
  assert.equal(env.doc.body.children[0], svg);
  const after = filters().map((filter) => attr(filter.children[1], "dx"));
  assert.notDeepEqual(after, before);
});

test("red and blue move in opposite directions, scaled by level", () => {
  const { glitch, filters } = setup();
  glitch.prepare();
  for (const filter of filters()) {
    const [red, blue] = [filter.children[1], filter.children[4]];
    assert.ok(Math.abs(attr(red, "dx") + attr(blue, "dx")) < 1e-9);
    assert.ok(Math.abs(attr(red, "dy") + attr(blue, "dy")) < 1e-9);
    const level = Number(attr(filter, "id").split("-").at(-1));
    assert.ok(Math.abs(Math.hypot(attr(red, "dx"), attr(red, "dy")) - (8 * level) / 6) < 1e-9);
  }
});

test("switches at the same peak as the page-wide transition and ends unfiltered", () => {
  const { glitch, timers, animations } = setup();
  let switches = 0;
  glitch.run(() => switches++);
  assert.equal(timers[0].delay, 360 * switchPoint);
  assert.equal(switchPoint, 0.16);
  assert.equal(switches, 0);
  timers[0].callback();
  assert.equal(switches, 1);
  assert.equal(animations[0].frames.at(-1).filter, "none");
  assert.deepEqual(animations[0].frames, createElementFrames(animations[0].frames[0].filter.match(/#(.+)-\d/)[1]));
});

test("stopping early still switches exactly once", () => {
  const { glitch, animations } = setup();
  let switches = 0;
  const stop = glitch.run(() => switches++);
  stop();
  stop();
  assert.equal(animations[0].cancelled, true);
  assert.equal(switches, 1);
});

test("reduced motion switches straight away and builds nothing", () => {
  const { env, glitch, animations } = setup({ reducedMotion: true });
  let switches = 0;
  glitch.run(() => switches++);
  assert.equal(switches, 1);
  assert.equal(animations.length, 0);
  assert.equal(env.doc.body.children.length, 0);
});

test("dispose removes the filters", () => {
  const { env, glitch } = setup();
  glitch.prepare();
  assert.equal(env.doc.body.children.length, 1);
  glitch.dispose();
  assert.equal(env.doc.body.children.length, 0);
});

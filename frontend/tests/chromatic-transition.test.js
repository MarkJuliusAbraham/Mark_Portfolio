import test from "node:test";
import assert from "node:assert/strict";
import { createChannelDirections, createChromaticEffect, createChromaticFrames } from "../src/lib/theme-transition/chromaticTransition.js";
import { createThemeTransition } from "../src/lib/theme-transition/themeTransition.js";
import { environment } from "./helpers/themeEnvironment.js";

test("separation starts immediately, switches the page early, and ends with aligned channels", () => {
  const oldFrames = createChromaticFrames("test", false);
  const newFrames = createChromaticFrames("test", true);
  for (const [index, oldFrame] of oldFrames.entries()) {
    const newFrame = newFrames[index];
    assert.equal(oldFrame.opacity + newFrame.opacity, 1);
    assert.equal((oldFrame.opacity ? newFrame : oldFrame).filter, "none");
    assert.equal(newFrame.easing, "steps(1, end)");
  }
  assert.notEqual(oldFrames[0].filter, "none");
  assert.equal(newFrames[0].opacity, 0);
  assert.ok(newFrames.find((frame) => frame.opacity === 1).offset <= 0.2);
  assert.equal(newFrames.at(-1).opacity, 1);
  assert.equal(newFrames.at(-1).filter, "none");
});

test("inline names yield to the whole-page capture and retain their original priorities afterward", async () => {
  const env = environment({ preset: "chromatic", holdCapture: true, mediaNames: ["", "project-1"] });
  env.settings.frameGlitch = { enabled: true, duration: 180, strength: 20 };
  env.media[1].style.setProperty("view-transition-name", "project-1", "important");
  const pending = createThemeTransition(env).run(() => {});
  assert.equal(env.attributes.get("data-theme-transition"), "chromatic");
  const names = env.media.map((image) => image.style.getPropertyValue("view-transition-name"));
  assert.deepEqual(names, ["", "none"]);
  assert.equal(env.media[1].style.getPropertyPriority("view-transition-name"), "important");
  assert.equal(env.doc.body.children.length, 1);
  env.captures[0].commit();
  await pending;
  assert.deepEqual(env.media.map((image) => image.style.getPropertyValue("view-transition-name")), ["", "project-1"]);
  assert.equal(env.media[1].style.getPropertyPriority("view-transition-name"), "important");
  assert.equal(env.doc.body.children.length, 0);
  assert.equal(env.attributes.size, 0);
});

test("speed changes both snapshots together; red and blue move oppositely while green stays aligned", async () => {
  const env = environment({ preset: "chromatic", holdCapture: true });
  env.settings.chromatic = { speed: 2, strength: 12 };
  const pending = createThemeTransition(env).run(() => {});
  const filters = env.doc.body.children[0].children[0].children;
  for (const filter of filters) {
    const shifts = filter.children.filter((child) => child.tag === "feOffset");
    assert.equal(shifts.length, 2);
    const red = ["dx", "dy"].map((axis) => Number(shifts[0].attributes.get(axis)));
    const blue = ["dx", "dy"].map((axis) => Number(shifts[1].attributes.get(axis)));
    assert.ok(red.every((offset, index) => offset === -blue[index]));
    assert.ok(Math.hypot(...red) > 0 && Math.hypot(...red) <= 12 + 1e-10);
    assert.ok(filter.children.every((child) => child.tag !== "feImage" && child.tag !== "feDisplacementMap"));
  }
  env.captures[0].commit();
  await pending;
  assert.equal(env.animations.length, 2);
  assert.ok(env.animations.every((animation) => animation.options.duration === 180));
  assert.deepEqual(env.animations.map((animation) => animation.options.pseudoElement),
    ["::view-transition-old(root)", "::view-transition-new(root)"]);
});

test("stochastic pulses cover every direction and fixed angles remain configurable", () => {
  const samples = [0, 0.25, 0.5, 0.75, 0.125, 0.625];
  const directions = createChannelDirections({}, () => samples.shift());
  assert.ok(directions[0].x > 0.99);
  assert.ok(directions[1].y > 0.99);
  assert.ok(directions[2].x < -0.99);
  assert.ok(directions[3].y < -0.99);
  assert.ok(directions[4].x > 0 && directions[4].y > 0);
  assert.ok(directions[5].x < 0 && directions[5].y < 0);
  const fixed = createChannelDirections({ stochastic: false, angle: 90 }, () => assert.fail("fixed directions need no randomness"));
  assert.ok(fixed.every(({ x, y }) => Math.abs(x) < 1e-10 && y === 1));
});

test("the radial renderer remains available and reverses lens direction stochastically", () => {
  const env = environment({ preset: "chromatic" });
  env.settings.chromatic.renderer = "radial";
  let sample = 0;
  const effect = createChromaticEffect({ ...env, random: () => sample++ % 2 ? 0.5 : 0 });
  effect.prepare();
  const filters = env.doc.body.children[0].children[0].children;
  const shifts = filters.map((filter) => filter.children.filter((child) => child.tag === "feDisplacementMap"));
  assert.ok(shifts.every((pair) => pair.length === 2
    && Number(pair[0].attributes.get("scale")) === -Number(pair[1].attributes.get("scale"))));
  assert.ok(shifts.some(([red]) => Number(red.attributes.get("scale")) > 0));
  assert.ok(shifts.some(([red]) => Number(red.attributes.get("scale")) < 0));
  effect.dispose();
});

test("large-screen offset transitions skip unused filters and keep images in the page layer", () => {
  const env = environment({ preset: "chromatic", mediaNames: ["", "offscreen"] });
  env.view.innerWidth = 3840;
  env.view.innerHeight = 2160;
  env.settings.frameGlitch = { enabled: true, duration: 10, strength: 20 };
  const effect = createChromaticEffect(env);
  effect.prepare();
  const filters = env.doc.body.children[0].children[0].children;
  const primitives = filters.flatMap((filter) => filter.children);
  assert.equal(filters.length, 6);
  assert.equal(primitives.filter((child) => child.tag === "feDisplacementMap").length, 1);
  assert.equal(primitives.filter((child) => child.tag === "feImage").length, 1);
  assert.equal(env.media[0].style.getPropertyValue("view-transition-name"), "");
  assert.equal(env.media[1].style.getPropertyValue("view-transition-name"), "none");
  effect.dispose();
  assert.equal(env.media[0].style.getPropertyValue("view-transition-name"), "");
  assert.equal(env.media[1].style.getPropertyValue("view-transition-name"), "offscreen");
});

test("interruption never leaves disabled navigation names or filters from an earlier toggle behind", async () => {
  const env = environment({ preset: "chromatic", holdCapture: true, mediaNames: ["project-1"] });
  env.settings.frameGlitch = { enabled: true, duration: 450, strength: 20 };
  const controller = createThemeTransition(env);
  let commits = 0;
  const first = controller.run(() => { commits++; });
  const firstSvg = env.doc.body.children[0];
  const second = controller.run(() => { commits++; });
  await first;
  assert.equal(commits, 1);
  assert.equal(env.doc.body.children.length, 1);
  assert.notEqual(env.doc.body.children[0], firstSvg);
  assert.equal(env.media[0].style.getPropertyValue("view-transition-name"), "none");
  env.captures[1].commit();
  await second;
  assert.equal(commits, 2);
  assert.equal(env.media[0].style.getPropertyValue("view-transition-name"), "project-1");
  assert.equal(env.doc.body.children.length, 0);
});

test("reduced motion, zero speed, hidden tabs, and failed captures release all chromatic resources", async () => {
  for (const condition of ["reduced", "disabled", "hidden", "failed"]) {
    const env = environment({ preset: "chromatic", mediaNames: ["project-1"],
      reducedMotion: condition === "reduced", rejectCapture: condition === "failed", holdCapture: condition === "hidden" });
    if (condition === "disabled") env.settings.chromatic.speed = 0;
    let commits = 0;
    const pending = createThemeTransition(env).run(() => { commits++; });
    if (condition === "hidden") {
      env.doc.visibilityState = "hidden";
      env.docListeners.get("visibilitychange")();
    }
    await pending;
    assert.equal(commits, 1);
    assert.equal(env.attributes.size, 0);
    assert.equal(env.doc.body.children.length, 0);
    assert.equal(env.media[0].style.getPropertyValue("view-transition-name"), "project-1");
  }
});

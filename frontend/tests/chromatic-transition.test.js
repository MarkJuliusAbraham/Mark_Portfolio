import test from "node:test";
import assert from "node:assert/strict";
import { createChromaticFrames } from "../src/utility/theme-transition/chromaticTransition.js";
import { createThemeTransition } from "../src/utility/theme-transition/themeTransition.js";
import { environment } from "./helpers/themeEnvironment.js";

test("separation starts immediately, switches the page early, and ends with aligned channels", () => {
  const oldFrames = createChromaticFrames("test", false);
  const newFrames = createChromaticFrames("test", true);
  for (const [index, oldFrame] of oldFrames.entries()) {
    const newFrame = newFrames[index];
    assert.equal(oldFrame.filter, newFrame.filter);
    assert.equal(oldFrame.opacity + newFrame.opacity, 1);
    assert.equal(newFrame.easing, "steps(1, end)");
  }
  assert.notEqual(newFrames[0].filter, "none");
  assert.equal(newFrames[0].opacity, 0);
  assert.ok(newFrames.find((frame) => frame.opacity === 1).offset <= 0.2);
  assert.equal(newFrames.at(-1).opacity, 1);
  assert.equal(newFrames.at(-1).filter, "none");
});

test("media gets clear snapshots; original navigation names and priorities are restored", async () => {
  const env = environment({ preset: "chromatic", holdCapture: true, mediaNames: ["", "project-1"] });
  env.settings.frameGlitch = { enabled: true, duration: 180, strength: 20 };
  env.media[1].style.setProperty("view-transition-name", "project-1", "important");
  const pending = createThemeTransition(env).run(() => {});
  assert.equal(env.attributes.get("data-theme-transition"), "chromatic");
  const names = env.media.map((image) => image.style.getPropertyValue("view-transition-name"));
  assert.equal(new Set(names).size, 2);
  assert.ok(names.every((name) => name.startsWith("theme-media-")));
  assert.ok(env.media.every((image) => image.style.getPropertyPriority("view-transition-name") === "important"));
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
    const shifts = filter.children.filter((child) => child.tag === "feDisplacementMap");
    assert.equal(shifts.length, 2);
    const red = Number(shifts[0].attributes.get("scale"));
    const blue = Number(shifts[1].attributes.get("scale"));
    assert.equal(red, -blue);
    assert.ok(red > 0 && red <= 24);
    assert.equal(shifts[0].attributes.get("xChannelSelector"), "R");
    assert.equal(shifts[0].attributes.get("yChannelSelector"), "G");
  }
  env.captures[0].commit();
  await pending;
  assert.equal(env.animations.length, 2);
  assert.ok(env.animations.every((animation) => animation.options.duration === 180));
  assert.deepEqual(env.animations.map((animation) => animation.options.pseudoElement),
    ["::view-transition-old(root)", "::view-transition-new(root)"]);
});

test("interruption never leaves media names or filters from an earlier toggle behind", async () => {
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
  assert.ok(env.media[0].style.getPropertyValue("view-transition-name").startsWith("theme-media-"));
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

import test from "node:test";
import assert from "node:assert/strict";
import { createChromaticFrames } from "../src/lib/theme-transition/chromaticTransition.js";
import { createFrameMap, frameGlitchOptions, frameGlitchPulse, layerFrameGlitch } from "../src/lib/theme-transition/frameGlitchTransition.js";
import { createThemeTransition } from "../src/lib/theme-transition/themeTransition.js";
import { environment } from "./helpers/themeEnvironment.js";

test("frame tearing starts alongside chromatic without stretching either effect's duration", () => {
  for (const duration of [90, 180, 900]) {
    const total = Math.max(180, duration);
    const oldFrames = layerFrameGlitch(createChromaticFrames("test", false), { snapshotDuration: 180, duration, prefix: "test" });
    const newFrames = layerFrameGlitch(createChromaticFrames("test", true), { snapshotDuration: 180, duration, prefix: "test" });
    assert.match(oldFrames[0].filter, /test-2.*test-frame-1/);
    assert.equal(newFrames[0].filter, "none");
    assert.equal(newFrames.at(-1).filter, "none");
    assert.equal(newFrames.at(-1).offset, 1);
    for (const [index, frame] of newFrames.entries()) {
      assert.equal(oldFrames[index].opacity + frame.opacity, 1);
      assert.equal((frame.opacity ? oldFrames[index] : frame).filter, "none");
      if (frame.offset * total >= 180) assert.doesNotMatch(frame.filter, /#test-\d/);
      if (frame.offset * total >= duration) assert.doesNotMatch(frame.filter, /test-frame-/);
    }
    const switchTime = newFrames.find((frame) => frame.opacity === 1).offset * total;
    assert.ok(switchTime < 30, "theme feedback stays early even during a longer signal glitch");
  }
});

test("short glitches do not generate eight sub-frame displacement maps", () => {
  assert.deepEqual(frameGlitchPulse(10), [[0, 1], [1, 0]]);
  for (const duration of [10, 90, 180, 900]) {
    const frames = frameGlitchPulse(duration);
    assert.equal(frames[0][0], 0);
    assert.equal(frames.at(-1)[0], 1);
    for (let index = 1; index < frames.length - 1; index++) {
      assert.ok((frames[index][0] - frames[index - 1][0]) * duration >= 1000 / 60 - 1e-10);
    }
  }
});

test("signal maps contain moving horizontal bands bounded to the viewport", () => {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const maps = Array.from({ length: 8 }, (_, frame) => createFrameMap(width, height, frame + 1));
    assert.equal(new Set(maps).size, 8);
    assert.equal(maps[0], createFrameMap(width, height, 1));
    for (const map of maps) {
      const svg = decodeURIComponent(map.split(",").slice(1).join(","));
      const bands = [...svg.matchAll(/y="(\d+)" width="(\d+)" height="(\d+)"/g)];
      assert.ok(bands.length > 0);
      for (const [, top, bandWidth, bandHeight] of bands) {
        assert.equal(Number(bandWidth), width);
        assert.ok(Number(top) >= 0 && Number(top) + Number(bandHeight) <= height);
        assert.ok(Number(bandHeight) > 0);
      }
    }
  }
});

test("the requested glitch duration controls both snapshots and all media resources are released", async () => {
  const env = environment({ preset: "chromatic", mediaNames: ["project-1"] });
  env.settings.chromatic.speed = 2;
  env.settings.frameGlitch = { enabled: true, duration: 450, strength: 20 };
  let commits = 0;
  await createThemeTransition(env).run(() => { commits++; });
  assert.equal(commits, 1);
  assert.equal(env.animations.length, 2);
  assert.ok(env.animations.every((animation) => animation.options.duration === 450));
  assert.ok(env.animations.every((animation) => animation.frames.some((frame) => frame.filter.includes("-frame-"))));
  assert.equal(env.doc.body.children.length, 0);
  assert.equal(env.media[0].style.getPropertyValue("view-transition-name"), "project-1");
  assert.equal(env.attributes.size, 0);
});

test("disabling frame tearing leaves the chromatic timing and filters intact", async () => {
  for (const options of [{ enabled: false, duration: 900, strength: 20 },
    { enabled: true, duration: 0, strength: 20 }, { enabled: true, duration: 900, strength: 0 }]) {
    assert.equal(frameGlitchOptions(options), null);
    const env = environment({ preset: "chromatic" });
    env.settings.chromatic.speed = 2;
    env.settings.frameGlitch = options;
    await createThemeTransition(env).run(() => {});
    assert.ok(env.animations.every((animation) => animation.options.duration === 180));
    assert.ok(env.animations.every((animation) => !animation.frames[0].filter.includes("-frame-")));
  }
});

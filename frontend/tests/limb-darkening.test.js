import test from "node:test";
import assert from "node:assert/strict";
import { brightestChannel, ditherSpread, limbShade, limbShape, paintLimbDarkening } from "../src/lib/limbDarkening.js";

test("the darkening is nothing in the middle, full in the corners, and only ever rises outward", () => {
  const [width, height] = [1200, 800];
  assert.equal(limbShade(width / 2, height / 2, width, height), 0);
  assert.ok(Math.abs(limbShade(0, 0, width, height) - 1) < 1e-9);
  let last = 0;
  for (let x = width / 2; x >= 0; x -= 10) {
    const shade = limbShade(x, 0, width, height);
    assert.ok(shade >= last, "it never lightens on the way out to an edge");
    last = shade;
  }
});

test("the dithering spans one visible step of the background: more on a dark page than a light one", () => {
  assert.ok(Math.abs(ditherSpread(255) - 1) < 1e-9, "on white, one opacity step is one visible step");
  assert.ok(ditherSpread(37) > 6 && ditherSpread(37) < 7.5, "on the dark page, a visible step takes about seven");
  assert.ok(ditherSpread(37) > ditherSpread(218));
});

const fakeCanvas = (width, height) => {
  const pixels = { data: null };
  const context = {
    createImageData: (w, h) => {
      pixels.data = new Uint8ClampedArray(w * h * 4);
      return pixels;
    },
    putImageData() {},
  };
  return { pixels, canvas: { width, height, getContext: () => context } };
};

const seeded = () => {
  let seed = 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
};

test("each pixel is nudged by at most half the spread either way, and the average darkness is exact", () => {
  const { pixels, canvas } = fakeCanvas(400, 300);
  const spread = ditherSpread(37);
  paintLimbDarkening(canvas, 0.28, { spread, random: seeded() });
  for (const [left, top] of [[0, 0], [190, 0], [0, 140]]) {
    let wanted = 0;
    let painted = 0;
    for (let y = top; y < top + 20; y += 1) {
      for (let x = left; x < left + 20; x += 1) {
        const exact = 0.28 * limbShade(x + 0.5, y + 0.5, 400, 300) * 255;
        const alpha = pixels.data[(y * 400 + x) * 4 + 3];
        assert.ok(Math.abs(alpha - exact) <= spread / 2 + 0.5, "no pixel strays further than the spread");
        wanted += exact;
        painted += alpha;
      }
    }
    assert.ok(Math.abs(painted - wanted) / 400 < 0.25, "on average the dithering lands on the true shade");
  }
  assert.equal(pixels.data[(150 * 400 + 200) * 4 + 3], 0, "the middle stays untouched, never nudged dark");
});

test("the background's brightest channel sets the dithering", () => {
  assert.equal(brightestChannel("rgb(31, 30, 37)"), 37);
  assert.equal(brightestChannel("not a color"), 255);
});

test("the curve sets how sharply it falls away inward: the corners stay full and the start stays clear", () => {
  const [width, height] = [1200, 800];
  const hard = { ...limbShape, curve: 3 };
  const soft = { ...limbShape, curve: 0.5 };
  // Three quarters of the way out toward a corner.
  const [x, y] = [width / 2 - 0.75 * (width / 2), height / 2 - 0.75 * (height / 2)];
  assert.ok(limbShade(x, y, width, height, hard) < limbShade(x, y, width, height) && limbShade(x, y, width, height) < limbShade(x, y, width, height, soft),
    "a higher curve leaves the inner part lighter; a lower one darkens it more");
  for (const shape of [hard, soft]) {
    assert.ok(Math.abs(limbShade(0, 0, width, height, shape) - 1) < 1e-9, "every curve reaches full strength in the corners");
    assert.equal(limbShade(width / 2 - 0.3 * (width / 2), height / 2 - 0.3 * (height / 2), width, height, shape), 0, "and nothing inside the start");
  }
  const later = { ...limbShape, start: 0.7 };
  assert.ok(limbShade(x, y, width, height, later) < limbShade(x, y, width, height), "a later start keeps more of the middle clear");
});

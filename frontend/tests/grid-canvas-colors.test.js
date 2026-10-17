import test from "node:test";
import assert from "node:assert/strict";
import { splitAlpha } from "../src/lib/gridCanvas.js";

test("a resolved color splits into its opaque self and its opacity, in each form the browser gives", () => {
  assert.deepEqual(splitAlpha("rgba(222, 219, 200, 0.4)"), { opaque: "rgb(222, 219, 200)", alpha: 0.4 });
  assert.deepEqual(splitAlpha("color(srgb 0.87 0.86 0.78 / 0.4)"), { opaque: "color(srgb 0.87 0.86 0.78)", alpha: 0.4 });
  assert.deepEqual(splitAlpha("rgb(1 2 3 / 50%)"), { opaque: "rgb(1 2 3)", alpha: 0.5 });
  assert.deepEqual(splitAlpha("rgb(32, 32, 27)"), { opaque: "rgb(32, 32, 27)", alpha: 1 });
  assert.equal(splitAlpha("rgba(0, 0, 0, 0)").alpha, 0, "a transparent background hides nothing");
});

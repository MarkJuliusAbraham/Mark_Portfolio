import test from "node:test";
import assert from "node:assert/strict";
import { createOpeningWave } from "../src/components/organisms/BodyGrid/gridOpeningWave.js";

test("the circular light's inner edge clears every viewport corner at the end", () => {
  for (const [width, height] of [[1440, 900], [390, 844], [3840, 2160], [844, 390]]) {
    for (const band of [80, 160, 240]) {
      const wave = createOpeningWave({ width, height }, { width: band });
      const innerRadius = wave.diameter / 2 - wave.width;
      for (const x of [-width / 2, width / 2]) {
        for (const y of [-height / 2, height / 2]) {
          assert.ok(innerRadius + 1e-9 >= Math.hypot(x, y), "no corner is left inside the light band when it finishes");
        }
      }
    }
  }
});

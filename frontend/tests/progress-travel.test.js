import test from "node:test";
import assert from "node:assert/strict";
import { progressInterval } from "../src/components/organisms/Sidebar/progressTravel.js";

test("reversing scroll cannot leave an unfilled cap before the fill", () => {
    // The fast track has moved upward while the slower trailing edge is below it.
    assert.deepEqual(progressInterval(0.3, 0.8, 0.6), {
        top: 0.3, bottom: 1.3, fillEnd: 0.6,
    });
});

test("rapid section jumps keep the fill inside the track in both directions", () => {
    for (const track of [0, 0.4, 1.8, 3]) {
        for (const back of [0, 1.2, 3]) {
            for (const progress of [0, 0.2, 2.5, 4]) {
                const { top, bottom, fillEnd } = progressInterval(track, back, progress);
                assert.ok(top <= fillEnd && fillEnd <= bottom);
                assert.ok(bottom >= track + 1);
            }
        }
    }
});

test("settled geometry preserves the section's exact progress", () => {
    assert.deepEqual(progressInterval(2, 2, 2.35), { top: 2, bottom: 3, fillEnd: 2.35 });
});

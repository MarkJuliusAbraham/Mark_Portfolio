import test from "node:test";
import assert from "node:assert/strict";
import { minScrollableSpan, pageProgress, sectionProgress, sectionSpans, writeSectionProgress } from "../src/lib/sectionProgress.js";

// Home, About, Projects and Contact become active at these scroll positions.
const starts = [0, 800, 2000, 3000];

test("the active section fills as you scroll through it", () => {
  assert.deepEqual(sectionProgress(starts, 400, 3600), [0.5, 0, 0, 0]);
  assert.deepEqual(sectionProgress(starts, 1400, 3600), [1, 0.5, 0, 0]);
  assert.deepEqual(sectionProgress(starts, 2500, 3600), [1, 1, 0.5, 0]);
});

test("the last section runs to the bottom of the page", () => {
  assert.deepEqual(sectionProgress(starts, 3300, 3600), [1, 1, 1, 0.5]);
  assert.deepEqual(sectionProgress(starts, 3600, 3600), [1, 1, 1, 1]);
});

test("a short final section that starts past the bottom completes the one before it", () => {
  // Contact would start at 3000, but the page can only scroll to 2600.
  const atBottom = sectionProgress(starts, 2600, 2600);
  assert.deepEqual(atBottom, [1, 1, 1, 1]);
  assert.equal(sectionProgress(starts, 2300, 2600)[2], 0.5);
});

test("sections whose start the page has not reached stay empty", () => {
  assert.deepEqual(sectionProgress([0, Infinity], 100, 500), [0.2, 0]);
  assert.deepEqual(sectionProgress([-50, 400], 0, 1000), [0, 0]);
});

test("pages without sections report overall scroll progress", () => {
  assert.equal(pageProgress(250, 1000), 0.25);
  assert.equal(pageProgress(0, 0), 1);
  assert.equal(pageProgress(1200, 1000), 1);
});

test("a final section that starts past the bottom has no scroll travel", () => {
  // Contact would start at 3000, but the page can only scroll to 2600.
  const spans = sectionSpans(starts, 2600);
  assert.deepEqual(spans, [800, 1200, 600, 0]);
  assert.ok(spans[3] < minScrollableSpan);
  assert.ok(spans.slice(0, 3).every((span) => span >= minScrollableSpan));
});

test("a final section with room to scroll keeps its travel", () => {
  assert.deepEqual(sectionSpans(starts, 3600), [800, 1200, 1000, 600]);
});

test("progress is written on the navbar's own containers, and a value that hasn't changed isn't written again", () => {
  const scope = () => {
    const writes = [];
    return { writes, style: { setProperty: (name, value) => writes.push([name, value]) } };
  };
  const desktop = scope();
  const mobile = scope();
  const spans = [minScrollableSpan * 4, minScrollableSpan / 2];
  writeSectionProgress([0.25, 1], spans, [desktop, mobile]);
  assert.deepEqual(desktop.writes, [
    ["--section-progress-0", "0.2500"],
    ["--section-fixed-0", "0"],
    ["--section-progress-1", "1.0000"],
    ["--section-fixed-1", "1"],
  ]);
  assert.deepEqual(mobile.writes, desktop.writes, "each container gets the same values");

  // The next frame of a scroll: only the first section's progress moved.
  writeSectionProgress([0.3, 1], spans, [desktop, mobile]);
  assert.deepEqual(desktop.writes.slice(4), [["--section-progress-0", "0.3000"]], "only what changed is written");
});

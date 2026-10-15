import test from "node:test";
import assert from "node:assert/strict";
import { isSettled, nextTypingState, typingDelay, typingState } from "../src/lib/typing.js";

const run = (from, to, limit = 100) => {
  const seen = [typeof from === "string" ? typingState(from) : from];
  while (!isSettled(seen.at(-1), to) && seen.length < limit) seen.push(nextTypingState(seen.at(-1), to));
  return seen;
};
const texts = (states) => states.map(({ text, highlight }) => (highlight ? `${text}[${highlight}]` : text));

const name = "Mark Julius\nAbraham";
const delays = { typeDelay: 55, deleteDelay: 30, highlightDelay: 220 };

test("types forward one character at a time from empty", () => {
  assert.deepEqual(texts(run("", "Mark")), ["", "M", "Ma", "Mar", "Mark"]);
});

test("appends a newly hidden line after the one already typed", () => {
  const states = run("Mark Julius", name);
  assert.equal(states.length, 1 + "\nAbraham".length);
  states.forEach(({ text, highlight }) => assert.ok(name.startsWith(text) && highlight === 0));
});

test("backspaces a single line that came back into view, one character at a time", () => {
  const states = run(name, "Mark Julius");
  assert.equal(states.length, 1 + "\nAbraham".length);
  assert.ok(states.every(({ highlight }) => highlight === 0));
});

test("when the first line must go too, the rest of the second is highlighted and removed at once", () => {
  // Partway through deleting the second line, the first line also comes back into view.
  const states = run({ text: "Mark Julius\nAbr", highlight: 0 }, "");
  assert.deepEqual(texts(states.slice(0, 3)), ["Mark Julius\nAbr", "Mark Julius\nAbr[4]", "Mark Julius"]);
  // The first line then backspaces normally.
  assert.equal(states[3].text, "Mark Juliu");
  assert.ok(states.slice(2).every(({ highlight }) => highlight === 0));
  assert.equal(states.at(-1).text, "");
});

test("never deletes from two lines at once", () => {
  for (const target of ["", "Mark", "Mark Julius"]) {
    const states = run(name, target);
    states.slice(1).forEach(({ text, highlight }, index) => {
      const before = states[index];
      if (highlight) return;
      // Each plain backspace removes exactly one character, never across a line break.
      if (text.length < before.text.length - before.highlight) assert.equal(before.text.length - text.length, 1);
    });
    assert.equal(states.at(-1).text, target);
  }
});

test("a highlight is dropped, not deleted, when the line is wanted back", () => {
  const highlighted = { text: name, highlight: 8 };
  assert.deepEqual(nextTypingState(highlighted, name), typingState(name));
});

test("holds a highlight briefly, and types and deletes at their own speeds", () => {
  assert.equal(typingDelay({ text: name, highlight: 8 }, "", delays), 220);
  assert.equal(typingDelay(typingState("Ma"), "Mark", delays), 55);
  assert.equal(typingDelay(typingState("Mark"), "Ma", delays), 30);
});

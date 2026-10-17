/**
 * Typed text and how many of its trailing characters are highlighted, like a text selection,
 * waiting to be deleted in one keystroke.
 */
export const typingState = (text = "") => ({ text, highlight: 0 });

const sharedPrefixLength = (a, b) => {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) length++;
  return length;
};

/**
 * One keystroke from `state` toward `target`. Text types forward while it is still a prefix of
 * the target and backspaces otherwise. When the target needs an earlier line deleted too, the rest
 * of the last line is highlighted and then removed in one go, so the deletion never runs on from
 * one line into the next.
 */
export function nextTypingState({ text, highlight }, target) {
  if (highlight > 0) {
    // The target wants the highlighted text back: drop the highlight instead of deleting it.
    if (target.startsWith(text)) return typingState(text);
    return typingState(text.slice(0, -highlight));
  }
  if (text === target) return typingState(text);
  if (target.startsWith(text)) return typingState(target.slice(0, text.length + 1));

  const lastBreak = text.lastIndexOf("\n");
  if (lastBreak >= 0 && sharedPrefixLength(text, target) < lastBreak) {
    return { text, highlight: text.length - lastBreak };
  }
  return typingState(text.slice(0, -1));
}

/** How long to wait before the next keystroke: typing, backspacing, or holding a highlight. */
export function typingDelay({ text, highlight }, target, { typeDelay, deleteDelay, highlightDelay }) {
  if (highlight > 0) return highlightDelay;
  return target.startsWith(text) ? typeDelay : deleteDelay;
}

export const isSettled = ({ text, highlight }, target) => text === target && highlight === 0;

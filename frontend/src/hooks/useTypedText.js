import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { isSettled, nextTypingState, typingDelay, typingState } from "@/lib/typing.js";

/**
 * Text that types its way toward `target` one character at a time, deleting first when it has
 * to back up. `highlight` counts trailing characters selected for a one-keystroke delete. With
 * reduced motion it jumps straight to the target.
 */
export function useTypedText(target, { typeDelay = 55, deleteDelay = 30, highlightDelay = 220, initial = "" } = {}) {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState(() => typingState(initial));

  useEffect(() => {
    if (reducedMotion || isSettled(state, target)) return;
    const timer = setTimeout(
      () => setState((current) => nextTypingState(current, target)),
      typingDelay(state, target, { typeDelay, deleteDelay, highlightDelay }),
    );
    return () => clearTimeout(timer);
  }, [state, target, typeDelay, deleteDelay, highlightDelay, reducedMotion]);

  const shown = reducedMotion ? typingState(target) : state;
  return { text: shown.text, highlight: shown.highlight, typing: !isSettled(shown, target) };
}

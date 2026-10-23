import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Hover hints for figure elements. A page wraps its figures in a HintProvider with a lookup from a
// term to its { definition }; any Term inside then shows that definition beside itself.
const HintContext = createContext({ show: () => {}, lookup: () => null });

const HINT_WIDTH = 300;
const GAP = 10;

// The hint card, placed below the element (or above when there's no room), kept inside the window.
// It's portalled to the body so the figure's scroll box can't clip it, and carries the page's
// simplified reading mode with it so plain-language text still applies.
const Hint = ({ hint, lookup }) => {
  if (!hint) return null;
  const { term, rect } = hint;
  const width = Math.min(HINT_WIDTH, window.innerWidth - 2 * GAP);
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, GAP), window.innerWidth - width - GAP);
  const below = window.innerHeight - rect.bottom > 180;
  const style = below
    ? { left, width, top: rect.bottom + GAP }
    : { left, width, bottom: window.innerHeight - rect.top + GAP };
  const simplified = Boolean(document.querySelector("[data-simplified]"));
  return createPortal(
    <div id="cs-hint" role="tooltip" className="cs-hint typeset-card-readable" style={style} data-simplified={simplified || undefined}>
      <p className="cs-hint-term typeset-card-toner">{term}</p>
      <div>{lookup(term).definition}</div>
    </div>,
    document.body,
  );
};

export const HintProvider = ({ lookup, children }) => {
  const [hint, setHint] = useState(null);
  const show = useCallback((next) => setHint(next), []);

  // Scrolling or Escape hides the hint; it would otherwise float away from its element.
  useEffect(() => {
    if (!hint) return undefined;
    const hide = () => setHint(null);
    const onKey = (event) => event.key === "Escape" && hide();
    window.addEventListener("scroll", hide, { passive: true, capture: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", hide, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [hint]);

  return (
    <HintContext.Provider value={{ show, lookup }}>
      {children}
      <Hint hint={hint} lookup={lookup} />
    </HintContext.Provider>
  );
};

// Makes a figure element a hint target: hover or focus shows its definition, tap toggles it.
export const Term = ({ term, children }) => {
  const { show, lookup } = useContext(HintContext);
  if (!lookup(term)) return children;
  const reveal = (event) => show({ term, rect: event.currentTarget.getBoundingClientRect() });
  return (
    <g
      className="cs-term"
      tabIndex={0}
      role="button"
      aria-label={term}
      aria-describedby="cs-hint"
      onMouseEnter={reveal}
      onMouseLeave={() => show(null)}
      onFocus={reveal}
      onBlur={() => show(null)}
    >
      {children}
    </g>
  );
};

// The cue that the figures are interactive, worded for the pointer the visitor has.
export const HintCue = ({ target = "box", compact = "Tap a component to expand details" }) => {
  const [touch] = useState(() => window.matchMedia("(hover: none)").matches);
  return (
    <p className="cs-cue typeset-card-toner">
      <span className="cs-cue-mark" aria-hidden="true">+</span>
      <span className="cs-cue-pointer">{touch ? "Tap" : "Hover"} any {target} for details</span>
      <span className="cs-cue-compact">{compact}</span>
    </p>
  );
};

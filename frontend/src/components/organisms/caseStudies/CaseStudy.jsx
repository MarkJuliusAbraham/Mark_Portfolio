import { useLayoutEffect, useRef, useState } from "react";
import { ReadingModeContext, useReadingMode } from "./readingMode.js";
const key = "case-study-simplified";
const read = () => { try { return localStorage.getItem(key) === "1"; } catch { return false; } };

/** Owns the reading mode and keeps the mode control anchored during a switch. */
export function CaseStudy({ children, ...props }) {
  const [simplified, setMode] = useState(read);
  const anchor = useRef(null);
  const article = useRef(null);
  const setSimplified = (next) => {
    const control = article.current?.querySelector(".cs-opening .cs-simplify-button");
    anchor.current = control && control.getBoundingClientRect().top >= 0 ? { control, top: control.getBoundingClientRect().top } : null;
    setMode(value => typeof next === "function" ? next(value) : next);
  };
  useLayoutEffect(() => {
    try { localStorage.setItem(key, simplified ? "1" : "0"); } catch { /* storage unavailable */ }
    if (anchor.current) {
      const { control, top } = anchor.current;
      window.scrollBy({ top: control.getBoundingClientRect().top - top, behavior: "instant" });
      anchor.current = null;
    }
  }, [simplified]);
  return <ReadingModeContext.Provider value={{ simplified, setSimplified }}>
    <article ref={article} {...props} data-simplified={simplified || undefined}>{children}</article>
  </ReadingModeContext.Provider>;
}

/** Mount only the current version, so hidden viewers and recordings do not run. */
export function ReadingVersions({ overview, children }) {
  const { simplified } = useReadingMode();
  return simplified ? <div className="cs-visual-overview">{overview}</div> : children;
}

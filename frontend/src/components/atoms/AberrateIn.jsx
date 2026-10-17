import { useEffect, useRef } from "react";
import { useEntranceInView } from "@/hooks/useEntranceInView.js";
import { createElementGlitch } from "@/lib/theme-transition/elementChromatic.js";
import "./aberrate-in.css";

// Not at first sight: only once all of it is on screen and a good way up from the bottom edge, so
// it plays where the eye already is.
const settledInView = { amount: "all", margin: "0px 0px -30% 0px" };

/**
 * Brings its content in and out of view through the theme switch's own chromatic aberration, the
 * site's one aberration effect. Arriving, it appears with its color channels split and steps
 * through the switch's pulse until they settle; leaving, it splits again and vanishes at the
 * pulse's peak, where the theme switch swaps themes. Whether it's in view is judged on a still
 * outer box, never the filtered content, so the effect can't end and restart itself.
 */
export const AberrateIn = ({ className, children }) => {
  const frameRef = useRef(null);
  const contentRef = useRef(null);
  const glitchRef = useRef(null);
  const shown = useEntranceInView(frameRef, settledInView);

  useEffect(() => {
    const glitch = createElementGlitch(contentRef.current);
    glitchRef.current = glitch;
    glitch.prepare();
    return () => {
      glitch.dispose();
      glitchRef.current = null;
    };
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    const glitch = glitchRef.current;
    if (!content || !glitch) return;
    if (shown) {
      content.setAttribute("data-visible", "true");
      glitch.run(() => {});
    } else if (content.getAttribute("data-visible") === "true") {
      glitch.run(() => content.setAttribute("data-visible", "false"));
    }
  }, [shown]);

  return (
    <span ref={frameRef} className="aberrate-in-frame">
      <span ref={contentRef} className={`aberrate-in${className ? ` ${className}` : ""}`}>{children}</span>
    </span>
  );
};

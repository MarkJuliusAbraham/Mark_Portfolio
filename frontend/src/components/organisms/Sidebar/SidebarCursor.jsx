import { useLayoutEffect, useRef } from "react";
import { cancelFrame, frame } from "motion";
import { motion, useReducedMotion } from "motion/react";
import { cursorEffects, getCursorGhost, getCursorMovement, getCursorSplit } from "./cursorEffects.js";

export function SidebarCursor({ chromatic = cursorEffects.chromatic, ghosting = cursorEffects.ghosting }) {
  const ref = useRef(null);
  const watchMovement = useRef(() => {});
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion) return;

    let previous = null;
    let stillFrames = 0;
    let running = false;
    const sample = ({ delta }) => {
      if (!element.isConnected) {
        cancelFrame(sample);
        running = false;
        return;
      }

      // Read after Motion paints its projection, so the direction is visual travel.
      const position = element.getBoundingClientRect();
      if (previous) {
        const dx = position.left - previous.left;
        const dy = position.top - previous.top;
        const movement = getCursorMovement(dx, dy, delta);
        const moving = movement.distance > 0.005;
        element.toggleAttribute("data-moving", moving);
        stillFrames = moving ? 0 : stillFrames + 1;

        if (moving) {
          const split = getCursorSplit(movement, chromatic);
          const ghost = getCursorGhost(movement, ghosting);
          element.style.setProperty("--cursor-fringe-x", `${split.x}px`);
          element.style.setProperty("--cursor-fringe-y", `${split.y}px`);
          element.style.setProperty("--cursor-ghost-x", `${ghost.x}px`);
          element.style.setProperty("--cursor-ghost-y", `${ghost.y}px`);
          element.style.setProperty("--cursor-ghost-opacity", String(ghost.opacity));
        }
      }

      previous = position;
      // Also clear interrupted or zero-distance layout animations that omit completion.
      if (stillFrames >= 3) {
        cancelFrame(sample);
        running = false;
      }
    };

    const start = () => {
      if (running) return;
      previous = null;
      stillFrames = 0;
      running = true;
      frame.postRender(sample, true);
    };
    watchMovement.current = start;
    // Shared-layout handoffs can move a new cursor without its own start event.
    start();
    return () => {
      cancelFrame(sample);
      element.removeAttribute("data-moving");
      watchMovement.current = () => {};
    };
  }, [reducedMotion, chromatic, ghosting]);

  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      className="sidebar-active-indicator"
      layoutId="active-section-indicator"
      initial={false}
      style={{ "--cursor-chromatic-opacity": chromatic.opacity ?? cursorEffects.chromatic.opacity }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
      onLayoutAnimationStart={() => watchMovement.current()}
    >
      <span className="sidebar-cursor-ghost" />
      <span className="sidebar-cursor-core" />
    </motion.span>
  );
}

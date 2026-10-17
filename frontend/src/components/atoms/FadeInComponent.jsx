import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useHorizontalDelay } from "@/hooks/useHorizontalDelay.js";
import { useEntranceInView } from "@/hooks/useEntranceInView.js";

// Where the element starts before sliding in, per entrance direction.
const offsets = {
  left: { x: 100, y: 0 },
  right: { x: -100, y: 0 },
  up: { x: 0, y: 100 },
  down: { x: 0, y: -100 },
};

/** Fades and slides its children in whenever they scroll into view, staggered left to right. */
export const FadeInComponent = ({ className, children, direction = "up" }) => {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const isInView = useEntranceInView(ref);
  const delay = useHorizontalDelay(ref, 0.4);
  const offset = offsets[direction] ?? offsets.up;
  const shown = reducedMotion || isInView;

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0, ...offset }}
      animate={{ opacity: shown ? 1 : 0, x: shown ? 0 : offset.x, y: shown ? 0 : offset.y }}
      transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion || !isInView ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

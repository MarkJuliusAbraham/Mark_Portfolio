import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useHorizontalDelay } from "@/hooks/useHorizontalDelay.js";

/** Rises its children up into a clipped box whenever they scroll into view, staggered left to right. */
export const PopInComponent = ({ className, children }) => {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: false });
  const delay = useHorizontalDelay(ref, 1);
  const shown = reducedMotion || isInView;

  return (
    <div className="overflow-hidden inline-block">
      <motion.div
        ref={ref}
        initial={reducedMotion ? false : { y: "100%", opacity: 0.7 }}
        animate={{ y: shown ? "0%" : "100%", opacity: shown ? 1 : 0.7 }}
        transition={{
          duration: reducedMotion ? 0 : 0.5,
          delay: reducedMotion || !isInView ? 0 : delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
};

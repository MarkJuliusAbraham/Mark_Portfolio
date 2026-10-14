import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

export const PopInComponent = ({className, children,}) => {

  const [delay, setDelay] = useState(0);
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once: false,
  });

  useEffect(() => {
    const updateDelay = () => {
      if (!ref.current) return;

      const x = ref.current.getBoundingClientRect().left;

      setDelay(
        Math.max(
          0,
          Math.min((x / window.innerWidth) * 1, 1)
        )
      );
    };

    updateDelay();
    window.addEventListener("resize", updateDelay);

    return () => {
      window.removeEventListener("resize", updateDelay);
    };
  }, []);

  return (
    <div className="overflow-hidden inline-block">
      <motion.div
        ref={ref}
        initial={reducedMotion ? false : {
          y: "100%",
          opacity: 0.7,
        }}
        animate={{
          y: reducedMotion || isInView ? "0%" : "100%",
          opacity: reducedMotion || isInView ? 1 : 0.7,
        }}
        transition={{
          duration: reducedMotion ? 0 : 0.5,
          delay: reducedMotion ? 0 : isInView ? delay : 0,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
};

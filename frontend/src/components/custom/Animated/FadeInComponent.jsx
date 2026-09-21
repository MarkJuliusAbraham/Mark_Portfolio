import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

export const FadeInComponent = ({
                                  className,
                                  children,
                                  direction = "up",
                                }) => {
  const [delay, setDelay] = useState(0);
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: false,
  });

  const directions = {
    left: { x: 100, y: 0 },
    right: { x: -100, y: 0 },
    up: { x: 0, y: 100 },
    down: { x: 0, y: -100 },
  };

  const initialPosition = directions[direction] || directions.up;

  useEffect(() => {
    const updateDelay = () => {
      if (!ref.current) return;

      const x = ref.current.getBoundingClientRect().left;

      setDelay(
        Math.max(
          0,
          Math.min((x / window.innerWidth) * 0.4, 0.4)
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
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        x: initialPosition.x,
        y: initialPosition.y,
      }}
      animate={{
        opacity: isInView ? 1 : 0,
        x: isInView ? 0 : initialPosition.x,
        y: isInView ? 0 : initialPosition.y,
      }}
      transition={{
        duration: 0.7,
        delay: isInView ? delay : 0,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

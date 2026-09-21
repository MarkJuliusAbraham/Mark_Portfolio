import {useEffect, useRef, useState} from "react";
import {motion, useInView} from "motion/react";
export const FadeInView = ({className, children}) => {
  const [delay, setDelay] = useState(0);
  const ref = useRef(null);
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
      initial={{ opacity: 0, y: 100 }}
      animate={{
        opacity: isInView ? 1 : 0,
        y: isInView ? 0 : 20,
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
}
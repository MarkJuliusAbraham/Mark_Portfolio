import { useEffect, useState } from "react";

/**
 * An entrance delay that grows with how far right the element sits in the viewport, up to
 * `maxDelay` seconds, so rows of elements reveal from left to right. Updates on resize.
 */
export function useHorizontalDelay(ref, maxDelay) {
  const [delay, setDelay] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const share = ref.current.getBoundingClientRect().left / window.innerWidth;
      setDelay(Math.max(0, Math.min(share * maxDelay, maxDelay)));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref, maxDelay]);

  return delay;
}

import { useEffect, useState } from "react";
import { useInView } from "motion/react";

/** Decorative loops run only while their panel and the page are visible. */
export const useAccentPaused = (itemRef) => {
  const inView = useInView(itemRef);
  const [hidden, setHidden] = useState(() => document.hidden);

  useEffect(() => {
    const updateVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return !inView || hidden;
};

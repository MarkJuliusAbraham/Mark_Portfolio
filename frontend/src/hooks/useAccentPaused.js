import { useEffect, useState } from "react";
import { useInView } from "motion/react";
import { usePageReady } from "@/lib/pageReady.js";

/** Decorative loops run only while their panel and the page are visible, after the loading screen. */
export const useAccentPaused = (itemRef) => {
  const inView = useInView(itemRef);
  const ready = usePageReady();
  const [hidden, setHidden] = useState(() => document.hidden);

  useEffect(() => {
    const updateVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return !ready || !inView || hidden;
};

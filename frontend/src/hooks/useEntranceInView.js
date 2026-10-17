import { useInView } from "motion/react";
import { usePageReady } from "@/lib/pageReady.js";

/**
 * Whether an entrance should play: its element is in view and the loading screen has left.
 * `options` (motion's useInView: `margin`, `amount`) can hold it back until it's further in.
 */
export const useEntranceInView = (ref, options) => {
  const inView = useInView(ref, { once: false, ...options });
  const ready = usePageReady();
  return inView && ready;
};

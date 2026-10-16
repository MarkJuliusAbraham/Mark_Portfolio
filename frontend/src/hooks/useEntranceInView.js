import { useInView } from "motion/react";
import { usePageReady } from "@/lib/pageReady.js";

/** Whether an entrance should play: its element is in view and the loading screen has left. */
export const useEntranceInView = (ref) => {
  const inView = useInView(ref, { once: false });
  const ready = usePageReady();
  return inView && ready;
};

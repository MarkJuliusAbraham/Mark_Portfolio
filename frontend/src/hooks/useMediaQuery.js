import { useSyncExternalStore } from "react";

/** Whether `query` matches right now, following it as it changes. */
export const useMediaQuery = (query) => useSyncExternalStore(
  (onChange) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  () => window.matchMedia(query).matches,
);

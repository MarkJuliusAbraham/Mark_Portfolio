import { useEffect, useRef } from "react";
import { usePageReady } from "@/lib/pageReady.js";

export const fringeTiming = { duration: 650, firstDelay: 2400, quietMin: 12000, quietMax: 20000 };

export function useThemeToggleFringe() {
  const ref = useRef(null);
  // The first pulse is timed from the loading screen leaving, not from mounting beneath it.
  const ready = usePageReady();

  useEffect(() => {
    const button = ref.current;
    if (!ready || !button || typeof IntersectionObserver !== "function") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let waitingTimer;
    let pulseTimer;
    const canAnimate = () => inView && !document.hidden && !reducedMotion.matches;
    const pause = () => {
      window.clearTimeout(waitingTimer);
      window.clearTimeout(pulseTimer);
      button.removeAttribute("data-chromatic-fringe");
    };
    const queue = (delay) => {
      waitingTimer = window.setTimeout(() => {
        if (!canAnimate()) return;
        if (document.documentElement.hasAttribute("data-theme-transition")) {
          queue(fringeTiming.quietMin);
          return;
        }

        button.setAttribute("data-chromatic-fringe", "");
        pulseTimer = window.setTimeout(() => {
          button.removeAttribute("data-chromatic-fringe");
          if (canAnimate()) queue(fringeTiming.quietMin + Math.random() * (fringeTiming.quietMax - fringeTiming.quietMin));
        }, fringeTiming.duration);
      }, delay);
    };
    const sync = () => {
      pause();
      if (canAnimate()) queue(fringeTiming.firstDelay);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.95;
      sync();
    }, { threshold: 0.95 });

    observer.observe(button);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
      pause();
    };
  }, [ready]);

  return ref;
}

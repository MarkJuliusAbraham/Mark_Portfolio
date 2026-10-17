import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { createGridTraces } from "@/lib/gridTraces.js";
import { usePageReady } from "@/lib/pageReady.js";

/**
 * Brightens the background grid's lines around a mouse or pen pointer, on `canvasRef` (see
 * gridTraces.js, which `options` go to). Waits for the loading screen, and stays off with reduced
 * motion.
 */
export const useGridTraces = (canvasRef, options) => {
  const ready = usePageReady();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready || reducedMotion) return;
    const traces = createGridTraces(canvas, options);
    // A canvas inside the page changes size with its element, not only the window.
    const size = new ResizeObserver(() => traces.refresh());
    size.observe(canvas);
    // A light that stays lit only runs while its canvas is on screen.
    const view = new IntersectionObserver(([entry]) => traces.show(entry.isIntersecting));
    if (options?.home) view.observe(canvas);

    // Touch has no hover to follow, so only a pointer that can hover lights the grid.
    const hovering = window.matchMedia("(hover: hover) and (pointer: fine)");
    const move = (event) => {
      if (hovering.matches && event.pointerType !== "touch") traces.point(event.clientX, event.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", traces.leave);

    // The theme switch swaps the page's colors; the lines follow.
    const theme = new MutationObserver(traces.refresh);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", traces.leave);
      theme.disconnect();
      size.disconnect();
      view.disconnect();
      traces.dispose();
    };
  }, [canvasRef, options, ready, reducedMotion]);
};

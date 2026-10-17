import { useEffect, useState } from "react";
import { createGridFormation, gridOpening } from "@/lib/gridFormation.js";
import { loadPage, markPageReady } from "@/lib/pageReady.js";
import { prefersReducedMotion } from "@/lib/scroll.js";
import "./page-loader.css";

/**
 * The background arrives first: scattered intersections form its grid, which settles into its
 * ambient tone once assets are ready, while the UI enters. The canvas stays as the background.
 */
export const PageLoader = ({ canvasRef }) => {
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    const grid = createGridFormation(canvasRef.current, { animate: !prefersReducedMotion() });
    let cancelled = false;
    Promise.all([loadPage(), grid.formed]).then(async () => {
      if (cancelled) return;
      setPhase("settling");
      markPageReady();
      await grid.settle();
      if (cancelled) return;
      setPhase("gone");
    });
    return () => {
      cancelled = true;
      grid.dispose();
    };
  }, [canvasRef]);

  // The page can't be scrolled out from under the loader.
  useEffect(() => {
    if (phase !== "loading") return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className="page-loader" data-phase={phase} role="status" aria-label="Loading" style={{ "--loader-blank-duration": `${gridOpening.blank}ms` }}>
      <div className="page-loader-label" aria-hidden="true">
        Loading
        <span className="page-loader-dots">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
};

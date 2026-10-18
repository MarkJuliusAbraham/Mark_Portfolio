import { useEffect, useRef } from "react";
import { resolveColor } from "@/lib/gridCanvas.js";
import { brightestChannel, ditherSpread, limbShape, paintLimbDarkening } from "@/lib/limbDarkening.js";
import { showLimb } from "@/lib/limbPierce.js";
import { useLimbScopes } from "./useLimbScopes.js";
import "./screen-limb.css";

const themes = ["light", "dark"];

// A number from the stylesheet, or `fallback` if it's unset or unreadable.
const readNumber = (style, name, fallback) => {
  const value = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
};

// The darkening's shape as screen-limb.css sets it, each part falling back to limbShape's.
const readShape = (style) => ({
  start: readNumber(style, "--screen-limb-start", limbShape.start),
  end: readNumber(style, "--screen-limb-end", limbShape.end),
  curve: Math.max(readNumber(style, "--screen-limb-curve", limbShape.curve), 0.05),
});

/**
 * The screen's edges darkening, as on a curved display (limbDarkening.js), laid over everything:
 * the grid, the page and its controls alike, as the glass in front of them would. Each theme's
 * darkening is painted once, at the screen's own pixel density, as strong as --screen-limb-<theme>
 * says and dithered by one visible step of that theme's background, onto a canvas of its own; the
 * stylesheet shows the current theme's, so switching themes costs nothing. The current theme's is
 * painted first and the other's once the browser is idle, and both again when the window resizes.
 * Panels marked `data-limb-scope` carry their own copy instead (useLimbScopes.js,
 * LimbScopeLayer.jsx), so what's inside them can be layered above it, and the background grid's
 * light shines through the one shown (limbPierce.js).
 */
export function ScreenLimb() {
  const canvasRefs = useRef({});
  useLimbScopes(canvasRefs);

  useEffect(() => {
    const canvases = canvasRefs.current;
    let frame;
    let idle;
    // The first paint, as the page loads: both themes at once, behind the loading screen.
    let first = true;
    const currentTheme = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");
    // The screen the canvases cover, in device pixels, measured on the one shown (the hidden one has
    // no size of its own), or failing that the window less any scrollbar.
    const screenSize = () => {
      const ratio = window.devicePixelRatio || 1;
      const box = canvases[currentTheme()]?.getBoundingClientRect();
      const width = box?.width || document.documentElement.clientWidth;
      const height = box?.height || document.documentElement.clientHeight;
      return [Math.round(width * ratio), Math.round(height * ratio)];
    };

    const paint = (theme) => {
      const canvas = canvases[theme];
      if (!canvas) return;
      [canvas.width, canvas.height] = screenSize();
      const style = getComputedStyle(canvas);
      const strength = readNumber(style, `--screen-limb-${theme}`, 0) / 100;
      const surface = resolveColor(`var(--nier-${theme}-surface)`);
      paintLimbDarkening(canvas, strength, {
        shape: readShape(style),
        spread: ditherSpread(brightestChannel(surface)),
      });
      if (theme === currentTheme()) showLimb(canvas, { repainted: true });
    };

    const paintAll = () => {
      frame = undefined;
      const current = currentTheme();
      paint(current);
      const other = themes.find((theme) => theme !== current);
      if (first) {
        first = false;
        paint(other);
        return;
      }
      const later = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 200));
      const cancel = window.cancelIdleCallback ?? clearTimeout;
      if (idle !== undefined) cancel(idle);
      // Within a second however busy the page is, so switching themes soon after loading finds it
      // painted.
      idle = later(() => {
        idle = undefined;
        paint(other);
      }, { timeout: 1000 });
    };
    // Repainted once the window settles at its new size, not on every step of a drag; in between,
    // the canvases stretch with it.
    let settle;
    const schedule = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (frame === undefined) frame = requestAnimationFrame(paintAll);
      }, 150);
    };

    paintAll();
    window.addEventListener("resize", schedule);
    // The screen can change size without the window doing so, as when a scrollbar comes or goes.
    const size = new ResizeObserver(() => {
      const shown = canvases[currentTheme()];
      const [width, height] = screenSize();
      if (shown && (shown.width !== width || shown.height !== height)) schedule();
    });
    for (const canvas of Object.values(canvases)) if (canvas) size.observe(canvas);
    // The light shines through whichever theme's darkening is shown.
    const theme = new MutationObserver(() => showLimb(canvases[currentTheme()]));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      size.disconnect();
      theme.disconnect();
      showLimb(null);
      clearTimeout(settle);
      cancelAnimationFrame(frame);
      if (idle !== undefined) (window.cancelIdleCallback ?? clearTimeout)(idle);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return themes.map((theme) => (
    <canvas
      key={theme}
      ref={(canvas) => { canvasRefs.current[theme] = canvas; }}
      className="screen-limb"
      data-theme={theme}
      aria-hidden="true"
    />
  ));
}

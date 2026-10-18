import { useEffect } from "react";

// Panels that carry their own copy of the darkening (LimbScopeLayer.jsx), marked
// `data-limb-scope`: the screen-wide darkening leaves each one out, along its own edges, so the
// copy inside it isn't laid over a second time.
export const limbScopeSelector = "[data-limb-scope]";

// How many frames running the cut-outs must hold still before they stop being measured.
const settleFrames = 20;

// One side of an `inset()` clip, in px of the element's `size` along that side.
const insetLength = (value, size) => (value.endsWith("%") ? (parseFloat(value) / 100) * size : parseFloat(value) || 0);

/**
 * How much of an element is actually showing: the part of its box left by its own `inset()` clip
 * (as its entrance wipes it in) and by any ancestor that clips what overflows it, and how opaque it
 * is, all its ancestors' opacity included. Nothing at all while it's hidden.
 */
const visiblePart = (element) => {
  const style = getComputedStyle(element);
  if (style.visibility !== "visible") return null;
  const box = element.getBoundingClientRect();
  let [left, top, right, bottom] = [box.left, box.top, box.right, box.bottom];

  const inset = style.clipPath.match(/^inset\(([^)]*)\)/);
  if (inset) {
    const sides = inset[1].split(/\s+round\s+/)[0].trim().split(/\s+/);
    const [insetTop, insetRight = insetTop, insetBottom = insetTop, insetLeft = insetRight] = sides;
    top += insetLength(insetTop, box.height);
    right -= insetLength(insetRight, box.width);
    bottom -= insetLength(insetBottom, box.height);
    left += insetLength(insetLeft, box.width);
  }

  let opacity = parseFloat(style.opacity);
  for (let ancestor = element.parentElement; ancestor && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
    const outer = getComputedStyle(ancestor);
    opacity *= parseFloat(outer.opacity);
    if (outer.overflowX !== "visible" || outer.overflowY !== "visible") {
      const bounds = ancestor.getBoundingClientRect();
      left = Math.max(left, bounds.left);
      top = Math.max(top, bounds.top);
      right = Math.min(right, bounds.right);
      bottom = Math.min(bottom, bounds.bottom);
    }
  }
  return { left, top, right, bottom, opacity };
};

// Each cut-out as [left, top, width, height] in CSS px, snapped to whole device pixels so its
// edges are as crisp as the element's own, and how fully it's cut, from 0 to 1: as opaque as the
// element is, so a cut-out fades in and out with what it shows rather than ahead of it.
const measureHoles = () => {
  const ratio = window.devicePixelRatio || 1;
  const snap = (value) => Math.round(value * ratio) / ratio;
  const holes = [];
  for (const element of document.querySelectorAll(limbScopeSelector)) {
    const part = visiblePart(element);
    if (!part || part.opacity < 0.01) continue;
    const left = snap(Math.max(part.left, 0));
    const top = snap(Math.max(part.top, 0));
    const width = snap(Math.min(part.right, window.innerWidth)) - left;
    const height = snap(Math.min(part.bottom, window.innerHeight)) - top;
    if (width <= 0 || height <= 0) continue;
    holes.push([left, top, width, height, Math.round(part.opacity * 100) / 100]);
  }
  return holes;
};

// A mask that keeps the whole canvas but each hole. The layers are listed top first and each is
// combined with those beneath it, so the full layer goes last and every hole is cut from it, as far
// as its own opacity goes.
const maskFor = (holes) => {
  if (!holes.length) return { maskImage: "", maskSize: "", maskPosition: "", maskRepeat: "", maskComposite: "" };
  const layer = "linear-gradient(#000 0 0)";
  return {
    maskImage: [...holes.map(([, , , , opacity]) => `linear-gradient(rgb(0 0 0 / ${opacity}) 0 0)`), layer].join(", "),
    maskSize: [...holes.map(([, , width, height]) => `${width}px ${height}px`), "100% 100%"].join(", "),
    maskPosition: [...holes.map(([left, top]) => `${left}px ${top}px`), "0 0"].join(", "),
    maskRepeat: "no-repeat",
    maskComposite: [...holes.map(() => "exclude"), "add"].join(", "),
  };
};

/**
 * Cuts every scope panel out of the darkening's canvases (`canvasRefs`), following them as the
 * page scrolls, the window resizes and things animate. It measures only while something may be
 * moving, frame by frame until the cut-outs hold still, and rests otherwise.
 */
export const useLimbScopes = (canvasRefs) => {
  useEffect(() => {
    let frame;
    let still = 0;
    let shown = "";

    const tick = () => {
      frame = undefined;
      const holes = measureHoles();
      const key = holes.join(";");
      if (key !== shown) {
        shown = key;
        const mask = maskFor(holes);
        for (const canvas of Object.values(canvasRefs.current)) if (canvas) Object.assign(canvas.style, mask);
        still = 0;
      } else {
        still += 1;
      }
      if (still < settleFrames) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      still = 0;
      if (frame === undefined) frame = requestAnimationFrame(tick);
    };

    // A panel becoming a scope or stopping, or one arriving already marked (as on a new page);
    // text and other changes are let pass without a look.
    const marks = new MutationObserver((changes) => {
      const relevant = changes.some((change) => change.type === "attributes" || [...change.addedNodes, ...change.removedNodes].some(
        (node) => node.nodeType === 1 && (node.matches(limbScopeSelector) || node.querySelector(limbScopeSelector)),
      ));
      if (relevant) wake();
    });
    // The loading screen's end (data-page-ready) reveals the page, scope panels included.
    marks.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-limb-scope", "data-page-ready"] });
    const moves = ["scroll", "resize", "animationstart", "animationend", "transitionstart", "transitionend"];
    for (const type of moves) document.addEventListener(type, wake, { capture: true, passive: true });
    window.addEventListener("resize", wake);

    wake();
    return () => {
      cancelAnimationFrame(frame);
      marks.disconnect();
      for (const type of moves) document.removeEventListener(type, wake, { capture: true });
      window.removeEventListener("resize", wake);
    };
  }, [canvasRefs]);
};

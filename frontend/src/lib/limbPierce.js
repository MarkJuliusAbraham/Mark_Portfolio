import { splitAlpha } from "./gridCanvas.js";

// Lets the background grid's light shine through the screen's darkening (ScreenLimb.jsx): where
// the light brightens the grid's lines (gridTraces.js), it erases those lines from the darkening,
// so they show at full brightness however near the dark corners they are. The page's solid panels
// and pictures sit between the grid and the darkening; wherever one covers the grid, the darkening
// is put back, so a lit line passing behind a card never shows through it.
//
// The darkening is a still picture, kept unchanged in `pristine`: each frame, the part the light
// last erased is first put back from it, then the light's new lines are erased, all in the light's
// own small box, so nothing else is touched.

// The darkening's canvas being shown, its picture as painted, and the part last erased from it, as
// [x, y, width, height] in its pixels.
let target = null;
let pristine = null;
let erased = null;

// Elements whose solid background or picture hides the grid behind them, and whether that list
// needs looking for again (the page changed).
let covers = [];
let coversFound = false;
let search;

const draw = (canvas) => {
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  return context;
};

// Puts back the part last erased.
const restore = () => {
  if (target && pristine && erased) {
    const [x, y, width, height] = erased;
    const context = draw(target);
    context.clearRect(x, y, width, height);
    context.drawImage(pristine, x, y, width, height, x, y, width, height);
  }
  erased = null;
};

// Whether an element hides what's behind it: a background at least this opaque, or a picture.
const opaqueEnough = 0.9;
const coversGrid = (element) => {
  if (element.matches("img, video")) return true;
  return splitAlpha(getComputedStyle(element).backgroundColor).alpha >= opaqueEnough;
};

// The outermost covering elements in the page: one found, what's inside it is covered already.
const findCovers = () => {
  search = undefined;
  const found = [];
  const walk = (element) => {
    for (const child of element.children) {
      if (coversGrid(child)) found.push(child);
      else walk(child);
    }
  };
  const page = document.querySelector(".page-ui");
  if (page) walk(page);
  covers = found;
  coversFound = true;
};

const findCoversSoon = () => {
  if (search !== undefined) return;
  const later = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 200));
  search = later(findCovers, { timeout: 500 });
};

// The page changing (content arriving, a view switched, the theme changing its backgrounds, the
// window resizing) may change what covers the grid, so the list is looked for again, when idle.
let watching = false;
const watch = () => {
  if (watching) return;
  watching = true;
  // At most one look per quarter second, however busy the page is: waiting for it to settle would
  // wait forever beside a running animation that keeps changing its text. Text alone changes
  // nothing that covers the grid, so it's let pass.
  let pending;
  const changed = (records = []) => {
    const relevant = !records.length || records.some((record) => record.type === "attributes"
      || [...record.addedNodes, ...record.removedNodes].some((node) => node.nodeType === 1));
    if (!relevant || pending !== undefined) return;
    pending = setTimeout(() => {
      pending = undefined;
      findCoversSoon();
    }, 250);
  };
  new MutationObserver(changed).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-page-ready"] });
  new MutationObserver(changed).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", () => changed());
  findCoversSoon();
};

/**
 * ScreenLimb shows a darkening canvas, `canvas`, or with `repainted`, has just painted the one
 * shown afresh: the light erases from this one from now on. What it had erased from the one shown
 * before is put back first; a canvas already shown and not repainted is left as it is.
 */
export const showLimb = (canvas, { repainted = false } = {}) => {
  if (canvas === target && !repainted) return;
  if (canvas !== target) restore();
  erased = null;
  target = canvas;
  if (!canvas) return;
  pristine ??= document.createElement("canvas");
  pristine.width = canvas.width;
  pristine.height = canvas.height;
  // A canvas with no size yet can't be drawn from; the copy stays empty until it's painted.
  if (canvas.width && canvas.height) draw(pristine).drawImage(canvas, 0, 0);
  watch();
  for (const listener of listeners) listener();
};

// Panels that carry their own copy of the darkening (LimbScopeLayer.jsx), told when the picture
// changes: a repaint, or a switch to the other theme's.
const listeners = new Set();

/**
 * The darkening as painted for the theme shown, untouched by the light, covering the screen less
 * any scrollbar; null before the first paint.
 */
export const limbPicture = () => (target ? pristine : null);

/** The picture's pixels per CSS px: taken from the canvas shown, which knows its own size best. */
export const limbPictureScale = () => (target ? target.width / (target.getBoundingClientRect().width || target.width) : 1);

/** Calls `listener` whenever the picture changes; returns a function that stops it. */
export const onLimbPicture = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Erases the light's lines from the darkening: `source` is the light's drawing, covering the same
 * screen as the darkening, and `[sourceX, sourceY, sourceWidth, sourceHeight]` the part of it the
 * light covers, in its pixels; `strength`, from 0 to 1, how fully the lines show through (the
 * light's breath). The two canvases may differ by a few pixels for a moment (one resized before the
 * other); the drawing is scaled to fit their widths.
 */
export const pierceLimb = (source, [sourceX, sourceY, sourceWidth, sourceHeight], strength) => {
  if (!target || !pristine || !source.width || !source.height) return;
  if (!coversFound) findCovers();
  restore();
  // Both start at the screen's top left at the same pixel density; the darkening may run taller
  // (below a phone's address bar), so it's matched by width, the same scale both ways.
  const scaleX = target.width / source.width;
  const scaleY = scaleX;
  const x = Math.max(Math.floor(sourceX * scaleX), 0);
  const y = Math.max(Math.floor(sourceY * scaleY), 0);
  const width = Math.min(Math.ceil((sourceX + sourceWidth) * scaleX), target.width) - x;
  const height = Math.min(Math.ceil((sourceY + sourceHeight) * scaleY), target.height) - y;
  if (width <= 0 || height <= 0) return;
  const context = draw(target);
  context.globalCompositeOperation = "destination-out";
  context.globalAlpha = Math.min(Math.max(strength, 0), 1);
  context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, sourceX * scaleX, sourceY * scaleY, sourceWidth * scaleX, sourceHeight * scaleY);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  erased = [x, y, width, height];

  // Put the darkening back over whatever covers the grid inside the region, unless the page is
  // hidden (under the loading screen), when nothing covers it.
  const page = document.querySelector(".page-ui");
  if (!page || getComputedStyle(page).visibility !== "visible") return;
  const ratio = target.width / target.getBoundingClientRect().width;
  for (const cover of covers) {
    const box = cover.getBoundingClientRect();
    const left = Math.max(Math.floor(box.left * ratio), x);
    const top = Math.max(Math.floor(box.top * ratio), y);
    const right = Math.min(Math.ceil(box.right * ratio), x + width);
    const bottom = Math.min(Math.ceil(box.bottom * ratio), y + height);
    if (right <= left || bottom <= top) continue;
    context.clearRect(left, top, right - left, bottom - top);
    context.drawImage(pristine, left, top, right - left, bottom - top, left, top, right - left, bottom - top);
  }
};

/** The light has gone out: the darkening is put back whole. */
export const clearLimbPierce = () => restore();

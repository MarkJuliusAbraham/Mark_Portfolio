import { hash, readGrid, resolveColor, splitAlpha, traceGridLine, unbend } from "./gridCanvas.js";
import { clearLimbPierce, pierceLimb } from "./limbPierce.js";

// The background grid's own lines lit around the pointer, breathing, on a transparent canvas laid
// over the grid. The lines are drawn inside a box, then faded out with a radial mask, so they never
// show as a hard-edged patch. The canvas can also sit inside an element, such as a panel that hides
// the grid, where the same lines carry on in that element's colours.

const cursor = {
  // How far from the pointer the lines light, in px.
  radius: 170,
  // One full breath, in seconds: the light swells wider and brighter, then settles. `swell` is how
  // much wider it grows and `dim` how far it fades, as shares, at the bottom of each breath.
  breath: 4.2,
  swell: 0.18,
  dim: 0.35,
  // How much each lit line drifts brighter or dimmer on its own, from 0 to 1, so they never
  // pulse in step, and how fast that drifts, in changes a second.
  drift: 0.55,
  driftRate: 0.35,
  // How bright the lit lines get at full breath, from 0 to 1, and how much thicker, in px.
  strength: 0.45,
  thicken: 0.5,
  // How closely the light follows the pointer each frame (1 is at once), and how fast it fades
  // in and out, per second.
  follow: 0.18,
  fade: 3,
};

const smooth = (t) => t * t * (3 - 2 * t);

// Smooth noise from 0 to 1 along one axis, per line `seed`: no jumps from one moment to the next.
const drift = (seed, at) => {
  const whole = Math.floor(at);
  const step = smooth(at - whole);
  return hash(seed, whole, 9) + (hash(seed, whole + 1, 9) - hash(seed, whole, 9)) * step;
};

/**
 * Lights the grid around the pointer on `canvas`. `color` is the lines' CSS color, resolved inside
 * the canvas's parent; `look` overrides any of the light's settings above, for a stronger or
 * softer light; with `bounded`, the light only wakes while the pointer is over the canvas or near
 * enough to reach it, for a canvas that covers part of the page. With `home`, the light never goes
 * out: it rests, breathing, at the canvas's centre, follows the pointer while it's over the
 * canvas, and glides back when it leaves, for as long as `show` says the canvas is in view. With
 * `pierce`, for the canvas laid over the whole background, the lit lines also show through the
 * screen's darkening at its edges (limbPierce.js), as strongly as the light breathes.
 */
export const createGridTraces = (canvas, { color = "color-mix(in srgb, var(--nier-foreground) 40%, transparent)", look, bounded = false, home = false, pierce = false } = {}) => {
  const light = { ...cursor, ...look };
  const context = canvas.getContext("2d");
  // Each effect is drawn here first, masked, then laid onto the canvas.
  const buffer = document.createElement("canvas");
  const layer = buffer.getContext("2d");
  let grid;
  let ratio;
  // The lines' color, drawn opaque onto the buffer, and its own opacity, applied as they're laid
  // onto the canvas: the buffer then holds the lines' exact shape, for the darkening to erase.
  let line;
  let lineAlpha = 1;
  let frame = 0;
  let last = 0;
  // Where the canvas sits on screen, in px: the lines are worked out in screen space.
  let origin = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0, shownX: 0, shownY: 0, present: false, energy: 0 };
  // For a light with a home: whether the canvas is in view, and whether the light has been set at
  // its first place yet (it starts there rather than gliding in from a corner).
  let inView = false;
  let placed = false;

  const measure = () => {
    ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    for (const surface of [canvas, buffer]) {
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
    }
    grid = readGrid();
    ({ opaque: line, alpha: lineAlpha } = splitAlpha(resolveColor(color, canvas.parentElement ?? document.body)));
  };

  const locate = () => {
    const { left, top } = canvas.getBoundingClientRect();
    origin = { x: left, y: top };
  };

  // Whether the pointer is near enough to light any of the canvas.
  const reaches = (x, y) => {
    if (!bounded) return true;
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    const reach = light.radius * (1 + light.swell);
    return x > box.left - reach && x < box.right + reach && y > box.top - reach && y < box.bottom + reach;
  };

  /**
   * Draws the grid's lines that cross the box (in screen px) onto the buffer, at `width` px, each
   * as bright as `shade(index, vertical)` says, from 0 to 1, if given.
   */
  const drawLines = (box, width, shade) => {
    const { size, angle, span, centerX, centerY } = grid;
    layer.setTransform(ratio, 0, 0, ratio, -origin.x * ratio, -origin.y * ratio);
    // The box's corners, taken back to the flat grid (the screen bulges, gridCanvas.js) and into
    // its rotated frame, bound which lines show inside it.
    const corners = [[box.left, box.top], [box.right, box.top], [box.left, box.bottom], [box.right, box.bottom]].map(([x, y]) => {
      const [flatX, flatY] = unbend(grid, x, y);
      const dx = flatX - centerX;
      const dy = flatY - centerY;
      return [dx * Math.cos(angle) + dy * Math.sin(angle), -dx * Math.sin(angle) + dy * Math.cos(angle)];
    });
    const [minX, maxX] = [Math.min(...corners.map(([x]) => x)), Math.max(...corners.map(([x]) => x))];
    const [minY, maxY] = [Math.min(...corners.map(([, y]) => y)), Math.max(...corners.map(([, y]) => y))];
    layer.strokeStyle = line;
    layer.lineWidth = width;
    const offset = span / 2;
    // Each line drawn as it shows on the bulging screen, along the same boundary the grid opens.
    const trace = (vertical, index, from, to) => {
      layer.globalAlpha = shade ? shade(index, vertical) : 1;
      layer.beginPath();
      traceGridLine(layer, grid, vertical, index * size - offset + 0.5, from, to, 16);
      layer.stroke();
    };
    for (let index = Math.ceil((minX + offset) / size); index * size - offset <= maxX; index += 1) trace(true, index, minY, maxY);
    for (let index = Math.ceil((minY + offset) / size); index * size - offset <= maxY; index += 1) trace(false, index, minX, maxX);
    layer.globalAlpha = 1;
  };

  /** Keeps the buffer's lines only where the radial `stops` allow, then lays them onto the canvas. */
  const maskAndLay = (box, centerX, centerY, radius, stops, alpha) => {
    layer.setTransform(ratio, 0, 0, ratio, -origin.x * ratio, -origin.y * ratio);
    layer.globalCompositeOperation = "destination-in";
    const mask = layer.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    for (const [position, opacity] of stops) mask.addColorStop(position, `rgb(0 0 0 / ${opacity})`);
    layer.fillStyle = mask;
    layer.fillRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
    layer.globalCompositeOperation = "source-over";
    // Only the box, in device pixels, kept on the canvas: copying the whole screen every frame
    // would cost far more than the lines themselves.
    const left = Math.max(Math.floor((box.left - origin.x) * ratio), 0);
    const top = Math.max(Math.floor((box.top - origin.y) * ratio), 0);
    const width = Math.min(Math.ceil((box.right - origin.x) * ratio), buffer.width) - left;
    const height = Math.min(Math.ceil((box.bottom - origin.y) * ratio), buffer.height) - top;
    if (width > 0 && height > 0) {
      context.globalAlpha = alpha * lineAlpha;
      context.drawImage(buffer, left, top, width, height, left, top, width, height);
      context.globalAlpha = 1;
      // Fully through the darkening at the top of each breath, as a share of the light's peak.
      if (pierce) pierceLimb(buffer, [left, top, width, height], alpha / light.strength);
    }
    layer.setTransform(1, 0, 0, 1, 0, 0);
    layer.clearRect(0, 0, buffer.width, buffer.height);
  };

  const drawCursor = (now) => {
    const seconds = now / 1000;
    // In and out on an eased curve, lingering at the top and bottom of each breath like a lung.
    const inhale = smooth(0.5 + 0.5 * Math.sin((2 * Math.PI * seconds) / light.breath));
    const radius = light.radius * (1 - light.swell + light.swell * inhale);
    const box = { left: pointer.shownX - radius, top: pointer.shownY - radius, right: pointer.shownX + radius, bottom: pointer.shownY + radius };
    const shade = (index, vertical) => 1 - light.drift + light.drift * drift(index * 2 + (vertical ? 0 : 1), seconds * light.driftRate);
    drawLines(box, 1 + light.thicken * inhale, shade);
    // An eased falloff so no edge or ring shows.
    const brightness = light.strength * (1 - light.dim + light.dim * inhale) * pointer.energy;
    maskAndLay(box, pointer.shownX, pointer.shownY, radius, [[0, 1], [0.35, 0.75], [0.7, 0.25], [1, 0]], brightness);
  };

  // Where a light with a home heads: the pointer while it's over the canvas, otherwise the centre.
  const homeTarget = (box) => {
    const over = pointer.present
      && pointer.x >= box.left && pointer.x <= box.right && pointer.y >= box.top && pointer.y <= box.bottom;
    return over ? { x: pointer.x, y: pointer.y } : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  };

  const render = (now) => {
    const elapsed = last ? (now - last) / 1000 : 0;
    last = now;
    let target = { x: pointer.x, y: pointer.y };
    if (home) {
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) {
        frame = 0;
        return;
      }
      target = homeTarget(box);
      if (!placed) {
        pointer.shownX = target.x;
        pointer.shownY = target.y;
        placed = true;
      }
    }
    const lit = home || pointer.present;
    pointer.energy = Math.min(Math.max(pointer.energy + (lit ? 1 : -1) * light.fade * elapsed, 0), 1);
    pointer.shownX += (target.x - pointer.shownX) * light.follow;
    pointer.shownY += (target.y - pointer.shownY) * light.follow;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    // A canvas inside the page moves as it scrolls.
    if (bounded) locate();
    if (pointer.energy > 0) drawCursor(now);
    else if (pierce) clearLimbPierce();

    // Runs while the pointer is here (its light may still be fading in from nothing) or its light
    // is still fading out, or, for a light with a home, while the canvas is in view; rests otherwise.
    if (home ? inView : pointer.present || pointer.energy > 0) frame = requestAnimationFrame(render);
    else frame = 0;
  };

  const wake = () => {
    if (frame) return;
    last = 0;
    frame = requestAnimationFrame(render);
  };

  measure();
  window.addEventListener("resize", measure);

  return {
    /** Moves the cursor's light, or with `present: false` lets it fade out. */
    point: (x, y, present = true) => {
      if (home) {
        Object.assign(pointer, { x, y, present });
        return;
      }
      present = present && reaches(x, y);
      if (!present && !pointer.present && pointer.energy === 0) return;
      if (present && !pointer.present && pointer.energy === 0) {
        pointer.shownX = x;
        pointer.shownY = y;
      }
      Object.assign(pointer, { x, y, present });
      wake();
    },
    leave: () => {
      pointer.present = false;
      if (!home) wake();
    },
    /** For a light with a home: starts it while the canvas is in view, rests it while it isn't. */
    show: (visible) => {
      inView = visible;
      if (visible) wake();
    },
    /** Picks up new colors and sizes, as after a theme change or a resize. */
    refresh: () => {
      measure();
      if (home && inView) wake();
    },
    dispose: () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      if (pierce) clearLimbPierce();
    },
  };
};

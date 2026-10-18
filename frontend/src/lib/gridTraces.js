import { bend, hash, readGrid, resolveColor, splitAlpha, traceGridCell, traceGridLine, unbend } from "./gridCanvas.js";
import { clearLimbPierce, pierceLimb } from "./limbPierce.js";
import { gridLightAt } from "./gridLighting.js";

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
  // For a light with a home: how much thicker the lines grow at full breath while the pointer is
  // over its canvas, in px (the same as `thicken` unless set), and how quickly they ease between
  // the two each frame, from 0 to 1.
  thickenOver: null,
  overEase: 0.12,
  // How closely the light follows the pointer each frame (1 is at once), and how fast it fades
  // in and out, per second.
  follow: 0.18,
  fade: 3,
  // The squares between the lines tint too, in the lines' colour, each as one even tile shaded by
  // how far its centre is from the light, so the glow steps down tile by tile rather than pooling:
  // how strongly at full breath, from 0 (not at all) to 1, and, like the lines, how much each drifts
  // brighter or dimmer on its own and how fast.
  cells: 0,
  cellDrift: 0.8,
  cellDriftRate: 0.25,
  // How far each tile stops short of the lines around it, in px, so the lines keep their own
  // channel and the grid still reads through the tint, however faint its lines are.
  cellGap: 1.5,
};

const smooth = (t) => t * t * (3 - 2 * t);

// The light's falloff from its centre (0) to its edge (1), eased so no edge or ring shows.
const falloff = [[0, 1], [0.35, 0.75], [0.7, 0.25], [1, 0]];

// How strong the falloff is at `reach`, from 0 to 1, between its stops.
const falloffAt = (reach) => {
  if (reach >= 1) return 0;
  for (let index = 1; index < falloff.length; index += 1) {
    const [position, strength] = falloff[index];
    if (reach <= position) {
      const [lastPosition, lastStrength] = falloff[index - 1];
      return lastStrength + (strength - lastStrength) * ((reach - lastPosition) / (position - lastPosition));
    }
  }
  return 0;
};

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
 * screen's darkening at its edges (limbPierce.js), as strongly as the light breathes. With
 * `glows`, a source of other lights on the grid (the edge pulses, createGlowSource in
 * gridPulses.js), the squares tint around those too while they last, fading toward the middle of
 * the screen as the pulses themselves do. With `flat`, the lines are drawn straight, without the
 * screen's bulge: for a canvas inside a panel, which moves across the screen as the page scrolls
 * and would otherwise show the bend shifting over it.
 */
export const createGridTraces = (canvas, { color = "color-mix(in srgb, var(--nier-foreground) 40%, transparent)", look, bounded = false, home = false, pierce = false, glows = null, flat = false } = {}) => {
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
  // `over`, from 0 to 1, eases toward whether the pointer is over a light with a home's canvas.
  const pointer = { x: 0, y: 0, shownX: 0, shownY: 0, present: false, energy: 0, over: 0 };
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
    grid = flat ? { ...readGrid(), bulge: 0 } : readGrid();
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
   * The part of the grid's rotated frame a box (in screen px) covers: its corners, taken back to
   * the flat grid (the screen bulges, gridCanvas.js) and into the frame, bound which lines and
   * squares show inside it.
   */
  const frameBounds = (box) => {
    const { angle, centerX, centerY } = grid;
    const corners = [[box.left, box.top], [box.right, box.top], [box.left, box.bottom], [box.right, box.bottom]].map(([x, y]) => {
      const [flatX, flatY] = unbend(grid, x, y);
      const dx = flatX - centerX;
      const dy = flatY - centerY;
      return [dx * Math.cos(angle) + dy * Math.sin(angle), -dx * Math.sin(angle) + dy * Math.cos(angle)];
    });
    return {
      minX: Math.min(...corners.map(([x]) => x)),
      maxX: Math.max(...corners.map(([x]) => x)),
      minY: Math.min(...corners.map(([, y]) => y)),
      maxY: Math.max(...corners.map(([, y]) => y)),
    };
  };

  /**
   * Fills the grid's squares that cross the box (in screen px) onto the buffer, in the lines'
   * colour, each evenly, as strong as `shade(column, row, centreX, centreY)` says, from 0 to 1, given
   * where its centre shows on screen.
   */
  const drawCells = (box, shade) => {
    const { size, span, angle } = grid;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    layer.setTransform(ratio, 0, 0, ratio, -origin.x * ratio, -origin.y * ratio);
    const { minX, maxX, minY, maxY } = frameBounds(box);
    const offset = span / 2;
    layer.fillStyle = line;
    // Between the line on each square's near side and the next, stopping short of both.
    const gap = light.cellGap;
    for (let column = Math.floor((minX + offset) / size); column * size - offset <= maxX; column += 1) {
      for (let row = Math.floor((minY + offset) / size); row * size - offset <= maxY; row += 1) {
        const left = column * size - offset + 0.5;
        const top = row * size - offset + 0.5;
        const [x, y] = [left + size / 2, top + size / 2];
        const [centreX, centreY] = bend(grid, grid.centerX + x * cosine - y * sine, grid.centerY + x * sine + y * cosine);
        const strength = shade(column, row, centreX, centreY);
        if (strength <= 0) continue;
        layer.globalAlpha = strength;
        layer.beginPath();
        traceGridCell(layer, grid, left + gap, top + gap, left + size - gap, top + size - gap);
        layer.fill();
      }
    }
    layer.globalAlpha = 1;
  };

  /**
   * Draws the grid's lines that cross the box (in screen px) onto the buffer, at `width` px, each
   * as bright as `shade(index, vertical)` says, from 0 to 1, if given.
   */
  const drawLines = (box, width, shade) => {
    const { size, span } = grid;
    layer.setTransform(ratio, 0, 0, ratio, -origin.x * ratio, -origin.y * ratio);
    const { minX, maxX, minY, maxY } = frameBounds(box);
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

  /**
   * Keeps the buffer's drawing only where the radial `stops` allow, then lays it onto the canvas,
   * at `alpha` times `colorAlpha` (the lines' own colour's opacity, unless given). Without
   * `stops`, it's laid as drawn, with no fade. With `piercing`, it also shows through the screen's
   * darkening (only the lines do: squares there would erase it in whole patches).
   */
  const maskAndLay = (box, centerX, centerY, radius, stops, alpha, { colorAlpha = lineAlpha, piercing = pierce } = {}) => {
    layer.setTransform(ratio, 0, 0, ratio, -origin.x * ratio, -origin.y * ratio);
    if (stops) {
      layer.globalCompositeOperation = "destination-in";
      const mask = layer.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      for (const [position, opacity] of stops) mask.addColorStop(position, `rgb(0 0 0 / ${opacity})`);
      layer.fillStyle = mask;
      layer.fillRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
      layer.globalCompositeOperation = "source-over";
    }
    // Only the box, in device pixels, kept on the canvas: copying the whole screen every frame
    // would cost far more than the lines themselves.
    const left = Math.max(Math.floor((box.left - origin.x) * ratio), 0);
    const top = Math.max(Math.floor((box.top - origin.y) * ratio), 0);
    const width = Math.min(Math.ceil((box.right - origin.x) * ratio), buffer.width) - left;
    const height = Math.min(Math.ceil((box.bottom - origin.y) * ratio), buffer.height) - top;
    if (width > 0 && height > 0) {
      context.globalAlpha = alpha * colorAlpha;
      context.drawImage(buffer, left, top, width, height, left, top, width, height);
      context.globalAlpha = 1;
      // Fully through the darkening at the top of each breath, as a share of the light's peak.
      if (piercing) pierceLimb(buffer, [left, top, width, height], alpha / light.strength);
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
    const breathing = (1 - light.dim + light.dim * inhale) * pointer.energy;
    // The squares first, beneath the lines: each one even, shaded by how far its centre is from the
    // light and drifting on its own, so the glow steps down tile by tile with no fade across it.
    // They tint the grid but don't show through the darkening.
    if (light.cells > 0) {
      const cellShade = (column, row, centreX, centreY) => {
        const reach = Math.hypot(centreX - pointer.shownX, centreY - pointer.shownY) / radius;
        const own = 1 - light.cellDrift + light.cellDrift * drift(column * 7919 + row * 104729 + 3, seconds * light.cellDriftRate);
        return falloffAt(reach) * own;
      };
      drawCells(box, cellShade);
      maskAndLay(box, pointer.shownX, pointer.shownY, radius, null, light.cells * breathing, { colorAlpha: 1, piercing: false });
    }
    const shade = (index, vertical) => 1 - light.drift + light.drift * drift(index * 2 + (vertical ? 0 : 1), seconds * light.driftRate);
    const thicken = light.thicken + ((light.thickenOver ?? light.thicken) - light.thicken) * pointer.over;
    drawLines(box, 1 + thicken * inhale, shade);
    maskAndLay(box, pointer.shownX, pointer.shownY, radius, falloff, light.strength * breathing);
  };

  /**
   * Tints the squares around each of the other lights on the grid (`glows`): each square evenly,
   * by how far its centre is from the light, as bright as the light is now, and faded toward the
   * middle of the screen with the grid's own light. Returns whether any light was alive.
   */
  const drawGlows = (now) => {
    const lights = glows?.list() ?? [];
    if (!lights.length || light.cells <= 0) return lights.length > 0;
    const seconds = now / 1000;
    const { centerX, centerY, width, height, centerStrength } = grid;
    for (const glow of lights) {
      const box = { left: glow.x - glow.radius, top: glow.y - glow.radius, right: glow.x + glow.radius, bottom: glow.y + glow.radius };
      drawCells(box, (column, row, x, y) => {
        const own = 1 - light.cellDrift + light.cellDrift * drift(column * 7919 + row * 104729 + 3, seconds * light.cellDriftRate);
        return falloffAt(Math.hypot(x - glow.x, y - glow.y) / glow.radius) * own * gridLightAt(x - centerX, y - centerY, width, height, centerStrength);
      });
      maskAndLay(box, glow.x, glow.y, glow.radius, null, light.cells * glow.strength, { colorAlpha: 1, piercing: false });
    }
    return true;
  };

  // Where a light with a home heads: the pointer while it's over the canvas, otherwise the centre.
  // It notes which, too, for the lines to ease thinner while the pointer is over.
  const homeTarget = (box) => {
    const over = pointer.present
      && pointer.x >= box.left && pointer.x <= box.right && pointer.y >= box.top && pointer.y <= box.bottom;
    pointer.over += ((over ? 1 : 0) - pointer.over) * light.overEase;
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
    const glowing = drawGlows(now);
    if (pointer.energy > 0) drawCursor(now);
    else if (pierce) clearLimbPierce();

    // Runs while the pointer is here (its light may still be fading in from nothing) or its light
    // is still fading out, or, for a light with a home, while the canvas is in view; rests otherwise.
    if (home ? inView : pointer.present || pointer.energy > 0 || glowing) frame = requestAnimationFrame(render);
    else frame = 0;
  };

  const wake = () => {
    if (frame) return;
    last = 0;
    frame = requestAnimationFrame(render);
  };

  // Remeasured once the window settles at its new size, not on every step of a drag; in between,
  // the canvas stretches with it.
  let settle;
  const resized = () => {
    clearTimeout(settle);
    settle = setTimeout(measure, 150);
  };

  measure();
  window.addEventListener("resize", resized);
  // A pulse starting wakes the light, even with no pointer about.
  const stopGlows = glows?.subscribe(() => wake());

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
      clearTimeout(settle);
      window.removeEventListener("resize", resized);
      stopGlows?.();
      if (pierce) clearLimbPierce();
    },
  };
};

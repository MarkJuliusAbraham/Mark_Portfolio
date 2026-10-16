// Draws a cover of opaque grid squares matching the page's background grid. It opens blank and its
// lines draw themselves in; then, while the page loads, a slowly flowing noise field breathes
// through it, shrinking, shifting and shading the squares. Then the squares shrink away in an
// organic, noise-shaped wave from the middle of the screen to reveal the page. Canvas, since a
// full screen of squares is hundreds.

import { createLinePaint, createOpeningLines, gridOpening, gridOpeningDuration, hash, readGrid, resolveColor } from "./gridCanvas.js";

export { gridOpening };
const spawnLength = gridOpeningDuration;

const breath = {
  // The squares' size at rest, as a share of their cell: the rest is the grid line around them.
  rest: 0.97,
  // How much more of its cell a square gives up where the noise runs deepest.
  depth: 0.16,
  // How large the noise's features are, in px, and how fast it flows, in features a second.
  scale: 260,
  flow: 0.22,
  // How far a square drifts off the middle of its cell, in px, either way.
  shift: 3,
  // How far a square's tone may dim toward the theme's shade, from 0 to 1.
  dim: 0.35,
  // Where a sparse noise field peaks, scattered squares turn to the opposite theme's tone. Each
  // square turns once the field passes its own threshold, somewhere in this range.
  inverse: [0.68, 0.85],
  // How long the breath takes to rise to full strength once the lines are drawn, in ms.
  ease: 700,
};

// The tone squares dim toward. Each theme needs its own: the text color is dark on the pale theme
// but light on the dark one, so it can't stand in for a shade in both.
const shades = {
  light: "color-mix(in srgb, var(--foreground) 22%, var(--background))",
  dark: "color-mix(in srgb, black 45%, var(--background))",
};

const unravel = {
  // How long the wave takes to travel from the middle to the farthest square.
  spread: 650,
  // How much the noise pulls a square's leaving earlier or later than its distance alone would.
  roughness: 420,
  // How large the wave's noisy features are, in px.
  scale: 220,
  // How long each square takes to shrink away.
  shrink: 380,
};

// From the first square setting off to the last one gone.
const unravelLength = unravel.spread + unravel.roughness + unravel.shrink;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.min(Math.max(t, 0), 1);

/** Smooth value noise from 0 to 1: neighbouring points get similar values, with no seams. */
const noise = (x, y, z = 0) => {
  const [ix, iy, iz] = [Math.floor(x), Math.floor(y), Math.floor(z)];
  const [fx, fy, fz] = [smooth(x - ix), smooth(y - iy), smooth(z - iz)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const corner = (dx, dy, dz) => hash(ix + dx, iy + dy, iz + dz);
  const plane = (dz) => lerp(lerp(corner(0, 0, dz), corner(1, 0, dz), fx), lerp(corner(0, 1, dz), corner(1, 1, dz), fx), fy);
  return lerp(plane(0), plane(1), fz);
};

/** Pass `breathe: false` (as for reduced motion) to hold the cover still until it unravels. */
export const createGridUnravel = (canvas, { breathe = true } = {}) => {
  const context = canvas.getContext("2d");
  const clockStart = performance.now();
  // New growth on each load, stable during resizes and throughout this controller's lifetime.
  const openingSeed = Math.random() * 1000;
  let layout;
  let colors;

  const measure = () => {
    const ratio = window.devicePixelRatio || 1;
    // The canvas's own box, which leaves out the scrollbar's track, not the whole window: sized from
    // the window it would be stretched across a narrower box, squeezing the grid off true.
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const grid = readGrid();

    // The wave starts in the middle of the screen, which is not the grid's own center beside the
    // sidebar; find it in the grid's rotated frame.
    const offsetX = width / 2 - grid.centerX;
    const offsetY = height / 2 - grid.centerY;
    const originX = offsetX * Math.cos(grid.angle) + offsetY * Math.sin(grid.angle);
    const originY = -offsetX * Math.sin(grid.angle) + offsetY * Math.cos(grid.angle);

    // The background grid is laid out on a 150vmax square around its center; tile the same way so
    // the lines match, keeping the squares that reach the screen.
    const span = grid.span;
    const count = Math.ceil(span / grid.size);
    const cover = Math.hypot(width, height) / 2 + grid.size;
    const tiles = [];
    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        const x = column * grid.size - span / 2;
        const y = row * grid.size - span / 2;
        const middleX = x + grid.size / 2;
        const middleY = y + grid.size / 2;
        const distance = Math.hypot(middleX - originX, middleY - originY);
        if (distance > cover) continue;
        // When it leaves: its distance from the middle, pulled earlier or later by smooth noise,
        // so the opening grows in organic shapes rather than rings.
        const pull = noise(middleX / unravel.scale + 40, middleY / unravel.scale + 40);
        const [low, high] = breath.inverse;
        tiles.push({
          x,
          y,
          middleX,
          middleY,
          start: (distance / cover) * unravel.spread + pull * unravel.roughness,
          inverseAt: low + hash(column, row, 7) * (high - low),
        });
      }
    }
    const lines = createOpeningLines({ count, span, grid, width, height, seed: openingSeed });
    layout = { ratio, grid, tiles, lines, first: -span / 2, last: count * grid.size - span / 2 };
    colors = {
      face: resolveColor("var(--background)"),
      line: createLinePaint(context, grid, { width, height }),
      shade: resolveColor(shades[document.documentElement.classList.contains("dark") ? "dark" : "light"]),
      inverse: resolveColor("var(--card-inverse)"),
    };
  };

  /** Draws the lines growing in, `time` ms after the cover appeared, over a blank sheet. */
  const drawSpawn = (time) => {
    const { grid, lines, first, last } = layout;
    // As thick as the gaps the squares leave at rest, so the hand-over to them doesn't show.
    const thickness = (1 - breath.rest) * grid.size;
    context.fillStyle = colors.line;
    for (const line of lines) {
      const age = time - gridOpening.blank - line.delay;
      if (age <= 0) continue;
      const backward = easeInOut(clamp01(age / line.backward));
      const forward = easeInOut(clamp01(age / line.forward));
      const start = line.from - backward * (line.from - first);
      const end = line.from + forward * (last - line.from);
      if (line.vertical) context.fillRect(line.at - thickness / 2, start, thickness, end - start);
      else context.fillRect(start, line.at - thickness / 2, end - start, thickness);
    }
  };

  /** Draws the cover at `now`; with `elapsed`, that many ms into the unravel. */
  const draw = (now, elapsed = null) => {
    const { ratio, grid, tiles } = layout;
    const { size } = grid;
    const time = now - clockStart;
    // Held still (as for reduced motion), the noise stops flowing but keeps its shape, and the
    // grid is simply there rather than drawn in.
    const flow = breathe ? (time / 1000) * breath.flow : 0;
    const spawning = breathe && elapsed === null && time < spawnLength;
    const strength = breathe ? smooth(clamp01((time - spawnLength) / breath.ease)) : 1;
    // Cleared in device pixels: at fractional scales the CSS size falls short of the last column.
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (spawning) {
      context.fillStyle = colors.face;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.translate(grid.centerX, grid.centerY);
    context.rotate(grid.angle);
    if (spawning) {
      drawSpawn(time);
      return;
    }

    const present = [];
    for (const tile of tiles) {
      const progress = elapsed === null ? 0 : Math.min(Math.max((elapsed - tile.start) / unravel.shrink, 0), 1);
      if (progress < 1) present.push([tile, easeInOut(progress)]);
    }

    // Every cell first, the color of the grid lines, fading as its square goes so no outline
    // lingers; then the squares over them, so one drifting toward a neighbour is never cut off.
    context.fillStyle = colors.line;
    for (const [tile, leaving] of present) {
      context.globalAlpha = 1 - leaving;
      context.fillRect(tile.x - 0.25, tile.y - 0.25, size + 0.5, size + 0.5);
    }

    for (const [tile, leaving] of present) {
      // Shrunk by the breath and then by its leaving, drifting off the middle of its cell, dimming,
      // and here and there turning to the opposite theme's tone. Each follows its own patch of the
      // noise, so they never move in step. All of it rises in from nothing once the lines are drawn.
      const [u, v] = [tile.middleX / breath.scale, tile.middleY / breath.scale];
      const depth = noise(u, v, flow) * strength;
      const driftX = (noise(u + 17, v, flow) * 2 - 1) * breath.shift * strength;
      const driftY = (noise(u, v + 29, flow) * 2 - 1) * breath.shift * strength;
      const dim = smooth(noise(u + 53, v + 11, flow * 0.8)) * breath.dim * strength;
      const inverse = smooth(clamp01((noise(u * 3 + 91, v * 3 + 5, flow * 1.3) - tile.inverseAt) / 0.06)) * strength;
      const side = size * (breath.rest - breath.depth * depth) * (1 - leaving);
      const left = tile.middleX + driftX - side / 2;
      const top = tile.middleY + driftY - side / 2;
      const layers = [[colors.face, 1], [colors.shade, dim], [colors.inverse, inverse]];
      for (const [color, strength] of layers) {
        if (strength < 0.01) continue;
        context.globalAlpha = strength;
        context.fillStyle = color;
        context.fillRect(left, top, side, side);
      }
    }
    context.globalAlpha = 1;
  };

  let frame = 0;
  let waiting = 0;
  const breatheLoop = (now) => {
    draw(now);
    frame = requestAnimationFrame(breatheLoop);
  };

  measure();
  draw(clockStart);
  if (breathe) frame = requestAnimationFrame(breatheLoop);

  const onResize = () => {
    measure();
    draw(performance.now());
  };
  window.addEventListener("resize", onResize);

  return {
    /**
     * Shrinks the squares away; resolves once the last is gone. `onNearlyDone` runs `lead` ms
     * before that, while only the outermost squares remain.
     */
    play: ({ lead = 0, onNearlyDone } = {}) => new Promise((resolve) => {
      const run = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", onResize);
        const begin = performance.now();
        let nearlyDone = false;
        const step = (now) => {
          const elapsed = now - begin;
          draw(now, elapsed);
          if (!nearlyDone && elapsed >= unravelLength - lead) {
            nearlyDone = true;
            onNearlyDone?.();
          }
          if (elapsed < unravelLength) frame = requestAnimationFrame(step);
          else resolve();
        };
        frame = requestAnimationFrame(step);
      };
      // The grid always finishes drawing itself in before it comes apart.
      const wait = breathe ? clockStart + spawnLength - performance.now() : 0;
      if (wait > 0) waiting = setTimeout(run, wait);
      else run();
    }),
    dispose: () => {
      clearTimeout(waiting);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    },
  };
};

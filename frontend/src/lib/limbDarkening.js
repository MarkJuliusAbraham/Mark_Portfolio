// Limb darkening: a screen dimming toward its edges and most in its corners, as a convex display
// does, laid over the whole page (ScreenLimb.jsx). Painted rather than drawn as a CSS gradient:
// so faint a darkening across a whole screen takes the background through only a few visible
// shades (a dark page darkened by a quarter has about ten), and shows the steps between them as
// rings. Here each pixel's darkness is nudged at random by about one of those visible steps
// (dithering), balanced so the average stays exact, so the steps dissolve into a grain too fine to
// see. It's painted at the screen's own pixel density, so no stretching blurs that grain away again.

/**
 * The darkening's shape, unless the page's stylesheet sets its own (screen-limb.css): where it
 * begins and where it reaches full strength, as shares of the way from the centre to a corner, and
 * how its strength is spread between them. A curve of 1 eases in evenly; higher holds the
 * darkening back toward the corners, so it falls away more sharply inward; lower spreads it
 * further in.
 */
export const limbShape = { start: 0.42, end: 1, curve: 1.4 };

const smooth = (t) => t * t * (3 - 2 * t);

// How dim the screen is at `reach` of the way from the centre to a corner, from 0 to 1.
const shadeAt = (reach, { start, end, curve }) => {
  const span = Math.max(end - start, 1e-6);
  return smooth(Math.min(Math.max((reach - start) / span, 0), 1)) ** curve;
};

/**
 * How dim the screen is at a pixel, from 0 to 1 of the full strength: nothing in the middle,
 * easing in along one smooth curve with no kinks, so no edge of it can be picked out either.
 */
export const limbShade = (x, y, width, height, shape = limbShape) => {
  const dx = (x - width / 2) / (width / 2);
  const dy = (y - height / 2) / (height / 2);
  return shadeAt(Math.hypot(dx, dy) / Math.SQRT2, shape);
};

/**
 * How far, in steps of opacity (0 to 255), each pixel's darkness is nudged: one visible step of a
 * background whose brightest channel is `brightest` (0 to 255). Black laid over it at one opacity
 * step darkens it by brightest / 255 of a visible step, so it takes this many.
 */
export const ditherSpread = (brightest) => 255 / Math.max(brightest, 1);

/** The brightest channel (0 to 255) of an `rgb(…)` color, or 255 if it can't be read. */
export const brightestChannel = (color) => {
  const channels = String(color).match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3 ? Math.max(...channels) : 255;
};

// The shade is looked up by squared distance from the centre (0 at the centre, 2 in a corner, in
// half-widths and half-heights), in this many steps: far finer than the dithering, so the steps
// never show, and it spares every pixel a square root and a power.
const tableSteps = 4096;

// The grain comes from a tile of random nudges this many px square, repeated across the screen:
// making a random number for every pixel would cost more than all the rest of its work, and a
// grain one shade deep shows no pattern at this size.
const tileSize = 256;

// A fast seeded random number from 0 to 1 (xorshift), to fill the tile.
const fastRandom = () => {
  let seed = 0x9e3779b9;
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
};

/**
 * Paints the darkening onto `canvas` at the size it already has, as black up to `strength` (0 to
 * 1) in the corners, in the given `shape` (limbShape), dithered by `spread` opacity steps.
 * `random` is only for tests.
 */
export const paintLimbDarkening = (canvas, strength, { shape = limbShape, spread = 1, random = fastRandom() } = {}) => {
  const { width, height } = canvas;
  // A screen with no size yet has nothing to darken (and no image of no size can be made).
  if (!width || !height) return;
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);
  // Each pixel written whole, as one word: black, with its opacity in the top byte.
  const words = new Uint32Array(image.data.buffer);

  const table = new Float32Array(tableSteps + 2);
  for (let step = 0; step <= tableSteps + 1; step += 1) {
    table[step] = strength * shadeAt(Math.sqrt((step / tableSteps) * 2) / Math.SQRT2, shape) * 255;
  }
  const across = new Float32Array(width);
  for (let x = 0; x < width; x += 1) across[x] = ((x + 0.5 - width / 2) / (width / 2)) ** 2;
  const tile = new Float32Array(tileSize * tileSize);
  for (let index = 0; index < tile.length; index += 1) tile[index] = random() * 2 - 1;
  const toStep = tableSteps / 2;
  const half = spread / 2;
  const wrap = tileSize - 1;

  for (let y = 0; y < height; y += 1) {
    const down = ((y + 0.5 - height / 2) / (height / 2)) ** 2;
    const row = (y & wrap) * tileSize;
    let index = y * width;
    for (let x = 0; x < width; x += 1, index += 1) {
      const alpha = table[((down + across[x]) * toStep) | 0];
      if (alpha <= 0) continue;
      // Nudged evenly either way; near the middle, never further than it can go both ways, so
      // nothing is clipped at nothing and the average stays exact.
      const nudged = (alpha + tile[row + (x & wrap)] * (alpha < half ? alpha : half) + 0.5) | 0;
      words[index] = (nudged > 255 ? 255 : nudged) << 24;
    }
  }
  context.putImageData(image, 0, 0);
};

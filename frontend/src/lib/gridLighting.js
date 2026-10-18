// Shared falloff for the page's CSS grid and the loading canvas. The center strength stays a
// themeable CSS value; these eased stops keep the light from forming a visible ring.
export const gridLightStops = [
  [0, 0],
  [0.2, 0.08],
  [0.4, 0.3],
  [0.6, 0.62],
  [0.8, 0.9],
  [1, 1],
];

/**
 * How much of the grid's light shows at a point, from `center` (the share left in the middle of the
 * screen) to 1 at its corners: the same falloff as gridLightMask, at `dx`, `dy` px from the middle
 * of a `width` by `height` screen.
 */
export const gridLightAt = (dx, dy, width, height, center) => {
  // gridLightMask is an ellipse reaching the corners: half-axes of width and height over root 2.
  const reach = Math.min(Math.hypot(dx / (width / Math.SQRT2), dy / (height / Math.SQRT2)), 1);
  for (let index = 1; index < gridLightStops.length; index += 1) {
    const [position, strength] = gridLightStops[index];
    if (reach <= position) {
      const [lastPosition, lastStrength] = gridLightStops[index - 1];
      const share = lastStrength + (strength - lastStrength) * ((reach - lastPosition) / (position - lastPosition));
      return center + (1 - center) * share;
    }
  }
  return 1;
};

export const gridLightMask = `radial-gradient(ellipse farthest-corner at center, ${
  gridLightStops.map(([position, strength]) =>
    `rgb(0 0 0 / calc(var(--body-grid-center) + (1 - var(--body-grid-center)) * ${strength})) ${position * 100}%`,
  ).join(", ")
})`;

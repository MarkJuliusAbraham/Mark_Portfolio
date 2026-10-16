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

export const gridLightMask = `radial-gradient(ellipse farthest-corner at center, ${
  gridLightStops.map(([position, strength]) =>
    `rgb(0 0 0 / calc(var(--body-grid-center) + (1 - var(--body-grid-center)) * ${strength})) ${position * 100}%`,
  ).join(", ")
})`;

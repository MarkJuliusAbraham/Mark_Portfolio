export const gridOpeningWave = {
  enabled: true,
  duration: 600, // Milliseconds for the circular light to expand beyond the screen.
  width: 160, // Soft light band's width in CSS pixels at full size.
};

/** One round wave in viewport space, independent of the grid's angle or aspect ratio. */
export function createOpeningWave({ width, height }, options = gridOpeningWave) {
  const settings = { ...gridOpeningWave, ...options };
  return {
    ...settings,
    // At the end even the inner edge of the light has passed the farthest screen corner.
    diameter: Math.hypot(width, height) + settings.width * 2,
    keyframes: [
      { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0)" },
      { offset: 0.12, opacity: 1, transform: "translate(-50%, -50%) scale(0.12)" },
      { offset: 0.72, opacity: 1, transform: "translate(-50%, -50%) scale(0.72)" },
      { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(1)" },
    ],
  };
}

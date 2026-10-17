export const cursorEffects = {
  chromatic: {
    maxOffset: 6, // Maximum red/blue separation in CSS pixels.
    speedResponse: 3, // Separation per pixel/ms of movement.
    opacity: 1,
  },
  ghosting: {
    enabled: true,
    maxDistance: 18, // Maximum trailing distance in CSS pixels.
    lag: 32, // Milliseconds of travel represented by the trail; capped by maxDistance.
    maxOpacity: 0.45, // Opacity cap, from 0 to 1.
    opacityResponse: 1.2, // Visibility gained per pixel/ms of movement.
  },
};

export function getCursorMovement(dx, dy, frameDuration) {
  const distance = Math.hypot(dx, dy);
  return {
    distance,
    speed: distance / Math.max(1, frameDuration),
    direction: { x: distance ? dx / distance : 0, y: distance ? dy / distance : 0 },
  };
}

export function getCursorSplit(movement, options = cursorEffects.chromatic) {
  const { maxOffset, speedResponse } = { ...cursorEffects.chromatic, ...options };
  const offset = Math.max(0, Math.min(maxOffset, movement.speed * speedResponse));
  return { x: movement.direction.x * offset, y: movement.direction.y * offset };
}

export function getCursorGhost(movement, options = cursorEffects.ghosting) {
  const { enabled, maxDistance, lag, maxOpacity, opacityResponse } = { ...cursorEffects.ghosting, ...options };
  if (!enabled) return { x: 0, y: 0, opacity: 0 };
  const distance = Math.max(0, Math.min(maxDistance, movement.speed * lag));
  const opacity = Math.max(0, Math.min(1, maxOpacity, movement.speed * opacityResponse));
  return { x: -movement.direction.x * distance, y: -movement.direction.y * distance, opacity };
}

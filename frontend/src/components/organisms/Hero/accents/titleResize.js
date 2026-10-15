// How far the design title can be scaled from its original size.
export const titleScaleLimits = { min: 0.75, max: 1.4 };

// Past a limit, the drag only stretches this much of the extra distance, and never by more than
// `maxOvershoot`, so the box clearly pushes back rather than following the pointer.
const resistance = 0.15;
const maxOvershoot = 0.05;

/**
 * The scale a corner drag asks for. Dragging a corner away from the box grows it and toward the
 * box shrinks it; horizontal and vertical movement count equally, relative to the box's size when
 * the drag started. Corners are "tl", "tr", "bl" or "br".
 */
export function dragScale({ startScale, width, height, corner, dx, dy }) {
  const towardX = corner.endsWith("r") ? 1 : -1;
  const towardY = corner.startsWith("b") ? 1 : -1;
  const growth = ((dx * towardX) / width + (dy * towardY) / height) / 2;
  return startScale * (1 + growth);
}

/**
 * The scale to show for a requested one, and which limit it is pressing against, if any. Within
 * the limits it follows exactly; beyond them it resists.
 */
export function resistedScale(requested, { min, max } = titleScaleLimits) {
  if (requested > max) return { scale: max + Math.min((requested - max) * resistance, maxOvershoot), limit: "max" };
  if (requested < min) return { scale: min - Math.min((min - requested) * resistance, maxOvershoot), limit: "min" };
  return { scale: requested, limit: null };
}

/** Where the scale comes to rest once the handle is let go: back inside the limits. */
export const settledScale = (scale, { min, max } = titleScaleLimits) => Math.max(min, Math.min(max, scale));

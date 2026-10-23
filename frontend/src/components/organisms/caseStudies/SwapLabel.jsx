/**
 * A button label that switches between two texts without resizing the button: both texts share one
 * grid cell, sized to the longer, and only the current one is visible (and read out).
 */
export const SwapLabel = ({ on, onLabel, offLabel }) => (
  <span className="cs-swap">
    <span aria-hidden={!on || undefined} data-shown={on || undefined}>{onLabel}</span>
    <span aria-hidden={on || undefined} data-shown={!on || undefined}>{offLabel}</span>
  </span>
);

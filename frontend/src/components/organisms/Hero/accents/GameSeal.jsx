import { useAccentPaused } from "@/hooks/useAccentPaused.js";
import "./GameSeal.css";

const sealBarCount = 10;
const sealBars = Array.from({ length: sealBarCount }, (_, step) => {
  const position = step / (sealBarCount - 1);
  // Inverse smoothstep: the crest starts gently, accelerates, then eases into the diamond.
  const delay = 0.5 - Math.sin(Math.asin(1 - 2 * position) / 3);
  return { step, delay: Number(delay.toFixed(6)) };
});

/** Fixed bars grow and shrink in sequence, sending a wave toward the diamond on hover. */
export const GameSeal = ({ active, itemRef, dwellDuration }) => {
  const paused = useAccentPaused(itemRef);
  return (
    <span className="focus-game-seal" aria-hidden="true" data-paused={paused} style={{ "--seal-shift-duration": `${dwellDuration}ms`, "--seal-bar-count": sealBarCount }}>
      {["left", "right"].map((side) => (
        <span key={side} className="focus-game-seal-bars" data-side={side}>
          {active && (
            <span className="focus-game-seal-wave">
              {sealBars.map(({ step, delay }) => (
                <span key={step} className="focus-game-seal-bar" style={{ "--bar-step": step, "--bar-delay": delay }} />
              ))}
            </span>
          )}
        </span>
      ))}
      <span className="focus-game-seal-mark">
        <svg className="focus-game-seal-symbol" viewBox="0 0 24 24" width="18" height="18">
          <path d="M12 3.5 19.5 12 12 20.5 4.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path className="focus-game-seal-progress" d="M12 3.5 19.5 12 12 20.5 4.5 12Z" pathLength="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path className="focus-game-seal-core" d="m12 9 2.5 3-2.5 3-2.5-3Z" fill="currentColor" />
        </svg>
      </span>
    </span>
  );
};

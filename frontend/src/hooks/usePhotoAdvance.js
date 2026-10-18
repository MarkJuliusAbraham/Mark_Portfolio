import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useAccentPaused } from "@/hooks/useAccentPaused.js";
import { createElementGlitch } from "@/lib/theme-transition/elementChromatic.js";

// How the film moves on by a frame on its own: how long, and its pace, quick off the mark and
// settling into place like a wound advance.
export const filmAdvance = { duration: 460, easing: "cubic-bezier(0.6, 0, 0.2, 1)" };
// How long an advance keeps the countdown waiting, in ms.
const advanceTime = 500;

/**
 * Switches `frameRef` between `count` photos two ways. On its own, every `hold` ms (waiting while
 * `held`, off screen or in a background tab), the film moves on a frame: the photo slides away and
 * the next slides into place. On demand, with `step(±1)`, the frame splits through the site's
 * chromatic aberration and the photo changes at once, at its peak.
 *
 * `current` is the photo shown and `previous` the one it took over from, if any; `change` counts
 * every switch and `advanced` says whether the latest moved the film, so the movement can start
 * over with each. `auto` says what the automatic switch is doing: "counting" down the hold,
 * "held", "waiting" (mid-advance, off screen or before the page is ready) or "off" with reduced
 * motion. With `wind`, the first time the frame can be seen after loading,
 * its photo is wound into place, once.
 */
export const usePhotoAdvance = (frameRef, count, { hold = 4200, held = false, wind = true } = {}) => {
  const reduceMotion = useReducedMotion();
  const paused = useAccentPaused(frameRef);
  const [state, setState] = useState({ current: 0, previous: null, change: 0, advanced: false });
  const [moving, setMoving] = useState(false);
  const glitchRef = useRef(null);
  const timer = useRef(0);
  const introduced = useRef(false);

  useEffect(() => {
    const glitch = createElementGlitch(frameRef.current);
    glitchRef.current = glitch;
    return () => {
      glitch.dispose();
      glitchRef.current = null;
      clearTimeout(timer.current);
    };
  }, [frameRef]);

  const commit = (heading, advanced) => setState(({ current, change }) => ({
    current: (((current + heading) % count) + count) % count,
    previous: heading ? current : null,
    change: change + 1,
    advanced,
  }));

  /** Steps `heading` photos along by hand: the aberration, and the change at its peak. */
  const step = (heading) => {
    if (reduceMotion || !glitchRef.current) {
      commit(heading, false);
      return;
    }
    glitchRef.current.run(() => commit(heading, false));
  };

  /** Moves the film `heading` frames on, on its own (0 winds the one shown into place). */
  const advance = (heading) => {
    commit(heading, !reduceMotion);
    if (reduceMotion) return;
    setMoving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMoving(false), advanceTime);
  };

  const advanceOnItsOwn = useEffectEvent(() => advance(1));
  const windFirst = useEffectEvent(() => advance(0));

  // `paused` already waits for the page to be ready and the frame to be on screen.
  useEffect(() => {
    if (introduced.current || paused || reduceMotion || !wind) return;
    introduced.current = true;
    windFirst();
  }, [paused, reduceMotion, wind]);

  const auto = reduceMotion ? "off" : held ? "held" : paused || moving ? "waiting" : "counting";

  useEffect(() => {
    if (auto !== "counting") return;
    const countdown = setTimeout(advanceOnItsOwn, hold);
    return () => clearTimeout(countdown);
  }, [auto, hold]);

  return { ...state, step, auto };
};

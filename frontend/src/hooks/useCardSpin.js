import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useAccentPaused } from "@/hooks/useAccentPaused.js";

// Turning on its own is unhurried; a click answers at once and eases out.
const autoTurn = { duration: 1100, easing: "cubic-bezier(0.65, 0, 0.35, 1)" };
const clickTurn = { duration: 650, easing: "cubic-bezier(0.2, 0.8, 0.25, 1)" };

const rotation = (angle) => `rotateY(${angle}deg)`;
// Which edge-on point an angle is past: the side facing the viewer changes at each one.
const sideIndex = (angle) => Math.floor((angle + 90) / 180);

/**
 * Turns `cardRef` over on its vertical axis, half a turn at a time: on its own every `hold` ms
 * (left to right, waiting while `held`, off screen or in a background tab), or on demand with
 * `spin(direction)`, where 1 turns it left to right and -1 right to left. Spins on demand
 * interrupt: the same way adds half a turn, the other way heads back, each from wherever the card
 * is. The hold starts over once a spin settles.
 *
 * `position` steps by one each time the card passes edge-on: up turning left to right, down
 * turning back. Even while the front faces the viewer, odd while the back does. `heading` is the
 * way it last set off, 1 or -1, so the side facing away can show what comes next that way.
 * `autoSpin` says what the automatic turn is doing: "counting" down the hold, "held", "waiting"
 * (mid-turn, off screen or before the page is ready) or "off" with reduced motion.
 */
export const useCardSpin = (cardRef, { hold = 4200, held = false } = {}) => {
  const reduceMotion = useReducedMotion();
  const paused = useAccentPaused(cardRef);
  const [position, setPosition] = useState(0);
  const [heading, setHeading] = useState(1);
  // The hold before the next automatic turn starts over once a spin settles.
  const [spinning, setSpinning] = useState(false);
  const target = useRef(0);
  const motion = useRef(null);

  // The card's angle right now, mid-turn included.
  const visibleAngle = () => {
    const current = motion.current;
    if (!current) return target.current;
    const progress = current.animation.effect.getComputedTiming().progress ?? 1;
    return current.from + (current.to - current.from) * progress;
  };

  const spin = (direction = 1, { duration, easing } = clickTurn) => {
    const card = cardRef.current;
    if (!card) return;
    const from = visibleAngle();
    const to = target.current + 180 * direction;
    target.current = to;
    card.style.transform = rotation(to);

    const passEdges = (angle) => setPosition(sideIndex(angle));

    motion.current?.animation.cancel();
    cancelAnimationFrame(motion.current?.frame);
    motion.current = null;
    setHeading(direction);

    if (reduceMotion) {
      passEdges(to);
      return;
    }

    // A longer way round takes a little longer, never in proportion.
    const halves = Math.abs(to - from) / 180;
    const animation = card.animate([{ transform: rotation(from) }, { transform: rotation(to) }], {
      duration: duration * (0.6 + 0.4 * halves),
      easing,
    });
    const current = { animation, from, to, frame: 0 };
    motion.current = current;
    setSpinning(true);

    const watch = () => {
      passEdges(visibleAngle());
      current.frame = requestAnimationFrame(watch);
    };
    current.frame = requestAnimationFrame(watch);

    animation.finished
      .then(() => {
        cancelAnimationFrame(current.frame);
        passEdges(to);
        motion.current = null;
        setSpinning(false);
      })
      .catch(() => cancelAnimationFrame(current.frame));
  };

  const spinOnItsOwn = useEffectEvent(() => spin(1, autoTurn));

  const autoSpin = reduceMotion ? "off" : held ? "held" : paused || spinning ? "waiting" : "counting";

  useEffect(() => {
    if (autoSpin !== "counting") return;
    const timer = setTimeout(spinOnItsOwn, hold);
    return () => clearTimeout(timer);
  }, [autoSpin, hold]);

  useEffect(() => () => {
    cancelAnimationFrame(motion.current?.frame);
    motion.current?.animation.cancel();
  }, []);

  return { position, heading, spin, autoSpin };
};

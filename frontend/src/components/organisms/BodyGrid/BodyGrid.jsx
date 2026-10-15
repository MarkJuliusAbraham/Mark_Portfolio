import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { createPulse, gridPulses, pulseGlowKeyframes, pulseKeyframes, randomBetween } from "./gridPulses.js";

export function BodyGrid({ pulses = gridPulses }) {
  const layerRef = useRef(null);
  const lightRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const layer = layerRef.current;
    const light = lightRef.current;
    const options = { ...gridPulses, ...pulses };
    if (!layer || !light || reducedMotion || !options.enabled) return;

    const active = new Map();
    let timer;

    const spawn = () => {
      timer = setTimeout(spawn, randomBetween(Math.random, options.interval));
      if (document.hidden || active.size >= options.maxActive) return;

      // Read live values so angle and density changes apply to the next pulse.
      const style = getComputedStyle(layer);
      const { a, b } = new DOMMatrixReadOnly(style.transform);
      const frame = layer.parentElement.getBoundingClientRect();
      const pulse = createPulse(Math.random, {
        width: frame.width,
        height: frame.height,
        layerSize: layer.offsetWidth,
        cellSize: parseFloat(style.getPropertyValue("--body-grid-size")),
        angle: Math.atan2(b, a),
      }, options);

      // Light sits behind the grid and shows only through the lines.
      const element = document.createElement("span");
      element.className = "body-grid-pulse";
      Object.assign(element.style, {
        left: `${pulse.left}px`,
        top: `${pulse.top}px`,
        width: `${pulse.width}px`,
        height: `${pulse.height}px`,
      });
      element.dataset.heading = pulse.heading;
      element.append(Object.assign(document.createElement("span"), { className: "body-grid-pulse-glow" }));
      light.append(element);

      const timing = { duration: pulse.duration, easing: "linear" };
      const glow = element.animate(pulseGlowKeyframes(pulse), timing);
      const movement = element.animate(pulseKeyframes(pulse), timing);
      active.set(movement, element);
      movement.onfinish = () => {
        glow.cancel();
        element.remove();
        active.delete(movement);
      };
    };

    timer = setTimeout(spawn, randomBetween(Math.random, options.interval));
    return () => {
      clearTimeout(timer);
      active.forEach((element) => element.remove());
    };
  }, [pulses, reducedMotion]);

  return (
    <div className="body-grid" aria-hidden="true">
      <div ref={layerRef} className="body-grid-layer">
        <div ref={lightRef} className="body-grid-light" />
      </div>
    </div>
  );
}

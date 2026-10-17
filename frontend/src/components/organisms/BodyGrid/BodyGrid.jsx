import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { gridLightMask } from "@/lib/gridLighting.js";
import { gridOpening } from "@/lib/gridCanvas.js";
import { createPulse, gridPulses, pulseGlowKeyframes, pulseKeyframes, randomBetween } from "./gridPulses.js";
import { createOpeningWave, gridOpeningWave } from "./gridOpeningWave.js";
import { useGridTraces } from "./useGridTraces.js";

// The light over the whole background shines through the screen's darkening (limbPierce.js).
const backgroundTraces = { pierce: true };

export function BodyGrid({ canvasRef, pulses = gridPulses, openingWave = gridOpeningWave }) {
  const layerRef = useRef(null);
  const lightRef = useRef(null);
  const openingRef = useRef(null);
  const tracesRef = useRef(null);
  const reducedMotion = useReducedMotion();
  useGridTraces(tracesRef, backgroundTraces);

  useEffect(() => {
    const element = openingRef.current;
    const options = { ...gridOpeningWave, ...openingWave };
    if (!element || reducedMotion || !options.enabled) return;

    const wave = createOpeningWave(element.parentElement.getBoundingClientRect(), options);
    Object.assign(element.style, {
      width: `${wave.diameter}px`,
      height: `${wave.diameter}px`,
    });
    element.style.setProperty("--grid-opening-width", `${wave.width}px`);
    const animation = element.animate(wave.keyframes, {
      duration: wave.duration,
      delay: gridOpening.blank,
      easing: "linear",
      fill: "backwards",
    });
    animation.onfinish = () => animation.cancel();
    return () => animation.cancel();
  }, [openingWave, reducedMotion]);

  useEffect(() => {
    const layer = layerRef.current;
    const light = lightRef.current;
    const options = { ...gridPulses, ...pulses };
    if (!layer || !light || reducedMotion || !options.enabled) return;

    const active = new Map();
    let timer;

    const readFrame = () => {
      // Read live values so angle and density changes apply to the next pulse.
      const style = getComputedStyle(layer);
      const { a, b } = new DOMMatrixReadOnly(style.transform);
      const frame = layer.parentElement.getBoundingClientRect();
      return {
        width: frame.width,
        height: frame.height,
        layerSize: layer.offsetWidth,
        cellSize: parseFloat(style.getPropertyValue("--body-grid-size")),
        angle: Math.atan2(b, a),
      };
    };

    const spawn = (pulse) => {
      if (document.hidden || active.size >= options.maxActive) return;

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
      active.set(movement, { element, glow });
      movement.onfinish = () => {
        glow.cancel();
        element.remove();
        active.delete(movement);
      };
    };

    const schedule = (delay = 0) => {
      timer = setTimeout(() => {
        spawn(createPulse(Math.random, readFrame(), options));
        schedule();
      }, delay + randomBetween(Math.random, options.interval));
    };
    // Keep the opening a single circular wave. The ordinary edge glows begin afterward.
    const wave = { ...gridOpeningWave, ...openingWave };
    schedule(wave.enabled ? gridOpening.blank + wave.duration : 0);
    return () => {
      clearTimeout(timer);
      active.forEach(({ element, glow }, movement) => {
        movement.cancel();
        glow.cancel();
        element.remove();
      });
    };
  }, [pulses, openingWave, reducedMotion]);

  return (
    <div className="body-grid" aria-hidden="true">
      <canvas ref={canvasRef} className="body-grid-canvas" />
      <div className="body-grid-ambient" style={{ maskImage: gridLightMask }}>
        <div ref={openingRef} className="body-grid-opening" />
        <div ref={layerRef} className="body-grid-layer">
          <div ref={lightRef} className="body-grid-light" />
        </div>
      </div>
      {/* Lines lit around the pointer. */}
      <canvas ref={tracesRef} className="body-grid-traces" />
    </div>
  );
}

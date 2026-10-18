import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { gridLightMask } from "@/lib/gridLighting.js";
import { gridOpening } from "@/lib/gridCanvas.js";
import { createGlowSource, createPulse, gridPulses, pulseGlow, pulseGlowKeyframes, pulseHead, pulseKeyframes, randomBetween } from "./gridPulses.js";
import { createOpeningWave, gridOpeningWave } from "./gridOpeningWave.js";
import { useGridTraces } from "./useGridTraces.js";

// The light over the whole background shines through the screen's darkening (limbPierce.js), and
// tints the squares between the lines as well as the lines themselves (gridTraces.js), around the
// pointer and around each edge pulse.
const backgroundTraces = { pierce: true, look: { cells: 0.07 } };

// How far around a pulse's head its squares tint, in grid cells: half its glow's width (body-grid.css).
const pulseTileReach = 2.5;

export function BodyGrid({ canvasRef, pulses = gridPulses, openingWave = gridOpeningWave }) {
  const layerRef = useRef(null);
  const lightRef = useRef(null);
  const openingRef = useRef(null);
  const tracesRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const glows = useMemo(() => createGlowSource(), []);
  const traces = useMemo(() => ({ ...backgroundTraces, glows }), [glows]);
  useGridTraces(tracesRef, traces);

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
        centerX: frame.left + frame.width / 2,
        centerY: frame.top + frame.height / 2,
        layerSize: layer.offsetWidth,
        cellSize: parseFloat(style.getPropertyValue("--body-grid-size")),
        angle: Math.atan2(b, a),
      };
    };

    const spawn = (pulse, frame) => {
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
      // Its light, for the grid's squares to tint around: the head taken from the rotated layer to
      // the screen, as bright as its glow is at this point of its life.
      const { centerX, centerY, layerSize, cellSize, angle } = frame;
      const [cosine, sine] = [Math.cos(angle), Math.sin(angle)];
      const lit = () => {
        const offset = movement.currentTime / pulse.duration;
        if (!(offset >= 0 && offset < 1)) return null;
        const head = pulseHead(pulse, offset);
        const [x, y] = [head.x - layerSize / 2, head.y - layerSize / 2];
        return {
          x: centerX + x * cosine - y * sine,
          y: centerY + x * sine + y * cosine,
          radius: cellSize * pulseTileReach,
          strength: pulseGlow(offset, pulse.timeline),
        };
      };
      glows.add(lit);
      active.set(movement, { element, glow, lit });
      movement.onfinish = () => {
        glow.cancel();
        element.remove();
        glows.remove(lit);
        active.delete(movement);
      };
    };

    const schedule = (delay = 0) => {
      timer = setTimeout(() => {
        const frame = readFrame();
        spawn(createPulse(Math.random, frame, options), frame);
        schedule();
      }, delay + randomBetween(Math.random, options.interval));
    };
    // Keep the opening a single circular wave. The ordinary edge glows begin afterward.
    const wave = { ...gridOpeningWave, ...openingWave };
    schedule(wave.enabled ? gridOpening.blank + wave.duration : 0);
    return () => {
      clearTimeout(timer);
      active.forEach(({ element, glow, lit }, movement) => {
        movement.cancel();
        glow.cancel();
        element.remove();
        glows.remove(lit);
      });
    };
  }, [pulses, openingWave, reducedMotion, glows]);

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

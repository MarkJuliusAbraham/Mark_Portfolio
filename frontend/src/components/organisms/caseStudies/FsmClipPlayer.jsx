import { useEffect, useLayoutEffect, useRef, useState } from "react";
import sheetUrl from "@/gifs/threshold-fsm-sheet.webp";
import clip from "./threshold-fsm-timeline.json";
import { prefersReducedMotion } from "@/lib/scroll.js";

// How long the arrow just taken stays lit in the diagram, in ms.
const EDGE_GLOW_MS = 900;

/**
 * Plays the recorded folder clip from a sprite sheet, step by step from its timeline, and reports
 * each step's state, caption and the transition just taken so a diagram can follow along.
 * Pauses off screen; starts paused for visitors who prefer reduced motion.
 */
export const FsmClipPlayer = ({ onStep }) => {
  const canvasRef = useRef(null);
  const [sheet, setSheet] = useState(null);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const caption = clip.timeline[step].c;
  // The latest callback, kept current before the step effects below run.
  const onStepRef = useRef(onStep);
  useLayoutEffect(() => { onStepRef.current = onStep; }, [onStep]);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setSheet(image);
    image.src = sheetUrl;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    if (canvas) observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Draw and report the current step.
  useEffect(() => {
    const entry = clip.timeline[step];
    const canvas = canvasRef.current;
    if (sheet && canvas) {
      const { width, height, columns } = clip;
      const sx = (entry.f % columns) * width;
      const sy = Math.floor(entry.f / columns) * height;
      canvas.getContext("2d").drawImage(sheet, sx, sy, width, height, 0, 0, width, height);
    }
    onStepRef.current?.({ state: entry.s, edge: entry.e ?? null });
    if (!entry.e) return undefined;
    const clear = setTimeout(() => onStepRef.current?.({ state: entry.s, edge: null }), EDGE_GLOW_MS);
    return () => clearTimeout(clear);
  }, [step, sheet]);

  // Advance through the timeline while playing and on screen.
  useEffect(() => {
    if (!playing || !visible || !sheet) return undefined;
    const timer = setTimeout(() => setStep((current) => (current + 1) % clip.timeline.length), clip.timeline[step].d);
    return () => clearTimeout(timer);
  }, [playing, visible, sheet, step]);

  return (
    <div className="cs-clip">
      <div className="cs-clip-frame">
        <canvas
          ref={canvasRef}
          width={clip.width}
          height={clip.height}
          role="img"
          aria-label="Recorded in the game's reception scene: a right-click opens the folder and a second right-click closes it. The diagram below follows its state."
        />
        <button type="button" className="cs-clip-toggle typeset-card-toner" onClick={() => setPlaying((value) => !value)}>
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <p className="cs-clip-caption typeset-card-toner">{caption}</p>
    </div>
  );
};

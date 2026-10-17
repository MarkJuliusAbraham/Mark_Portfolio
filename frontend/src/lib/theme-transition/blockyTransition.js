import { createWaveFrames } from "./waveGeometry.js";

export function createBlockyEffect({ view, settings, origin }) {
  const width = view.innerWidth;
  const height = view.innerHeight;
  const blockSize = Math.max(8, Math.round(Number.isFinite(settings.volume) ? settings.volume : 40));
  const frames = createWaveFrames({
    width,
    height,
    origin: origin ?? { x: width / 2, y: height / 2 },
    blockSize,
  });

  return {
    supported: view.CSS?.supports("clip-path", 'path(evenodd, "M0,0H1V1H0Z")'),
    speed: settings.speed,
    prepare() {},
    animate: (root) => [root.animate(frames, {
      duration: 550 / settings.speed,
      fill: "both",
      easing: "linear",
      pseudoElement: "::view-transition-new(root)",
    })],
    dispose() {},
  };
}

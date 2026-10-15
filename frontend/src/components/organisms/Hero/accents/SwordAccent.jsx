import { useId } from "react";
import { useAccentPaused } from "@/hooks/useAccentPaused.js";
import "./SwordAccent.css";

// Scene units (viewBox 0 0 100 150). Keep the water and flowers fixed when positioning the sword.
const waterY = 115;
const reflectionDepth = 18;
// The leaning hilt reaches right, so the whole scene sits a little left.
const sceneShift = -8;
const swordPosition = { x: 56, y: waterY - 6 };

// The katana is Mark's own drawing, src/img/VirtuousContract.svg (a 1280 x 720 canvas, pommel at
// the lower left, blade tip at the upper right). It is planted by pinning the point where the blade
// meets the water, (776, 195) in the drawing, to swordPosition, turning it so the hilt leans up and to
// the right, and scaling it to the scene. Everything below the water is clipped, so the tip never
// shows.
const swordScale = 0.129;
const plantAngle = 143.4;
const waterPoint = [776, 195];

// The tip of the pommel in the drawing, where the tassel hangs from.
const pommelTip = [158, 668];

// The drawing is mirrored across its own length, the line from the pommel to where the blade meets
// the water, so the blade curves (and its edge faces) the other way while the hilt keeps its lean.
const axisAngle = (Math.atan2(waterPoint[1] - pommelTip[1], waterPoint[0] - pommelTip[0]) * 180) / Math.PI;
const swordTransform = [
  `translate(${swordPosition.x} ${swordPosition.y}) rotate(${plantAngle}) scale(${swordScale})`,
  `rotate(${axisAngle}) scale(1 -1) rotate(${-axisAngle})`,
  `translate(${-waterPoint[0]} ${-waterPoint[1]})`,
].join(" ");

/** Where a point in the drawing's own coordinates ends up in the scene, mirror included. */
const toScene = (x, y) => {
  const axis = (axisAngle * Math.PI) / 180;
  const plant = (plantAngle * Math.PI) / 180;
  // Mirror across the sword's axis through the water point.
  const ax = x - waterPoint[0];
  const ay = y - waterPoint[1];
  const along = ax * Math.cos(axis) + ay * Math.sin(axis);
  const across = -ax * Math.sin(axis) + ay * Math.cos(axis);
  const mx = along * Math.cos(axis) + across * Math.sin(axis);
  const my = along * Math.sin(axis) - across * Math.cos(axis);
  // Then plant: scale, turn, and pin the water point.
  const dx = mx * swordScale;
  const dy = my * swordScale;
  return [swordPosition.x + dx * Math.cos(plant) - dy * Math.sin(plant), swordPosition.y + dx * Math.sin(plant) + dy * Math.cos(plant)];
};

// The guard's centre in the drawing, where the lens flare crosses.
const guardCentre = [421.9, 467.6];

// Lunar tears growing on the ground around the blade's base and scattering away to the right:
// [x, y, size, twist in degrees].
// The back layer is dim, the front layer bright, as in a glowing cluster.
const backFlowers = [
  [24, 110, 7, 12],
  [36, 108, 6.5, -20],
  [49, 111, 6, 5],
  // Scattered further right along the ground, thinning out.
  [65, 111, 5, 30],
  [83, 112, 4.4, -10],
];
const frontFlowers = [
  [29, 109, 7, 8],
  [40, 110.5, 6.4, -16],
  [33, 113, 5.6, 28],
  [46, 108.5, 5.4, -2],
  [20, 112.5, 5, 18],
  [53, 113, 4.4, 36],
  [60, 112, 5, 15],
  [70, 109.8, 4.5, -25],
  [77, 113, 4, 40],
  [89, 111, 3.6, 5],
  [96, 113.4, 3, 22],
];

// Approximate the blade's water contact along its axis, keeping ripples centred after placement edits.
const bladeLean = ((plantAngle + axisAngle - 90) * Math.PI) / 180;
const waterContactX = swordPosition.x - (waterY - swordPosition.y) * Math.tan(bladeLean);

/** A lily-like flower: five broad petals with full shoulders, narrowing to a soft point. */
const LilyFlower = ({ x, y, size, twist, index }) => {
  const width = size * 0.56;
  const petal = `M0 0 C${width} ${-size * 0.2} ${width * 0.95} ${-size * 0.62} 0 ${-size} C${-width * 0.95} ${-size * 0.62} ${-width} ${-size * 0.2} 0 0 Z`;
  return (
    <g className="focus-sword-flower" style={{ "--glow-delay": `${-index * 0.9}s` }} transform={`translate(${x} ${y}) rotate(${twist})`}>
      {Array.from({ length: 5 }, (_, n) => <path key={n} d={petal} transform={`rotate(${n * 72})`} />)}
    </g>
  );
};

/** The shapes of VirtuousContract.svg: white ones as "light", black details as "dark". */
const swordShapes = (
  <>
    {/* Pommel, wrapped handle and guard. */}
    <rect className="focus-sword-light" x="216.38" y="523.3" transform="matrix(0.8048 -0.5936 0.5936 0.8048 -257.4323 298.3609)" width="217" height="34.5" />
    <rect className="focus-sword-light" x="231.43" y="580.27" transform="matrix(0.8101 -0.5863 0.5863 0.8101 -310.4424 253.294)" width="8.75" height="51.25" />
    <path className="focus-sword-dark" d="M167.85,673.64c-7.39,1.11-15.7-13.85-14.79-20.36c1.47-10.48,59.75-51.52,59.75-51.52l20.48,27.76C233.29,629.53,188.49,670.55,167.85,673.64z" />
    <g className="focus-sword-dark">
      <polygon points="255.94,590.59 256.49,577.29 268.8,580.75 268.34,594.14" />
      <polygon points="270.66,580.12 271.21,566.83 283.52,570.29 283.06,583.68" />
      <polygon points="284.91,569.03 285.46,555.73 297.77,559.19 297.31,572.58" />
      <polygon points="299.04,558.53 299.6,545.24 311.91,548.7 311.45,562.09" />
      <polygon points="313.52,547.98 314.07,534.68 326.38,538.14 325.93,551.53" />
      <polygon points="328.24,537.51 328.79,524.21 341.1,527.68 340.64,541.06" />
      <polygon points="342.49,526.41 343.04,513.12 355.35,516.58 354.89,529.97" />
      <polygon points="356.55,516.4 357.1,503.1 369.42,506.57 368.96,519.95" />
      <polygon points="371.27,505.93 371.82,492.64 384.14,496.1 383.68,509.49" />
      <polygon points="385.52,494.84 386.07,481.54 398.38,485 397.92,498.39" />
      <polygon points="241.5,601.63 242.06,588.34 254.37,591.8 253.91,605.19" />
    </g>
    <polygon className="focus-sword-light" points="174.52,631.38 201.77,616.39 210.94,615.48 220.37,629.81 215.85,639.19 190.42,662.62 245.74,634.24 242.95,623.23 222.27,594.66 208.5,591.66" />
    <polygon className="focus-sword-light" points="409.99,503.93 384.64,468.89 398.43,456.15 426.99,494.39" />
    <rect className="focus-sword-light" x="405.88" y="384.15" transform="matrix(0.8048 -0.5936 0.5936 0.8048 -195.2265 341.7105)" width="32" height="167" />
    <polygon className="focus-sword-light" points="375.84,390.54 482.09,534.59 479.27,544.43 467.82,545.12 361.57,401.06 364.11,391.45" />
    {/* Blade, its dark groove, the dark collar with its emblem, and the collar bands. */}
    <path className="focus-sword-light" d="M531.13,404.62l-27.07-32.76c0,0,184.82-140.1,250.09-182.68c210.5-137.32,330.01-164.3,330.01-164.3l40.26,12.46c0,0-111.76,37.02-252.86,118.74C717.93,245.05,531.13,404.62,531.13,404.62z" />
    <path className="focus-sword-dark" d="M516.3,378.86l14.38,17.73l11.68-13.17l8.7-0.51l9.1-13.95c0,0,62.31-53.51,84.14-70.02c8.6-6.5,9.85-13.16,9.85-13.16s-8.97,0.49-16.94,6.29c-21.8,15.85-86.39,64.48-86.39,64.48l-14.62,4.52l-3.94,9.17L516.3,378.86z" />
    <path className="focus-sword-dark" d="M450.18,478.93l-31.88-43.09c0,0,22.38-9.62,29.04-14.69c5.82-4.44,19.99-21.4,19.99-21.4l36.81,29.67c0,0-25.19,19.69-32.82,27.01C465.57,461.95,450.18,478.93,450.18,478.93z" />
    <path className="focus-sword-light" d="M436.58,452.72l24.63-4.6l5.35-15.54c0,0,1.72-1.09,4.47-0.9c1.14,0.08,7.91,3.85,7.91,3.85s-1.22-7.34-0.95-8.72c0.56-2.8,4.85-8.12,4.85-8.12s-6.41,2.26-10.12,1.71c-2.17-0.32-8.23-3.96-8.23-3.96s1.52,6.98,0.95,10.01c-0.3,1.59-1.57,2.6-1.57,2.6l-15.72,1.89L436.58,452.72z" />
    <polygon className="focus-sword-light" points="462.3,398.13 505.33,431.87 526.64,420.19 474.19,377.37" />
    <polygon className="focus-sword-light" points="479.49,388.14 505.46,366.97 534.97,406.98 520.11,417.94" />
  </>
);

/**
 * VirtuousContract.svg, planted in the water with everything below it clipped. Its white shapes
 * draw in the text color and its black details in the background color, so it follows the theme.
 * Underneath, the whole silhouette is drawn twice more: a wider ring in the background color, then a
 * narrower one in the text color. Together they outline the sword in the opposite color, so dark
 * details on its edge never melt into the background, while a thin gap keeps it clear of the
 * glowing flowers.
 */
const Katana = ({ id }) => (
  <g clipPath={`url(#${id}-above-water)`}>
    <g className="focus-sword-katana" transform={swordTransform}>
      <g className="focus-sword-gap">{swordShapes}</g>
      <g className="focus-sword-outline">{swordShapes}</g>
      {swordShapes}
    </g>
  </g>
);

/**
 * A horsetail tassel hanging from the pommel with gravity, in scene units from the ring down: a
 * ring, a short cord, and a binding that gathers one full tail of hair. The tail swells, flows with
 * a gentle curve, and ends in a few wispy points, a little shorter than the hilt. The whole tassel
 * sways from the ring and the tail ripples slowly beneath the binding.
 */
const Tassel = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="focus-sword-tassel">
      <circle className="focus-sword-tassel-ring" cx="0" cy="0" r="1.1" />
      <path className="focus-sword-tassel-cord" d="M0 1.1 C0.7 2.6 0.4 4.2 0 5.4" />
      <rect className="focus-sword-tassel-knot" x="-1.2" y="5.2" width="2.4" height="2.3" rx="0.8" />
      <g className="focus-sword-tassel-body">
        <path
          className="focus-sword-tassel-hair"
          d="M-1.1 7.4 C-2.5 10 -3.1 13 -2.3 16.5 C-1.7 19 -2.8 21 -2 23.6 L-0.8 21.2 L0.1 24.4 L0.8 21.4 L2.2 23.2 C2.5 20.5 1.7 18.6 2.2 16 C2.8 12.8 2.2 10 1.1 7.4 Z"
        />
        {/* Two faint partings suggest hair without drawing each strand. */}
        <path className="focus-sword-tassel-parting" d="M-0.4 8.6 C-0.9 12 -0.7 16 -0.6 20.6 M0.5 8.8 C0.7 12.4 0.4 16.4 0.6 20.8" />
      </g>
    </g>
  </g>
);

const flowerLayers = (
  <g>
    <g className="focus-sword-flowers-back">
      {backFlowers.map(([x, y, size, twist], index) => <LilyFlower key={index} x={x} y={y} size={size} twist={twist} index={index} />)}
    </g>
    <g className="focus-sword-flowers-front">
      {frontFlowers.map(([x, y, size, twist], index) => <LilyFlower key={index} x={x} y={y} size={size} twist={twist} index={index + 2} />)}
    </g>
  </g>
);

/**
 * Games: a planted-sword scene after NieR: Automata. Mark's Virtuous Contract drawing stands in still
 * water with a tassel hanging from its pommel, lunar tears glowing on the ground around it in the
 * dark, and their reflection fading below. At rest the tassel sways, the flowers breathe, and
 * faint ripples spread from the blade;
 * on hover the lens flare across the guard flashes and the glow swells.
 */
export const SwordAccent = ({ itemRef }) => {
  const id = useId().replace(/:/g, "");
  const paused = useAccentPaused(itemRef);
  const [flareX, flareY] = toScene(...guardCentre);
  const [tasselX, tasselY] = toScene(...pommelTip);

  return (
    <span className="focus-sword-scene" aria-hidden="true" data-paused={paused}>
      <svg className="focus-sword" viewBox="0 0 100 150">
        <defs>
          <clipPath id={`${id}-above-water`} clipPathUnits="userSpaceOnUse">
            <rect x="-50" y="-50" width="200" height={waterY + 50} />
          </clipPath>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="0.55" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={`${id}-reflection`} maskUnits="userSpaceOnUse" x="0" y={waterY} width="100" height={reflectionDepth}>
            <rect x="0" y={waterY} width="100" height={reflectionDepth} fill={`url(#${id}-fade)`} />
          </mask>
          <linearGradient id={`${id}-flare`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${sceneShift} 0)`}>
          {/* Mirror image in the water, fading with depth. */}
          <g mask={`url(#${id}-reflection)`}>
            <g className="focus-sword-reflection" transform={`translate(0 ${waterY * 2}) scale(1 -1)`}>
              {flowerLayers}
              <Katana id={id} />
            </g>
          </g>

          {/* Soft bloom behind the cluster, then the glowing flowers. */}
          <ellipse className="focus-sword-halo" cx="54" cy="110" rx="46" ry="15" fill={`url(#${id}-halo)`} />
          <g className="focus-sword-glow" filter={`url(#${id}-glow)`}>{flowerLayers}</g>
          <Katana id={id} />

          <Tassel x={tasselX} y={tasselY} />

          <ellipse className="focus-sword-water" cx={waterContactX} cy={waterY} rx="32" ry="0.65" />
          {[0, -0.5].map((phase) => (
            <ellipse
              key={phase}
              className="focus-sword-ripple"
              cx={waterContactX}
              cy={waterY}
              rx="5"
              ry="0.85"
              vectorEffect="non-scaling-stroke"
              style={{ "--ripple-phase": phase }}
            />
          ))}

          {/* Lens flare through the guard: faint at rest, flashing on hover. */}
          <rect className="focus-sword-flare" x={flareX - 48} y={flareY - 0.45} width="96" height="0.9" fill={`url(#${id}-flare)`} />
        </g>
      </svg>
    </span>
  );
};

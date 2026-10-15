import { useEffect, useId, useState } from "react";
import { useAccentPaused } from "@/hooks/useAccentPaused.js";
import "./GameParticles.css";

// Spread across the panel: x/y in percent, radius in pixels, delay, duration, and sideways drift.
const particles = [
  [8, 22, 1.3, -2.1, 8.8, 3],
  [19, 91, 1.5, -6.2, 10.2, -4],
  [28, 48, 1.1, -4.7, 9.4, 2],
  [37, 17, 1.4, -1.4, 11, -3],
  [45, 84, 1.2, -7.3, 8.2, 4],
  [56, 38, 1.6, -3.8, 10.4, -2],
  [65, 94, 1.3, -5.6, 9.1, 3],
  [76, 20, 1.2, -8.2, 10.8, -3],
  [87, 73, 1.6, -1.9, 8.6, 2],
  [95, 44, 1.2, -6.8, 9.8, -4],
  [12, 65, 1.1, -4.1, 10.6, 3],
  [32, 96, 1.5, -8.4, 11.2, -2],
  [52, 58, 1.2, -2.8, 8.9, 4],
  [71, 64, 1.4, -5.1, 10.1, -3],
  [84, 93, 1.3, -7.9, 9.6, 2],
  [94, 14, 1.1, -3.4, 11.4, -2],
];

/** Panel-wide motes, with clear space around every rendered line of copy. */
export const GameParticles = ({ itemRef }) => {
  const id = useId().replace(/:/g, "");
  const [textBounds, setTextBounds] = useState(null);
  const paused = useAccentPaused(itemRef);

  useEffect(() => {
    const item = itemRef.current;
    const body = item?.querySelector(".hero-focus-body");
    if (!item || !body) return;

    const measureText = () => {
      const bodyBounds = body.getBoundingClientRect();
      const padding = 6;
      const bounds = [];
      for (const element of body.querySelectorAll(".typeset-card-toner, .hero-focus-title, .hero-focus-text")) {
        const range = document.createRange();
        range.selectNodeContents(element);
        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          bounds.push({
            // Cancel the entrance translation; these coordinates belong to the panel's layout.
            x: rect.left - bodyBounds.left + body.offsetLeft - padding,
            y: rect.top - bodyBounds.top + body.offsetTop - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          });
        }
      }
      setTextBounds(bounds);
    };

    const observer = new ResizeObserver(measureText);
    observer.observe(item);
    observer.observe(body);
    document.fonts.addEventListener("loadingdone", measureText);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measureText);
    };
  }, [itemRef]);

  return (
    <svg className="focus-game-particles" aria-hidden="true" data-paused={paused}>
      <defs>
        <mask id={`${id}-text-clearance`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect width="100%" height="100%" fill="white" />
          {textBounds?.map((bounds, index) => <rect key={index} {...bounds} rx="2" fill="black" />)}
        </mask>
      </defs>
      <g mask={`url(#${id}-text-clearance)`} visibility={textBounds ? "visible" : "hidden"}>
        {particles.map(([x, y, radius, delay, duration, drift], index) => (
          <circle
            key={index}
            className="focus-game-particle"
            cx={`${x}%`}
            cy={`${y}%`}
            r={radius}
            style={{ "--particle-delay": `${delay}s`, "--particle-duration": `${duration}s`, "--particle-drift": `${drift}px` }}
          />
        ))}
      </g>
    </svg>
  );
};

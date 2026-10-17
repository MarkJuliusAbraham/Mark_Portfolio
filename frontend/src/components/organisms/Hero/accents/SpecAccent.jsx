import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { dragScale, resistedScale, settledScale } from "./titleResize.js";
import "./SpecAccent.css";

const corners = ["tl", "tr", "bl", "br"];

/** A short sideways shake, refusing a resize past its limit. */
const refuseFrames = [
  { transform: "translateX(0)" },
  { transform: "translateX(-3px)" },
  { transform: "translateX(3px)" },
  { transform: "translateX(-2px)" },
  { transform: "translateX(0)" },
];

/**
 * Design: a design-tool selection on the title, with its real size in a badge beside it. The
 * corner handles really resize the title, within limits; at a limit the selection turns red,
 * says so, shakes, and resists further dragging.
 */
export const SpecAccent = ({ titleRef }) => {
  const [size, setSize] = useState(null);
  const [limit, setLimit] = useState(null);
  const specRef = useRef(null);
  const drag = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = title.getBoundingClientRect();
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(title);
    return () => observer.disconnect();
  }, [titleRef]);

  const showLimit = (title, next) => {
    if (next === drag.current?.limit) return;
    if (drag.current) drag.current.limit = next;
    setLimit(next);
    if (next) {
      title.dataset.limit = next;
      if (!reducedMotion) specRef.current?.animate(refuseFrames, { duration: 240, easing: "ease-out" });
    } else {
      delete title.dataset.limit;
    }
  };

  const startResize = (corner) => (event) => {
    const title = titleRef.current;
    if (!title) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const { width, height } = title.getBoundingClientRect();
    const startScale = Number.parseFloat(title.style.getPropertyValue("--title-scale")) || 1;
    drag.current = { corner, x: event.clientX, y: event.clientY, width, height, startScale, limit: null };
    title.dataset.resizing = "";
  };

  const resize = (event) => {
    const title = titleRef.current;
    const current = drag.current;
    if (!title || !current) return;
    const requested = dragScale({ ...current, dx: event.clientX - current.x, dy: event.clientY - current.y });
    const { scale, limit: pressing } = resistedScale(requested);
    title.style.setProperty("--title-scale", scale.toFixed(4));
    showLimit(title, pressing);
  };

  const endResize = () => {
    const title = titleRef.current;
    if (!title || !drag.current) return;
    // Spring back inside the limits once the handle is let go.
    const scale = Number.parseFloat(title.style.getPropertyValue("--title-scale")) || 1;
    title.style.setProperty("--title-scale", settledScale(scale).toFixed(4));
    delete title.dataset.resizing;
    showLimit(title, null);
    drag.current = null;
  };

  return (
    <span ref={specRef} className="focus-spec" aria-hidden="true">
      <span className="focus-spec-frame" />
      {corners.map((corner) => (
        <span
          key={corner}
          className="focus-spec-handle"
          data-corner={corner}
          onPointerDown={startResize(corner)}
          onPointerMove={resize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onLostPointerCapture={endResize}
        />
      ))}
      {/* A collaborator's cursor idling beside the title, as in a shared design file. */}
      <span className="focus-spec-cursor">
        <svg viewBox="0 0 10 14" width="10" height="14">
          <path d="M0.5 0.5 L0.5 11.5 L3.4 8.8 L5.4 13.2 L7.2 12.4 L5.2 8.1 L9.2 8.1 Z" />
        </svg>
        <span className="focus-spec-cursor-tag">Mark</span>
      </span>
      {size && (
        <span className="focus-spec-badge">
          {size.width} × {size.height}
          {limit && <span className="focus-spec-limit">{limit === "max" ? "MAX" : "MIN"}</span>}
        </span>
      )}
    </span>
  );
};

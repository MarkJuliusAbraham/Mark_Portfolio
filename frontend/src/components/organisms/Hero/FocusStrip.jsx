import { useEffect, useRef, useState } from "react";
import {FocusAccent} from "@/components/organisms/Hero/accents/FocusAccents.jsx";
import {createElementGlitch} from "@/lib/theme-transition/elementChromatic.js";
import "@/components/organisms/Hero/accents/focus-accents.css";

const themeDwell = 480;

/**
 * Dwelling on the Games item toggles its theme through the page's chromatic transition.
 * The theme persists after the pointer leaves; filters are prepared ahead of the switch.
 */
const useGameTheme = (itemRef, enabled, active) => {
  const [inverted, setInverted] = useState(false);
  const glitchRef = useRef(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!enabled || !item) return;
    const glitch = createElementGlitch(item);
    glitchRef.current = glitch;
    // Ready before it's first needed: the item mounts under the loading screen, so its filters are
    // built there rather than on the first hover. Hovering prepares them again, for the size then.
    glitch.prepare();
    return () => {
      glitch.dispose();
      glitchRef.current = null;
    };
  }, [itemRef, enabled]);

  useEffect(() => {
    const glitch = glitchRef.current;
    if (!enabled || !glitch || !active) return;
    glitch.prepare();
    const timer = setTimeout(() => glitch.run(() => setInverted((current) => !current)), themeDwell);
    // Leaving before the dwell ends cancels it; an active glitch finishes on its own.
    return () => clearTimeout(timer);
  }, [enabled, active]);

  return inverted;
};

const FocusItem = ({ toner, title, readable, accent }) => {
  const itemRef = useRef(null);
  const titleRef = useRef(null);
  const [active, setActive] = useState(false);
  const inverted = useGameTheme(itemRef, accent === "game", active);
  const accentProps = { kind: accent, active, titleRef, itemRef, dwellDuration: themeDwell };

  return (
    <li
      ref={itemRef}
      className="hero-focus-item"
      data-accent={accent}
      data-active={active}
      data-inverted={inverted}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <FocusAccent slot="backdrop" {...accentProps} />
      <FocusAccent slot="edge" {...accentProps} />
      <div className="hero-focus-body flex min-w-0 flex-col gap-2">
        <span className="typeset-card-toner text-muted-foreground">[{toner}]</span>
        <span ref={titleRef} className="hero-focus-title">
          {title}
          <FocusAccent slot="title" {...accentProps} />
        </span>
        <span className="hero-focus-text">{readable}</span>
        <FocusAccent slot="after" {...accentProps} />
      </div>
    </li>
  );
};

export const FocusStrip = ({ items }) => {
  return (
    <ul className="hero-focus" aria-label="Areas of focus">
      {items.map((item) => <FocusItem key={item.toner} {...item} />)}
    </ul>
  );
};

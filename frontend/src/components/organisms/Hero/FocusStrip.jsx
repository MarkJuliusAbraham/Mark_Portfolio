import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
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

/**
 * One area of focus. One with `variants` (designs for the hero) can be clicked, or its button
 * pressed from the keyboard, to restyle the hero with the next of them; dragging the UI/UX title's
 * resize handles doesn't count. It says so under its text: a refresh icon that turns while it's
 * pointed at, "restyle", and a mark for the hero's own design and each of its own, the one shown
 * (`shownId`) filled.
 */
const FocusItem = ({ toner, title, readable, accent, variants = [], selected, shownId, onSelect }) => {
  const itemRef = useRef(null);
  const titleRef = useRef(null);
  const [active, setActive] = useState(false);
  const inverted = useGameTheme(itemRef, accent === "game", active);
  const accentProps = { kind: accent, active, titleRef, itemRef, dwellDuration: themeDwell };
  const selectable = variants.length > 0;
  // Which design is shown: 0 for the hero's own, then each of the area's in turn.
  const shown = variants.findIndex(({ id }) => id === shownId) + 1;
  const next = variants[shown]?.label ?? "its own design";

  return (
    <li
      ref={itemRef}
      className="hero-focus-item"
      data-accent={accent}
      data-active={active}
      data-inverted={inverted}
      data-selected={selected}
      data-selectable={selectable}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onClick={selectable ? (event) => {
        if (!event.target.closest(".focus-spec-handle")) onSelect();
      } : undefined}
    >
      {/* The item's click, for the keyboard and assistive technology; its click reaches the item. */}
      {selectable && (
        <button type="button" className="hero-focus-select sr-only">
          Restyle the hero: {next}
        </button>
      )}
      <FocusAccent slot="backdrop" {...accentProps} />
      <FocusAccent slot="edge" {...accentProps} />
      <div className="hero-focus-body flex min-w-0 flex-col gap-2">
        <span className="typeset-card-toner text-muted-foreground">[{toner}]</span>
        <span ref={titleRef} className="hero-focus-title">
          {title}
          <FocusAccent slot="title" {...accentProps} />
        </span>
        <span className="hero-focus-text">{readable}</span>
        {selectable && (
          <span className="hero-focus-cycle" aria-hidden="true">
            <span className="hero-focus-cycle-label">
              <RefreshCw className="hero-focus-cycle-icon" size={12} strokeWidth={2} />
              restyle
            </span>
            <span className="hero-focus-cycle-marks">
              {[null, ...variants].map((design, index) => (
                <span key={design?.id ?? "own"} data-on={index === shown} />
              ))}
            </span>
          </span>
        )}
        <FocusAccent slot="after" {...accentProps} />
      </div>
    </li>
  );
};

/**
 * The areas of focus; `selected` is the toner of the one chosen, `shown` the id of the design the
 * hero shows, and `onSelect` chooses one.
 */
export const FocusStrip = ({ items, selected, shown, onSelect }) => {
  return (
    <ul className="hero-focus" aria-label="Areas of focus">
      {items.map((item) => (
        <FocusItem
          key={item.toner}
          {...item}
          selected={item.toner === selected}
          shownId={shown}
          onSelect={() => onSelect(item.toner)}
        />
      ))}
    </ul>
  );
};

import { useEffect, useRef, useState } from "react";
import { PhrasePopIn } from "@/components/molecules/PhrasePopIn.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useMediaQuery } from "@/hooks/useMediaQuery.js";
import { desktopQuery, phoneQuery } from "@/lib/media.js";
import { setHiddenName } from "@/lib/nameTicker.js";
import { leadingInset } from "@/lib/opticalAlign.js";
import { useGridTraces } from "@/components/organisms/BodyGrid/useGridTraces.js";

/**
 * Tracks which lines have scrolled up out of view (under the mobile header on small screens).
 * Lines below the viewport, not yet reached, don't count as hidden.
 */
const useHiddenLines = (lineRefs, count) => {
  const [hidden, setHidden] = useState(() => Array(count).fill(false));

  useEffect(() => {
    const desktop = window.matchMedia(desktopQuery);
    let observer;

    const observe = () => {
      observer?.disconnect();
      const headerHeight = desktop.matches
        ? 0
        : document.querySelector(".sidebar-mobile-header")?.offsetHeight ?? 0;
      observer = new IntersectionObserver((entries) => {
        setHidden((current) => {
          const next = [...current];
          entries.forEach((entry) => {
            const index = lineRefs.current.indexOf(entry.target);
            next[index] = !entry.isIntersecting && entry.boundingClientRect.bottom <= entry.rootBounds.top;
          });
          return next.every((value, index) => value === current[index]) ? current : next;
        });
      }, { rootMargin: `-${headerHeight}px 0px 0px 0px` });
      lineRefs.current.forEach((line) => line && observer.observe(line));
    };

    observe();
    desktop.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      desktop.removeEventListener("change", observe);
    };
  }, [lineRefs, count]);

  return hidden;
};

/**
 * Hangs each line by the side space built into its first letter, so the letters themselves, not
 * their boxes, line up with the edge the rest of the hero shares. Measured again once the display
 * font has loaded.
 */
const useHangingLines = (lineRefs, texts) => {
  useEffect(() => {
    let current = true;
    const hang = () => {
      if (!current) return;
      texts.split("\n").forEach((text, index) => {
        const line = lineRefs.current[index];
        line?.style.setProperty("--line-hang", `${-leadingInset(line, text)}em`);
      });
    };
    hang();
    document.fonts?.ready.then(hang);
    return () => {
      current = false;
    };
  }, [lineRefs, texts]);
};

/**
 * The name, line by line. Its letters rise in once, as part of the hero's opening
 * (hero-intro.css), and then stay put. Whatever has scrolled away is passed to the navbar,
 * regrouped into the name's own lines (`nameLines`) however the hero splits it, so the navbar's
 * layout never changes.
 */
const NameLines = ({ lines, nameLines }) => {
  const lineRefs = useRef([]);
  const hidden = useHiddenLines(lineRefs, lines.length);
  useHangingLines(lineRefs, lines.map(({ text }) => text).join("\n"));

  const hiddenName = nameLines
    .map((_, group) => lines.filter((line, index) => line.group === group && hidden[index]).map(({ text }) => text).join(" "))
    .filter(Boolean)
    .join("\n");
  useEffect(() => setHiddenName(hiddenName), [hiddenName]);

  return (
    <h1 aria-label={nameLines.join(" ")} className="hero-name-heading">
      {lines.map(({ text }, index) => (
        <span
          key={`${text}-${index}`}
          ref={(element) => { lineRefs.current[index] = element; }}
          aria-hidden="true"
          className="hero-name-line"
        >
          <PhrasePopIn
            className="hero-name-letter"
            word={text}
            still
            firstLetter={lines.slice(0, index).reduce((total, line) => total + line.text.length, 0)}
          />
        </span>
      ))}
    </h1>
  );
};

// Where the name block is a panel that hides the page (the inverse split), the grid carries on
// inside it, but only lit around the pointer, in the panel's own colours, and far more strongly
// than on the page, so the panel reads as the place that matters: brighter, reaching further,
// lines swelling thicker, dimming less and breathing a little quicker. It never goes out there:
// it rests at the panel's centre and follows the pointer only while it's over the panel, its lines
// easing thinner then (still breathing), so the pointer reads as a finer touch.
const panelTraces = {
  color: "color-mix(in srgb, var(--card-inverse-foreground) 85%, transparent)",
  look: { radius: 230, strength: 0.85, thicken: 0.85, thickenOver: 0.3, dim: 0.2, drift: 0.4, breath: 3.4 },
  bounded: true,
  home: true,
  // Its grid is the panel's own, drawn straight: the screen's bulge belongs to the page behind it,
  // and would shift across the panel as it scrolls.
  flat: true,
};

export const NameBanner = ({ nameLines, description, actions = [] }) => {
  const tracesRef = useRef(null);
  useGridTraces(tracesRef, panelTraces);

  // On phones each word takes its own line: left-aligned, the words lengthen down the page into a
  // staircase like the lines above them.
  const split = useMediaQuery(phoneQuery);
  const lines = split
    ? nameLines.flatMap((line, group) => line.split(" ").map((text) => ({ text, group })))
    : nameLines.map((text, group) => ({ text, group }));

  // Off the home page none of the name is in view, so the navbar carries all of it.
  const fullName = nameLines.join("\n");
  useEffect(() => () => setHiddenName(fullName), [fullName]);

  return (
    <div className="hero-name">
      {/* Shown only where the name block is a panel (hero-layouts.css). */}
      <canvas ref={tracesRef} className="hero-name-traces" aria-hidden="true" />
      {description && <p className="hero-role">{description}</p>}
      {/* Starts over when the split changes, since its lines and their tracking change with it. */}
      <NameLines key={split ? "words" : "lines"} lines={lines} nameLines={nameLines} />
      {actions.length > 0 && (
        <div className="hero-actions">
          {actions.map(({ label, onClick, variant = "default" }) => (
            <Button key={label} size="lg" variant={variant} onClick={onClick} className="hero-action">
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

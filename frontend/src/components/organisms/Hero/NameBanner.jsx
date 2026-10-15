import { useEffect, useRef, useState } from "react";
import { TypedText } from "@/components/atoms/TypedText.jsx";
import { PhrasePopIn } from "@/components/molecules/PhrasePopIn.jsx";
import { Button } from "@/components/ui/button.jsx";
import { desktopQuery } from "@/lib/media.js";
import { setHiddenName } from "@/lib/nameTicker.js";

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

export const NameBanner = ({ nameLines, description, intro, actions = [] }) => {
  const lineRefs = useRef([]);
  const hidden = useHiddenLines(lineRefs, nameLines.length);
  // Lines pop in on first load; once a line has scrolled away it types itself back in instead.
  const [scrolledAway, setScrolledAway] = useState(() => nameLines.map(() => false));
  if (hidden.some((value, index) => value && !scrolledAway[index])) {
    setScrolledAway(scrolledAway.map((value, index) => value || hidden[index]));
  }

  const hiddenName = nameLines.filter((_, index) => hidden[index]).join("\n");
  useEffect(() => setHiddenName(hiddenName), [hiddenName]);

  // Off the home page none of the name is in view, so the navbar carries all of it.
  const fullName = nameLines.join("\n");
  useEffect(() => () => setHiddenName(fullName), [fullName]);

  return (
    <div className="hero-name">
      {description && <p className="hero-role">{description}</p>}
      <h1 aria-label={nameLines.join(" ")} className="hero-name-heading">
        {nameLines.map((line, index) => (
          <span
            key={`${line}-${index}`}
            ref={(element) => { lineRefs.current[index] = element; }}
            aria-hidden="true"
            className="hero-name-line"
          >
            {scrolledAway[index] ? (
              // Remounted on each return to view, so the line types itself in from empty.
              <TypedText key={hidden[index] ? "hidden" : "shown"} text={hidden[index] ? "" : line} reserve={line} typeDelay={45} />
            ) : (
              <PhrasePopIn word={line} />
            )}
          </span>
        ))}
      </h1>
      {intro && <p className="hero-intro">{intro}</p>}
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

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { usePageReady } from "@/lib/pageReady.js";
import {NameBanner} from "./NameBanner.jsx";
import {ImageBanner} from "./ImageBanner.jsx";
import {FocusStrip} from "./FocusStrip.jsx";
import "./hero-banner.css";
import "./hero-layouts.css";
import "./hero-intro.css";

// The opening plays once per page load: coming back to the home page later shows the hero as is.
let introPlayed = false;
// How long the opening runs, in ms (hero-intro.css), after which its animations are taken off.
const introLength = 2400;

/**
 * Whether this hero plays the opening (`intro`, settled as it mounts) and, while it does, its
 * `stage`: "play" from the moment the loading screen leaves until the opening has run.
 */
const useHeroIntro = () => {
  const reduceMotion = useReducedMotion();
  const ready = usePageReady();
  const [intro] = useState(() => !introPlayed && !reduceMotion);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!intro || !ready) return;
    introPlayed = true;
    const timer = setTimeout(() => setDone(true), introLength);
    return () => clearTimeout(timer);
  }, [intro, ready]);

  return { intro, stage: intro && ready && !done ? "play" : undefined };
};

/**
 * The home page's hero. `layout` asks for an alternative arrangement (hero-layouts.css); without
 * one, the hero keeps its own arrangement.
 */
export const HomeBannerLayout = ({ ref, profile, focusAreas = [], actions = [], layout }) => {
  const { intro, stage } = useHeroIntro();

  return (
    <div ref={ref} className="hero-banner" data-layout={layout} data-intro={stage}>
      <div className="hero-banner-content">
        {/* The header line, name and photo. Where a layout gathers them into one panel (the
            inverse layout, hero-layouts.css) this is that panel; elsewhere it stands as if it
            weren't there, and its pieces sit in the hero's grid directly. */}
        <div className="hero-panel">
          <div className="hero-meta" aria-hidden="true">
            <span>{profile.label ?? "Portfolio"}</span>
            <span className="hero-meta-rule" />
            <span>{new Date().getFullYear()}</span>
          </div>
          <NameBanner
            nameLines={profile.nameLines}
            description={profile.description}
            actions={actions}
          />
          <ImageBanner photos={profile.photos} intro={intro} />
        </div>
        {focusAreas.length > 0 && <FocusStrip items={focusAreas} />}
      </div>
    </div>
  );
};

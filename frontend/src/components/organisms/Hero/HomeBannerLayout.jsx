import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { usePageReady } from "@/lib/pageReady.js";
import { createElementGlitch } from "@/lib/theme-transition/elementChromatic.js";
import {NameBanner} from "./NameBanner.jsx";
import {ImageBanner} from "./ImageBanner.jsx";
import {FocusStrip} from "./FocusStrip.jsx";
import "./hero-banner.css";
import "./hero-layouts.css";
import "./hero-intro.css";
import "./hero-variants.css";

// The opening plays once per page load: coming back to the home page later shows the hero as is.
let introPlayed = false;
// How long the opening runs, in ms (hero-intro.css), after which its animations are taken off.
const introLength = 2400;
// How long each design shows as the opening runs through them all, in ms.
const previewStep = 300;

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
 * Which area of focus is selected (its toner, or null) and the hero's variant (the design shown,
 * with the `toner` of the area it belongs to). Selecting an area shows its first design;
 * selecting it again, the next, until past the last it's deselected and the hero is its own
 * again. Each change of design switches the panel through the site's chromatic aberration, the
 * new design shown at its peak; selecting between areas that share a design just marks the
 * choice. `preview` runs through every design in turn, quickly, and back to the hero's own,
 * selecting nothing; selecting an area stops it.
 */
const useHeroVariant = (panelRef, focusAreas) => {
  const [selection, setSelection] = useState({ toner: null, step: 0 });
  const [variant, setVariant] = useState(null);
  const glitchRef = useRef(null);
  const previewTimer = useRef(0);

  const show = (next) => {
    if (glitchRef.current) glitchRef.current.run(() => setVariant(next));
    else setVariant(next);
  };

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const glitch = createElementGlitch(panel);
    glitchRef.current = glitch;
    return () => {
      glitch.dispose();
      glitchRef.current = null;
      clearTimeout(previewTimer.current);
    };
  }, [panelRef]);

  const preview = () => {
    const designs = focusAreas.flatMap(({ toner, variants = [] }) => variants.map((design) => ({ ...design, toner })));
    const next = (index) => {
      show(designs[index] ?? null);
      if (index < designs.length) previewTimer.current = setTimeout(() => next(index + 1), previewStep);
    };
    if (designs.length) next(0);
  };

  const select = (toner) => {
    clearTimeout(previewTimer.current);
    const designs = (focusAreas.find((area) => area.toner === toner)?.variants ?? []).map((design) => ({ ...design, toner }));
    const step = toner === selection.toner ? selection.step + 1 : 0;
    const next = toner === selection.toner && step >= designs.length ? { toner: null, step: 0 } : { toner, step };
    setSelection(next);
    const nextVariant = next.toner === null ? null : designs[next.step] ?? null;
    if (nextVariant?.id === variant?.id) return;
    show(nextVariant);
  };

  return { selected: selection.toner, variant, select, preview };
};

/**
 * The home page's hero. `layout` asks for an alternative arrangement (hero-layouts.css); without
 * one, the hero keeps its own arrangement. Selecting an area of focus with `variants` redesigns
 * the panel for it (hero-variants.css), its header line naming the design shown.
 */
export const HomeBannerLayout = ({ ref, profile, focusAreas = [], actions = [], layout }) => {
  const { stage } = useHeroIntro();
  const panelRef = useRef(null);
  const { selected, variant, select, preview } = useHeroVariant(panelRef, focusAreas);
  // How far Vaporwave reaches past its three muted hues into lavender and peach, from 0 to 100
  // (hero-variants.css); kept while the designs change.
  const [spectrum, setSpectrum] = useState(0);
  // The area whose design is shown, selected or not (a preview selects none).
  const area = focusAreas.find((focus) => focus.toner === variant?.toner);

  // The opening starts with a quick run through every design, then back to the hero's own
  // (hero-intro.css), from the moment the loading screen leaves.
  const previewed = useRef(false);
  useEffect(() => {
    if (stage !== "play" || previewed.current) return;
    previewed.current = true;
    preview();
  }, [stage, preview]);

  return (
    <div
      ref={ref}
      className="hero-banner"
      data-layout={layout}
      data-intro={stage}
      data-variant={variant?.id}
      style={{ "--vapor-spectrum": spectrum / 100 }}
    >
      <div className="hero-banner-content">
        {/* The header line, name and photo. Where a layout gathers them into one panel (the
            inverse layout, hero-layouts.css) this is that panel; elsewhere it stands as if it
            weren't there, and its pieces sit in the hero's grid directly. */}
        <div ref={panelRef} className="hero-panel">
          {/* Vaporwave's scene, behind everything else in the panel: the sky, the sun setting into
              the horizon, the grid floor running to it, and scanlines over the lot. */}
          {variant?.id === "vaporwave" && (
            <div className="hero-vapor-scene" aria-hidden="true">
              <span className="is-sun" />
              <span className="is-floor" />
            </div>
          )}
          {/* Bauhaus's shapes, behind everything else in the panel. */}
          {variant?.id === "bauhaus" && (
            <div className="hero-bauhaus-shapes" aria-hidden="true">
              <span className="is-circle" />
              <span className="is-bar" />
              <span className="is-quarter" />
            </div>
          )}
          <div className="hero-meta" aria-hidden="true">
            <span>{variant?.label ?? profile.label ?? "Portfolio"}</span>
            <span className="hero-meta-rule" />
            <span>{new Date().getFullYear()}</span>
          </div>
          <NameBanner
            nameLines={profile.nameLines}
            description={profile.description}
            actions={actions}
            splitWords={variant?.id === "bauhaus" || variant?.id === "swiss"}
          />
          <ImageBanner photos={profile.photos} />
          {/* The album's name, centred on the whole cover, over the panel's grid (NameBanner.jsx).
              The heading itself keeps its place unseen (and still read), holding the panel's size. */}
          {variant?.id === "album" && (
            <p className="hero-name-heading hero-album-name" aria-hidden="true">
              {profile.nameLines.map((line) => <span key={line}>{line}</span>)}
            </p>
          )}
          {/* Swiss's poster elements: the area's number, set huge, and its words as a small
              block of information. */}
          {variant?.id === "swiss" && area && (
            <>
              <span className="hero-swiss-number" aria-hidden="true">{area.toner}</span>
              <p className="hero-swiss-info" aria-hidden="true">
                <strong>{area.title}</strong> {area.readable}
              </p>
            </>
          )}
          {/* Vaporwave's spectrum: how many of its hues it uses. */}
          {variant?.id === "vaporwave" && (
            <label className="hero-vapor-spectrum">
              <span>spectrum</span>
              <input
                type="range"
                min="0"
                max="100"
                value={spectrum}
                onChange={(event) => setSpectrum(Number(event.target.value))}
                aria-label="Colour spectrum"
              />
            </label>
          )}
          {/* Vaporwave's line of katakana under the name: the role, as "designer / developer". */}
          {variant?.id === "vaporwave" && (
            <p className="hero-vapor-kana" aria-hidden="true">デザイナー ／ デベロッパー</p>
          )}
          {/* The album's catalogue line, as printed along a sleeve's foot. */}
          {variant?.id === "album" && area && (
            <p className="hero-album-line" aria-hidden="true">
              {area.toner} — {area.title} — Side A
            </p>
          )}
        </div>
        {focusAreas.length > 0 && <FocusStrip items={focusAreas} selected={selected} shown={variant?.id} onSelect={select} />}
      </div>
    </div>
  );
};

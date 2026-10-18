import { speed, volume, chromatic, frameGlitch, transitionPreset } from "./config.js";
import { createBlockyEffect } from "./blockyTransition.js";
import { createChromaticEffect } from "./chromaticTransition.js";

const defaults = { preset: transitionPreset, speed, volume, chromatic, frameGlitch };

export function createThemeTransition({ doc = document, view = window, settings = defaults } = {}) {
  const root = doc.documentElement;
  let active = null;
  // An effect built ahead of the next switch (`warm`), so a click finds its filters ready.
  let warmed = null;
  let warming;
  // Whether the owner asked for switches to be kept warm; until it does, none are built ahead.
  let keepWarm = false;

  const cleanUp = () => {
    root.removeAttribute("data-theme-wave");
    root.removeAttribute("data-theme-transition");
    root.removeAttribute("data-theme-transition-phase");
    view.removeEventListener("resize", finish);
    doc.removeEventListener("visibilitychange", finishIfHidden);
  };

  const cancel = (commitPending = true) => {
    if (!active) return;

    const run = active;
    if (commitPending) run.commit();
    else run.aborted = true;

    run.transition?.skipTransition();
    run.animations.forEach((animation) => animation.cancel());
    run.effect.dispose();
    active = null;
    cleanUp();
  };

  const finish = () => cancel();
  const finishIfHidden = () => {
    if (doc.visibilityState === "hidden") cancel();
  };

  const run = async (update, origin) => {
    cancel();

    const supported = typeof doc.startViewTransition === "function"
      && typeof root.animate === "function";
    const reducedMotion = view.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supported || reducedMotion) {
      update();
      return;
    }

    const preset = settings.preset === "chromatic" ? "chromatic" : "blocky";
    // The warmed effect if there is one (its filters rebuild themselves if the window has changed
    // size since), otherwise a new one.
    const effect = (preset === "chromatic" && warmed) || (preset === "chromatic" ? createChromaticEffect : createBlockyEffect)({ doc, view, settings, origin });
    warmed = null;
    if (!effect.supported || !Number.isFinite(effect.speed) || effect.speed <= 0) {
      update();
      return;
    }
    let committed = false;
    const current = {
      aborted: false,
      transition: null,
      effect,
      animations: [],
      commit: () => {
        if (committed || current.aborted) return;
        committed = true;
        update();
      },
    };

    active = current;
    root.setAttribute("data-theme-transition", preset);
    root.setAttribute("data-theme-transition-phase", "preparing");
    if (preset === "blocky") root.setAttribute("data-theme-wave", "preparing");
    view.addEventListener("resize", finish);
    doc.addEventListener("visibilitychange", finishIfHidden);

    try {
      effect.prepare();
      current.transition = doc.startViewTransition(current.commit);
      await current.transition.ready;
      if (active !== current) return;

      root.setAttribute("data-theme-transition-phase", "running");
      if (preset === "blocky") root.setAttribute("data-theme-wave", "running");
      current.animations = effect.animate(root);
      await Promise.race([
        Promise.all(current.animations.map((animation) => animation.finished)).then(() => current.transition.finished),
        current.transition.finished,
      ]);
    } catch {
      // Failed captures or interrupted animations still commit the chosen mode.
      current.commit();
      current.transition?.skipTransition();
    } finally {
      current.animations.forEach((animation) => animation.cancel());
      effect.dispose();
      if (active === current) {
        active = null;
        cleanUp();
      }
      // Ready for the next switch.
      warmSoon();
    }
  };

  /**
   * Builds the next switch's effect ahead of time, as the page loads and again after each switch,
   * so a click doesn't build its filters on the spot. Only the chromatic effect has any to build.
   */
  const warm = () => {
    warming = undefined;
    keepWarm = true;
    if (warmed || settings.preset !== "chromatic") return;
    const effect = createChromaticEffect({ doc, view, settings });
    if (!effect.supported) return;
    effect.build();
    warmed = effect;
  };

  const warmSoon = () => {
    if (!keepWarm || warming !== undefined) return;
    if (view.requestIdleCallback) {
      const handle = view.requestIdleCallback(warm, { timeout: 1000 });
      warming = () => view.cancelIdleCallback?.(handle);
    } else {
      const handle = setTimeout(warm, 200);
      warming = () => clearTimeout(handle);
    }
  };

  return {
    run,
    warm,
    dispose: () => {
      cancel(false);
      warming?.();
      warming = undefined;
      keepWarm = false;
      warmed?.dispose();
      warmed = null;
    },
  };
}

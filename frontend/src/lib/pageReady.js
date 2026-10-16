import { useSyncExternalStore } from "react";
import { heroProfile } from "@/content/home.js";

// Whether the first-load screen has finished: entrance animations and loops wait for it.
let pageReady = false;
const listeners = new Set();

export function markPageReady() {
  if (pageReady) return;
  pageReady = true;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getPageReady = () => pageReady;

export const usePageReady = () => useSyncExternalStore(subscribe, getPageReady);

// Images the opening screen needs fully decoded, not just downloaded, before it can show.
const criticalImages = heroProfile.photos.map(({ src }) => src).filter(Boolean);

const windowLoaded = () => new Promise((resolve) => {
  if (document.readyState === "complete") resolve();
  else window.addEventListener("load", resolve, { once: true });
});

const decodeImage = (src) => {
  const image = new Image();
  image.src = src;
  return image.decode().catch(() => {});
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolves once the page is ready to be seen: stylesheets and eager images loaded, fonts in, and
 * the opening screen's images decoded. Never sooner than `minimum` ms, so the loader doesn't
 * flicker, and never later than `maximum`, so a stalled request can't hold the page hostage.
 */
export const loadPage = ({ minimum = 600, maximum = 10000 } = {}) => Promise.race([
  Promise.all([
    windowLoaded(),
    document.fonts?.ready,
    ...criticalImages.map(decodeImage),
    wait(minimum),
  ]),
  wait(maximum),
]);

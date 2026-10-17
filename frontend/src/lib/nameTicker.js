import { useSyncExternalStore } from "react";

// Lines of the hero name that are scrolled out of view, joined by newlines, for the navbar.
let hiddenName = "";
const listeners = new Set();

export function setHiddenName(name) {
  if (name === hiddenName) return;
  hiddenName = name;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getHiddenName = () => hiddenName;

export const useHiddenName = () => useSyncExternalStore(subscribe, getHiddenName);

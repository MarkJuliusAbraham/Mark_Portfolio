import { useEffect, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createThemeTransition } from "./theme-transition/themeTransition.js";

const storageKey = "theme";

const applyTheme = (theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export function initializeTheme() {
  let theme = "light";

  try {
    if (localStorage.getItem(storageKey) === "dark") theme = "dark";
  } catch {
    // Storage can be unavailable; the switch still works for this visit.
  }

  applyTheme(theme);
}

export function useTheme() {
  const [transition] = useState(createThemeTransition);
  const [theme, setTheme] = useState(() => (
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  ));

  useLayoutEffect(() => {
    applyTheme(theme);

    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Keep the current appearance even when saving preferences is blocked.
    }
  }, [theme]);

  useEffect(() => () => transition.dispose(), [transition]);

  const toggleTheme = (event) => {
    const bounds = event?.currentTarget?.getBoundingClientRect();
    const origin = bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 } : undefined;

    void transition.run(() => {
      flushSync(() => setTheme((current) => current === "dark" ? "light" : "dark"));
    }, origin);
  };

  return { theme, toggleTheme };
}

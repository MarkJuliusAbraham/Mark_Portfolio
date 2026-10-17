import { useEffect, useState } from "react";
import { usePageReady } from "@/lib/pageReady.js";

// Prototype entrances for the navbar's lower group, the theme switch and footer (see
// sidebar-entrance.css); the navigation buttons always wipe in. Try one with
// ?navBottom=<name> in the URL; the default plays otherwise.
export const bottomEntrances = ["fade", "rise", "flicker", "none"];
const defaultBottomEntrance = "fade";
// Long enough for the last item and the pointer's flicker to finish.
const entranceLength = 2200;

const pickBottomEntrance = () => {
  const requested = new URLSearchParams(window.location.search).get("navBottom");
  return bottomEntrances.includes(requested) ? requested : defaultBottomEntrance;
};

/**
 * The navbar's entrance: `entrance` names the lower group's style until it has played, then turns
 * undefined so nothing replays when an element is shown again later. While `waiting` (the loading
 * screen is still up) the entrance is set but held on its first frame, so the items stay hidden
 * rather than showing finished and then jumping back to start.
 */
export const useSidebarEntrance = () => {
  const ready = usePageReady();
  const [bottom] = useState(pickBottomEntrance);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setDone(true), entranceLength);
    return () => clearTimeout(timer);
  }, [ready]);

  return { entrance: done ? undefined : bottom, waiting: !ready };
};

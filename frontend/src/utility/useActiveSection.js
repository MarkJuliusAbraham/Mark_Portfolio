import { useCallback, useEffect, useRef, useState } from "react";

const scrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

export const useActiveSection = (items, pathname) => {
  const [section, setSection] = useState("Home");
  const [requested, setRequested] = useState(null);
  const pending = useRef(null);

  const selectSection = useCallback((label) => {
    const request = { label, originPathname: pathname };
    pending.current = request;
    setRequested(request);
  }, [pathname]);

  useEffect(() => {
    let frame;
    const clearRequest = () => {
      pending.current = null;
      setRequested(null);
    };

    const update = () => {
      frame = undefined;
      if (pathname !== "/") {
        if (pending.current && pending.current.originPathname !== pathname) clearRequest();
        return;
      }

      let active = "Home";
      let latestTop = -Infinity;

      for (const item of items) {
        const target = item.ref?.current;
        if (!target) continue;
        const top = target.getBoundingClientRect().top;
        const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        if (top <= margin + 16 && top >= latestTop) {
          active = item.label;
          latestTop = top;
        }
      }

      // The final section can be shorter than the viewport.
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        active = items.at(-1)?.label || active;
      }
      setSection(active);

      const target = items.find((item) => item.label === pending.current?.label)?.ref?.current;
      if (target) {
        const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const destination = Math.max(0, Math.min(maxScroll, target.getBoundingClientRect().top + window.scrollY - margin));
        if (Math.abs(window.scrollY - destination) <= 2) clearRequest();
      }
    };

    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };

    const cancelSelection = (event) => {
      if (!pending.current || event?.defaultPrevented) return;
      if (event?.type === "keydown") {
        if (!scrollKeys.has(event.key)) return;
        const target = event.target;
        if (target instanceof HTMLElement && (target.isContentEditable || target.matches("input, textarea, select"))) return;
      }
      clearRequest();
      schedule();
    };

    // Recover if native scrolling is interrupted or cannot reach the anchor.
    const timeout = requested ? setTimeout(() => {
      if (pending.current === requested) cancelSelection();
    }, 2000) : undefined;

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", cancelSelection, { passive: true });
    window.addEventListener("touchmove", cancelSelection, { passive: true });
    window.addEventListener("keydown", cancelSelection);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", cancelSelection);
      window.removeEventListener("touchmove", cancelSelection);
      window.removeEventListener("keydown", cancelSelection);
    };
  }, [items, pathname, requested]);

  const routeSection = pathname.startsWith("/projects/") ? "Projects" : section;
  const activeSection = requested && (pathname === "/" || pathname === requested.originPathname)
    ? requested.label
    : routeSection;

  return { activeSection, selectSection };
};

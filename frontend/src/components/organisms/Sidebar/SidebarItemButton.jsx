import { useEffect, useRef } from "react";
import { backgroundBehind, createElementGlitch } from "@/lib/theme-transition/elementChromatic.js";
import { chromatic } from "@/lib/theme-transition/config.js";
import { prefersReducedMotion } from "@/lib/scroll.js";
import { travelFor } from "./progressTravel.js";

// While the dot is shown, how often it glitches again on its own, in ms.
const dotGlitchEvery = 2600;

// The switch's split at full strength is wider than the dot itself; kept to a few pixels here so it
// stays around the dot rather than spilling across the row.
const dotGlitch = { ...chromatic, strength: 3 };

/**
 * The dot that stands in for the bar on a section too short to scroll through, brought in and out
 * with the site's one aberration effect: it glitches in, again every so often while it stays, and
 * glitches out, vanishing at the pulse's peak.
 */
const useDotGlitch = (dotRef) => {
    const glitchRef = useRef(null);

    useEffect(() => {
        const dot = dotRef.current;
        // The dot sits outside its row, over what's behind the row rather than the row itself.
        const glitch = createElementGlitch(dot, { settings: dotGlitch, backdrop: () => backgroundBehind(dot.parentElement) });
        glitchRef.current = glitch;
        return () => {
            glitch.dispose();
            glitchRef.current = null;
        };
    }, [dotRef]);

    return glitchRef;
};

/**
 * Moves the progress bar between rows as the page moves between sections (progressTravel.js):
 * toward `progressIndex`, the row it's going to, with its fill following `scrolledIndex`, the row
 * the page is scrolled to. A section too short to scroll through has a dot instead, which glitches
 * in as the bar is sent there.
 */
const useProgressTravel = ({ buttonRef, dotRef, index, progressIndex, scrolledIndex }) => {
    const glitchRef = useDotGlitch(dotRef);

    useEffect(() => {
        const button = buttonRef.current;
        const dot = dotRef.current;
        const column = button?.parentElement;
        if (!button || !dot || !column || progressIndex < 0) return;
        const travel = travelFor(column);
        // Every row tells it; only the first to hear of a change sets it moving.
        travel.update({ to: progressIndex, scrolledRow: scrolledIndex, instantly: prefersReducedMotion() });

        const glitch = glitchRef.current;
        if (index !== progressIndex) {
            button.removeAttribute("data-arrived");
            if (dot.getAttribute("data-visible") === "true") glitch?.run(() => dot.setAttribute("data-visible", "false"));
            return;
        }

        button.setAttribute("data-arrived", "");
        dot.setAttribute("data-visible", "true");
        if (parseFloat(getComputedStyle(button).getPropertyValue("--item-fixed")) < 1) return;
        glitch?.run(() => {});
        const idle = setInterval(() => glitch?.run(() => {}), dotGlitchEvery);
        return () => clearInterval(idle);
    }, [buttonRef, dotRef, glitchRef, index, progressIndex, scrolledIndex]);
};

export const SidebarItemButton = ({label, index, progressIndex, scrolledIndex = progressIndex, onClick, active = false, children}) => {
    const buttonRef = useRef(null);
    const dotRef = useRef(null);
    useProgressTravel({ buttonRef, dotRef, index, progressIndex, scrolledIndex });

    return (
        <button
            ref={buttonRef}
            type="button"
            onClick = {onClick}
            className="sidebar-item sidebar-enter"
            style={{
                "--item-progress": `var(--section-progress-${index}, 0)`,
                "--item-fixed": `var(--section-fixed-${index}, 0)`,
                "--enter-index": index,
            }}
            data-active={active}
            // The selected section stands out at full brightness, untouched by the screen's
            // darkening toward its edges (ScreenLimb.jsx).
            data-limb-exempt={active || undefined}
            aria-current={active ? "location" : undefined}
        >
            {children}
            <span className="sidebar-item-label">
                {label}
            </span>

            {/* Corner marks that lock onto the row like a reticle on hover or keyboard focus. */}
            <span className="sidebar-item-lock" aria-hidden="true" />

            {/* Beside the row, fills top to bottom with scroll progress through this section; shown
                once the selection has arrived here. Exempt from the darkening with the row. */}
            <span className="sidebar-item-progress" data-limb-exempt={active || undefined} aria-hidden="true" />
            {/* Stands in for the bar on a section too short to scroll through; aberrates in when entered. */}
            <span ref={dotRef} className="sidebar-item-dot" data-limb-exempt={active || undefined} aria-hidden="true" />
        </button>
    );
}

import { ArrowRight } from "lucide-react";

export const SidebarItemButton = ({label, index, onClick, active = false, children}) => {
    return (
        <button
            type="button"
            onClick = {onClick}
            className="sidebar-item sidebar-enter"
            style={{
                "--item-progress": `var(--section-progress-${index}, 0)`,
                "--item-fixed": `var(--section-fixed-${index}, 0)`,
                "--enter-index": index,
            }}
            data-active={active}
            aria-current={active ? "location" : undefined}
        >
            {children}
            <span className="sidebar-item-label">
                {label}
            </span>

            <ArrowRight className="sidebar-item-arrow" strokeWidth={1.5} aria-hidden="true" />

            {/* Fills top to bottom with scroll progress through this section; shown while active. */}
            <span className="sidebar-item-progress" aria-hidden="true" />
            {/* Stands in for the bar on a section too short to scroll through; pops in when entered. */}
            <span className="sidebar-item-dot" aria-hidden="true">
                <span className="sidebar-item-dot-core" />
            </span>
        </button>
    );
}

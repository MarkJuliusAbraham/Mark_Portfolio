import { ArrowRight } from "lucide-react";

export const SidebarItemButton = ({label, onClick, active = false, children}) => {
    return (
        <button
            type="button"
            onClick = {onClick}
            className="sidebar-item"
            data-active={active}
            aria-current={active ? "location" : undefined}
        >
            {children}
            <span className="sidebar-item-label">
                {label}
            </span>

            <ArrowRight className="sidebar-item-arrow" strokeWidth={1.5} aria-hidden="true" />
        </button>
    );
}

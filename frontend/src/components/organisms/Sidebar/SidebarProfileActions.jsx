import { availability } from "@/content/profile.js";
import "./sidebar-profile.css";

/** Shared profile utilities for the desktop sidebar and the expanded mobile menu. */
export const SidebarProfileActions = () => {
  return (
    <div className="sidebar-profile-actions">
      <p className="sidebar-availability">
        <span className="sidebar-status-mark" aria-hidden="true" />
        <span>{availability}</span>
      </p>
    </div>
  );
};

import { useId } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { sidebarPreview } from "@/content/profile.js";
import "./sidebar-profile.css";

/** Shared profile utilities for the desktop sidebar and the expanded mobile menu. */
export const SidebarProfileActions = () => {
  const previewId = useId();

  return (
    <div className="sidebar-profile-actions">
      <p className="sidebar-availability">
        <span className="sidebar-status-mark" aria-hidden="true" />
        <span>{sidebarPreview.availability}</span>
        <span className="sidebar-preview-label">Demo</span>
      </p>
      {/* Intentionally a button without a handler: this layout preview downloads nothing. */}
      <Button type="button" variant="outline" className="sidebar-cv-button" title="Preview only" aria-describedby={previewId}>
        {sidebarPreview.cvLabel}
        <Download size={16} strokeWidth={1.5} aria-hidden="true" />
      </Button>
      <span id={previewId} className="sr-only">CV preview only. No file will be downloaded.</span>
    </div>
  );
};

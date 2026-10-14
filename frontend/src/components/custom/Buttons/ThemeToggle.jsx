import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import "./theme-toggle.css";

export function ThemeToggle({ theme, onToggle, compact = false }) {
  const dark = theme === "dark";
  const Icon = dark ? Moon : Sun;

  return (
    <Button
      type="button"
      variant="outline"
      role="switch"
      aria-label="Dark theme"
      aria-checked={dark}
      title={`Switch to ${dark ? "light" : "dark"} theme`}
      onClick={onToggle}
      className={`theme-toggle${compact ? " theme-toggle-compact" : ""}`}
    >
      <span className="theme-toggle-label">
        <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
        {!compact && <span>{dark ? "Dark mode" : "Light mode"}</span>}
      </span>
      {!compact && (
        <span className="theme-toggle-track" aria-hidden="true">
          <span className="theme-toggle-thumb" />
        </span>
      )}
    </Button>
  );
}

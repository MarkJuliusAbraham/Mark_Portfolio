import { useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { LayoutGroup } from "motion/react";
import { SidebarHeader } from "./SidebarHeader.jsx";
import { SidebarFooter } from "./SidebarFooter.jsx";
import { SidebarItemButton } from "./SidebarItemButton.jsx";
import { SidebarCursor } from "./SidebarCursor.jsx";
import { ThemeToggle } from "@/components/molecules/ThemeToggle/ThemeToggle.jsx";
import { useTheme } from "@/hooks/useTheme.js";
import { desktopQuery } from "@/lib/media.js";
import "./sidebar.css";

export const Sidebar = ({ items, onNavigate, activeSection }) => {
  const menuRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const closeMenu = () => menuRef.current?.removeAttribute("open");

  useEffect(() => {
    const dismissOutside = (event) => {
      if (menuRef.current?.open && !menuRef.current.contains(event.target)) {
        menuRef.current.removeAttribute("open");
      }
    };
    const desktop = window.matchMedia(desktopQuery);
    const dismissOnDesktop = () => {
      if (desktop.matches) menuRef.current?.removeAttribute("open");
    };

    document.addEventListener("pointerdown", dismissOutside);
    desktop.addEventListener("change", dismissOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      desktop.removeEventListener("change", dismissOnDesktop);
    };
  }, []);

  const navigate = (item) => {
    closeMenu();
    onNavigate(item);
  };
  const goHome = () => navigate(items[0]);

  const navigation = (label) => (
    <LayoutGroup id={label}>
      <nav aria-label={label} className="sidebar-navigation">
        {items.map((item, index) => (
          <SidebarItemButton key={item.label} label={item.label} index={index} active={item.label === activeSection} onClick={() => navigate(item)}>
            {item.label === activeSection && <SidebarCursor />}
          </SidebarItemButton>
        ))}
      </nav>
    </LayoutGroup>
  );

  return (
    <>
      <header
        className="sidebar-mobile-header sticky top-0 z-50 flex h-(--mobile-header-height) items-center justify-between border-b bg-background px-6 min-[1100px]:hidden"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuRef.current?.open) {
            closeMenu();
            menuRef.current.querySelector("summary")?.focus();
          }
        }}
      >
        <SidebarHeader onClick={goHome} />
        <div className="sidebar-mobile-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
          <details ref={menuRef}>
            <summary className="sidebar-menu-toggle flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <Menu className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
              Menu
            </summary>
            <div className="sidebar-mobile-panel absolute inset-x-0 top-full max-h-[calc(100dvh-var(--mobile-header-height))] overflow-y-auto border-b bg-background px-6 py-6">
              {navigation("Mobile navigation")}
              <SidebarFooter />
            </div>
          </details>
        </div>
      </header>

      <aside className="sidebar-desktop fixed inset-y-0 left-0 z-40 hidden w-(--sidebar-width) overflow-y-auto min-[1100px]:block">
        <div className="sidebar-shell">
          <SidebarHeader onClick={goHome} />
          {navigation("Desktop navigation")}
          <div className="sidebar-bottom">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <SidebarFooter />
          </div>
        </div>
      </aside>
    </>
  );
};

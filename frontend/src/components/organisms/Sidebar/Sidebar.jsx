import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { LayoutGroup } from "motion/react";
import { SidebarHeader } from "./SidebarHeader.jsx";
import { SidebarFooter } from "./SidebarFooter.jsx";
import { SidebarProfileActions } from "./SidebarProfileActions.jsx";
import { SidebarItemButton } from "./SidebarItemButton.jsx";
import { SidebarCursor } from "./SidebarCursor.jsx";
import { SidebarOutline } from "./SidebarOutline.jsx";
import { usePageOutline } from "./usePageOutline.js";
import { LimbScopeLayer } from "@/components/organisms/ScreenLimb/LimbScopeLayer.jsx";
import { useSidebarEntrance } from "./useSidebarEntrance.js";
import { ThemeToggle } from "@/components/molecules/ThemeToggle/ThemeToggle.jsx";
import { useTheme } from "@/hooks/useTheme.js";
import { desktopQuery } from "@/lib/media.js";
import "./sidebar.css";
import "./sidebar-entrance.css";

// Places an element of the navbar's lower group in its entrance order (see sidebar-entrance.css).
const enterSoft = (index) => ({ className: "sidebar-enter-soft", style: { "--enter-index": index } });

export const Sidebar = ({ items, onNavigate, activeSection, scrolledSection = activeSection, navigating = false }) => {
  const menuRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { entrance, waiting } = useSidebarEntrance();
  const closeMenu = () => menuRef.current?.removeAttribute("open");
  // On a project's page, its sections fill the space under the navigation.
  const { pathname } = useLocation();
  const { outline, activeId } = usePageOutline(pathname.startsWith("/projects/"), pathname);

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

  // The progress bar heads for the section being shown: one chosen from the list straight away,
  // otherwise the one scrolled to. Its fill follows where the page actually is.
  const progressIndex = items.findIndex((item) => item.label === (navigating ? activeSection : scrolledSection));
  const scrolledIndex = items.findIndex((item) => item.label === scrolledSection);

  const navigation = (label) => (
    <LayoutGroup id={label}>
      <nav aria-label={label} className="sidebar-navigation">
        {items.map((item, index) => (
          <SidebarItemButton key={item.label} label={item.label} index={index} progressIndex={progressIndex} scrolledIndex={scrolledIndex} active={item.label === activeSection} onClick={() => navigate(item)}>
            {item.label === activeSection && <SidebarCursor />}
          </SidebarItemButton>
        ))}
      </nav>
    </LayoutGroup>
  );

  return (
    <>
      <header
        data-section-progress
        data-entrance={entrance}
        data-entrance-waiting={waiting || undefined}
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
          <div {...enterSoft(0)}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
          </div>
          <details ref={menuRef} {...enterSoft(1)}>
            <summary className="sidebar-menu-toggle flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <Menu className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
              <span className="sidebar-menu-label">Menu</span>
            </summary>
            <div className="sidebar-mobile-panel absolute inset-x-0 top-full max-h-[calc(100dvh-var(--mobile-header-height))] overflow-y-auto border-b bg-background px-6 py-6">
              {navigation("Mobile navigation")}
              <SidebarOutline outline={outline} activeId={activeId} onChoose={closeMenu} />
              <SidebarProfileActions />
              <SidebarFooter />
            </div>
          </details>
        </div>
      </header>

      {/* Carries its own copy of the screen's darkening, beneath everything in it: the panel dims
          toward the screen's edge while its name, links and controls stay untouched
          (LimbScopeLayer.jsx). */}
      <aside data-limb-scope data-section-progress data-entrance={entrance} data-entrance-waiting={waiting || undefined} className="sidebar-desktop fixed inset-y-0 left-0 z-40 hidden w-(--sidebar-width) overflow-y-auto min-[1100px]:block">
        <LimbScopeLayer beneath />
        <div className="sidebar-shell">
          <div className="sidebar-top">
            <SidebarHeader onClick={goHome} />
            {navigation("Desktop navigation")}
            <SidebarOutline outline={outline} activeId={activeId} />
          </div>
          <div className="sidebar-bottom">
            <div {...enterSoft(0)}>
              <SidebarProfileActions />
            </div>
            <div {...enterSoft(1)}>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <div {...enterSoft(2)}>
              <SidebarFooter />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

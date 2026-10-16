import { createRef, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/organisms/Sidebar/Sidebar.jsx";
import { BodyGrid } from "@/components/organisms/BodyGrid/BodyGrid.jsx";
import { PageLoader } from "@/components/organisms/PageLoader/PageLoader.jsx";
import { useActiveSection } from "@/hooks/useActiveSection.js";
import { scrollToElement } from "@/lib/scroll.js";
import { usePageReady } from "@/lib/pageReady.js";
import "@/styles/page-entrance.css";

// Every section the page can scroll to; Education is reached by scrolling, not from the navigation.
const sectionNames = ["Home", "About", "Projects", "Education", "Contact"];
const navigationLabels = ["Home", "About", "Projects", "Contact"];

export const BasePage = () => {
  const ready = usePageReady();
  const gridCanvasRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [sections] = useState(() => Object.fromEntries(sectionNames.map((name) => [name, createRef()])));
  const navigationItems = useMemo(
    () => navigationLabels.map((label) => ({ label, ref: sections[label] })),
    [sections],
  );
  const { activeSection, selectSection } = useActiveSection(navigationItems, location.pathname);

  const handleNavigate = (item) => {
    selectSection(item.label);
    if (location.pathname === "/") scrollToElement(item.ref.current);
    else navigate("/", { state: { scrollTo: item.label } });
  };

  return (
    <div className="page-scene isolate min-h-dvh min-w-0 min-[1100px]:pl-(--sidebar-width)" data-page-ready={ready}>
      <BodyGrid canvasRef={gridCanvasRef} />
      <PageLoader canvasRef={gridCanvasRef} />
      <div className="page-ui" inert={!ready} aria-hidden={!ready || undefined}>
        <a href="#main-content" className="fixed top-2 left-2 z-[60] -translate-y-20 bg-background px-4 py-3 focus:translate-y-0">
          Skip to content
        </a>
        <Sidebar items={navigationItems} onNavigate={handleNavigate} activeSection={activeSection} />
        <Outlet context={{ sections }} />
      </div>
    </div>
  );
};

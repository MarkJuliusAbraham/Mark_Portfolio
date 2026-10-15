import { createRef, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/organisms/Sidebar/Sidebar.jsx";
import { BodyGrid } from "@/components/organisms/BodyGrid/BodyGrid.jsx";
import { useActiveSection } from "@/hooks/useActiveSection.js";
import { scrollToElement } from "@/lib/scroll.js";

// Every section the page can scroll to; Education is reached by scrolling, not from the navigation.
const sectionNames = ["Home", "About", "Projects", "Education", "Contact"];
const navigationLabels = ["Home", "About", "Projects", "Contact"];

export const BasePage = () => {
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
    <div className="isolate min-h-dvh min-w-0 min-[1100px]:pl-(--sidebar-width)">
      <BodyGrid />
      <a href="#main-content" className="fixed top-2 left-2 z-[60] -translate-y-20 bg-background px-4 py-3 focus:translate-y-0">
        Skip to content
      </a>
      <Sidebar items={navigationItems} onNavigate={handleNavigate} activeSection={activeSection} />
      <Outlet context={{ sections }} />
    </div>
  );
};

import { useMemo, useRef } from "react";
import { Sidebar } from "@/components/custom/Sidebar/Sidebar.jsx";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useActiveSection } from "@/utility/useActiveSection.js";

export const BasePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const aboutRef = useRef(null);
  const homeRef = useRef(null);
  const projectRef = useRef(null);
  const educationRef = useRef(null);
  const contactRef = useRef(null);

  const navigationItems = useMemo(() => [
    { label: "Home", ref: homeRef },
    { label: "About", ref: aboutRef },
    { label: "Projects", ref: projectRef },
    { label: "Contact", ref: contactRef },
  ], [homeRef, aboutRef, projectRef, contactRef]);

  const { activeSection, selectSection } = useActiveSection(navigationItems, location.pathname);

  const scrollTo = (ref) => {
    ref?.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
      inline: "start",
    });
  };

  const handleSidebarClick = (item) => {
    selectSection(item.label);
    if (location.pathname === "/") {
      scrollTo(item.ref);
    } else {
      navigate("/", {
        state: {
          scrollTo: item.label,
        },
      });
    }
  };

  return (
    <div className="min-h-dvh min-w-0 min-[1100px]:pl-(--sidebar-width)">
      <a href="#main-content" className="fixed top-2 left-2 z-[60] -translate-y-20 bg-background px-4 py-3 focus:translate-y-0">
        Skip to content
      </a>
      <Sidebar email="mjabraham00@gmail.com" items={navigationItems} onNavigate={handleSidebarClick} activeSection={activeSection} />

      <Outlet
        context={{
          homeRef,
          aboutRef,
          projectRef,
          educationRef,
          contactRef,
        }}
      />

    </div>
  );
};

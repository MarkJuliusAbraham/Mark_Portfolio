import { motion, useAnimation } from "motion/react";
import { useEffect } from "react";
import {SidebarHeader} from "@/components/custom/Sidebar/SidebarHeader.jsx";
import {SidebarFooter} from "@/components/custom/Sidebar/SidebarFooter.jsx";

export const Sidebar = ({ items, email, children }) => {
  const controls = useAnimation();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1100px)");

    const update = () => {
      controls.start({
        x: mediaQuery.matches ? 0 : "-100%",
        transition: {
          duration: 0.7,
          ease: [0.16, 1, 0.3, 1],
        },
      });
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, [controls]);

  return (
    <motion.aside
      initial={{ x: "-100%" }}
      animate={controls}
      className="fixed inset-y-0 left-0 z-50 w-80"
    >
      <div className="box-border flex min-h-screen flex-col px-6 py-6">
        <SidebarHeader name="Mark" />

        {children}

        <SidebarFooter name={email} />
      </div>
    </motion.aside>
  );
};

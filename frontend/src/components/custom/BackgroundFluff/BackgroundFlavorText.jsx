import { useState, useEffect } from "react";
import {motion} from "motion/react";

export const BackgroundFlavorText = ({ activeSection }) => {

  const sections = [
    { name: "HOME", position: 0 },
    { name: "ABOUT", position: -65 },
    { name: "PROJECTS", position: -139 },
    { name: "EDUCATION", position: -243 },
  ];

  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const section = sections.find(
      (section) => section.name === activeSection
    );

    if (section) {
      setOffset(section.position);
    }
  }, [activeSection]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="background-text scale-[25] origin-left typeset-aesthetic text-gray-100 whitespace-nowrap mix-blend-difference"
        animate={{
          x: offset,
        }}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {sections.map((section) => (
          <span key={section.name} className="mr-5" >
            {section.name}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

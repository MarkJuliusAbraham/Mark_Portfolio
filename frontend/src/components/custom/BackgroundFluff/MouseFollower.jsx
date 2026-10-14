import { useEffect, useRef, useState } from "react";

export const MouseFollower = () => {
  const mouse = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });

  const [displayPosition, setDisplayPosition] = useState({
    x: 0,
    y: 0,
  });

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1100px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let animationFrame;
    let active = false;

    const handleMouseMove = (e) => {
      mouse.current = {
        x: 0,
        y: e.clientY,
      };

      const isNearLeft = e.clientX < 352;

      setVisible(isNearLeft);
    };


    const animate = () => {
      const easing = 0.2;

      position.current.x +=
        (mouse.current.x - position.current.x) * easing;

      position.current.y +=
        (mouse.current.y - position.current.y) * easing;

      setDisplayPosition({
        x: position.current.x,
        y: position.current.y,
      });

      animationFrame = requestAnimationFrame(animate);
    };

    const update = () => {
      if (mediaQuery.matches && !active) {
        active = true;
        window.addEventListener("mousemove", handleMouseMove);
        animate();
      } else if (!mediaQuery.matches && active) {
        active = false;
        window.removeEventListener("mousemove", handleMouseMove);
        cancelAnimationFrame(animationFrame);
      }
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return (
    <div
      className={`
        fixed
        hidden
        min-[1100px]:[@media(hover:hover)_and_(pointer:fine)]:block
        motion-reduce:!hidden
        pointer-events-none
        z-50
        h-25
        w-25
        rounded-full
        bg-white
        mix-blend-difference
        transition-opacity
        duration-500
        ease-in-out
        ${visible ? "opacity-100" : "opacity-0"}
      `}
      aria-hidden="true"
      style={{
        left: displayPosition.x,
        top: displayPosition.y,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
};

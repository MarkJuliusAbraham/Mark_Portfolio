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
    const handleMouseMove = (e) => {
      mouse.current = {
        x: 0,
        y: e.clientY,
      };

      const isNearLeft = e.clientX < 352;

      setVisible(isNearLeft);
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame;

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

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      className={`
        fixed
        pointer-events-none
        z-50
        h-35
        w-35
        rounded-full
        bg-white
        mix-blend-difference
        transition-opacity
        duration-500
        ease-in-out
        ${visible ? "opacity-100" : "opacity-0"}
      `}
      style={{
        left: displayPosition.x,
        top: displayPosition.y,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
};

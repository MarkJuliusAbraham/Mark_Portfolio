import { useEffect, useState } from "react";

const gifs = Object.values(
  import.meta.glob("/src/gifs/*.gif", {
    eager: true,
    query: "?url",
    import: "default",
  })
);

export const RotatingGifsHolder = ({ rotationMs = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (gifs.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % gifs.length);
    }, rotationMs);

    return () => clearInterval(interval);
  }, [rotationMs]);

  if (gifs.length === 0) {
    return null;
  }

  return (
    <div>
      <img
        src={gifs[currentIndex]}
        alt=""
      />
    </div>
  );
};

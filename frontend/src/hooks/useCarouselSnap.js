import { useEffect, useState } from "react";

/** The carousel's snap points and which one is selected, kept in sync with its API. */
export function useCarouselSnap(api) {
  const [snap, setSnap] = useState({ count: 0, current: 0 });

  useEffect(() => {
    if (!api) return;
    const update = () => setSnap({ count: api.scrollSnapList().length, current: api.selectedScrollSnap() });
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return snap;
}

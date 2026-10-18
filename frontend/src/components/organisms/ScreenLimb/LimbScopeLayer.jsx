import { useEffect, useRef } from "react";
import { limbPicture, limbPictureScale, onLimbPicture } from "@/lib/limbPierce.js";

/**
 * The screen's darkening (ScreenLimb.jsx) carried inside a panel of its own, for a panel marked
 * `data-limb-scope`. The screen-wide darkening leaves that panel out (useLimbScopes.js), and
 * this layer draws the very same pixels over it from inside, so nothing shows at the seam. Being
 * inside the panel, it can be layered with the panel's own content: anything in the panel marked
 * `data-limb-exempt` sits above it and shows untouched, however near the dark corners, in whatever
 * shape it has and through whatever it animates; everything else sits beneath and is darkened.
 *
 * With `beneath`, it darkens only the panel's own background and border and sits beneath all of
 * its content, so everything in the panel shows untouched without being marked one by one.
 *
 * It's fixed to the screen at the panel's place, so the panel must not be inside anything that
 * moves or transforms what's fixed in it.
 */
export function LimbScopeLayer({ beneath = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.closest("[data-limb-scope]");
    if (!canvas || !host) return;
    let frame;
    // What was last drawn, so a scroll that leaves the panel where it was (as a panel fixed to the
    // screen always is) costs nothing.
    let drawn = "";
    let drawnPicture = null;

    const draw = (force = false) => {
      frame = undefined;
      const picture = limbPicture();
      const box = host.getBoundingClientRect();
      const key = [box.left, box.top, box.width, box.height].join();
      if (!force && key === drawn && picture === drawnPicture) return;
      drawn = key;
      drawnPicture = picture;
      Object.assign(canvas.style, {
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      });
      if (!picture?.width || !picture.height || !box.width || !box.height) {
        canvas.width = 0;
        return;
      }
      // The part of the picture under the panel; the picture starts at the screen's top left.
      const scale = limbPictureScale();
      const [x, y, width, height] = [box.left, box.top, box.width, box.height].map((value) => value * scale);
      canvas.width = Math.max(Math.round(width), 1);
      canvas.height = Math.max(Math.round(height), 1);
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(picture, x, y, width, height, 0, 0, canvas.width, canvas.height);
    };
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(() => draw());
    };
    // The picture is one canvas, repainted in place: when it changes, redraw even if it's the same.
    const repaint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => draw(true));
    };

    draw(true);
    const stop = onLimbPicture(repaint);
    const size = new ResizeObserver(schedule);
    size.observe(host);
    window.addEventListener("resize", schedule);
    // A panel in the page (not fixed to the screen) moves under the darkening as it scrolls.
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(frame);
      stop();
      size.disconnect();
      window.removeEventListener("resize", schedule);
      document.removeEventListener("scroll", schedule, { capture: true });
    };
  }, []);

  return <canvas ref={ref} className="limb-scope-layer" data-beneath={beneath || undefined} aria-hidden="true" />;
}

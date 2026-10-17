import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Pause } from "lucide-react";
import { filmAdvance, usePhotoAdvance } from "@/hooks/usePhotoAdvance.js";
import { cn } from "@/lib/utils";

/**
 * One photo in the frame: the image, a black blank while it has none, or a placeholder if it fails.
 * `state` is "current" (shown), "previous" (the one it took over from, seen leaving as the film
 * moves) or nothing (kept loaded, unseen).
 */
const PhotoFace = ({ ref, photo, state }) => {
  const [failed, setFailed] = useState(false);
  const className = cn("hero-photo-face", state && `is-${state}`);
  const hidden = state !== "current" || undefined;

  if (!photo.src) return <div ref={ref} className={cn(className, "hero-photo-blank")} aria-hidden={hidden} />;

  return failed ? (
    <div ref={ref} className={cn(className, "hero-photo-placeholder")} role="img" aria-label="Portrait placeholder" aria-hidden={hidden}>
      <ImageIcon size={32} strokeWidth={1} aria-hidden="true" />
      <span aria-hidden="true">Portrait</span>
    </div>
  ) : (
    <img
      ref={ref}
      src={photo.src}
      alt={photo.alt ?? "Portrait"}
      aria-hidden={hidden}
      className={cn(className, "hero-photo")}
      style={{ objectPosition: photo.position ?? "50% 50%", objectFit: photo.fit ?? "cover" }}
      onError={() => setFailed(true)}
    />
  );
};

const switchHold = 4200;

/** How the automatic switch stands: a line filling toward the next switch, or paused while held. */
const AutoSwitchStatus = ({ state }) => {
  if (state === "held") {
    return (
      <span className="hero-photo-autospin is-held">
        <Pause size={11} strokeWidth={2} aria-hidden="true" />
        Paused
      </span>
    );
  }
  return (
    <span className="hero-photo-autospin">
      {/* Remounts whenever the countdown starts over, so the line fills from empty. */}
      {state === "counting" && <span className="hero-photo-autospin-fill" style={{ "--spin-hold": `${switchHold}ms` }} />}
    </span>
  );
};

// The dark line between one frame of film and the next, in px.
const frameLine = 8;

/**
 * A framed photo that keeps moving on through its photos (usePhotoAdvance.js). On its own, the
 * film moves on a frame: the photo slides up and away, the next slides up into place, and the
 * sprocket holes along the film's edge travel with them. Clicking either half steps back or
 * forward at once, through the site's chromatic aberration. Every photo stays loaded, so none ever
 * shows half-decoded. Hovering or focusing it holds the automatic switch, and the caption shows
 * it: a line filling toward the next switch, or "Paused".
 */
export const ImageBanner = ({ photos = [] }) => {
  const frameRef = useRef(null);
  const faceRefs = useRef([]);
  const edgeRef = useRef(null);
  // How far the sprocket holes have travelled, in px, so each move carries on from the last.
  const edgeTravel = useRef({ offset: 0, animation: null });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const count = Math.max(photos.length, 1);
  const { current, previous, change, advanced, step, auto } = usePhotoAdvance(frameRef, count, {
    hold: switchHold,
    held: hovered || focused,
  });

  // Decode every photo up front so even the first time each comes around, it is ready.
  useEffect(() => {
    for (const { src } of photos) {
      if (!src) continue;
      const image = new Image();
      image.src = src;
      image.decode().catch(() => {});
    }
  }, [photos]);

  // A switch on its own moves the film on a frame: the photo leaving slides up and out, the one
  // arriving slides up into place a frame line behind it, and the sprocket holes travel as far.
  useEffect(() => {
    const arriving = faceRefs.current[current];
    if (!advanced || !arriving) return;
    const distance = arriving.offsetHeight + frameLine;
    const moves = [
      arriving.animate([{ transform: `translateY(${distance}px)` }, { transform: "none" }], filmAdvance),
    ];
    const leaving = previous === null ? null : faceRefs.current[previous];
    if (leaving) moves.push(leaving.animate([{ transform: "none" }, { transform: `translateY(${-distance}px)` }], filmAdvance));

    const edge = edgeRef.current;
    const travel = edgeTravel.current;
    if (edge && getComputedStyle(edge).display !== "none") {
      const from = travel.offset;
      travel.offset -= distance;
      const holes = edge.animate(
        [{ backgroundPositionY: `${from}px` }, { backgroundPositionY: `${travel.offset}px` }],
        { ...filmAdvance, pseudoElement: "::before", fill: "forwards" },
      );
      travel.animation?.cancel();
      travel.animation = holes;
    }
    return () => moves.forEach((move) => move.cancel());
  }, [change, current, previous, advanced]);

  const figure = String(current + 1).padStart(2, "0");

  return (
    <figure className="hero-photo-figure">
      {/* The photo and, where the layout shows it, a film edge beside it (hero-layouts.css). */}
      <div className="hero-photo-film">
        <div
          className="hero-photo-frame"
          // Touch has no hover to end, so only a mouse or pen holds the switching.
          onPointerEnter={(event) => event.pointerType !== "touch" && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={(event) => event.target.matches(":focus-visible") && setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <div ref={frameRef} className="hero-photo-side">
            {photos.map((photo, index) => (
              <PhotoFace
                key={index}
                ref={(element) => { faceRefs.current[index] = element; }}
                photo={photo}
                state={index === current ? "current" : index === previous ? "previous" : undefined}
              />
            ))}
          </div>
          <button type="button" className="hero-photo-turn is-left" aria-label="Show the previous photo" onClick={() => step(-1)} />
          <button type="button" className="hero-photo-turn is-right" aria-label="Show the next photo" onClick={() => step(1)} />
        </div>
        {/* Sprocket holes and the frame's number, as printed along the edge of a strip of film. */}
        <div ref={edgeRef} className="hero-photo-edge" aria-hidden="true">
          <span>{figure} ▸ {figure}A</span>
        </div>
      </div>
      <figcaption className="hero-photo-caption" aria-hidden="true">
        <span>Fig. {figure}</span>
        <span>{photos[current]?.caption}</span>
        <AutoSwitchStatus state={auto} />
      </figcaption>
    </figure>
  );
};

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
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

// The dark line between one frame of film and the next, in px.
const frameLine = 8;

// The hero's opening (hero-intro.css): the film winds two frames on, slower, once the panel has
// opened, so it reads as the reel being threaded rather than an ordinary advance.
const introWind = { duration: 1100, delay: 750, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
const introFrames = 2;

/**
 * A framed photo on a strip of film (usePhotoAdvance.js). Clicking either half steps back or
 * forward at once, through the site's chromatic aberration; it never turns on its own, and the
 * caption counts the frames so it's clear there are more. With `intro`, the hero's opening is
 * playing: the film winds its first photo into place as part of it. Every photo stays loaded, so
 * none ever shows half-decoded.
 */
export const ImageBanner = ({ photos = [], intro = false }) => {
  const frameRef = useRef(null);
  const faceRefs = useRef([]);
  const edgeRef = useRef(null);
  // How far the sprocket holes have travelled, in px, so each move carries on from the last.
  const edgeTravel = useRef({ offset: 0, animation: null });
  const count = Math.max(photos.length, 1);
  const { current, previous, change, advanced, step } = usePhotoAdvance(frameRef, count, {
    autoplay: false,
    wind: intro,
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

  // Winding the film moves it on a frame: the photo leaving slides up and out, the one arriving
  // slides up into place a frame line behind it, and the sprocket holes travel as far. The opening
  // winds further and slower (introWind).
  useEffect(() => {
    const arriving = faceRefs.current[current];
    if (!advanced || !arriving) return;
    const opening = intro && change === 1;
    const timing = opening ? { ...introWind, fill: "backwards" } : filmAdvance;
    const distance = (arriving.offsetHeight + frameLine) * (opening ? introFrames : 1);
    const moves = [
      arriving.animate([{ transform: `translateY(${distance}px)` }, { transform: "none" }], timing),
    ];
    const leaving = previous === null ? null : faceRefs.current[previous];
    if (leaving) moves.push(leaving.animate([{ transform: "none" }, { transform: `translateY(${-distance}px)` }], timing));

    const edge = edgeRef.current;
    const travel = edgeTravel.current;
    if (edge && getComputedStyle(edge).display !== "none") {
      const from = travel.offset;
      travel.offset -= distance;
      const holes = edge.animate(
        [{ backgroundPositionY: `${from}px` }, { backgroundPositionY: `${travel.offset}px` }],
        { ...timing, pseudoElement: "::before", fill: "both" },
      );
      travel.animation?.cancel();
      travel.animation = holes;
    }
    return () => moves.forEach((move) => move.cancel());
  }, [change, current, previous, advanced, intro]);

  const figure = String(current + 1).padStart(2, "0");

  return (
    <figure className="hero-photo-figure">
      {/* The photo and, where the layout shows it, a film edge beside it (hero-layouts.css). */}
      <div className="hero-photo-film">
        <div className="hero-photo-frame">
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
        <span className="hero-photo-count">{figure} / {String(count).padStart(2, "0")}</span>
      </figcaption>
    </figure>
  );
};

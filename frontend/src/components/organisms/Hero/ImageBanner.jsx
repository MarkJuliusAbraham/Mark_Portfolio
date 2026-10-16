import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Pause } from "lucide-react";
import { useCardSpin } from "@/hooks/useCardSpin.js";
import { cn } from "@/lib/utils";

/** One photo on a side of the card: the image, a black blank while it has none, or a placeholder if it fails. */
const PhotoFace = ({ photo, current, exposed }) => {
  const [failed, setFailed] = useState(false);
  const className = cn("hero-photo-face", current && "is-current");
  const hidden = !exposed || undefined;

  if (!photo.src) return <div className={cn(className, "hero-photo-blank")} aria-hidden={hidden} />;

  return failed ? (
    <div className={cn(className, "hero-photo-placeholder")} role="img" aria-label="Portrait placeholder" aria-hidden={hidden}>
      <ImageIcon size={32} strokeWidth={1} aria-hidden="true" />
      <span aria-hidden="true">Portrait</span>
    </div>
  ) : (
    <img
      src={photo.src}
      alt={photo.alt ?? "Portrait"}
      aria-hidden={hidden}
      className={cn(className, "hero-photo")}
      style={{ objectPosition: photo.position ?? "50% 50%", objectFit: photo.fit ?? "cover" }}
      onError={() => setFailed(true)}
    />
  );
};

/**
 * One side of the card. Every photo stays mounted on both sides and only the current one shows, so
 * turning to a photo never reloads or re-decodes it.
 */
const CardSide = ({ photos, current, facing, className }) => (
  <div className={cn("hero-photo-side", className)}>
    {photos.map((photo, index) => (
      <PhotoFace key={index} photo={photo} current={index === current} exposed={facing && index === current} />
    ))}
  </div>
);

const spinHold = 4200;

/** How the automatic turn stands: a line filling toward the next turn, or paused while held. */
const AutoSpinStatus = ({ state }) => {
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
      {state === "counting" && <span className="hero-photo-autospin-fill" style={{ "--spin-hold": `${spinHold}ms` }} />}
    </span>
  );
};

/**
 * A two-sided framed card that keeps turning over, frame and all. Whichever side faces away takes
 * the photo that comes next the way the card is turning: forward through the list left to right,
 * back right to left, so every side that comes around is a new one. Clicking either half turns
 * it toward that side; the caption counts along. Hovering or focusing the card holds the
 * automatic turn, and the caption shows it: a line filling toward the next turn, or "Paused".
 */
export const ImageBanner = ({ photos = [] }) => {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { position, heading, spin, autoSpin } = useCardSpin(cardRef, { hold: spinHold, held: hovered || focused });
  const count = Math.max(photos.length, 1);
  const wrap = (index) => ((index % count) + count) % count;
  const backFacing = Math.abs(position % 2) === 1;
  const shown = wrap(position);
  const upcoming = wrap(position + heading);

  // Decode every photo up front so even the first time each comes around, it is ready.
  useEffect(() => {
    for (const { src } of photos) {
      if (!src) continue;
      const image = new Image();
      image.src = src;
      image.decode().catch(() => {});
    }
  }, [photos]);

  return (
    <figure className="hero-photo-figure">
      <div
        className="hero-photo-frame"
        // Touch has no hover to end, so only a mouse or pen holds the card.
        onPointerEnter={(event) => event.pointerType !== "touch" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={(event) => event.target.matches(":focus-visible") && setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <div ref={cardRef} className="hero-photo-card">
          <CardSide photos={photos} current={backFacing ? upcoming : shown} facing={!backFacing} className="is-front" />
          <CardSide photos={photos} current={backFacing ? shown : upcoming} facing={backFacing} className="is-back" />
        </div>
        <button type="button" className="hero-photo-turn is-left" aria-label="Turn the photo to the left" onClick={() => spin(-1)} />
        <button type="button" className="hero-photo-turn is-right" aria-label="Turn the photo to the right" onClick={() => spin(1)} />
      </div>
      <figcaption className="hero-photo-caption" aria-hidden="true">
        <span>Fig. {String(shown + 1).padStart(2, "0")}</span>
        <span>{photos[shown]?.caption}</span>
        <AutoSpinStatus state={autoSpin} />
      </figcaption>
    </figure>
  );
};

import { useEffect, useRef, useState } from "react";
import runVideo from "@/previews/MitsuhaRun.mp4";
import runPoster from "@/previews/MitsuhaRun.jpg";
import rollVideo from "@/previews/MitsuhaRoll.mp4";
import rollPoster from "@/previews/MitsuhaRoll.jpg";
import tragedyVideo from "@/previews/Tragedy.mp4";
import tragedyPoster from "@/previews/Tragedy.jpg";
import meteorVideo from "@/previews/TakiGazeMeteor.mp4";
import meteorPoster from "@/previews/TakiGazeMeteor.jpg";
import loversVideo from "@/previews/StarCrossedLovers.mp4";
import loversPoster from "@/previews/StarCrossedLovers.jpg";
import chaseVideo from "@/previews/MitsuhaChaseMeteor.mp4";
import chasePoster from "@/previews/MitsuhaChaseMeteor.jpg";
import receptionPreview from "@/gifs/threshold-preview.gif";
import treeSystemsPreview from "@/gifs/tree-systems.gif";
import windVideo from "@/previews/WindSystem.mp4";
import windPoster from "@/previews/WindSystem.jpg";
import gestureVideo from "@/previews/GestureCapture.mp4";
import gesturePoster from "@/previews/GestureCapture.jpg";
import { prefersReducedMotion } from "@/lib/scroll.js";

// Placeholder previews until each project has its own: short looping videos (far smaller than the
// GIFs they were made from), each with its first frame as a still.
const previews = [
  { video: runVideo, poster: runPoster },
  { video: rollVideo, poster: rollPoster },
  { video: tragedyVideo, poster: tragedyPoster },
  { video: meteorVideo, poster: meteorPoster },
  { video: loversVideo, poster: loversPoster },
  { video: chaseVideo, poster: chasePoster },
];

// Projects that have their own preview, recorded from the project itself: a GIF, or a video with its
// first frame as a still (for footage too rich in colour to be a reasonable GIF).
const ownPreviews = {
  // Hand gestures on the webcam casting Invoker's spells in Dota 2.
  "project-1": { video: gestureVideo, poster: gesturePoster },
  // Bob collects her papers at the reception window and leaves.
  "project-2": { gif: receptionPreview, alt: "" },
  "tree-systems": { gif: treeSystemsPreview, alt: "" },
  // A gust passing through the gust viewer's moonlit stand, cropped tight for the card.
  "wind-system": { video: windVideo, poster: windPoster },
};

// The same stand-in for a project every time, so it matches between the carousel and the grid.
const standIn = (id) => previews[[...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % previews.length];

// How near the screen a preview must come before it loads, so it's ready as it scrolls in.
const loadAhead = "300px";

/**
 * A preview video that loads only once it nears the screen (one in a carousel slide scrolled out
 * of view counts as off screen), plays only while it's on screen, and with reduced motion shows
 * its still frame and never loads the video at all.
 */
const LazyVideo = ({ preview, className }) => {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [still] = useState(prefersReducedMotion);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const approach = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNear(true);
    }, { rootMargin: loadAhead });
    const view = new IntersectionObserver(([entry]) => {
      if (still) return;
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    approach.observe(video);
    view.observe(video);
    return () => {
      approach.disconnect();
      view.disconnect();
    };
  }, [still]);

  return (
    <video
      ref={ref}
      className={className}
      poster={near ? preview.poster : undefined}
      src={near && !still ? preview.video : undefined}
      muted
      loop
      playsInline
      autoPlay={!still}
      preload="none"
      aria-hidden="true"
    />
  );
};

/**
 * A project's preview inside a figure frame: its video, or for a placeholder project an empty
 * field marked "TBD".
 */
export const ProjectPreview = ({ id, placeholder, className }) => {
  if (placeholder) return <span className={`${className} project-preview-empty`} aria-hidden="true">TBD</span>;
  const own = ownPreviews[id];
  if (own?.gif) return <img className={className} src={own.gif} alt={own.alt} loading="lazy" decoding="async" aria-hidden="true" />;
  if (own?.video) return <LazyVideo preview={own} className={className} />;
  return <LazyVideo preview={standIn(id)} className={className} />;
};

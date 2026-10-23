import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./CaseStudyMedia.css";

// Animated media (recordings exported as GIF or animated WebP) is labelled as a recording.
const isRecording = (src) => /\.(gif|webp)(\?|$)/i.test(src);

/**
 * The one media figure for case-study pages: a framed screenshot or recording with its caption, which
 * opens in a full-screen viewer with zoom.
 */
export function CaseStudyMedia({ media: { src, width, height, name, alt, caption } }) {
  const kind = isRecording(src) ? "recording" : "screenshot";
  const dialog = useRef(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function showMedia() {
    setZoom(1);
    dialog.current.showModal();
    setOpen(true);
  }

  return (
    <>
      <figure className="cs-media">
        <button className="cs-media__preview" onClick={showMedia}
          aria-label={`Enlarge ${name} ${kind}`} aria-haspopup="dialog">
          <img src={src} width={width} height={height} alt={alt} loading="lazy" />
        </button>
        <figcaption>
          <span>{caption}</span>
          <button onClick={showMedia} aria-label={`View ${name} ${kind}`}>View {kind} ↗</button>
        </figcaption>
      </figure>
      {createPortal(
        <dialog ref={dialog} className="cs-media-viewer" aria-labelledby={titleId}
          onClose={() => setOpen(false)}>
          <header className="cs-media-viewer__header">
            <h2 id={titleId}>{caption}</h2>
            <button onClick={() => dialog.current.close()} autoFocus aria-label={`Close ${kind}`}>Close ×</button>
          </header>
          <div className="cs-media-viewer__tools" aria-label="Image zoom controls">
            <button onClick={() => setZoom(Math.max(1, zoom - 0.5))} disabled={zoom === 1} aria-label="Zoom out">−</button>
            <output aria-live="polite">{Math.round(zoom * 100)}%</output>
            <button onClick={() => setZoom(Math.min(4, zoom + 0.5))} disabled={zoom === 4} aria-label="Zoom in">+</button>
            <button onClick={() => setZoom(1)}>Fit</button>
            <a href={src} target="_blank" rel="noopener noreferrer">Original ↗</a>
          </div>
          <div className="cs-media-viewer__viewport" data-fit={zoom === 1} tabIndex={0} aria-label={`${kind[0].toUpperCase()}${kind.slice(1)}. Scroll to pan when zoomed.`}>
            <img src={src} width={width} height={height} alt={alt}
              style={{ width: `${zoom * 100}%` }} />
          </div>
          <p className="cs-media-viewer__hint">Zoom in to read controls. Scroll or swipe to explore.</p>
        </dialog>, document.body,
      )}
    </>
  );
}

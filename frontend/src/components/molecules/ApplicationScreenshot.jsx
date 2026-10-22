import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ApplicationScreenshot.css";

export function ApplicationScreenshot({ image: { src, width, height, name, alt, caption } }) {
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

  function showScreenshot() {
    setZoom(1);
    dialog.current.showModal();
    setOpen(true);
  }

  return (
    <>
      <figure className="application-screenshot">
        <button className="application-screenshot__preview" onClick={showScreenshot}
          aria-label={`Enlarge ${name} screenshot`} aria-haspopup="dialog">
          <img src={src} width={width} height={height} alt={alt} loading="lazy" />
        </button>
        <figcaption>
          <span>{caption}</span>
          <button onClick={showScreenshot} aria-label={`View ${name} screenshot`}>View screenshot ↗</button>
        </figcaption>
      </figure>
      {createPortal(
        <dialog ref={dialog} className="screenshot-viewer" aria-labelledby={titleId}
          onClose={() => setOpen(false)}>
          <header className="screenshot-viewer__header">
            <h2 id={titleId}>{caption}</h2>
            <button onClick={() => dialog.current.close()} autoFocus aria-label="Close screenshot">Close ×</button>
          </header>
          <div className="screenshot-viewer__tools" aria-label="Image zoom controls">
            <button onClick={() => setZoom(Math.max(1, zoom - 0.5))} disabled={zoom === 1} aria-label="Zoom out">−</button>
            <output aria-live="polite">{Math.round(zoom * 100)}%</output>
            <button onClick={() => setZoom(Math.min(4, zoom + 0.5))} disabled={zoom === 4} aria-label="Zoom in">+</button>
            <button onClick={() => setZoom(1)}>Fit</button>
            <a href={src} target="_blank" rel="noopener noreferrer">Original ↗</a>
          </div>
          <div className="screenshot-viewer__viewport" data-fit={zoom === 1} tabIndex={0} aria-label="Screenshot. Scroll to pan when zoomed.">
            <img src={src} width={width} height={height} alt={alt}
              style={{ width: `${zoom * 100}%` }} />
          </div>
          <p className="screenshot-viewer__hint">Zoom in to read controls. Scroll or swipe to explore.</p>
        </dialog>, document.body,
      )}
    </>
  );
}

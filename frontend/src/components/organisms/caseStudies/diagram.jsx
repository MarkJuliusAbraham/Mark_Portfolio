import { Term } from "./Hints.jsx";

// Shared drawing pieces for case-study figures (SVG). A figure lays these out in its own viewBox;
// boxes with a `term` show that term's hint when the page provides one through HintProvider.

export const Arrowhead = ({ id, className = "cs-fill-ink" }) => (
  <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" className={className} />
  </marker>
);

export const FigureLabel = ({ number, title }) => (
  <text x="0" y="12" className="cs-fig-label">
    <tspan className="cs-fig-number">FIG. {number}</tspan>
    <tspan dx="12">{title}</tspan>
  </text>
);

// A component uses its own contrasting surface; grouping keeps all of its labels on that palette.
export const Node = ({ x, y, width, height = 46, name, note, tag, lines = [], accent = false, term = name }) => (
  <g className="cs-component">
  <Term term={term}>
    <rect x={x} y={y} width={width} height={height} className={accent ? "cs-node cs-node-accent" : "cs-node"} />
    <path d={`M${x},${y} h7 L${x},${y + 7} z`} className={accent ? "cs-fill-accent" : "cs-fill-ink"} />
    <text x={x + 12} y={y + 20} className="cs-name">{name}</text>
    <text x={x + width - 9} y={y + 14} textAnchor="middle" className="cs-plus" aria-hidden="true">+</text>
    {tag && <text x={x + width - 20} y={y + 20} textAnchor="end" className="cs-tag">{tag}</text>}
    {note && <text x={x + 12} y={y + 36} className="cs-note">{note}</text>}
    {lines.map((line, i) => <text key={line} x={x + 12} y={y + 46 + i * 20} className="cs-state-line">{line}</text>)}
  </Term>
  </g>
);

// A container drawn as a frame with a hoverable header strip, so hovering what's inside it
// shows the inner box's hint, not the container's.
export const Frame = ({ x, y, width, height, name, note, term = name, shaded = false }) => (
  <g className={shaded ? "cs-shaded-frame" : undefined}>
    <rect x={x} y={y} width={width} height={height} className={shaded ? "cs-frame cs-frame-shaded" : "cs-frame"} />
    <path d={`M${x},${y} h7 L${x},${y + 7} z`} className="cs-fill-ink" />
    <Term term={term}>
      <rect x={x} y={y} width={Math.min(width, 420)} height="34" className="cs-hit" />
      <text x={x + 12} y={y + 21} className="cs-name">{name}</text>
      <text x={x + 12 + name.length * 8.4 + 10} y={y + 21} className="cs-note">{note}</text>
      <text x={x + width - 9} y={y + 14} textAnchor="middle" className="cs-plus" aria-hidden="true">+</text>
    </Term>
  </g>
);

// A labelled empty frame standing in for media that hasn't been recorded yet (HTML, not SVG).
export const Placeholder = ({ label, ratio = "16 / 9" }) => (
  <figure className="cs-placeholder" style={{ aspectRatio: ratio }} aria-label={`Placeholder: ${label}`}>
    <figcaption className="typeset-card-toner">{label}</figcaption>
  </figure>
);

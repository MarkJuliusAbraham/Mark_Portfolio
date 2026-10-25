import { useEffect, useState } from "react";
import { CaseStudyMedia } from "@/components/molecules/CaseStudyMedia.jsx";
import { prefersReducedMotion } from "@/lib/scroll.js";
const sampleImages = import.meta.glob("/src/gifs/tree-viewer-{young,mature,aged}-*.png", {
  eager: true, query: "?url", import: "default",
});
const treeTypes = ["Young", "Mature", "Aged"].map((name) => ({
  name,
  variants: Array.from({ length: 3 }, (_, index) => ({
    debug: sampleImages[`/src/gifs/tree-viewer-${name.toLowerCase()}-${index}.png`],
    clean: sampleImages[`/src/gifs/tree-viewer-${name.toLowerCase()}-${index}-clean.png`],
  })),
}));

export function TreeVariantViewer() {
  const [selected, setSelected] = useState(0);
  const [type, setType] = useState(0);
  const [debug, setDebug] = useState(true);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const { name, variants } = treeTypes[type];

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setSelected((index) => (index + 1) % variants.length), 1800);
    return () => window.clearInterval(timer);
  }, [playing, variants.length]);

  function select(index) {
    setPlaying(false);
    setSelected((index + variants.length) % variants.length);
  }

  return (
    <div className="tree-recording" role="group" aria-label="Tree viewer variants">
      <div className="tree-sample-options">
        <div className="tree-variant-choices" role="group" aria-label="Tree age">
          {treeTypes.map((tree, index) => (
            <button className="cs-simplify-button" type="button" key={tree.name}
              aria-pressed={type === index}
              onClick={() => { setPlaying(false); setSelected(0); setType(index); }}>{tree.name}</button>
          ))}
        </div>
        <label className="tree-debug-toggle">
          <input type="checkbox" checked={debug} onChange={(event) => { setDebug(event.target.checked); setPlaying(false); }} />
          Show debug overlays
        </label>
      </div>
      {/* Opening the shared media viewer holds the selected image for inspection. */}
      <div onClickCapture={() => setPlaying(false)}>
        <CaseStudyMedia media={{
          src: variants[selected][debug ? "debug" : "clean"], width: 1600, height: 828,
          name: `${name} tree variant ${selected}`,
          alt: `${name} tree variant ${selected}, rendered by the Woods tree viewer.${debug ? " Blue puff spheres and a pink crown sphere surround the foliage, with an enlarged leaf shape beside the tree." : " The tree's foliage and branching structure under the viewer's preview lighting, without debug overlays."}`,
          caption: `${name} tree · Variant ${selected} · ${debug ? "Puffs, Crown and Leaf Shape enabled" : "Normal appearance"}`,
        }} />
      </div>
      <div className="tree-variant-controls">
        <button className="cs-simplify-button" type="button" onClick={() => select(selected - 1)} aria-label="Previous tree variant">Previous</button>
        <div className="tree-variant-choices" role="group" aria-label="Select a tree variant">
          {variants.map((sample, index) => (
            <button className="cs-simplify-button" type="button" key={sample.debug}
              aria-label={`Show tree variant ${index}`} aria-pressed={selected === index}
              onClick={() => select(index)}>{index}</button>
          ))}
        </div>
        <button className="cs-simplify-button" type="button" onClick={() => select(selected + 1)} aria-label="Next tree variant">Next</button>
        <button className="cs-simplify-button" type="button" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>
          {playing ? "Pause sequence" : "Play sequence"}
        </button>
      </div>
      <p className="cs-caption" aria-live={playing ? "off" : "polite"}>
        {name} · Variant {selected} · {selected + 1} of {variants.length}. Choosing an age or variant pauses the sequence.
      </p>
    </div>
  );
}

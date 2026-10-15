import "./NetworkAccent.css";

// A hand-placed, uneven network: [x, y] per node, grouped into layers left to right.
const networkLayers = [
  [[6, 18], [10, 44], [4, 70]],
  [[42, 8], [36, 34], [46, 58], [40, 84]],
  [[78, 22], [84, 52], [74, 76]],
  [[112, 40], [108, 66]],
];

/** AI: a faint network behind the text; hover brightens it and sends a signal through it. */
export const NetworkAccent = () => (
  <svg className="focus-network" viewBox="0 0 116 92" aria-hidden="true">
    {networkLayers.slice(0, -1).map((nodes, layer) =>
      nodes.flatMap(([x1, y1], from) =>
        networkLayers[layer + 1].map(([x2, y2], to) => (
          <line key={`${layer}-${from}-${to}`} className="focus-network-edge" style={{ "--layer": layer }} x1={x1} y1={y1} x2={x2} y2={y2} />
        )),
      ),
    )}
    {networkLayers.map((nodes, layer) =>
      nodes.map(([x, y], index) => (
        <circle
          key={`${layer}-${index}`}
          className="focus-network-node"
          // Uneven idle timing per node, so the network twinkles rather than pulsing as one.
          style={{ "--layer": layer, "--twinkle-delay": `${(((layer * 5 + index * 3) * 0.83) % 5).toFixed(2)}s` }}
          cx={x}
          cy={y}
          r="2.2"
        />
      )),
    )}
  </svg>
);

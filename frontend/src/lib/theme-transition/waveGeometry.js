const cellNoise = (row, column) => {
  let seed = Math.imul(row + 1, 92837111) ^ Math.imul(column + 1, 689287499);
  seed = Math.imul(seed ^ (seed >>> 13), 1274126177);
  return ((seed ^ (seed >>> 16)) >>> 0) / 4294967295;
};

function createBleed({ width, height, x, y, reach, blockSize }) {
  const spread = blockSize * 1.25;
  const halfBlock = blockSize / 2;
  const columns = Math.ceil(width / blockSize);
  const paths = [];

  for (let row = 0; row < Math.ceil(height / blockSize); row++) {
    const top = row * blockSize;
    const bottom = Math.min(height, top + blockSize);
    const distanceY = (top + bottom) / 2 - y;
    if (Math.abs(distanceY) > reach + spread) continue;

    const outer = Math.sqrt(Math.max(0, (reach + spread) ** 2 - distanceY ** 2));
    const inner = Math.sqrt(Math.max(0, Math.max(0, reach - spread) ** 2 - distanceY ** 2));
    const ranges = inner > 0
      ? [[x - outer, x - inner], [x + inner, x + outer]]
      : [[x - outer, x + outer]];

    for (const [start, end] of ranges) {
      const first = Math.max(0, Math.ceil(start / blockSize - 0.5));
      const last = Math.min(columns - 1, Math.floor(end / blockSize - 0.5));
      for (let column = first; column <= last; column++) {
        const distance = Math.hypot((column + 0.5) * blockSize - x, distanceY);
        const bodyVisible = distance <= reach;

        for (let part = 0; part < 4; part++) {
          const fineRow = row * 2 + Math.floor(part / 2);
          const fineColumn = column * 2 + part % 2;
          if (cellNoise(fineRow, fineColumn) > 0.35) continue;

          // Fixed thresholds give islands ahead and holes behind without flicker.
          const threshold = distance + (cellNoise(fineRow + 17, fineColumn + 31) * 2 - 1) * spread;
          const squareVisible = reach >= threshold;
          if (squareVisible === bodyVisible) continue;

          const left = column * blockSize + part % 2 * halfBlock;
          const squareTop = top + Math.floor(part / 2) * halfBlock;
          const right = Math.min(width, left + halfBlock);
          const squareBottom = Math.min(bottom, squareTop + halfBlock);
          if (left >= width || squareTop >= height) continue;
          paths.push(`M${left},${squareTop}H${right}V${squareBottom}H${left}Z`);
        }
      }
    }
  }

  return paths.join(" ");
}

export function createWaveFrames({ width, height, origin, blockSize }) {
  const x = Math.max(0, Math.min(width, origin.x));
  const y = Math.max(0, Math.min(height, origin.y));
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + blockSize;
  const steps = Math.max(1, Math.min(120, Math.ceil(radius / blockSize)));
  const rows = Math.ceil(height / blockSize);

  return Array.from({ length: steps + 1 }, (_, step) => {
    const reach = radius * step / steps;
    const bands = Array.from({ length: rows }, (_, row) => {
      const top = row * blockSize;
      const bottom = Math.min(height, top + blockSize);
      const distanceY = (top + bottom) / 2 - y;
      let left = 0;
      let right = 0;

      if (step === steps) {
        right = width;
      } else if (step > 0 && Math.abs(distanceY) <= reach) {
        const distanceX = Math.sqrt(reach * reach - distanceY * distanceY);
        const firstCell = Math.ceil((x - distanceX) / blockSize - 0.5);
        const lastCell = Math.floor((x + distanceX) / blockSize - 0.5);

        if (firstCell <= lastCell) {
          left = Math.max(0, Math.min(width, firstCell * blockSize));
          right = Math.max(left, Math.min(width, (lastCell + 1) * blockSize));
        }
      }

      return `M${left},${top}H${right}V${bottom}H${left}Z`;
    }).join(" ");

    const bleed = step > 0 && step < steps
      ? createBleed({ width, height, x, y, reach, blockSize })
      : "";

    return {
      offset: step / steps,
      clipPath: `path(evenodd, "${bands} ${bleed}")`,
      easing: "steps(1, end)",
    };
  });
}

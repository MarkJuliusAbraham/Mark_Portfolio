import { createLinePaint, createOpeningLines, gridOpening, gridOpeningDuration, readGrid, resolveColor, traceGridLine } from "./gridCanvas.js";

export { gridOpening };

export const gridHandoff = {
  emphasis: 3.5, // The loading grid's line strength relative to the page background.
  settle: 520, // Milliseconds to dim into the background while the UI enters.
};

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const easeInOut = (value) => value < 0.5 ? 2 * value * value : 1 - (-2 * value + 2) ** 2 / 2;

/** Forms the actual background, then dims it in place. It remains mounted after loading. */
export const createGridFormation = (canvas, { animate = true } = {}) => {
  const context = canvas.getContext("2d");
  const start = performance.now();
  const seed = Math.random() * 1000;
  const emphasis = animate ? gridHandoff.emphasis : 1;
  let layout;
  let frame = 0;
  let disposed = false;
  let opacity = 1;
  let resolveFormed;
  let resolveSettled;
  const formed = new Promise((resolve) => { resolveFormed = resolve; });

  const measure = () => {
    const { width, height } = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const grid = readGrid();
    const count = Math.ceil(grid.span / grid.size);
    layout = {
      ratio,
      grid,
      first: -grid.span / 2,
      last: count * grid.size - grid.span / 2,
      lines: createOpeningLines({ count, span: grid.span, grid, width, height, seed }),
      face: resolveColor("var(--background)"),
      line: createLinePaint(context, grid, { width, height }, { emphasis, transparent: true }),
    };
  };

  const draw = (time) => {
    const { ratio, grid, first, last, lines, face, line: paint } = layout;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = face;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    // This canvas is the cover above the moving lights. Open it only where a line has grown,
    // so a glow cannot reveal parts of the grid that haven't formed yet. Each line is opened as
    // it shows on the bulging screen (gridCanvas.js), a one-pixel stroke along its cell boundary.
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "#000";
    context.lineWidth = 1;
    context.beginPath();
    let hasLines = false;
    for (const line of lines) {
      const age = time - gridOpening.blank - line.delay;
      if (age <= 0) continue;
      hasLines = true;
      const backward = easeInOut(clamp01(age / line.backward));
      const forward = easeInOut(clamp01(age / line.forward));
      const from = line.from - backward * (line.from - first);
      const to = line.from + forward * (last - line.from);
      traceGridLine(context, grid, line.vertical, line.at + 0.5, from, to);
    }
    context.stroke();
    context.translate(grid.centerX, grid.centerY);
    context.rotate(grid.angle);
    if (hasLines) {
      // Paint into the open strokes once, keeping intersections at the same strength. The
      // transparent line tint lets the existing CSS light pass through underneath.
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = paint;
      context.globalAlpha = opacity;
      context.fillRect(first, first, last - first + 1, last - first + 1);
    }
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
  };

  const grow = (now) => {
    draw(now - start);
    if (now - start < gridOpeningDuration) frame = requestAnimationFrame(grow);
    else resolveFormed(); // Hold the completed grid without a running animation while assets load.
  };
  const onResize = () => {
    measure();
    draw(animate ? performance.now() - start : gridOpeningDuration);
  };
  const themeObserver = new MutationObserver(onResize);

  measure();
  draw(animate ? 0 : gridOpeningDuration);
  if (animate) frame = requestAnimationFrame(grow);
  else resolveFormed();
  window.addEventListener("resize", onResize);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  return {
    formed,
    settle: async () => {
      await formed;
      if (disposed || !animate) return;
      return new Promise((resolve) => {
        resolveSettled = resolve;
        const begin = performance.now();
        const step = (now) => {
          const progress = clamp01((now - begin) / gridHandoff.settle);
          opacity = 1 - easeInOut(progress) * (1 - 1 / emphasis);
          draw(gridOpeningDuration);
          if (progress < 1) frame = requestAnimationFrame(step);
          else resolve();
        };
        frame = requestAnimationFrame(step);
      });
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
      resolveFormed();
      resolveSettled?.();
    },
  };
};

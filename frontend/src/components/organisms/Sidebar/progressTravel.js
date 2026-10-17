// How the progress bar moves between rows as the page moves between sections. Rows are counted in
// bar lengths down the column, 0 the top of the top row. The bar is the white track from the back
// of its dark fill to its own front; within it, the dark fill runs from the track's visible top
// to where the page is actually scrolled. Each part moves on its own:
//   - the track heads for the row the bar is going to: on choosing a section, straight there; on
//     scrolling, the row scrolled into, so it reaches ahead into the new row;
//   - the fill's front follows the page, clamped inside the visible track; a slower trailing edge
//     stretches the track as the page crosses into each section, without splitting its fill.
// So the fill seems to push the track ahead of it, and choosing a section looks just like
// scrolling there.

// The springs the parts move on, as pull and damping. The track's is much quicker than the fill's,
// so it reaches into a new row ahead of the fill however fast the page scrolls.
const trackSpring = { stiffness: 1100, damping: 66 };
const fillSpring = { stiffness: 300, damping: 33 };
// Close enough, in rows and rows a second, to call a spring settled.
const restDistance = 0.002;
const restSpeed = 0.01;
// The springs are worked out in steps of this many seconds, and at most this much time per frame.
const substep = 1 / 240;
const maxElapsed = 0.1;

const clamp = (value) => Math.min(Math.max(value, 0), 1);

// One contiguous filled interval followed by one unfilled interval, even when
// the page reverses direction or jumps past several rows during navigation.
export const progressInterval = (track, back, progress) => {
    const top = Math.min(track, back);
    const bottom = Math.max(track + 1, progress, back);
    return { top, bottom, fillEnd: Math.min(bottom, Math.max(top, progress)) };
};

/** Moves `spring` toward `goal` over `dt` seconds, on `{ stiffness, damping }`. */
const pull = (spring, goal, dt, { stiffness, damping }) => {
    spring.speed += (stiffness * (goal - spring.at) - damping * spring.speed) * dt;
    spring.at += spring.speed * dt;
};

const settled = (spring, goal) => Math.abs(goal - spring.at) < restDistance && Math.abs(spring.speed) < restSpeed;

const travels = new WeakMap();

const createTravel = (column) => {
    // Where the track is (its back edge; its front is one bar length on) and the back of the fill.
    const track = { at: null, speed: 0 };
    const fillBack = { at: null, speed: 0 };
    // The row the bar is going to, and the row of the section the page is scrolled to.
    let target = null;
    let scrolled = null;
    let frame = null;
    let last = 0;

    const rows = () => [...column.children];
    const fixed = (row) => parseFloat(getComputedStyle(row).getPropertyValue("--item-fixed")) >= 1;
    // Where the page is scrolled, in rows: each section passed counts one, the current one its part.
    const scrolledTo = () => rows().reduce(
        (sum, row) => sum + clamp(parseFloat(getComputedStyle(row).getPropertyValue("--item-progress")) || 0),
        0,
    );

    const draw = () => {
        const { top, bottom, fillEnd } = progressInterval(track.at, fillBack.at, scrolledTo());
        rows().forEach((row, index) => {
            const bar = row.querySelector(".sidebar-item-progress");
            if (!bar) return;
            const over = top < index + 1 && bottom > index && !fixed(row);
            bar.style.opacity = over ? "1" : "0";
            bar.style.clipPath = `inset(${clamp(top - index) * 100}% 0 ${clamp(index + 1 - bottom) * 100}% 0)`;
            bar.style.setProperty("--bar-fill-from", String(top - index));
            bar.style.setProperty("--bar-fill-size", String(fillEnd - top));
        });
    };

    const release = () => {
        rows().forEach((row) => {
            const bar = row.querySelector(".sidebar-item-progress");
            if (!bar) return;
            for (const property of ["opacity", "clip-path", "--bar-fill-from", "--bar-fill-size"]) bar.style.removeProperty(property);
        });
    };

    const step = (now) => {
        let elapsed = Math.min((now - last) / 1000, maxElapsed);
        last = now;
        while (elapsed > 0) {
            const dt = Math.min(elapsed, substep);
            pull(track, target, dt, trackSpring);
            pull(fillBack, scrolled, dt, fillSpring);
            elapsed -= dt;
        }
        // At rest only once the page has arrived where the bar went and both parts are there: then
        // the row's own bar, drawn by its styles, looks just the same.
        if (target === scrolled && settled(track, target) && settled(fillBack, scrolled)) {
            track.at = target;
            fillBack.at = scrolled;
            track.speed = 0;
            fillBack.speed = 0;
            frame = null;
            release();
            return;
        }
        draw();
        frame = requestAnimationFrame(step);
    };

    return {
        /**
         * Tells the bar the row it's going to and the row the page is scrolled to; with `instantly`,
         * it's simply there.
         */
        update({ to, scrolledRow, instantly = false }) {
            const moved = to !== target || scrolledRow !== scrolled;
            target = to;
            scrolled = scrolledRow;
            if (instantly || track.at === null) {
                track.at = target;
                fillBack.at = scrolled;
                track.speed = 0;
                fillBack.speed = 0;
                if (frame !== null) cancelAnimationFrame(frame);
                frame = null;
                release();
                return;
            }
            if (!moved || frame !== null) return;
            // Drawn at once, so a row's own bar never shows before the move's first frame.
            draw();
            last = performance.now();
            frame = requestAnimationFrame(step);
        },
    };
};

/** The bar travel for a navbar column, made on first use. */
export const travelFor = (column) => {
    let travel = travels.get(column);
    if (!travel) {
        travel = createTravel(column);
        travels.set(column, travel);
    }
    return travel;
};

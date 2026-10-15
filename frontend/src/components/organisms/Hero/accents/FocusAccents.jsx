import { GameParticles } from "./GameParticles.jsx";
import { GameSeal } from "./GameSeal.jsx";
import { NetworkAccent } from "./NetworkAccent.jsx";
import { SpecAccent } from "./SpecAccent.jsx";
import { SwordAccent } from "./SwordAccent.jsx";
import { TerminalAccent } from "./TerminalAccent.jsx";

/**
 * Each accent lives somewhere different in its item, where its subject would put it, rather than
 * in a shared slot: on the title, behind the text, after the text, or along the top edge. Per
 * kind, this maps each slot it uses to what it draws there.
 */
const accents = {
  spec: { title: ({ titleRef }) => <SpecAccent titleRef={titleRef} /> },
  network: { backdrop: () => <NetworkAccent /> },
  terminal: { after: ({ active, itemRef }) => <TerminalAccent active={active} itemRef={itemRef} /> },
  game: {
    edge: ({ active, itemRef, dwellDuration }) => <GameSeal active={active} itemRef={itemRef} dwellDuration={dwellDuration} />,
    backdrop: ({ itemRef }) => (
      <>
        <GameParticles itemRef={itemRef} />
        <SwordAccent itemRef={itemRef} />
      </>
    ),
  },
};

/** Renders the item's accent for `slot`, or nothing when that kind of accent doesn't use it. */
export const FocusAccent = ({ kind, slot, ...props }) => accents[kind]?.[slot]?.(props) ?? null;

import { AberrateIn } from "@/components/atoms/AberrateIn.jsx";
import {PhrasePopIn} from "./PhrasePopIn.jsx";

/**
 * A section's title, centered, or with `align="start"` at the left of a row it shares. It pops in
 * letter by letter, with `entrance="aberrate"` glitches in whole, or with `entrance="none"` is
 * simply there.
 */
export const SectionTitle = ({ref, word = "Default Section Title", align = "center", entrance = "pop"}) => {
  return (
    <h2 ref={ref} aria-label={word} className={`section-anchor flex min-w-0 flex-wrap items-center ${align === "start" ? "justify-start text-left" : "justify-center text-center"}`}>
      <span aria-hidden="true">
        {entrance === "aberrate"
          ? <AberrateIn className="typeset-section-title">{word}</AberrateIn>
          : <PhrasePopIn className="typeset-section-title" word={word} still={entrance === "none"} />}
      </span>
    </h2>
  );
}

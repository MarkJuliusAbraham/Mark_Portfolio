import { PopInComponent } from "@/components/atoms/PopInComponent.jsx";

/**
 * Pops a phrase in letter by letter; spaces keep their width. Each letter sits in an extra
 * clipping box around PopInComponent's own: the nested inline boxes add the spacing under each
 * line that the section titles' layout is built on. With `still`, the letters sit in the same
 * boxes from the start, without popping in, each numbered in `--letter` (counting on from
 * `firstLetter`) for a stylesheet to stagger its own entrance by.
 */
export const PhrasePopIn = ({ className, word, still = false, firstLetter = 0 }) => (
  <>
    {[...word].map((char, index) => {
      const letter = <span>{char === " " ? " " : char}</span>;
      return (
        <div key={index} className="overflow-hidden inline-block">
          {still ? (
            <div className="overflow-hidden inline-block">
              <div className={className} style={{ "--letter": firstLetter + index }}>{letter}</div>
            </div>
          ) : (
            <PopInComponent className={className}>{letter}</PopInComponent>
          )}
        </div>
      );
    })}
  </>
);

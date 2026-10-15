import { PopInComponent } from "@/components/atoms/PopInComponent.jsx";

/**
 * Pops a phrase in letter by letter; spaces keep their width. Each letter sits in an extra
 * clipping box around PopInComponent's own: the nested inline boxes add the spacing under each
 * line that the section titles' layout is built on.
 */
export const PhrasePopIn = ({ className, word }) => (
  <>
    {[...word].map((char, index) => (
      <div key={index} className="overflow-hidden inline-block">
        <PopInComponent className={className}>
          <span>{char === " " ? " " : char}</span>
        </PopInComponent>
      </div>
    ))}
  </>
);

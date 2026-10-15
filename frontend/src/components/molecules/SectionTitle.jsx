import {PhrasePopIn} from "./PhrasePopIn.jsx";

export const SectionTitle = ({ref, word = "Default Section Title"}) => {
  return (
    <h2 ref={ref} aria-label={word} className="section-anchor flex min-w-0 flex-wrap justify-center items-center text-center">
      <span aria-hidden="true">
        <PhrasePopIn className="typeset-section-title" word={word} />
      </span>
    </h2>
  );
}

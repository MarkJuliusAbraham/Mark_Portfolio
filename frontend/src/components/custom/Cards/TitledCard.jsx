import {PhrasePopIn} from "@/components/custom/Animated/PhrasePopIn.jsx";

export const TitledCard = ({ref, title = "Default Title", children}) => {
  return (
    <div ref={ref} className="section-anchor flex min-w-0 flex-col gap-4 sm:gap-6">
      <h3 aria-label={title}>
        <span aria-hidden="true"><PhrasePopIn word={title} className="typeset-title inline-block"/></span>
      </h3>
      <div>
        {children}
      </div>
    </div>

  );
}

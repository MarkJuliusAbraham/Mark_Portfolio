import {PhrasePopIn} from "@/components/custom/Animated/PhrasePopIn.jsx";

export const NameBanner = ({ nameLines, description }) => {
  return (
    <div className="hero-name">
      <h1 aria-label={nameLines.join(" ")} className="hero-name-heading">
        {nameLines.map((line, index) => (
          <span key={`${line}-${index}`} aria-hidden="true" className="hero-name-line">
            <PhrasePopIn word={line} />
          </span>
        ))}
      </h1>
      {description && <p className="hero-role">{description}</p>}
    </div>
  );
};

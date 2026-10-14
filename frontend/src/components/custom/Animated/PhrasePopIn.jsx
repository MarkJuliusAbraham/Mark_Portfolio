import {PopInComponent} from "@/components/custom/Animated/PopInComponent.jsx";

export const PhrasePopIn = ({className, word}) => {
  return (
    <>
      {[...word].map((char, charIndex) => (
        <div
          key={charIndex}
          className="overflow-hidden inline-block">
          <PopInComponent
            key={charIndex}
            className={className}
          >
            <span>{char === " " ? "\u00A0" : char}</span>
          </PopInComponent>
        </div>
      ))}
    </>
  );
}
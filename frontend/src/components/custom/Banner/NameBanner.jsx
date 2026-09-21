import {FadeInComponent} from "@/components/custom/Animated/FadeInComponent.jsx";
import {PopInComponent} from "@/components/custom/Animated/PopInComponent.jsx";

export const NameBanner = () => {
  const name = "Mark Julius Abraham";

  return (
    <div className="relative min-[1400px]:w-[50%]">
      {/* Small text */}
      <div className="absolute left-0.5 -top-3">
        <FadeInComponent>
          <div className="typeset-mini-text text-gray-600">
            Designer / Developer
          </div>
        </FadeInComponent>
      </div>

      {/* Big text */}
      <div className="typeset-BIG-TEXT flex w-full min-w-0 flex-col items-stretch min-[1000px]:flex-row min-[1400px]:flex-col">
        {name.split(" ").map((word, wordIndex) => (
          <div
            key={wordIndex}
            className="whitespace-nowrap shrink-0 overflow-hidden pr-10"
          >
            {[...word].map((char, charIndex) => (
              <PopInComponent
                key={charIndex}
                className="mr-[-0.06em] inline-block"
              >
                <span>{char}</span>
              </PopInComponent>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}
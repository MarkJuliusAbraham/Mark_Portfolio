import {motion} from "motion/react";
import {FadeInComponent} from "@/components/custom/Animated/FadeInComponent.jsx";

export const ImageBanner = () => {
  return (
    <FadeInComponent
      direction={"right"}
      className="flex justify-end">
      <img
        src="src/img/adam-hamel-MgmfPmixwE4-unsplash.jpg"
        alt="Profile"
        className="object-contain"
      />
    </FadeInComponent>

  )
}
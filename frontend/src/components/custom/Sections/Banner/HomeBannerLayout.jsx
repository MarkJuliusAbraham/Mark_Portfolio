import {NameBanner} from "@/components/custom/Sections/Banner/NameBanner.jsx";
import {ImageBanner} from "@/components/custom/Sections/Banner/ImageBanner.jsx";

export const HomeBannerLayout = ({ref}) => {
  return (
    <div ref={ref} className="flex w-full flex-col gap-10 min-[1400px]:flex-row min-[1400px]:items-center min-[1400px]:gap-6 ">
      {/* Left */}
      <div className="flex h-[65vh] self-center min-[1400px]:h-[60vh] min-[1400px]:w-1/2 min-[1400px]:justify-end">
        <ImageBanner />
      </div>

      {/* Right */}
      <NameBanner />
    </div>


  );
}
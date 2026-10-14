import {NameBanner} from "@/components/custom/Sections/Banner/NameBanner.jsx";
import {ImageBanner} from "@/components/custom/Sections/Banner/ImageBanner.jsx";
import "./hero-banner.css";

export const HomeBannerLayout = ({ ref, profile }) => {
  return (
    <div ref={ref} className="hero-banner">
      <div className="hero-banner-content">
        <NameBanner nameLines={profile.nameLines} description={profile.description} />
        <ImageBanner photo={profile.photo} />
      </div>
    </div>
  );
};

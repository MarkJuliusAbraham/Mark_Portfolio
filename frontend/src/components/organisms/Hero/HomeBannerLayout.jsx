import {NameBanner} from "./NameBanner.jsx";
import {ImageBanner} from "./ImageBanner.jsx";
import {FocusStrip} from "./FocusStrip.jsx";
import "./hero-banner.css";

export const HomeBannerLayout = ({ ref, profile, focusAreas = [], actions = [] }) => {
  return (
    <div ref={ref} className="hero-banner">
      <div className="hero-banner-content">
        <div className="hero-meta" aria-hidden="true">
          <span>{profile.label ?? "Portfolio"}</span>
          <span className="hero-meta-rule" />
          <span>{new Date().getFullYear()}</span>
        </div>
        <NameBanner
          nameLines={profile.nameLines}
          description={profile.description}
          intro={profile.intro}
          actions={actions}
        />
        <ImageBanner photos={profile.photos} />
        {focusAreas.length > 0 && <FocusStrip items={focusAreas} />}
      </div>
    </div>
  );
};

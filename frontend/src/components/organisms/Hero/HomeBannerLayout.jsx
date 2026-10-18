import {NameBanner} from "./NameBanner.jsx";
import {ImageBanner} from "./ImageBanner.jsx";
import {FocusStrip} from "./FocusStrip.jsx";
import "./hero-banner.css";
import "./hero-layouts.css";

/**
 * The home page's hero. `layout` asks for an alternative arrangement (hero-layouts.css), used only
 * where it fits; elsewhere, and without one, the hero keeps its own arrangement.
 */
export const HomeBannerLayout = ({ ref, profile, focusAreas = [], actions = [], layout }) => {
  return (
    <div ref={ref} className="hero-banner" data-layout={layout}>
      <div className="hero-banner-content">
        {/* The header line, name and photo. Where a layout gathers them into one panel (the
            inverse layout on phones, hero-layouts.css) this is that panel; elsewhere it stands as
            if it weren't there, and its pieces sit in the hero's grid directly. */}
        <div className="hero-panel">
          <div className="hero-meta" aria-hidden="true">
            <span>{profile.label ?? "Portfolio"}</span>
            <span className="hero-meta-rule" />
            <span>{new Date().getFullYear()}</span>
          </div>
          <NameBanner
            nameLines={profile.nameLines}
            description={profile.description}
            actions={actions}
          />
          <ImageBanner photos={profile.photos} />
        </div>
        {focusAreas.length > 0 && <FocusStrip items={focusAreas} />}
      </div>
    </div>
  );
};

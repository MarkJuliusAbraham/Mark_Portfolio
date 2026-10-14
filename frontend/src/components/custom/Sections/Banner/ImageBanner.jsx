import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

export const ImageBanner = ({ photo }) => {
  const [failedSource, setFailedSource] = useState(null);
  const showImage = photo?.src && photo.src !== failedSource;

  return (
    <div className="hero-photo-frame">
      {showImage ? (
        <img
          src={photo.src}
          alt={photo.alt ?? "Portrait"}
          className="hero-photo"
          style={{ objectPosition: photo.position ?? "50% 50%", objectFit: photo.fit ?? "cover" }}
          fetchPriority="high"
          decoding="async"
          onError={() => setFailedSource(photo.src)}
        />
      ) : (
        <div className="hero-photo-placeholder" role="img" aria-label="Portrait placeholder">
          <ImageIcon size={32} strokeWidth={1} aria-hidden="true" />
          <span aria-hidden="true">Portrait</span>
        </div>
      )}
    </div>
  );
};

import { CaseStudyMedia } from "@/components/molecules/CaseStudyMedia.jsx";
import painting from "@/assets/tree-references/pink-canopy-painting.png";
import watercolor from "@/assets/tree-references/pink-branching-watercolor.png";
import greenTree from "@/assets/tree-references/stylized-green-tree.png";

const references = [
  { src: painting, width: 1414, height: 1153, name: "painted pink canopy", alt: "Painting of a pink flowering tree with a broad, clustered canopy.", caption: "Painted canopy masses and color." },
  { src: watercolor, width: 1048, height: 1057, name: "watercolor branching", alt: "Watercolor pink tree with visible dark branches and an asymmetrical silhouette.", caption: "Branching and an open silhouette." },
  { src: greenTree, width: 859, height: 960, name: "stylized green tree", alt: "Stylized green 3D tree with broad light and shadow shapes.", caption: "Foliage grouped into light and shadow." },
];

export function TreeReferenceGallery() {
  return (
    <div className="tree-reference-gallery">
      {references.map((media) => <div key={media.name}><CaseStudyMedia media={media} /></div>)}
    </div>
  );
}

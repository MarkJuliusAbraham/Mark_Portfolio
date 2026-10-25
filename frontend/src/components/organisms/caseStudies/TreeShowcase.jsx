import { CaseStudyMedia } from "@/components/molecules/CaseStudyMedia.jsx";
import warmFoliage from "@/assets/tree-showcase/warm-foliage.png";
import shrub from "@/assets/tree-showcase/shrub.png";
import nightLighting from "@/assets/tree-showcase/night-lighting.png";
import fourLeafCanopy from "@/assets/tree-showcase/four-leaf-canopy.png";

const examples = [
  { src: warmFoliage, width: 1465, height: 1251, name: "warm foliage tree", alt: "Tree with orange-red foliage and an enlarged single-leaf silhouette beside it.", caption: "Warm foliage · a branching canopy built from a single-leaf shape" },
  { src: shrub, width: 1390, height: 1402, name: "compact shrub", alt: "Small green and gold shrub beside a preview of its three-leaf card.", caption: "Compact shrub · a different scale and a three-leaf card" },
  { src: nightLighting, width: 963, height: 1063, name: "tree in night lighting", alt: "Tree in Woods under deep red night lighting, illuminated near its base by the player’s light.", caption: "In Woods · seeing the tree under the game’s night lighting" },
  { src: fourLeafCanopy, width: 1341, height: 999, name: "four-leaf canopy", alt: "Pale-trunked tree with muted foliage beside an enlarged four-leaf card preview.", caption: "Another look · a pale trunk and a four-leaf silhouette" },
];

export function TreeShowcase() {
  return (
    <div className="tree-showcase-gallery">
      {examples.map((media) => <div key={media.name}><CaseStudyMedia media={media} /></div>)}
    </div>
  );
}

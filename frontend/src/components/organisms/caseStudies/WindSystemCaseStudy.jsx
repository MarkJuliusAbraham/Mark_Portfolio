import { CaseStudy, ReadingVersions } from "./CaseStudy.jsx";
import { CaseStudyOpening, Separator } from "./CaseStudyOpening.jsx";
import { Plain } from "./Plain.jsx";
import { CaseStudyMedia } from "@/components/molecules/CaseStudyMedia.jsx";
import gustField from "@/img/wind/wind-field-gust.png";
import debugPanel from "@/img/wind/wind-debug-panel.png";
import legacyGrass from "@/gifs/legacy-grass-wind.webp";
import gustViewer from "@/gifs/gust-over-time.gif";
import singleTree from "@/gifs/single-tree-gust.mp4";
import singleTreePoster from "@/gifs/single-tree-gust.jpg";
import "./case-study.css";

// Grounded in Woods: shaders/wind_gust_field.gdshaderinc, wind_noise_field.gdshader,
// wind_response.gdshaderinc, leaves/cel_shading/foliage_shadow_volume.gdshader,
// scripts/World/WindGustSystem.cs and legacy/shaders/grass_wind.gdshaderinc.
// Fig. 01: the wind is calculated once and read by everything that moves.
const pipeline = [
  { name: "Gust timing", made: "When gusts start, how strong they are, which way they blow", by: "WindGustSystem" },
  { name: "Noise field", made: "A 256 × 256 texture of gusts covering the play area", by: "wind_noise_field" },
  { name: "Shader globals", made: "The texture, its position in the world, the wind's direction", by: "ShaderGlobals" },
];

const WindPipeline = () => (
  <figure className="cs-flow-figure" aria-label="Fig. 01: gust timing feeds a noise field texture, published as shader globals and read by trunks, leaves and foliage shadows.">
    <ol className="cs-flow">
      {pipeline.map(({ name, made, by }) => (
        <li key={name} className="cs-flow-stage">
          <b className="cs-flow-name">{name}</b>
          <span className="cs-flow-made">{made}</span>
          <code className="cs-flow-by cs-technical">{by}</code>
        </li>
      ))}
      <li className="cs-flow-stage cs-flow-end">
        <b className="cs-flow-name">Everything that sways</b>
        <span className="cs-flow-made">Trunks, leaves and foliage shadows each look up the wind at their own position</span>
      </li>
    </ol>
  </figure>
);

// How each part of a tree turns the same wind sample into movement.
const treeParts = [
  {
    name: "Trunks and branches",
    file: "cel_shading.gdshader",
    simple: "The trunk bends more the higher it goes, so the base stays planted and the top sways.",
    full: "Each vertex is pushed along the wind by an amount that grows with its height above the tree's base (height² ÷ (2 + height)). The base stays planted, and the top sways the most.",
  },
  {
    name: "Leaves",
    file: "leaves.gdshader",
    simple: "Leaves move with their branch, plus a little extra push of their own.",
    full: "A leaf cluster takes the bend of the wood it sits on, then adds its own push, sampled at the cluster's position. Clusters on different sides of the crown catch slightly different gusts.",
  },
  {
    name: "Foliage shadows",
    file: "foliage_shadow_volume.gdshader",
    simple: "Shadows move with the leaves, so they never drift apart.",
    full: "The shadow volumes use the same leaf offset, so the shadow on the ground moves in step with the canopy above it.",
  },
];

export function WindSystemCaseStudy() {
  return (
    <CaseStudy className="case-study typeset-card-readable">
      <CaseStudyOpening id="wind-system" summary="Wind that moves through a forest, from a gentle breeze to a passing gust.">
        <h1 className="typeset-title">Wind System - One Field for the Whole Forest</h1>
        <p>The wind for <i>Woods</i>, built in Godot with C# and shaders.</p>
        <p>
          A forest that stands perfectly still reads as a set of props. Wind is what makes it feel alive, but a
          forest has thousands of leaves, and every one of them has to move believably, together, and cheaply.
        </p>
      </CaseStudyOpening>
<ReadingVersions overview={<> <section><h2 className="typeset-card-title">A forest that feels alive</h2><p>Watch a gust pass through the trees, then settle.</p><CaseStudyMedia media={{src:gustViewer,width:960,height:682,name:"Forest gust",alt:"Wind moves through a moonlit forest.",caption:"A gust moving through the forest"}} /></section>
<section><h2 className="typeset-card-title">One tree, one gust</h2><p>The base stays planted. Branches, leaves and shadows move together.</p><CaseStudyMedia media={{src:singleTree,poster:singleTreePoster,width:900,height:900,name:"Tree in wind",alt:"A tree sways while its base stays still.",caption:"The crown sways; the base stays put"}} /></section>
<section><h2 className="typeset-card-title">One shared wind map</h2><p>The diagram shows how one map moves the whole forest. Bright areas mean stronger wind; dark areas are calm.</p><WindPipeline /><CaseStudyMedia media={{src:gustField,width:512,height:512,name:"Wind map",alt:"White gust patches separated by dark calm areas.",caption:"White: stronger wind. Black: calm."}} /></section> </>}>


      <section>
        <h2 className="typeset-card-title">Where the Wind Came From</h2>
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The starting point</p>
          <p className="cs-callout-body">The wind started as a sway for the grass, and the trees outgrew it.</p>
        </div>
        <p className="cs-prose">
          <Plain simple="The first version only moved the grass. Every blade worked out its own wind from where it stood and what time it was, which looked fine on short grass.">
            The first version lived in the grass shader. Every blade worked out its own wind from its position in the
            world and the time: a soft value noise drifting in one direction, with a small ripple on top. For short
            grass that was enough.
          </Plain>
        </p>
        <CaseStudyMedia media={{
          src: legacyGrass, width: 720, height: 405, name: "original grass sway",
          alt: "The legacy grass scene: tufts of grass sway together in the wind, bending past a grey block that stands in the field.",
          caption: "The original grass sway · legacy scene, grass tinted slightly for visibility",
        }} />
        <div className="cs-subsection cs-prose">
          <h3 className="typeset-card-title">Why It Didn't Scale to Trees</h3>
          <p>Trees asked more of it in three ways:</p>
          <ul>
            <li><b>Cost.</b> A tree has far more moving points than a blade of grass, and smooth gusts need several layers of noise. Calculating all of them for every leaf, every frame, adds up fast.</li>
            <li><b>Agreement.</b> Trunks, leaves and shadows are drawn by different shaders. If each calculated its own wind, they could drift out of step.</li>
            <li><b>Weather.</b> Grass only needed a constant breeze. Trees needed gusts: wind that builds, passes through and dies down.</li>
          </ul>
        </div>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">One Field Everyone Reads</h2>
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The idea</p>
          <p className="cs-callout-lead">Calculate the wind once, then let everything read it.</p>
        </div>
        <p className="cs-prose">
          <Plain simple="Instead of every leaf working out the wind, the game draws a map of the wind once, as a picture covering the whole play area. Anything that sways just looks up the wind at its own spot on that map.">
            Instead of every vertex computing noise, the gusts are drawn once into a texture that covers the play area.
            The texture and where it sits in the world are published as shader globals, so any shader can look up the
            wind at its own position with a single texture read.
          </Plain>
        </p>
        <WindPipeline />
        <div className="cs-media-pair">
          <CaseStudyMedia media={{
            src: gustField, width: 512, height: 512, name: "wind field texture",
            alt: "The wind field texture rendered from the game's shader at full gust strength: bright, blotchy patches of wind separated by dark calm gaps.",
            caption: "The texture the trees read · rendered from the game's shader",
          }} />
          <div className="cs-prose cs-media-notes">
            <h3 className="typeset-card-title">How to Read It</h3>
            <ul>
              <li><b>White is wind, black is calm.</b> A tree standing on a bright patch bends; one in a dark gap barely moves.</li>
              <li><b>Gusts come in patches.</b> Several layers of noise give each patch a ragged, natural edge instead of a smooth blob.</li>
              <li><b>The gaps are deliberate.</b> Low values are cut to black, so the forest gets real lulls between gusts rather than a constant shimmer.</li>
              <li><b>It covers the play area.</b> One texture spans the whole battlefield, so neighbouring trees always share the same gust.</li>
            </ul>
          </div>
        </div>
        <p className="cs-caption">
          <Plain simple="The map is only redrawn when the wind changes, so a calm forest costs almost nothing.">
            The texture is only redrawn when the wind actually changes: its position, scale or strength.
          </Plain>
        </p>

        <div className="cs-subsection">
          <h3 className="typeset-card-title">Why Use It</h3>
          <div className="cs-media-pair">
            <ul className="cs-prose">
              <li><b>It's cheap.</b> Every vertex does one texture lookup instead of four layers of noise. The shader says it directly: this avoids running the noise for every leaf vertex in the woods.</li>
              <li><b>Everything agrees.</b> Trunks, leaves and shadows all read the same value at the same place, so a gust moves the whole tree at once.</li>
              <li><b>You can see it.</b> The wind is a picture, so the game can show it live: press F4 for the field the trees are using right now, the flow direction and the time to the next gust.</li>
            </ul>
            <CaseStudyMedia media={{
              src: debugPanel, width: 760, height: 776, name: "in-game wind debug preview",
              alt: "The in-game wind debug panel, opened with F4: the live wind field as a black and white map with an arrow showing the flow direction, and the text Next gust 01:19, Gust active, Flow 250 degrees, and White = stronger gust, X/Z map.",
              caption: "In game · F4 opens the live wind preview",
            }} />
          </div>
        </div>

        <div className="cs-subsection cs-prose cs-technical">
          <h3 className="typeset-card-title">Where the Noise Comes From</h3>
          <p>
            The gusts are built from Ashima Arts' 2D simplex noise (by Ian McEwan, maintained by Stefan Gustavson,
            MIT licensed), adapted only for Godot's function names. Four octaves are layered for detail, then shaped with a smoothstep
            so the field reads as distinct gusts with calm gaps between them, rather than a constant shimmer.
          </p>
        </div>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">How the Trees Use It</h2>
        <p className="cs-prose">
          Every part of a tree reads the same wind, but each turns it into a different kind of movement.
        </p>
        <CaseStudyMedia media={{
          src: singleTree, poster: singleTreePoster, width: 900, height: 900, name: "single tree in a gust",
          alt: "One tree seen side-on, with the camera at right angles to the wind, so the tree looks flat and its full height is visible. As the gust passes, the crown sways sideways across the frame while the trunk's base stays planted.",
          caption: "One tree, side-on to the wind · the base stays put, the crown sways",
        }} />
        <ul className="cs-details-grid">
          {treeParts.map(({ name, file, simple, full }) => (
            <li key={name} className="cs-detail">
              <p className="cs-detail-fix">{name}</p>
              <p className="cs-detail-how"><Plain simple={simple}>{full}</Plain></p>
              <p className="cs-detail-adjust typeset-card-toner cs-technical">{file}</p>
            </li>
          ))}
        </ul>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Gusts Over Time</h2>
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The goal</p>
          <p className="cs-callout-lead">Wind that behaves like weather: it builds, passes through and settles.</p>
        </div>
        <p className="cs-prose">
          <Plain simple="Between gusts there's a gentle breeze. Every so often a gust builds up, sweeps through the forest from one side, and dies down again, often from a new direction.">
            Between gusts, a gentle breeze keeps the forest moving at about a third of full strength. Every 35 to 85
            seconds a gust begins: it builds over two seconds, lasts 6 to 18 seconds, and fades over three. Its
            direction swings smoothly to a new heading rather than snapping.
          </Plain>
        </p>
        <p className="cs-prose">
          <Plain simple="The wind map also slides across the world, so you can watch a gust travel through the trees instead of every tree moving at once.">
            The noise field also slides across the world in the wind's direction, faster during a gust. That's what
            lets you watch a gust travel through the forest instead of every tree moving in unison.
          </Plain>
        </p>
        <CaseStudyMedia media={{
          src: gustViewer, width: 960, height: 682, name: "gust passing through the trees",
          alt: "A moonlit stand of trees seen from above in the gust viewer, with the F4 wind panel open beside it. During the gust the canopies sway along the flow shown by the panel's arrow, then settle as the panel switches back to Gentle breeze.",
          caption: "One gust, start to finish · the F4 panel counts down while the trees respond",
        }} />
        <p className="cs-prose cs-technical">
          Timing is stepped in small, fixed slices, so a slow frame can't skip past the start of a gust or make the
          easing jump. A seed makes a run's wind repeatable.
        </p>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <div className="cs-subsection cs-prose cs-conclusions">
          <h3 className="typeset-card-title">Conclusions</h3>
          <div className="cs-callout">
            <p className="cs-callout-label typeset-card-toner">Conclusion</p>
            <p className="cs-callout-body">
              <Plain simple="Working out the wind once and sharing it made it cheaper, kept every part of a tree moving together, and made the wind something you can actually see and tune.">
                Moving the wind out of individual shaders and into one shared field made it cheaper, kept every part
                of a tree in step, and turned the wind into something that can be seen and tuned rather than guessed at.
              </Plain>
            </p>
          </div>
        </div>
      </section>
    </ReadingVersions>
    </CaseStudy>
  );
}

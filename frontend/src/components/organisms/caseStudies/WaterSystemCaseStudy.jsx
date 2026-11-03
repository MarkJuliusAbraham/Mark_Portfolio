import { CaseStudy, ReadingVersions } from "./CaseStudy.jsx";
import { CaseStudyOpening, Separator } from "./CaseStudyOpening.jsx";
import { Plain } from "./Plain.jsx";
import { CaseStudyMedia } from "@/components/molecules/CaseStudyMedia.jsx";
import viewerMap from "@/img/water/river-viewer-map.jpg";
import debugPanel from "@/img/water/water-debug-panel.png";
import debugViews from "@/gifs/water/river-debug-views.mp4";
import debugViewsPoster from "@/gifs/water/river-debug-views.jpg";
import profileLive from "@/gifs/water/river-profile-live.mp4";
import profileLivePoster from "@/gifs/water/river-profile-live.jpg";
import reflection from "@/gifs/water/river-reflection.mp4";
import reflectionPoster from "@/gifs/water/river-reflection.jpg";
import leaves from "@/gifs/water/river-leaves.mp4";
import leavesPoster from "@/gifs/water/river-leaves.jpg";
import bank from "@/gifs/water/river-bank.mp4";
import bankPoster from "@/gifs/water/river-bank.jpg";
import torch from "@/gifs/water/river-torch.mp4";
import torchPoster from "@/gifs/water/river-torch.jpg";
import "./case-study.css";

// Grounded in Woods: shaders/river.gdshaderinc, scripts/World/RiverProfile.cs, RiverReflection.cs,
// RiverViewer.cs, scripts/Rendering/RiverNoiseTexture.cs, scripts/World/FallingLeafEmitter.cs,
// shaders/falling_leaf_ripple.gdshader and scripts/UI/WaterDebugPanel.cs. Media is captured from the
// river viewer (scenes/tools/river_viewer.tscn).
export function WaterSystemCaseStudy() {
  return (
    <CaseStudy className="case-study typeset-card-readable">
      <CaseStudyOpening id="water-system" summary="Rivers that mirror the forest above them and ripple where leaves land.">
        <h1 className="typeset-title">Water Systems - Rivers for the Woods</h1>
        <p>The rivers of <i>Woods</i>, built in Godot with C# and shaders.</p>
        <p>
          Water in a dark forest is mostly about what it gives back: the trees above it, the light that reaches it,
          and the small disturbances that tell you it is water at all.
        </p>
      </CaseStudyOpening>

      <ReadingVersions overview={<>
        <section>
          <h2 className="typeset-card-title">A mirror in the dark</h2>
          <p>The river reflects the trees and people standing over it.</p>
          <CaseStudyMedia media={{src:reflection,poster:reflectionPoster,width:1280,height:720,name:"River reflection",alt:"A tree standing over a pond, mirrored upside down in the water.",caption:"The tree above, mirrored below"}} />
        </section>
        <section>
          <h2 className="typeset-card-title">Leaves on the water</h2>
          <p>Falling leaves land on the river and send rings across it.</p>
          <CaseStudyMedia media={{src:leaves,poster:leavesPoster,width:1280,height:720,name:"Leaves on the water",alt:"Leaves drift down from a tree and land on a pond, each sending out small rings.",caption:"Each leaf that lands sends out rings"}} />
        </section>
      </>}>

      <section>
        <h2 className="typeset-card-title">One Profile for Every River</h2>
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The idea</p>
          <p className="cs-callout-lead">
            <Plain simple="Every river in the game gets its look from one settings file, edited live in a viewer.">
              Every river's look lives in one profile, and the editor and the game read the same file.
            </Plain>
          </p>
        </div>
        <p className="cs-prose">
          <Plain simple="The water, its ripples, the current and the banks are all set in one place. A viewer shows rivers of every shape while you change them, and saving there changes the game's rivers too.">
            A river profile holds everything about the water: its ripples, the current, the banks and how water and bank
            meet. Each setting is a uniform in the river shader. The river viewer draws a map of flowing and still
            formations with that profile open in the inspector, so every change shows live, and saving it changes the
            game's rivers too.
          </Plain>
        </p>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">The River Viewer</h2>
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The tool</p>
          <p className="cs-callout-lead">
            <Plain simple="A workshop for rivers: every kind of river on one map, changing as you tune it.">
              A workshop for the water: every river formation on one map, redrawn live as the profile changes.
            </Plain>
          </p>
        </div>
        <p className="cs-prose">
          <Plain simple="The viewer lays out fifteen kinds of river, from a trickle to a lake, so one change can be judged everywhere at once. A tree and a figure stand by each one to check reflections, and the lighting switches between bright and the game's night.">
            The viewer lays out fifteen formations side by side: straight, winding and sharp-cornered rivers, wide water
            and a one-tile trickle, forks, joins, an island, a dead end, a lake, and still water with no current. One
            change to the profile can be judged on all of them at once. A tree and a person-sized figure stand across the
            water at each formation to judge reflections, and their leaves fall onto it. The camera can focus on any
            single formation, and the lighting switches between bright and the game's own night.
          </Plain>
        </p>
        <CaseStudyMedia media={{
          src: viewerMap, width: 1600, height: 900, name: "river viewer map",
          alt: "The river viewer seen from above: fifteen labelled river formations laid out on one grassy map, from narrow winding rivers to a lake, with a tree and a figure beside each.",
          caption: "The river viewer · fifteen formations on one map",
        }} />
        <div className="cs-subsection cs-prose">
          <h3 className="typeset-card-title">Seeing What a Setting Works From</h3>
          <p>
            <Plain simple="Debug views swap the water's look for the data behind it, like how far each spot is from the shore or which way the water flows.">
              Debug views replace the look with the data behind it: distance to the bank, flow direction, where the
              current presses against a bank and where a bank shelters it, and water speed.
            </Plain>
          </p>
          <CaseStudyMedia media={{
            src: debugViews, poster: debugViewsPoster, width: 1280, height: 720, name: "river debug views",
            alt: "The same river around an island shown five ways in turn: its normal look, then as distance to the bank, flow direction, impact and shelter, and water speed.",
            caption: "Look · distance to bank · flow direction · impact and shelter · water speed",
          }} />
        </div>
        <div className="cs-subsection cs-prose">
          <h3 className="typeset-card-title">Edited Live, Saved for the Game</h3>
          <p>
            <Plain simple="Every change shows straight away, and saving it changes the rivers in the game itself.">
              The profile opens right in the inspector and every change redraws immediately. Because it is the same file
              the game's floors draw from, saving the look changes the game's rivers too.
            </Plain>
          </p>
          <CaseStudyMedia media={{
            src: profileLive, poster: profileLivePoster, width: 1280, height: 720, name: "adjusting the profile live",
            alt: "A river around an island as one profile setting changes: the pale shallow band along its banks widens across the water and narrows again.",
            caption: "Shallow width changing in the profile · every formation redraws as it moves",
          }} />
        </div>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Water That Knows Its Banks</h2>
        <p className="cs-prose">
          <Plain simple="The water knows how far it is from the shore everywhere, so it can run faster through narrow gaps, slow down in wide pools, and foam where it meets the bank.">
            The floor supplies one value per tile: how far it is from the nearest bank. From that the shader speeds the
            current up through narrows and slows it in wide spots, drags it against the banks, and draws what happens
            where water meets land: foam, lines lapping in toward the shore, and a waterline rising and falling on the
            bank's face.
          </Plain>
        </p>
        <CaseStudyMedia media={{
          src: bank, poster: bankPoster, width: 1280, height: 720, name: "water along the banks",
          alt: "A river turning a sharp corner: streaks of current run along it, with foam and thin lapping lines along both banks.",
          caption: "A sharp corner · current, foam and lapping lines along the banks",
        }} />
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Ripples That Only Catch Light</h2>
        <p className="cs-prose">
          <Plain simple="The ripples have no colour of their own. They only show where light reaches them, so in the dark the water goes still and quiet.">
            The ripples are raised shapes with no colour of their own: they only catch whatever light reaches them, so
            they vanish in the dark and appear around a torch. They are hard-edged like the rest of the game's
            lighting, and stretched into streaks along the current. Still water can keep its ripples or lie flat.
          </Plain>
        </p>
        <CaseStudyMedia media={{
          src: torch, poster: torchPoster, width: 1280, height: 720, name: "ripples under torchlight",
          alt: "A river at night, dark and flat, as a torch moves along its bank: ripples light up inside the torch's glow and vanish again outside it.",
          caption: "At night · ripples show only inside the torch's light",
        }} />
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Reflections</h2>
        <p className="cs-prose">
          <Plain simple="To mirror the forest, the game draws the scene a second time, upside down, and the water shows that picture. When nothing stands over the water, it skips the extra work.">
            The river mirrors trees, people and anything else standing above it. A second camera, flipped across the
            water's height, draws the world without its ground or grass into a texture, and the ground's shader looks up
            each pixel of water in it. That means drawing the scene twice, so it stops when there is nothing to mirror.
          </Plain>
        </p>
        <CaseStudyMedia media={{
          src: reflection, poster: reflectionPoster, width: 1280, height: 720, name: "a tree and its reflection",
          alt: "A tree and a figure standing at the edge of a pond, both mirrored in the water below them.",
          caption: "A tree and a figure, mirrored by the second camera",
        }} />
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Leaves on the Water</h2>
        <p className="cs-prose">
          <Plain simple="Leaves fall from the trees, and where they land on the river, rings spread out and bounce off the banks.">
            Falling leaves come from one particle system per tree type, dropping only near the camera within a fixed
            budget. Where a leaf lands on water, hard-edged rings spread out and thin away. Like the water's own ripples
            they only catch light, they stop exactly where the water does, and they bounce back off a bank.
          </Plain>
        </p>
        <CaseStudyMedia media={{
          src: leaves, poster: leavesPoster, width: 1280, height: 720, name: "leaves landing on the water",
          alt: "Leaves fall from a tree onto a pond; where each lands, hard-edged rings spread out and thin away.",
          caption: "Leaves landing · rings spread and thin away",
        }} />
      </section>

      <Separator className="cs-separator-section cs-technical" />
      <section className="cs-technical">
        <h2 className="typeset-card-title">Seeing the Layers</h2>
        <p className="cs-prose">
          The water debug panel takes a floor's water apart: the shader drawing it, as an image and by name, and each
          layer of the look with the file that draws it and a switch to turn it off. It reads the live floor and
          profile, and its switches only touch the running scene, never the profile.
        </p>
        <CaseStudyMedia media={{
          src: debugPanel, width: 718, height: 998, name: "water debug panel",
          alt: "The in-game water debug panel, opened with F4: an image of the river tiles drawn by terrain.gdshader, then a list of the water's layers, from water color and ripples to reflections and landing rings, each with a checkbox, its state and the files that draw it.",
          caption: "In game · F4 opens the water shaders section",
        }} />
      </section>

      </ReadingVersions>
    </CaseStudy>
  );
}

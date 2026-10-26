import { CaseStudy, ReadingVersions } from "./CaseStudy.jsx";
import { CaseStudyOpening, Separator } from "./CaseStudyOpening.jsx";
import { Plain } from "./Plain.jsx";
import { CaseStudyMedia } from "@/components/molecules/CaseStudyMedia.jsx";
import { TreeVariantViewer } from "./TreeVariantViewer.jsx";
import { TreeReferenceGallery } from "./TreeReferenceGallery.jsx";
import { TreeShowcase } from "./TreeShowcase.jsx";
import leafControls from "@/gifs/tree-viewer-leaf-controls.png";
import branchControls from "@/gifs/tree-editor-branches.png";
import branchProfileRecording from "@/gifs/tree-branch-profile.gif";
import leafProfileRecording from "@/gifs/tree-leaf-profile.gif";
import forestProfiles from "@/gifs/tree-editor-forest-profiles.png";
import lookControls from "@/gifs/tree-editor-look.png";
import "./case-study.css";
import "./tree-systems.css";

// Editorial reference: src/content/tree-systems.md. Update the Markdown first when revising
// page copy, then apply those edits here; Markdown is not rendered automatically.
const controls = [
  ["Trunk & branches", "Length, thickness, fork count, spread, taper and bend.", "The silhouette and structure of the tree."],
  ["Leaf puffs", "Group nearby twig tips and control each cluster’s size.", "Where foliage gathers, and how full it feels."],
  ["Leaf cards", "Size, density, scatter and camera-facing behavior.", "How small flat surfaces fill out each puff."],
  ["Leaf shape", "Leaf count, fan, width, widest point and tip sharpness.", "The cut-out silhouette on each card."],
  ["Look", "Color, shading bands, variation and crown influence.", "How those shapes read under the game’s lighting."],
];

export function TreeSystemsCaseStudy() {
  return (
    <CaseStudy className="case-study tree-case-study typeset-card-readable">
      <CaseStudyOpening id="tree-systems" summary="Make different trees, adjust their shapes, and see them in the game.">
        <h1 className="typeset-title tree-case-title">Tree Systems - Designing Unfamiliar Systems with the AI Tools</h1>
        <p>A procedural tree system and an authoring tool for <i>Woods</i>, built in Godot with C# and shaders.</p>
        <p>
          When this project was started, the goal was to create a basic Tree using AI. However, my experience
          developing systems quickly pushed me to use the AI to create a Tree System rather than requesting
          for a completely usable tree mesh. I find that requesting for the final product is the trap that
          results in "AI-Slop". The proccess of creation is itself an art, and rapidly creating the tools with
          AI helps you engage in that proccess much sooner.
        </p>
        <p>
          In short, AI helps build the machinery; the tool gives me a way to inspect it and make the visual decisions myself.
        </p>
      </CaseStudyOpening>
<ReadingVersions overview={<> <section><h2 className="typeset-card-title">From references to trees</h2><p>A few of the shapes and styles that inspired the project.</p><TreeReferenceGallery /></section>
<section><h2 className="typeset-card-title">Choose a tree. Explore its shape.</h2><p>Compare ages and variations. Turn overlays on to see the leaf clusters underneath.</p><TreeVariantViewer /></section>
<section><h2 className="typeset-card-title">Shape it live</h2><p>Branch controls change the silhouette; leaf controls change how full it feels.</p><CaseStudyMedia media={{src: branchProfileRecording, width:1600,height:637,name:"Branch shapes",alt:"Branch settings change the tree live.",caption:"Changing the branches"}} /><CaseStudyMedia media={{src: leafProfileRecording,width:1600,height:685,name:"Leaf clusters",alt:"Leaf spacing and size change the canopy live.",caption:"Filling out the canopy"}} /></section>
<section><h2 className="typeset-card-title">In the game</h2><p>The same trees, seen in Woods.</p><TreeShowcase /></section> </>}>


      <section>
        <h2 className="typeset-card-title">Preparation</h2>
        <p className="cs-prose">
          It's always good to prepare yourself before engaging with a task. For this project, I used Claude
          to source information on how tree-systems are created online. For myself, I searched for inspiration
          on what distinct look of trees I wanted to be able to depict with the potential system I will be
          creating. The goal was to create a Tree System that works with Cell Shading.
        </p>
        <p className="cs-prose">
          I gathered references from paintings, 3D models, trees in games, and sketches.
          These are just a few examples from that broader collection.
        </p>
        <TreeReferenceGallery />
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Turning the References into Branching Rules</h2>
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">From inspiration to rules</p>
          <p className="cs-callout-body">The references gave me a visual direction. A profile gave me a way to turn that direction into rules I could adjust.</p>
        </div>
        <p className="cs-prose">
          To work toward the shapes in the references, I needed control over the structure underneath the leaves. Branch length, spread, taper and bend let me work on the silhouette directly. Saving those decisions in a profile also meant I could explore different individuals without losing the character of a tree type.
        </p>
        <CaseStudyMedia media={{
          src: branchControls, width: 2000, height: 1020,
          name: "Branch generation inspector",
          alt: "Godot editor showing the mature tree profile with Branches expanded: depth, fork count, spread, branch length, radius, shrink, taper and lean controls beside the generated tree.",
          caption: "Mature profile · branch rules in the Godot inspector beside their generated result",
        }} />
        <div className="cs-subsection">
          <h3 className="typeset-card-title">Tree structure dictates a lot of the look</h3>
          <p className="cs-prose">
            Most trees follow the same structure with variations on some parameters that gives them their
            final look. All we do is try to capture what those parameters are, and place them in the Godot Editor.
          </p>
          <p className="cs-prose">
            <code>BareTreeMesh</code> builds a tapering trunk and branching limbs. Forks become thinner and
            shorter until the depth or minimum twig radius ends their growth. Nearby twig tips are then
            grouped into puffs, which are filled with leaf cards. Most trees follow the same rules due to
            the underlying physics in the real world that promotes this structure. With that said, we're
            also <em>free</em> to break those rules as much as we want since we dictate what the parameters are.
          </p>
          <CaseStudyMedia media={{
            src: branchProfileRecording, width: 1600, height: 637,
            name: "Live branch profile adjustment",
            alt: "Recording of the aged tree profile being adjusted in Godot. With leaves hidden, the branching structure updates live as the branch settings change.",
            caption: "Adjusting the branch profile live · Leaves hidden to reveal changes to the tree’s structure",
          }} />
          <p className="cs-prose tree-media-following">
            The geometry and shading have different jobs. Cards supply the leafy silhouettes; puff and crown
            volumes supply the smooth shading directions. That separation makes it possible to tune a crisp
            leaf outline without forcing every card to look like a separately lit flat surface.
          </p>
          <p className="cs-prose cs-technical">
            More detail has a cost. Fork depth multiplies the amount of branching, and card density increases
            foliage geometry. In the forest, a limited set of generated meshes is reused with different rotations
            and scales, rather than building a unique mesh for every placed tree.
          </p>
        </div>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Understanding What Makes the Foliage Read as a Tree</h2>
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The goal</p>
          <p className="cs-callout-lead">Controlling the branches gave me a structure to work with. Understanding the foliage meant making its hidden shapes visible too.</p>
        </div>
        <p className="cs-prose">
          Adding leaves brings the silhouette and the shading together, which makes it harder to tell what needs adjusting. I needed to see how the smaller foliage clusters contributed to the whole canopy. The viewer exposes those relationships through debug overlays. Below, compare young, mature and aged trees with the overlays on and off to see the construction behind the finished appearance.
        </p>
        <TreeVariantViewer />
        <dl className="tree-debug-key">
          <div>
            <dt><span className="tree-volume tree-volume-puff" aria-hidden="true" />Puffs · local foliage clusters</dt>
            <dd><Plain simple="The small blue spheres show the groups of leaves. Each group is lit as one rounded volume.">
              Nearby twig tips share a puff. The shader uses its sphere as a stand-in surface for shading,
              so many flat leaf cards read as one rounded cluster.
            </Plain></dd>
          </div>
          <div>
            <dt><span className="tree-volume tree-volume-crown" aria-hidden="true" />Crown · the overall canopy</dt>
            <dd><Plain simple="The larger pink sphere gives the whole canopy a shared direction for its shading.">
              A larger stand-in sphere supplies the crown’s overall shading direction. Crown influence blends
              that direction with each puff’s, tying the clusters into a single canopy.
            </Plain></dd>
          </div>
          <div>
            <dt><span className="tree-volume tree-volume-leaf" aria-hidden="true" />Leaf Shape · the card’s cut-out</dt>
            <dd>The enlarged green shape shows one leaf card up close. Its outline can be judged separately
              from the thousands of small shapes that make up the tree; the square marks where the card clips it.</dd>
          </div>
        </dl>
        <div className="cs-prose cs-subsection">
          <h3 className="typeset-card-title">Turning a Visual Question into Something I Can Inspect</h3>
          <p>
            This gave me a way to connect a visual judgment to a part of the implementation. If a canopy feels too round, I can inspect puff placement and crown influence. If its edge feels wrong, I can look at the leaf shape. Those are specific questions I can investigate with AI, using the preview to judge the answer.
          </p>
        </div>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Finding the Look through Experimentation</h2>
        <p className="cs-prose">
          With those relationships visible, I could use the viewer to explore the look itself. Instead of describing a finished tree in another prompt, I could adjust one part, watch the result, and decide what to change next. The canopy and the individual leaf needed attention at different scales.
        </p>
        <CaseStudyMedia media={{
          src: leafControls, width: 1800, height: 733,
          name: "Leaf shape authoring controls",
          alt: "The Woods tree viewer with the Leaf Shape inspector expanded, showing controls for count, fan, angle jitter, length, width, length variation, widest point, tip sharpness and start. An enlarged leaf card sits beside the debug canopy.",
          caption: "Leaf Shape · the profile’s controls beside the enlarged card preview",
        }} />
        <div className="cs-subsection">
          <h3 className="typeset-card-title">Adjusting the Fullness of the Canopy</h3>
          <p className="cs-prose">
            At the canopy scale, I could experiment with how foliage gathers around the branches. In this recording, changing puff spacing and radius changes the distribution and fullness live. That feedback lets me judge the shape while working on it, rather than waiting for a new generated result.
          </p>
          <CaseStudyMedia media={{
            src: leafProfileRecording, width: 1600, height: 685,
            name: "Live leaf puff adjustment",
            alt: "Recording of the aged tree in Godot as puff spacing and radius are adjusted. The foliage clusters change size and distribution while the tree updates live.",
            caption: "Shaping the canopy live · adjusting leaf puff spacing and radius",
          }} />
        </div>
        <div className="cs-subsection cs-prose">
          <h3 className="typeset-card-title">Looking Closer at a Single Leaf</h3>
          <p>
            A leaf is too small to judge reliably in a full tree. The enlarged preview makes width, fan,
            tip sharpness and the position of the widest point visible at a useful scale. It uses the same
            leaf-shape shader include as the foliage, so the preview and the tree share the actual cut-out logic.
          </p>
          <p>
            Together, these views gave me a practical way to work from the references: adjust the larger masses, inspect the smaller shapes, and compare the whole tree again. AI helped with the implementation, while the tool let me make those visual decisions myself.
          </p>
        </div>
        <div className="tree-controls-reference cs-technical">
          <table>
            <caption>What each part of the profile controls</caption>
            <thead><tr><th scope="col">Part</th><th scope="col">Parameters</th><th scope="col">Visual decision</th></tr></thead>
            <tbody>{controls.map(([part, parameters, decision]) => (
              <tr key={part}><th scope="row">{part}</th><td>{parameters}</td><td>{decision}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Taking the Trees Back into Woods</h2>
        <p className="cs-prose">A tree in the viewer is only part of the goal; it also has to belong in Woods. The saved profiles connect those two contexts. Young, mature and aged trees, along with shrubs, have their own profiles, while seeds and variants produce different individuals within each type.</p>
        <p className="cs-prose">
          The viewer edits the same <code>TreeProfile</code> resources that the forest and bushes use.
          Saving a profile writes its <code>.tres</code> file. The game builds its trees from those settings,
          so there is no separate set of tree values to copy across by hand.
        </p>
        <CaseStudyMedia media={{
          src: forestProfiles, width: 2000, height: 1020,
          name: "Forest profile assignments",
          alt: "Godot's main scene with the Trees node selected. The forest fills the viewport and the TreeScatter inspector assigns young.tres, mature.tres and aged.tres, alongside age weights and variants per age.",
          caption: "Game scene · TreeScatter uses young.tres, mature.tres and aged.tres to populate the forest",
        }} />
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The boundary</p>
          <p className="cs-callout-body">Tree settings belong to the profile. Camera position, preview lighting and debug overlays belong to the viewer.</p>
        </div>
        <p className="cs-prose">
          The torch, canopy light and ambient fill help judge the tree under the game’s night lighting.
          They stage the preview; they do not become part of the tree recipe. That keeps an experiment with
          the camera or lighting separate from a change to the trees themselves.
        </p>
        <p className="cs-prose cs-technical">
          Resource bindings listen for profile changes, and tree regeneration is deferred so a slider can
          request multiple changes while the viewer rebuilds at most once per frame. The forest also tracks
          profile changes while its scene tab is away and rebuilds when it returns.
        </p>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">What I Can Make with the System So Far</h2>
        <p className="cs-prose">
          These are some of the trees and shrubs I have achieved using the system. The earlier controls
          come together here: branching gives each plant its structure, while leaf shape, foliage
          distribution and color give it a different character.
        </p>
        <p className="cs-prose">
          Seeing these results beside each other brings the project back to the references I started with.
          The system is still in its infancy, but I now have a way to explore those ideas myself and see
          how the trees read both in the viewer and in Woods.
        </p>
        <TreeShowcase />
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">What I Want to Explore Next</h2>
        <p className="cs-prose">
          These results give me a starting point to build on. The next features I want to explore are:
        </p>
        <ul className="tree-future-features cs-prose">
          <li><strong>Flowers.</strong> Add flowers to the trees.</li>
          <li><strong>Better light interaction.</strong> Improve how the trees respond to light.</li>
          <li><strong>Falling leaves.</strong> Explore falling leaves through a shader.</li>
        </ul>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">What This Changed about Working with AI</h2>
        <p className="cs-prose">
          The project began with the goal of making a tree using AI. The more useful result was a way to keep designing trees. Research gave me concepts to work with; branch controls, debug volumes and leaf previews made those concepts something I could inspect and change.
        </p>
        <p className="cs-prose">The working loop became more concrete: choose a visual question, expose the part of the system behind it, and judge the change in the viewer. The Look controls bring color and shading into that same loop, alongside the structure and leaf shape.</p>
        <CaseStudyMedia media={{
          src: lookControls, width: 2000, height: 1020,
          name: "Appearance inspection in Godot",
          alt: "The actual Godot tree viewer with the mature tree and debug volumes beside its Look inspector: bark and leaf colors, jitter, crown influence, occlusion, translucency and leaf shading controls.",
          caption: "Inspect and judge · appearance controls and debug volumes share the same editor view",
        }} />
        <p className="cs-prose cs-technical tree-media-following">
          Visual judgment still needs technical checks. Woods includes verification scripts for foliage
          shadows, lighting materials and wind behavior. For example, the foliage-shadow check compares a lit
          scene with the same scene under a solid blocker. That tests a rendering behavior separately from
          whether the tree looks good. These are checks in the project, not benchmark results claimed here.
        </p>
        <div className="cs-subsection cs-prose cs-conclusions">
          <h3 className="typeset-card-title">Conclusions</h3>
          <p>
            The references remain a direction to work toward, and the system, which is pretty much still
            in its infancy, gives me a way to keep working toward it.
          </p>
          <p>
            I can change the rules, judge the result and carry those creative decisions myself.
          </p>
          <blockquote>“Build the system that makes the output.”</blockquote>
        </div>
      </section>
    </ReadingVersions>
    </CaseStudy>
  );
}

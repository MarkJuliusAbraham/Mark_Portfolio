import { CaseStudy, ReadingVersions } from "./CaseStudy.jsx";
import { useId, useState } from "react";
import "./case-study.css";
import { CaseStudyOpening, Separator } from "./CaseStudyOpening.jsx";
import { Plain } from "./Plain.jsx";
import { SwapLabel } from "./SwapLabel.jsx";
import { HintCue, HintProvider, Term } from "./Hints.jsx";
import { CaseStudyMedia } from "@/components/molecules/CaseStudyMedia";
import trackingHubImage from "@/img/computer-vision/tracking-hub.png";
import debuggingImage from "@/gifs/hand-diagnostics.gif";
import cameraImage from "@/gifs/camera-preview.webp";
import overlayImage from "@/gifs/desktop-overlay.webp";
import manualImage from "@/gifs/manual-gesture.gif";
import settingsImage from "@/img/computer-vision/hand-settings.png";
import mappingImage from "@/img/computer-vision/gesture-mapping.png";
import profilesImage from "@/img/computer-vision/gesture-profiles.png";
import invokerImage from "@/img/computer-vision/invoker-profile.png";
import youtubeImage from "@/img/computer-vision/youtube-profile.png";
import repeatImage from "@/img/computer-vision/repeat-commands.png";
import resetImage from "@/img/computer-vision/universal-reset.png";

const applicationScreenshots = {
  manual: { src: manualImage, width: 1528, height: 1086, name: "manual gesture definition", alt: "The Invoke gesture's hand criteria in the Invoker profile. Use checklist switches the finger dropdowns to a grid of six positions per finger, from Straight through Partial, Curled, Very Curled and Nearly Closed to Closed. Ticking Curled for the thumb adds it to the allowed positions, and Discard changes and Save mappings become available.", caption: "Manual definition · Allowed finger positions picked from the checklist" },
  overlay: { src: overlayImage, width: 1260, height: 492, name: "desktop overlay", alt: "The hand-tracking overlay floating over Dota 2. In the overlay settings, the background opacity is lowered and the overlay is dragged into place; when the settings close, the translucent overlay stays on top of the game, showing each hand's status, palm, gesture, command and finger bars.", caption: "Desktop overlay · Opacity and position set live, then left over the game" },
  reset: { src: resetImage, width: 1300, height: 727, name: "universal reset settings", alt: "Universal reset settings: stops queued commands, clears the drawing, and re-arms gesture input, applying to every gesture in the profile. Its hand criteria are palm orientation Any, thumb Any position, and the index, middle, ring and pinky fingers Curled through Closed.", caption: "Universal reset · A loose fist re-arms every gesture in the profile" },
  repeats: { src: repeatImage, width: 1152, height: 565, name: "repeat commands settings", alt: "Repeat Commands settings for a gesture, with Apply to all gestures checked. The repeat trigger is Distance: 6% per repeat, a limit of 3 times and 25 ms between repeats, with axis weights X 1, Y 0 and Z 0, so only side-to-side movement counts.", caption: "Repeat commands · Distance trigger, limit, delay and axis weights" },
  camera: { src: cameraImage, width: 834, height: 456, name: "camera preview", alt: "The mirrored camera preview while making gestures. Each finger's joints are drawn in its own colour, the top-left corner lists the fingers up, the palm's direction and each finger's bend in degrees, fingertip paths trail behind the moving fingers, and an Invoker spell icon appears in the bottom-right corner after a command is sent.", caption: "Camera preview · Landmarks, finger readouts, fingertip paths and command feedback" },
  hub: { src: trackingHubImage, width: 1260, height: 874, name: "tracking hub", alt: "Tracking hub with Camera 1 streaming and a hand-tracking workspace available to open.", caption: "Tracking hub · Camera controls and workspace selection" },
  debugging: { src: debuggingImage, width: 1548, height: 1196, name: "debugging panel", alt: "Hand-tracking debugging panel updating live: the left hand is detected, its palm turns toward and away from the camera, its gesture and command change, and the finger deviation bars and classes (straight, curled, closed) move as the fingers bend. The right hand is not detected.", caption: "Debugging · Model controls and Live Gesture Data" },
  settings: { src: settingsImage, width: 1545, height: 1107, name: "hand-tracking settings", alt: "Hand-tracking settings with model selection, finger deviation ranges, hysteresis, optimistic tracking options, and Apply and Discard changes controls.", caption: "Settings · Workspace-wide tracking and recognition configuration" },
  mapping: { src: mappingImage, width: 1542, height: 1096, name: "mapping panel", alt: "Mapping panel showing the Invoker Profile, its gesture list, palm and finger criteria, profile management, and Save mappings controls.", caption: "Mapping · Gesture criteria, command mappings, and profiles" },
  profiles: { src: profilesImage, width: 1069, height: 859, name: "gesture profile options", alt: "Gesture profiles dialog with a profile folder, Create profile button, and Earthshaker, Invoker, Juggernaut, and YouTube profiles. Invoker is active while Earthshaker is selected for confirmation.", caption: "Gesture profiles · Create, select, and activate different mappings" },
};

// Project overview grounded in ComputerVisionBasics/hand-tracking (docs/architecture.md and
// docs/functionality_diagrams.md). Media slots stay labelled until recordings are available.
const Placeholder = ({ label, ratio = "16 / 9" }) => (
  <figure className="cs-placeholder" style={{ aspectRatio: ratio }} aria-label={`Placeholder: ${label}`}>
    <figcaption className="typeset-card-toner">{label}</figcaption>
  </figure>
);

// One gesture's trip from the camera to another application. Each stage is what the system knows at
// that point, the step that produces it, and the class that does the work.
const stages = [
  { name: "Camera", made: "Live video", by: "Camera", simple: "Your webcam films your hand." },
  { name: "Find the hand", made: "21 joint positions per hand", by: "HandLandmarkerSession · MediaPipe", simple: "A model finds the joints of each hand." },
  { name: "Read the pose", made: "Each finger's bend, the palm's direction", by: "Detector", simple: "Each finger is read as straight, curled or closed." },
  { name: "Match a gesture", made: "The matched gesture and its keys", by: "GestureHandler", simple: "The pose is compared with your saved gestures." },
  { name: "Press the keys", made: "Key presses, releases and delays", by: "CommandExecutor · InputSimulator", simple: "The gesture's keys are pressed for you." },
];

const arrowHints = [
  {
    term: "Camera → Find the hand",
    definition: (
      <Plain simple="The webcam keeps filming, and a hand-tracking model finds the joints of each hand. The app never waits on the model: it uses the most recent answer it has, so everything stays responsive.">
        The camera captures on its own worker thread and keeps only the latest frame. MediaPipe's Hand
        Landmarker runs asynchronously: each tick submits a new frame and reads back the most recent finished
        result, which may belong to an earlier frame. Nothing blocks waiting on inference.
      </Plain>
    ),
  },
  {
    term: "Find the hand → Read the pose",
    definition: (
      <Plain simple="Each finger is sorted into a simple category, from straight to closed, and the palm is read as facing the camera or not.">
        The Detector measures how far each finger deviates from straight and sorts it into a band, from
        straight through curled to closed, and reads the palm's direction: a <code>GestureState</code>. An
        optional One Euro filter steadies noisy landmarks, and hysteresis stops a finger near a threshold
        flickering between bands.
      </Plain>
    ),
  },
  {
    term: "Read the pose → Match a gesture",
    definition: (
      <Plain simple={'A gesture is a rule over those categories, like "index straight, the rest closed, palm facing the camera". The pose is checked against every gesture you saved.'}>
        The GestureMatcher compares the pose with every gesture in the active profile: the palm rule plus each
        finger's allowed bands. A pose that matches more than one gesture is rejected. Finger settling can
        also hold a match back until the relevant fingers stop moving.
      </Plain>
    ),
  },
  {
    term: "Match a gesture → Press the keys",
    definition: (
      <Plain simple="A recognized gesture presses its keys once, then waits until you make the reset pose before it can fire again, so holding a pose doesn't spam the key.">
        A match isn't automatically a key press. The GestureHandler <i>latches</i> input after a gesture fires,
        and only the profile's reset pose unlocks it. Deliberate repeats come from movement instead, within a
        per-gesture repeat budget.
      </Plain>
    ),
  },
  {
    term: "Press the keys → Your application",
    definition: (
      <Plain simple="The keys are pressed as if you typed them, so any program that takes keyboard input works: a game, a video player, anything.">
        The CommandExecutor queues the gesture's sequence of taps and delays, and the InputSimulator sends
        them to the operating system through pynput, holding each key for 50 ms. Whichever application has
        focus receives them as ordinary key presses.
      </Plain>
    ),
  },
  {
    term: "Settings",
    definition: (
      <Plain simple="Workspace-wide tuning: which tracking model to use, how bent a finger must be to count as curled, and how much to smooth the hand's movement.">
        Workspace-wide configuration, saved as JSON: the landmarker model, finger deviation ranges, hysteresis,
        smoothing and settling. The settings panel edits a draft and applies it to the running Detector.
      </Plain>
    ),
  },
  {
    term: "Profile",
    definition: (
      <Plain simple="Your gestures and the keys each one presses, saved as a file. Nothing about a particular game is built in; swap the profile and the same system drives another program.">
        A saved JSON file of gesture definitions (palm and finger criteria), their command sequences, a reset
        rule and repeat defaults. Nothing game-specific is built into recognition; the active profile is
        applied to the running GestureHandler.
      </Plain>
    ),
  },
  {
    term: "Live views",
    definition: (
      <Plain simple="Everything you see in the app reads the same live results, so opening another window never makes the tracking work twice.">
        Each tick, the TrackingEngine returns one report of hand states and matched gestures. The debugging
        panel, settings preview and desktop overlay all read that same report, and the camera preview draws
        the landmarks and fingertip paths. The backend never imports the frontend, and a test enforces it.
      </Plain>
    ),
  },
];
const hintFor = (term) => arrowHints.find((entry) => entry.term === term);

const StageFlow = () => (
  <div className="cs-compact cs-flow-figure">
    <ol className="cs-flow">
      {stages.map(({ name, made, by, simple }, i) => {
        const next = stages[i + 1]?.name ?? "Your application";
        return (
          <li key={name} className="cs-flow-stage">
            <b className="cs-flow-name">{name}</b>
            <span className="cs-flow-made"><Plain simple={simple}>{made}</Plain></span>
            <code className="cs-flow-by cs-technical">{by}</code>
            <details className="cs-flow-how">
              <summary>How it gets to {next}</summary>
              <div>{hintFor(`${name} → ${next}`).definition}</div>
            </details>
          </li>
        );
      })}
      <li className="cs-flow-stage cs-flow-end">
        <b className="cs-flow-name">Your application</b>
        <span className="cs-flow-made">A game, a video player, anything that takes keys</span>
      </li>
    </ol>
    <p className="cs-flow-branch typeset-card-toner">
      At every stage, the same results also feed the live views: the debugging panel, the
      camera preview and the desktop overlay.
    </p>
  </div>
);

// Fig. 01, drawn: the pipeline left to right, what configures it above, and what it feeds below.
// Class names are technical lines, hidden in the simplified reading mode.
const Arrowhead = ({ id }) => (
  <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" className="cs-fill-ink" />
  </marker>
);

const Box = ({ x, y, width = 156, height = 72, name, note, code, className }) => (
  <g className={className}>
    <rect x={x} y={y} width={width} height={height} className="cs-node" />
    <path d={`M${x},${y} h7 L${x},${y + 7} z`} className="cs-fill-ink" />
    <text x={x + 12} y={y + 22} className="cs-name">{name}</text>
    {note && <text x={x + 12} y={y + 40} className="cs-note">{note}</text>}
    {code && <text x={x + 12} y={y + 59} className="cs-state-line cs-technical">{code}</text>}
  </g>
);

const ArrowHint = ({ term, x, y }) => (
  <Term term={term}>
    <circle cx={x} cy={y} r="14" className="cs-hit" />
    <circle cx={x} cy={y} r="8" className="cs-arrow-dot" />
    <text x={x} y={y + 4} textAnchor="middle" className="cs-arrow-plus" aria-hidden="true">+</text>
  </Term>
);

// The same figure for the simplified reading mode: three steps and the feedback, no internals
// (the "General audience" view in ComputerVisionBasics/hand-tracking/docs/functionality_diagrams.md).
const simpleSteps = [
  { name: "Camera", note: "films your hand" },
  { name: "Recognize the hand", note: "matches your gestures" },
  { name: "Simulate key presses", note: "the ones you assigned" },
];

const SimpleSystemDiagram = () => (
  <svg viewBox="-24 -8 948 372" role="img" aria-label="The system in three steps: the camera films your hand, the app recognizes your hand and matches it to your gestures, then simulates the key presses you assigned, which go to your application. In the app's window you set your gestures, keys and tuning, which configure the recognizing and the key presses, and you see live feedback of what it recognized.">
    <defs><Arrowhead id="cv-simple-arrow" /></defs>
    <text x="0" y="12" className="cs-fig-label"><tspan className="cs-fig-number">FIG. 01</tspan><tspan dx="12">FROM HAND TO KEY PRESS</tspan></text>

    {/* The app's window: where you set things up, and where you see what it recognized. */}
    <Box x={233} y={40} width={433} height={56} name="Your settings" note="gestures, keys and tuning · set in the app" />
    <g className="cs-wire" strokeDasharray="5 4" markerEnd="url(#cv-simple-arrow)">
      <line x1="333" y1="96" x2="333" y2="148" />
      <line x1="566" y1="96" x2="566" y2="148" />
    </g>

    {simpleSteps.map((step, i) => <Box key={step.name} x={i * 233} y={150} width={200} height={56} {...step} />)}
    <g className="cs-solid-blue"><Box x={699} y={150} width={200} height={56} name="Your application" note="a game, a video player…" /></g>
    <g className="cs-wire" markerEnd="url(#cv-simple-arrow)">
      {[0, 1, 2].map((i) => <line key={i} x1={i * 233 + 200} y1="178" x2={(i + 1) * 233 - 2} y2="178" />)}
      <line x1="333" y1="206" x2="333" y2="284" />
    </g>
    <Box x={233} y={286} width={433} height={56} name="Live feedback" note="what it recognized · shown in the app" />
  </svg>
);

const SimpleStageFlow = () => (
  <div className="cs-compact cs-flow-figure">
    <ol className="cs-flow">
      {simpleSteps.map(({ name, note }) => (
        <li key={name} className="cs-flow-stage">
          <b className="cs-flow-name">{name}</b>
          <span className="cs-flow-made">{note}</span>
        </li>
      ))}
      <li className="cs-flow-stage cs-flow-end">
        <b className="cs-flow-name">Your application</b>
        <span className="cs-flow-made">A game, a video player, anything that takes keys</span>
      </li>
    </ol>
    <p className="cs-flow-branch typeset-card-toner">
      You set your gestures, keys and tuning in the app's window, and it shows what it recognizes as it happens.
    </p>
  </div>
);

const pipelineBoxes = [
  { name: "Camera", note: "live video", code: "Camera" },
  { name: "Find the hand", note: "21 joints per hand", code: "MediaPipe landmarker" },
  { name: "Read the pose", note: "finger bends · palm", code: "Detector" },
  { name: "Match a gesture", note: "against the profile", code: "GestureHandler" },
  { name: "Press the keys", note: "taps, holds, delays", code: "CommandExecutor" },
];
const boxX = (i) => i * 186;

const SystemDiagram = () => (
  <svg viewBox="-24 -8 948 384" role="img" aria-label="The system, left to right: the camera's live video goes to the hand finder, which locates 21 joints per hand; the pose reader turns those into finger bends and palm direction; the matcher compares the pose with the active profile; and the key presser sends taps, holds and delays to your application. Settings configure the hand finder and pose reader, and the profile configures the matcher. The hand, pose and gesture also feed the live views: the debugging panel, desktop overlay and camera preview.">
    <defs><Arrowhead id="cv-arrow" /></defs>
    <text x="0" y="12" className="cs-fig-label"><tspan className="cs-fig-number">FIG. 01</tspan><tspan dx="12">FROM HAND TO KEY PRESS</tspan></text>

    {/* What configures the pipeline: saved files, edited in the app. */}
    <Box x={186} y={40} width={342} height={46} name="Settings" note="model · finger ranges · smoothing" />
    <Box x={558} y={40} width={156} height={46} name="Profile" note="gestures → keys" />
    <g className="cs-wire" strokeDasharray="5 4" markerEnd="url(#cv-arrow)">
      <line x1="264" y1="86" x2="264" y2="148" />
      <line x1="450" y1="86" x2="450" y2="148" />
      <line x1="636" y1="86" x2="636" y2="148" />
    </g>

    {pipelineBoxes.map((box, i) => <Box key={box.name} x={boxX(i)} y={150} {...box} />)}
    <g className="cs-wire" markerEnd="url(#cv-arrow)">
      {pipelineBoxes.slice(1).map((box, i) => <line key={box.name} x1={boxX(i) + 156} y1="186" x2={boxX(i + 1) - 2} y2="186" />)}
      <line x1="822" y1="222" x2="822" y2="296" />
      <line x1="264" y1="222" x2="264" y2="296" />
      <line x1="450" y1="222" x2="450" y2="296" />
      <line x1="636" y1="222" x2="636" y2="296" />
    </g>

    {/* Every arrow explains itself on hover. */}
    {pipelineBoxes.slice(1).map((box, i) => (
      <ArrowHint key={box.name} term={`${pipelineBoxes[i].name} → ${box.name}`} x={boxX(i) + 171} y={186} />
    ))}
    <ArrowHint term="Press the keys → Your application" x={822} y={259} />
    <ArrowHint term="Settings" x={264} y={117} />
    <ArrowHint term="Settings" x={450} y={117} />
    <ArrowHint term="Profile" x={636} y={117} />
    {[264, 450, 636].map((x) => <ArrowHint key={x} term="Live views" x={x} y={259} />)}

    {/* What the pipeline feeds: the same results, shown to you and sent to another program. */}
    <Box x={186} y={298} width={528} height={50} name="Live views" note="debugging panel · desktop overlay · camera preview" />
    <g className="cs-solid-blue"><Box x={744} y={298} width={156} height={50} name="Your application" note="receives the keys" /></g>
  </svg>
);

/**
 * A feature at a glance (name, one-line pitch, the problem it solves, media) with its full write-up opened in place: beside
 * the media on wide screens, over it on narrow ones. Either way it only takes room the media already
 * gives the card (scrolling if long), so opening it never moves the page. The card's id makes it linkable (#feature-mapping) without sending visitors to another page.
 */
const Feature = ({ id, name, pitch, why, use, media, children }) => {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  return (
    <article className="cs-feature" id={`feature-${id}`}>
      <div className="cs-feature-media">{media}</div>
      <div className="cs-feature-side">
        <h3 className="cs-feature-title typeset-card-title">{name}</h3>
        {/* The write-up opens over the description (wide) or the media (narrow): space the card
            already has, so opening it never moves the page. */}
        <div className="cs-feature-summary">
          <p className="cs-feature-pitch">{pitch}</p>
          {why && <p className="cs-feature-why"><b>Why:</b> {why}</p>}
          {open && (
            <div className="cs-feature-body cs-prose" id={bodyId} role="region" aria-label={name}>
              <div className="cs-technical">{children}</div>
              {use && (
                <ol className="cs-feature-points cs-feature-steps cs-simple-block">
                  {use.map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="cs-feature-more typeset-card-toner"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((now) => !now)}
        >
          <SwapLabel on={open} onLabel="Hide details" offLabel={<Plain simple="How to use it">How it works</Plain>} />
        </button>
      </div>
    </article>
  );
};

// The small decisions that keep tracking steady, each as the problem it solves and the fix. `adjust`
// marks the ones a user can tune, and where; the rest are built in.
// Grounded in ComputerVisionBasics/hand-tracking/docs (one_euro_filter, finger_hysteresis,
// finger_settling, runtime_reliability) and the gesture handler.
const designDetails = [
  {
    problem: "Landmarks jitter while the hand is still",
    group: "steady",
    fix: "One Euro filter",
    adjust: { where: "Settings", what: "On/off, minimum cutoff and speed response" },
    how: "Smooths each joint heavily while it's barely moving and lightly while it moves fast, so a resting hand is steady without a moving one lagging behind.",
  },
  {
    problem: "A finger near a threshold flickers between positions",
    group: "steady",
    fix: "Hysteresis",
    adjust: { where: "Settings", what: "On/off and the margin in degrees" },
    how: "A finger must bend a few degrees past a boundary to change position, and straighten a few degrees back to return. Between the two, it keeps the position it had.",
  },
  {
    problem: "A pose passing through on its way to another fires by accident",
    group: "deliberate",
    fix: "Finger settling",
    adjust: { where: "Settings", what: "On/off and the maximum bend speed" },
    how: "A matched gesture waits until the fingers that matter slow below a speed limit, so only a pose you're holding activates.",
  },
  {
    problem: "Holding a pose would press its key over and over",
    group: "deliberate",
    fix: "Input latch",
    adjust: { where: "Profile", what: "The reset pose, as the universal reset" },
    how: "A gesture fires once, then input stays locked until the profile's reset pose. Repeats only come from deliberate movement.",
  },
  {
    problem: "One pose could match two gestures",
    group: "deliberate",
    fix: "Ambiguity is rejected",
    how: "Identical criteria are flagged while editing, and a live pose that matches more than one gesture sends nothing rather than guessing.",
  },
  {
    problem: "The model is slower than the camera",
    group: "stuck",
    fix: "Never wait on inference",
    how: "Each frame is submitted and the newest finished result is used, so the app and its windows stay responsive while the model catches up.",
  },
  {
    problem: "The same motion counts differently near and far from the camera",
    group: "steady",
    fix: "Hand-size scaling",
    adjust: { where: "Settings", what: "On/off, under optimistic tracking" },
    how: "When turned on, wrist movement is scaled by how large the palm appears, so a repeat takes the same motion whether you sit close or lean back.",
  },
  {
    problem: "The hand drops out for a moment",
    group: "steady",
    fix: "Stale history is discarded",
    how: "If a hand disappears or results are more than 250 ms apart, smoothing and motion history reset instead of bridging the gap with a guess.",
  },
  {
    problem: "A crash could leave a key held down",
    group: "stuck",
    fix: "Input is always released",
    how: "An unexpected error stops tracking and commands, and shutdown releases gesture input before closing the camera, model and windows.",
  },
];

// What the design details add up to, for the simplified reading mode: outcomes, not mechanisms.
const reliabilityOutcomes = [
  { title: "Steady, even with shaky hands", text: "Small tremors and camera noise are smoothed out before anything is read." },
  { title: "Only presses keys you mean", text: "A gesture fires once and then waits, and a pose you pass through on the way to another doesn't count." },
  { title: "Never guesses", text: "If a pose could mean two different gestures, nothing is pressed." },
  { title: "Never stuck", text: "The app keeps up with the camera, and a problem never leaves a key held down." },
];

const detailGroups = [
  { id: "steady", name: "Steady Readings", intro: "Camera data is noisy. These keep what the system reads about your hand from wobbling." },
  { id: "deliberate", name: "Only Deliberate Input", intro: "People don't hold perfectly still. These make sure a key is pressed only when you mean it." },
  { id: "stuck", name: "Never Stuck", intro: "A slow model or a crash shouldn't freeze the app or leave a key held down." },
];

const profiles = [
  {
    name: "Invoker",
    summary: "A Dota 2 profile that maps hand shapes to spell key sequences. The game-specific combinations live in the profile.",
    gif: "GIF: the Invoker input profile in use",
    image: { src: invokerImage, width: 1528, height: 1083, name: "Invoker profile", alt: "Mapping panel for the Invoker profile. Its gestures are Invoke, Quas, Wex, Exort, Cast 1 and Cast 2. Invoke is selected: palm orientation Any, thumb Straight or Partial, and the index, middle, ring and pinky fingers Straight, with capture from hand and checklist options and fingertip tracking settings below.", caption: "Invoker profile · Six gestures; Invoke shown with its hand criteria" },
  },
  {
    name: "YouTube",
    summary: "Not a game at all: hand gestures for watching videos, sending YouTube's own keyboard shortcuts. The same capture, recognition and input systems drive it; only the profile is different.",
    gif: "GIF: the YouTube input profile in use",
    image: { src: youtubeImage, width: 1534, height: 1108, name: "YouTube profile", alt: "Mapping panel for the YouTube profile. Its gestures are Pause/Play, Back, Forward and Mute/Unmute. Mute/Unmute is selected: palm orientation Any, the thumb, index, middle and ring fingers Straight and the pinky Curled, with the index fingertip tracked.", caption: "YouTube profile · Four playback gestures; Mute/Unmute shown with its hand criteria" },
  },
];

export const ComputerVisionProject = () => (
  <HintProvider lookup={hintFor}>
  <CaseStudy className="case-study typeset-card-readable">
    <CaseStudyOpening id="project-1" summary="Use hand gestures to control games and other apps.">
      <p className="cs-eyebrow typeset-card-toner">Project · Desktop application · Python / Tkinter / OpenCV / MediaPipe</p>
      <h1 className="typeset-title">Computer Vision for Input Simulation</h1>
      <p>A desktop application that turns hand gestures into keyboard input.</p>
      <p>
        Hold up a hand shape in front of a webcam, and the application presses the keys you assigned to it. Which
        shapes mean which keys is up to you, saved as profiles for any program that takes keyboard input.
      </p>
      <p className="cs-technical">
        Under the hood: OpenCV captures the camera, MediaPipe finds the hand's landmarks, and a Python pipeline
        classifies each finger, matches gestures against the profile and sends keys through pynput.
      </p>
    </CaseStudyOpening>
<ReadingVersions overview={<> <section><h2 className="typeset-card-title">Your hand becomes the controller</h2><p>The camera reads a hand shape and presses the keys you chose.</p><figure className="cs-figure"><SimpleSystemDiagram /></figure><CaseStudyMedia media={applicationScreenshots.camera} /></section>
<section><h2 className="typeset-card-title">Choose a gesture</h2><p>Set the hand shape, assign a key, and save it in a profile.</p><CaseStudyMedia media={applicationScreenshots.manual} /></section>
<section><h2 className="typeset-card-title">Use it over a game</h2><p>A small overlay shows what your hands are doing without covering the action.</p><CaseStudyMedia media={applicationScreenshots.overlay} /></section> </>}>


    <section>
      <h2 className="typeset-card-title">Systems</h2>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">The goal</p>
        <p className="cs-callout-lead">
          <Plain simple="Turn a hand shape into key presses, quickly and reliably enough to play a game with.">
            Turn a camera feed into keyboard input that is fast, predictable, and configurable without code.
          </Plain>
        </p>
      </div>
      <p className="cs-prose">
        Every gesture takes the same trip, one stage at a time. Each stage turns what the last one knew into
        something closer to a key press.
      </p>
      <div className="cs-technical">
        <HintCue target="arrow" compact="Open a stage to see how it reaches the next" />
      </div>
      <figure className="cs-figure cs-technical"><SystemDiagram /><StageFlow /></figure>
      <figure className="cs-figure cs-simple-block"><SimpleSystemDiagram /><SimpleStageFlow /></figure>

    </section>

    <Separator className="cs-separator-section" />
    <section>
      <h2 className="typeset-card-title">Features</h2>
      <div className="cs-features">
        <Feature
          id="hub"
          name="Pick a Camera and a Workspace"
          pitch="Choose a webcam, see that it's streaming, and open the hand-tracking workspace."
          why="If the camera isn't streaming, nothing else works. Checking it first rules that out before blaming a gesture."
          use={["Pick your webcam from the list.", "Check that it says it's streaming.", "Open the Hand tracking workspace."]}
          media={<CaseStudyMedia media={applicationScreenshots.hub} />}
        >
          <ul className="cs-feature-points">
            <li>Camera controls are shared by every workspace.</li>
            <li>Each workspace keeps its own tracking data and settings.</li>
            <li>Hand tracking is available now; body and eye tracking are planned.</li>
          </ul>
        </Feature>

        <Feature
          id="debugging"
          name="Watch It Read Your Hand"
          pitch="See, live, what the system thinks each hand is doing and which key it would press."
          why="When a gesture doesn't fire, you need to know whether the hand was misread or the gesture was set up wrong."
          use={["Hold your hand up to the camera.", "Watch the gesture and each finger's bar update.", "If a gesture won't fire, look for the finger that's read wrong."]}
          media={<CaseStudyMedia media={applicationScreenshots.debugging} />}
        >
          <ul className="cs-feature-points">
            <li>Each hand side by side: detected, palm direction, gesture, command.</li>
            <li>Every finger's bend, with its category.</li>
            <li>Model status, plus pause, restart and the overlay switch.</li>
          </ul>
        </Feature>

        <Feature
          id="camera"
          name="See What the Camera Sees"
          pitch="A camera window draws your hand's joints, the paths your fingertips trace, and the keys just pressed."
          why="Seeing the tracked joints over your own hand shows straight away when the model loses a finger or the lighting is too poor."
          use={["Open the camera preview.", "Move your hand; the drawn joints should follow it.", "If they jump around, add more light."]}
          media={<CaseStudyMedia media={applicationScreenshots.camera} />}
        >
          <ul className="cs-feature-points">
            <li>Joints and finger chains drawn over the mirrored camera.</li>
            <li>Tracked fingertips leave paths, marked wherever a repeat fired.</li>
            <li>Profiles can add their own feedback, like Invoker's spell icons.</li>
          </ul>
        </Feature>

        <Feature
          id="mapping"
          name="Teach It a Gesture"
          pitch="Make the pose, and the app records how each finger is bent and which way the palm faces."
          why="Describing a hand shape finger by finger is slow and easy to get wrong. Making the pose is how people already think of it."
          use={["Pick a gesture and press Capture from hand.", "Hold the pose until the countdown ends.", "Choose the keys it presses, then save."]}
          media={<CaseStudyMedia media={applicationScreenshots.mapping} />}
        >
          <ul className="cs-feature-points">
            <li><b>Capture from hand</b> watches for 1.5 s; each finger takes the position it held most.</li>
            <li>The palm counts only if it agreed in 80% of frames.</li>
            <li><b>Allowance</b> adds leeway, so a pointed finger still matches half-raised.</li>
          </ul>
        </Feature>

        <Feature
          id="manual"
          name="Define a Gesture Manually"
          pitch="Pick the palm direction and each finger's allowed positions yourself, from simple choices or a checklist."
          why="A captured pose is exact, but some gestures should accept a range, like a thumb that's anywhere from straight to partly bent."
          use={["Pick a gesture and set each finger's position.", "Press Use checklist to allow several positions.", "Choose the keys it presses, then save."]}
          media={<CaseStudyMedia media={applicationScreenshots.manual} />}
        >
          <ul className="cs-feature-points">
            <li><b>Simple choices:</b> one dropdown per finger, like “Curled through Closed”.</li>
            <li><b>Checklist:</b> tick any mix of positions; none ticked means any.</li>
            <li>Saving checks for duplicate gestures and invalid keys first.</li>
          </ul>
        </Feature>

        <Feature
          id="repeats"
          name="Repeat by Moving"
          pitch="Move your hand after a gesture to press its keys again, instead of re-making the pose."
          why="Some actions repeat: turning the volume, seeking, casting the same spell. Re-making the pose for every press is slow and tiring."
          use={["Open Repeat Commands for a gesture.", "Choose the trigger: holding, moving or shaking.", "Set how many times it may repeat."]}
          media={<CaseStudyMedia media={applicationScreenshots.repeats} />}
        >
          <ul className="cs-feature-points">
            <li><b>Tracking:</b> repeats while the pose is held.</li>
            <li><b>Distance:</b> one repeat per set distance moved.</li>
            <li><b>Shake:</b> one repeat per shake.</li>
            <li>Each has a limit; axis weights pick which directions count.</li>
          </ul>
        </Feature>

        <Feature
          id="reset"
          name="Reset with One Pose"
          pitch="One gesture, shared by the whole profile, stops everything and gets ready for the next command."
          why="Gestures fire once and then wait, so you need a quick, deliberate way to say “done, ready for the next one.”"
          use={["Press Edit universal reset.", "Set the pose, like a loose fist.", "Make it whenever you want gestures ready again."]}
          media={<CaseStudyMedia media={applicationScreenshots.reset} />}
        >
          <ul className="cs-feature-points">
            <li>Stops queued keys, clears drawn paths, and re-arms every gesture.</li>
            <li>Overrides every other gesture in the profile.</li>
            <li>Here it's a loose fist: four fingers curled, thumb and palm free.</li>
          </ul>
        </Feature>

        <Feature
          id="profiles"
          name="Switch Between Profiles"
          pitch="Keep separate gesture sets for different programs and swap between them."
          why="Different programs need different keys. One set of gestures can't serve a game and a video player at once."
          use={["Press More Profiles.", "Create a profile or pick one.", "Confirm to switch."]}
          media={<CaseStudyMedia media={applicationScreenshots.profiles} />}
        >
          <ul className="cs-feature-points">
            <li>Create profiles and keep them in any folder.</li>
            <li>Pick one, then confirm to make it active.</li>
          </ul>
        </Feature>

        <Feature
          id="settings"
          name="Tune Recognition"
          pitch="Adjust how fingers are judged and how steady tracking is, with a live preview of your own hand."
          why="Hands, cameras and lighting differ. Thresholds that work in one setup misfire in another."
          use={["Open Settings and press Test deviation.", "Adjust while watching your hand in the preview.", "Apply once it reads your hand reliably."]}
          media={<CaseStudyMedia media={applicationScreenshots.settings} />}
        >
          <ul className="cs-feature-points">
            <li>Tracking model, finger bend ranges, smoothing and settling.</li>
            <li>Repeat thresholds and hand-size scaling.</li>
            <li>A live preview tests drafts; nothing changes until you apply.</li>
          </ul>
        </Feature>

        <Feature
          id="overlay"
          name="Keep Feedback on Screen"
          pitch="A small desktop overlay shows what's recognized while you use another program."
          why="While you play, the app's own window is hidden behind the game, leaving no other way to see what's being recognized."
          use={["Press Enable Overlay in the debugging panel.", "Use Reposition overlay to drag it into place.", "Lower its opacity so the game shows through."]}
          media={<CaseStudyMedia media={applicationScreenshots.overlay} />}
        >
          <ul className="cs-feature-points">
            <li>Shows the same live report as the debugging panel.</li>
            <li>Set its style, opacity and position, then save or discard.</li>
          </ul>
        </Feature>
      </div>

      <div className="cs-subsection">
        <h3 className="typeset-card-title">Profiles in Use</h3>
        <p className="cs-prose">
          Profiles built with the application, for a game and for watching videos. The same tracking and input systems drive each one; only the
          profile changes.
        </p>
        <div className="cs-entities">
          {profiles.map(({ name, summary, gif, image }) => (
            <div key={name} className="cs-entity">
              {image ? <CaseStudyMedia media={image} /> : <Placeholder label={gif} />}
              <div className="cs-composition"><h4 className="typeset-card-title">{name}</h4><p>{summary}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <Separator className="cs-separator-section cs-simple-block" />
    <section className="cs-simple-block">
      <h2 className="typeset-card-title">Why It Feels Reliable</h2>
      <ul className="cs-details-grid">
        {reliabilityOutcomes.map(({ title, text }) => (
          <li key={title} className="cs-detail">
            <p className="cs-detail-fix">{title}</p>
            <p className="cs-detail-how">{text}</p>
          </li>
        ))}
      </ul>
    </section>

    <Separator className="cs-separator-section cs-technical" />
    <section className="cs-technical">
      <h2 className="typeset-card-title">Design Details</h2>
      <p className="cs-prose">
        The pipeline in Systems is the happy path. Most of the work that makes it feel good is in the small decisions
        around it, each handling one way things would otherwise show up as a wrong, repeated or missing key press.
      </p>
      {detailGroups.map((group) => (
        <div key={group.id} className="cs-subsection">
          <h3 className="typeset-card-title">{group.name}</h3>
          <p className="cs-prose">{group.intro}</p>
          <ul className="cs-details-grid">
            {designDetails.filter((detail) => detail.group === group.id).map(({ problem, fix, how, adjust }) => (
              <li key={fix} className="cs-detail">
                <p className="cs-detail-problem typeset-card-toner"><b>Problem:</b> {problem}</p>
                <p className="cs-detail-fix"><span className="cs-detail-label typeset-card-toner">Fix:</span> {fix}</p>
                <p className="cs-detail-how">{how}</p>
                <p className="cs-detail-adjust typeset-card-toner" data-adjustable={adjust ? "" : undefined}>
                  {adjust ? <><b>Adjustable in {adjust.where}</b> · {adjust.what}</> : "Built in"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  </ReadingVersions>
    </CaseStudy>
  </HintProvider>
);

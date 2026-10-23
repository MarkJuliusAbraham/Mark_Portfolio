import { useId, useState } from "react";
import "./case-study.css";
import { CaseStudyOpening } from "./CaseStudyOpening.jsx";
import { Plain } from "./Plain.jsx";
import { HintCue, HintProvider, Term } from "./Hints.jsx";
import { ApplicationScreenshot } from "@/components/molecules/ApplicationScreenshot";
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
 * A feature at a glance (name, one-line pitch, media) with its full write-up opened in place: beside
 * the media on wide screens, over it on narrow ones. Either way it only takes room the media already
 * gives the card (scrolling if long), so opening it never moves the page. The card's id makes it linkable (#feature-mapping) without sending visitors to another page.
 */
const Feature = ({ id, name, pitch, media, children }) => {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  return (
    <article className="cs-feature" id={`feature-${id}`}>
      <div className="cs-feature-media">{media}</div>
      <div className="cs-feature-side">
      <div className="cs-feature-head">
        <h3 className="typeset-card-title">{name}</h3>
        <p className="cs-feature-pitch">{pitch}</p>
      </div>
      <button
        type="button"
        className="cs-feature-more typeset-card-toner"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((now) => !now)}
      >
        {open ? "Hide details" : "How it works"}
      </button>
      {open && (
        <div className="cs-feature-body cs-prose" id={bodyId} role="region" aria-label={`How ${name.toLowerCase()} works`}>
          {children}
        </div>
      )}
      </div>
    </article>
  );
};

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
  <article className="case-study typeset-card-readable">
    <CaseStudyOpening id="project-1">
      <p className="cs-eyebrow typeset-card-toner">Project · Desktop application · Python / Tkinter / OpenCV / MediaPipe</p>
      <h1 className="typeset-title">Computer Vision for Input Simulation</h1>
      <p>A desktop application that turns hand gestures into keyboard input.</p>
      <p>
        Hold up a hand shape in front of a webcam, and the application presses the keys you assigned to it. Which
        shapes mean which keys is up to you, saved as profiles for any program that takes keyboard input.
      </p>
    </CaseStudyOpening>

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
      <HintCue target="arrow" compact="Open a stage to see how it reaches the next" />
      <figure className="cs-figure"><SystemDiagram /><StageFlow /></figure>

    </section>

    <section>
      <h2 className="typeset-card-title">Features</h2>
      <p className="cs-prose">
        What you can do in the application. Each feature is summed up in a line; open <i>How it works</i> for the
        details.
      </p>
      <div className="cs-features">
        <Feature
          id="hub"
          name="Pick a camera and a workspace"
          pitch="Choose a webcam, see that it's streaming, and open the hand-tracking workspace."
          media={<ApplicationScreenshot image={applicationScreenshots.hub} />}
        >
          <p>
            The tracking hub is the application's entry point. Camera controls are shared, and each workspace
            provides its own tracking data and configuration.
          </p>
          <p>Hand tracking is the workspace available today; body and eye tracking are planned.</p>
        </Feature>

        <Feature
          id="debugging"
          name="Watch it read your hand"
          pitch="See, live, what the system thinks each hand is doing and which key it would press."
          media={<ApplicationScreenshot image={applicationScreenshots.debugging} />}
        >
          <p>
            The debugging panel shows each hand side by side: whether it's detected, which way the palm faces,
            the matched gesture and its command, and every finger's bend and category.
          </p>
          <p>
            It also shows whether the hand-tracking model is ready, and lets you restart or pause tracking or turn
            on the desktop overlay.
          </p>
        </Feature>

        <Feature
          id="camera"
          name="See what the camera sees"
          pitch="A camera window draws your hand's joints, the paths your fingertips trace, and the keys just pressed."
          media={<ApplicationScreenshot image={applicationScreenshots.camera} />}
        >
          <p>
            The preview shows the camera mirrored, with each hand's joints and finger chains drawn over it. The
            fingertips a gesture tracks leave paths behind them, with a marker wherever a repeat fired.
          </p>
          <p>
            Some feedback is profile-specific: the Invoker profile shows the spell elements it just sent, read from
            the keys actually pressed rather than from the gesture.
          </p>
        </Feature>

        <Feature
          id="mapping"
          name="Teach it a gesture"
          pitch="Make the pose, and the app records how each finger is bent and which way the palm faces."
          media={<ApplicationScreenshot image={applicationScreenshots.mapping} />}
        >
          <p>
            <b>Capture from hand</b> counts down, then watches your hand for 1.5 seconds. Each finger takes the
            position it held most, and the palm is only required if it agreed in at least 80% of frames.
          </p>
          <p>
            The <b>Allowance</b> setting (none, 1 or 2 bands) adds leeway: a finger captured fully straight or closed
            also accepts the next positions toward the middle, so a pointed finger still matches when it's only
            partly up.
          </p>
          <p>
            The captured pose lands in the editor like any other change, so you can adjust it before saving, then
            assign the keys it presses.
          </p>
        </Feature>

        <Feature
          id="manual"
          name="Define a gesture manually"
          pitch="Pick the palm direction and each finger's allowed positions yourself, from simple choices or a checklist."
          media={<ApplicationScreenshot image={applicationScreenshots.manual} />}
        >
          <p>
            A gesture is a palm direction plus the positions each finger may be in, connected to a sequence of keys
            and delays.
          </p>
          <p>
            <b>Simple choices</b> offer one dropdown per finger, like "Straight" or "Curled through Closed".{" "}
            <b>Use checklist</b> shows every position from Straight to Closed, so any combination can be ticked; a
            finger with nothing ticked accepts any position.
          </p>
          <p>
            Edits are drafts until saved, and are checked first: two gestures with identical criteria, or an invalid
            command, are flagged before they reach the running handler.
          </p>
        </Feature>

        <Feature
          id="repeats"
          name="Repeat by moving"
          pitch="Move your hand after a gesture to press its keys again, instead of re-making the pose."
          media={<ApplicationScreenshot image={applicationScreenshots.repeats} />}
        >
          <p>Each gesture picks how a repeat is triggered:</p>
          <ul>
            <li><b>Tracking:</b> repeats the gesture while it's held, as its tracked fingertips travel.</li>
            <li><b>Distance:</b> every set distance the tracked fingertips travel earns one repeat. The gesture that fired is remembered until reset, so the pose can change while you move.</li>
            <li><b>Shake:</b> shaking the hand repeats the remembered gesture, with a set travel and time window per shake.</li>
          </ul>
          <p>
            Distances are a percentage of the camera image's width. With several fingertips tracked, their distances are
            averaged, and leftover distance carries over to the next repeat. Axis weights pick which directions count:
            the settings shown only count side-to-side movement.
          </p>
          <p>
            Every mode has a repeat limit, shared until the next reset, and distance repeats set a delay between presses.
            Optimistic tracking can also measure the wrist, and scale distances with hand size so the same motion counts at
            any distance from the camera.
          </p>
        </Feature>

        <Feature
          id="reset"
          name="Reset with one pose"
          pitch="One gesture, shared by the whole profile, stops everything and gets ready for the next command."
          media={<ApplicationScreenshot image={applicationScreenshots.reset} />}
        >
          <p>
            A profile's universal reset is a hand pose with a built-in action and no keys: it stops queued commands,
            clears the drawn paths, and re-arms gesture input. It applies to every gesture in the profile and takes
            precedence over them.
          </p>
          <p>
            It's edited like any gesture's hand criteria. In this profile it's a loose fist: the index through pinky fingers
            anywhere from curled to closed, with the thumb and palm left free.
          </p>
          <p>
            Re-arming matters because a gesture fires once and then waits. Without a reset, holding a pose would press
            its keys over and over.
          </p>
        </Feature>

        <Feature
          id="profiles"
          name="Switch between profiles"
          pitch="Keep separate gesture sets for different programs and swap between them."
          media={<ApplicationScreenshot image={applicationScreenshots.profiles} />}
        >
          <p>
            Choose a profile folder, create new profiles, and pick which one is active. The dialog shows the active
            profile apart from the current selection, and a switch takes effect once confirmed.
          </p>
          <p>The list here has a YouTube profile alongside the game profiles.</p>
        </Feature>

        <Feature
          id="settings"
          name="Tune recognition"
          pitch="Adjust how fingers are judged and how steady tracking is, with a live preview of your own hand."
          media={<ApplicationScreenshot image={applicationScreenshots.settings} />}
        >
          <p>
            Settings cover the whole workspace: the tracking model, finger bend ranges, how much margin a finger
            needs before changing category, and landmark smoothing. <b>Finger settling</b> can hold a gesture back
            until the relevant fingers stop moving, so a pose passing through on its way to another doesn't fire.
          </p>
          <p>
            Optimistic tracking options set the movement thresholds, repeat timing and hand-size scaling for
            repeats. A live preview shows your hand against the draft values, and nothing changes until you apply.
          </p>
          <p>The application itself has light, dark and NieR: Automata-inspired themes, and a display scale.</p>
        </Feature>

        <Feature
          id="overlay"
          name="Keep feedback on screen"
          pitch="A small desktop overlay shows what's recognized while you use another program."
          media={<ApplicationScreenshot image={applicationScreenshots.overlay} />}
        >
          <p>
            The overlay draws the same live hand report as the debugging panel in a transparent window on top of
            other applications. Its style, background opacity and position can be previewed, then saved or
            discarded.
          </p>
        </Feature>
      </div>

      <div className="cs-subsection">
        <h3 className="typeset-card-title">Profiles in use</h3>
        <p className="cs-prose">
          Profiles built with the application, for a game and for watching videos. The same tracking and input systems drive each one; only the
          profile changes.
        </p>
        <div className="cs-entities">
          {profiles.map(({ name, summary, gif, image }) => (
            <div key={name} className="cs-entity">
              {image ? <ApplicationScreenshot image={image} /> : <Placeholder label={gif} />}
              <div className="cs-composition"><h4 className="typeset-card-title">{name}</h4><p>{summary}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </article>
  </HintProvider>
);

import "./case-study.css";
import { ApplicationScreenshot } from "@/components/molecules/ApplicationScreenshot";
import trackingHubImage from "@/img/computer-vision/tracking-hub.png";
import debuggingImage from "@/img/computer-vision/hand-diagnostics.png";
import settingsImage from "@/img/computer-vision/hand-settings.png";
import mappingImage from "@/img/computer-vision/gesture-mapping.png";
import profilesImage from "@/img/computer-vision/gesture-profiles.png";

const applicationScreenshots = {
  hub: { src: trackingHubImage, width: 1260, height: 874, name: "tracking hub", alt: "Tracking hub with Camera 1 streaming and a hand-tracking workspace available to open.", caption: "Tracking hub · Camera controls and workspace selection" },
  debugging: { src: debuggingImage, width: 1552, height: 1201, name: "debugging panel", alt: "Hand-tracking debugging panel with a ready MediaPipe model, tracking controls, and separate left- and right-hand gesture data. Neither hand is currently detected.", caption: "Debugging · Model controls and Live Gesture Data" },
  settings: { src: settingsImage, width: 1545, height: 1107, name: "hand-tracking settings", alt: "Hand-tracking settings with model selection, finger deviation ranges, hysteresis, optimistic tracking options, and Apply and Discard changes controls.", caption: "Settings · Workspace-wide tracking and recognition configuration" },
  mapping: { src: mappingImage, width: 1542, height: 1096, name: "mapping panel", alt: "Mapping panel showing the Invoker Profile, its gesture list, palm and finger criteria, profile management, and Save mappings controls.", caption: "Mapping · Gesture criteria, command mappings, and profiles" },
  profiles: { src: profilesImage, width: 1069, height: 859, name: "gesture profile options", alt: "Gesture profiles dialog with a profile folder, Create profile button, and Earthshaker, Invoker, Juggernaut, and YouTube profiles. Invoker is active while Earthshaker is selected for confirmation.", caption: "Gesture profiles · Create, select, and activate different mappings" },
};

// Project overview grounded in ComputerVisionBasics/hand-tracking. Media slots stay labelled
// until recordings of the application and its systems are available.
const Placeholder = ({ label, ratio = "16 / 9" }) => (
  <figure className="cs-placeholder" style={{ aspectRatio: ratio }} aria-label={`Placeholder: ${label}`}>
    <figcaption className="typeset-card-toner">{label}</figcaption>
  </figure>
);

const profiles = [
  { name: "Invoker", summary: "A Dota 2 profile that maps hand shapes to spell key sequences. The game-specific combinations live in the profile.", gif: "GIF: the Invoker input profile in use" },
  { name: "Earthshaker", summary: "A different set of gestures and commands, using the same capture, recognition, and input systems.", gif: "GIF: the Earthshaker input profile in use" },
  { name: "Juggernaut", summary: "Another configuration of the application. Changing the bindings does not require a separate recognition pipeline.", gif: "GIF: the Juggernaut input profile in use" },
];

const pipeline = [
  { name: "Capture", description: "OpenCV reads the camera on a worker and keeps the latest frame available to the tracking engine." },
  { name: "Detection", description: "MediaPipe runs hand-landmark inference asynchronously. The engine consumes the latest completed result while new inference is in progress." },
  { name: "Interpretation", description: "Finger and palm classification produce a GestureState. GestureHandler compares it with the active profile and decides whether a command may run." },
  { name: "Input simulation", description: "CommandExecutor schedules key presses, releases, and delays. InputSimulator sends keyboard events through pynput to the operating system." },
  { name: "Feedback", description: "Hand reports and the annotated camera frame feed the GUI. The debugging panel, settings preview, and desktop overlay share tracking results." },
];

export const ComputerVisionProject = () => (
  <article className="case-study typeset-card-readable">
    <header className="cs-prose">
      <p className="cs-eyebrow typeset-card-toner">Project · Desktop application · Python / Tkinter / OpenCV / MediaPipe</p>
      <h1 className="typeset-title">Computer Vision for Input Simulation</h1>
      <p>A desktop application that turns hand gestures into configurable keyboard input.</p>
      <p>
        The project brings together a real-time tracking pipeline, an input-simulation system, and a GUI for
        editing profiles, tuning recognition, and inspecting live feedback. Profiles can define keyboard-driven
        workflows for other applications, with games providing examples of those mappings in use.
      </p>
    </header>

    <section>
      <h2 className="typeset-card-title">The Application</h2>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">The goal</p>
        <p className="cs-callout-lead">Make gesture-driven input something you can configure, understand, and control through an application.</p>
      </div>
      <p className="cs-prose">
        The tracking hub is the application's entry point: select a camera, check its connection and streaming
        status, and open an available tracking workspace. Camera controls are shared, while each workspace
        provides its own tracking data and configuration.
      </p>
      <p className="cs-prose">
        Hand tracking is the currently available workspace. Body and eye tracking workspaces are planned as
        additional ways to use the application.
      </p>
      <ApplicationScreenshot image={applicationScreenshots.hub} />

      <div className="cs-subsection">
        <h3 className="typeset-card-title">Build and Edit Input Profiles</h3>
        <div className="cs-prose">
          <p>
            Mapping contains the settings for gesture-to-input bindings and gesture profiles. Select a profile,
            choose or manage its gestures, and define each gesture's palm orientation and allowed finger positions.
            Criteria can be captured from the hand or edited with the selection controls and checklist.
            Each gesture connects to a sequence of keys and delays.
          </p>
          <p>
            Edits are held as drafts, checked for conflicting criteria and invalid commands, and saved before
            being applied to the running handler. The GUI also supports profile selection and discarding changes.
          </p>
        </div>
        <ApplicationScreenshot image={applicationScreenshots.mapping} />
      </div>

      <div className="cs-subsection">
        <h3 className="typeset-card-title">Create and Switch Profiles</h3>
        <div className="cs-prose">
          <p>
            Profile options let users choose a profile folder, create additional gesture profiles, and select
            which one to activate. The dialog distinguishes the active profile from the current selection;
            switching takes effect after confirmation.
          </p>
          <p>
            Each profile holds a different set of gestures and input mappings. The list shown includes a YouTube
            profile alongside the game profiles, keeping application-specific bindings separate from the shared
            tracking and input systems.
          </p>
        </div>
        <ApplicationScreenshot image={applicationScreenshots.profiles} />
      </div>

      <div className="cs-subsection">
        <h3 className="typeset-card-title">See What the System Is Doing</h3>
        <div className="cs-prose">
        <p>
          The debugging panel shows the selected landmarker model and its readiness, with a shortcut to model
          settings. Live Gesture Data separates the left and right hands: tracking status, palm orientation,
          matched gesture, command, and each finger's deviation and classification are visible together.
          Tracking can be restarted or paused, and the optional desktop overlay is controlled from the same panel.
        </p>
        <p>
          These displays consume the same tracking reports. Opening another view does not require another detector
          or a second interpretation of the hand.
        </p>
        </div>
        <ApplicationScreenshot image={applicationScreenshots.debugging} />
      </div>

      <div className="cs-subsection">
        <h3 className="typeset-card-title">Tune and Control Tracking</h3>
        <div className="cs-prose">
        <p>
          Settings contains the general configuration for the hand-tracking workspace: the landmarker model,
          tracking enablement, finger deviation ranges, classification hysteresis, landmark smoothing, and finger
          settling. A live deviation preview helps explain how the current hand position relates to draft thresholds.
        </p>
        <p>
          Optimistic tracking controls expose movement thresholds, repeat timing, smoothing, axis weights, and
          hand-size scaling. These workspace-wide options are kept separate from the gesture-specific criteria,
          commands, and profiles in Mapping. Changes are applied explicitly or discarded.
        </p>
        </div>
        <ApplicationScreenshot image={applicationScreenshots.settings} />
      </div>
    </section>

    <section>
      <h2 className="typeset-card-title">The Systems Behind the UI</h2>
      <p className="cs-prose">
        TrackingEngine coordinates the backend without depending on the GUI. The frontend schedules processing,
        presents each result, and forwards user actions through the engine's public controls.
      </p>
      <Placeholder label="System diagram: capture, detection, gesture interpretation, input simulation, and GUI feedback" ratio="900 / 420" />
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">From camera to application input</p>
        <ol className="cs-callout-points">
          {pipeline.map(({ name, description }) => <li key={name}><b>{name}.</b> {description}</li>)}
        </ol>
      </div>

      <div className="cs-subsection cs-prose">
        <h3 className="typeset-card-title">Profiles Configure the Behavior</h3>
        <p>
          Saved JSON profiles describe gesture criteria, command sequences, and repeat settings. The GUI edits
          those definitions; the runtime matches and executes them. Application-specific key combinations stay
          in configuration instead of being built into the hand detector.
        </p>
        <p>
          Recognition and command execution are separate decisions. The application can preview hand data in the
          settings interface without sending keyboard events to another program.
        </p>
      </div>
    </section>

    <section>
      <h2 className="typeset-card-title">Keeping Input Predictable</h2>
      <p className="cs-prose">
        The application needs to handle noisy camera data and the lifetime of the input it produces. Recognition
        settings and runtime controls address different parts of that problem.
      </p>
      <div className="cs-subsection cs-prose">
        <h3 className="typeset-card-title">Landmark Smoothing and Stable Classification</h3>
        <p>
          The optional One Euro filter smooths landmark coordinates strongly when the hand is still and follows
          faster movement more closely. Classification hysteresis adds a margin before a finger changes category,
          reducing flicker near a threshold.
        </p>
        <p>
          The GUI exposes these settings and live finger feedback together, making it possible to inspect the
          effect of a threshold instead of adjusting it blindly.
        </p>
      </div>
      <div className="cs-subsection cs-prose">
        <h3 className="typeset-card-title">Command Timing and Input Ownership</h3>
        <p>
          A matched gesture does not automatically mean a new command should run. The handler checks invocation
          state and its input latch, while the executor advances scheduled presses, releases, and repeats.
          Pausing or suspending tracking clears active gesture input; shutdown releases input and closes the
          camera, inference, preview, and control windows.
        </p>
      </div>
    </section>

    <section>
      <h2 className="typeset-card-title">Example Profiles in Use</h2>
      <p className="cs-prose">
        These game profiles demonstrate the input-simulation application with different gesture-to-key mappings.
        The same profile editor, tracking engine, and command executor support each example.
      </p>
      <div className="cs-entities">
        {profiles.map(({ name, summary, gif }) => (
          <div key={name} className="cs-entity">
            <Placeholder label={gif} />
            <div className="cs-composition"><h4 className="typeset-card-title">{name}</h4><p>{summary}</p></div>
          </div>
        ))}
      </div>
    </section>
  </article>
);

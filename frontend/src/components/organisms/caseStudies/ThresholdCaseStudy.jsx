import { CaseStudy, ReadingVersions } from "./CaseStudy.jsx";
import { useState } from "react";
import { FsmClipPlayer } from "./FsmClipPlayer.jsx";
import { CaseStudyOpening, Separator } from "./CaseStudyOpening.jsx";
import { Plain } from "./Plain.jsx";
import { CaseStudyMedia } from "@/components/molecules/CaseStudyMedia";
import { HintCue, HintProvider, Term } from "./Hints.jsx";
import { CompactDiagramTerms, CompactGoal, CompactOverview, CompactSequence, CompactModes, CompactMachine, CompactChange, CompactActivatable } from "./CompactDiagrams.jsx";
import folderGif from "@/gifs/threshold-folder.gif";
import receptionPreview from "@/gifs/threshold-preview.gif";
import ticketGif from "@/gifs/threshold-ticket.gif";
import controllableTicketGif from "@/gifs/threshold-controllable-ticket.gif";
import "./case-study.css";

// The "Papers Please"-style game's case study: how desk objects decide who handles each input
// (the coordinator) and what that input means right now (each behavior's state machine).
// Figures are monochrome schematics; the accent marks only input claims, the idea the page is about.

const Arrowhead = ({ id, className = "cs-fill-ink" }) => (
  <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" className={className} />
  </marker>
);

// What each box in the figures means, shown in a hint beside it; `term` is the name drawn in the box.
const glossary = [
  {
    term: "Godot engine",
    definition: (
      <>
        The game engine. It feeds the entity three kinds of call:
        <ul className="cs-hint-list">
          <li><code>_Process</code>: every frame, e.g. easing a folder open during its animation.</li>
          <li><code>_GuiInput</code>: events on this item only, e.g. a click or the cursor moving over a folder.</li>
          <li><code>_Input</code>: every event, wherever it happens, e.g. the mouse-up that ends a drag after the cursor has left the item.</li>
        </ul>
      </>
    ),
  },
  { term: "Entity", definition: "A typical game object that may have behaviors, like a folder or a sheet of paper. It doesn't know what it can do. It just passes every click and keypress along, and the behaviors attached to it decide what happens." },
  { term: "BehaviorCoordinator", definition: "The messenger. It hands each click to the behaviors that want it, most important first, and skips any that have been asked to wait." },
  {
    term: "InputCoordinator",
    definition: (
      <>
        The referee that stops behaviors fighting over the mouse and keyboard. A behavior can hold the mouse in
        one of three ways:
        <ul className="cs-hint-list">
          <li><b>Take over</b>: "mine until I let go." Others wait, and it follows the cursor off the item.</li>
          <li><b>Hold</b>: "everyone wait." Others pause while a folder animates open.</li>
          <li><b>Share</b>: "I'm busy, carry on." Others keep going.</li>
        </ul>
        A take-over can bump a sharer that agreed to step aside. Behaviors never need to know about
        each other, and one that's removed lets go automatically, so the mouse never gets stuck.
      </>
    ),
  },
  { term: "Take over", definition: "\"This is mine until I let go.\" Behaviors that agreed to wait are paused, and this one keeps hearing the mouse even after the cursor leaves the item. Dragging uses it." },
  { term: "Hold", definition: "\"Everyone wait.\" Behaviors that agreed to wait are paused until it lets go. A folder opening uses it, so a stray click mid-animation does nothing." },
  { term: "Share", definition: "\"I'm busy, but carry on.\" Nobody is paused. If another behavior takes over, a sharer that agreed to step aside is bumped and told about it. Folders use it while animating, so you can change your mind mid-animation." },
  { term: "Actions", definition: "What the entity itself can do, like a folder's Open or Close. Behaviors never do these: they emit signals such as \"activating\", and the scene connects each signal to one of the entity's actions. The behavior decides when; the entity decides what." },
  { term: "BehaviorBase", definition: <>The base every behavior is built on. One side is a Godot node, so it lives in the scene and registers itself. The other side is the coordinators' contract (<code>ICoordinatedBehavior</code>): what input it wants, and whether it agrees to wait. The coordinators only ever see that contract, never the state machine inside.</> },
  { term: "Finite state machine", definition: "Each behavior's logic. States have Enter, Exit, Process and Input hooks, plus optional callbacks around enter and exit. The BehaviorBase adapter builds the FSM, registers the behavior and forwards events to the current state." },
  { term: "Pressable", definition: <>The click behavior, a child node you add to an entity in the scene. A clean press and release emits <code>Clicked</code>.</> },
  { term: "Activatable", definition: "The open-and-close behavior. Its states are Inactive, Activating, Active and Deactivating; the \"-ing\" states let an animation play first. By default it holds the mouse while animating. Folders share it instead, so a second right-click can reverse the animation." },
  { term: "Draggable", definition: "The pick-up behavior. It can start the moment you press, or wait until the cursor moves a few pixels, so the same item can be clicked and dragged." },
  { term: "FiniteStateMachine", definition: "Holds a behavior's states by name and remembers which one is current. Every frame and every input it receives goes to that one state only." },
  { term: "Current state", definition: "The one state that's listening. Changing it changes what the behavior does with the very same click." },
  { term: "Idle state", definition: "Built and waiting, but deaf: it hears nothing until it becomes the current state." },
  { term: "Hook", definition: "An optional callback (a Godot Callable) set on a state, run around a state change: OnEnter, OnEnterFinished, OnExit, OnExitFinished. Each one points at a method on the behavior, like EmitActivating, and that method emits the signal the scene wires to the entity's action." },
  { term: "Enter / Exit", definition: "The state's own code for arriving and leaving. Enter is told which state came before, so a state can react to where it came from." },
  { term: "Callback", definition: <>A state never acts on its own. It calls back into a method on its behavior (<code>OnActivationRequested</code> → <code>Activate()</code>), and that method does the work: here, asking the referee for the mouse before changing state. Other callbacks call methods that emit signals, like <code>EmitActivated()</code>, which the scene wires to the entity's own actions.</> },
  { term: "ActivatableState", definition: "The base class all four of Activatable's states inherit from, itself a kind of StateBehavior. Each state only adds what's different about it, like which input it reacts to." },
  { term: "Inactive", definition: "Closed. A right-click asks to open, which only goes ahead if the mouse can be claimed. Arriving here from Deactivating emits Deactivated and lets go of the mouse." },
  { term: "Activating", definition: "Opening. Entering it emits Activating, which the scene wires to the folder's opening animation. It waits for the animation to finish, or moves straight on if it isn't set to wait." },
  { term: "Active", definition: "Open. Arriving from Activating emits Activated and lets go of the mouse. A right-click asks to close." },
  { term: "Deactivating", definition: "Closing. Entering it emits Deactivating, and it waits for the closing animation to finish." },
  { term: "Player", definition: "The person at the desk, clicking and dragging." },
  { term: "Booth", definition: "The small view at the top of the screen, where characters stand. Papers here are miniatures with physics: they fall, and can be pinned to the bulletin board." },
  { term: "Desk", definition: "The table at the bottom, where papers are full size and readable. It's the item's permanent home, and where its behaviors live." },
  { term: "MiniDraggable", definition: "An item's booth view: a small physics body that follows the pointer while dragged, then falls or pins when let go. Created the first time it's needed." },
  { term: "Table entity", definition: "An item's desk view: the Entity and its behaviors, like Draggable." },
  { term: "ItemRepresentation", definition: "One per item. Owns the item's identity and both of its views, and decides which one is visible. Hiding a view never destroys it, so contents and state survive the switch." },
];

const entryFor = (term) => glossary.find((entry) => entry.term === term);

// A component uses its own contrasting surface; grouping keeps all of its labels on that palette.
const Node = ({ x, y, width, height = 46, name, note, tag, lines = [], accent = false, term = name }) => (
  <g className="cs-component">
  <Term term={term}>
    <rect x={x} y={y} width={width} height={height} className={accent ? "cs-node cs-node-accent" : "cs-node"} />
    <path d={`M${x},${y} h7 L${x},${y + 7} z`} className={accent ? "cs-fill-accent" : "cs-fill-ink"} />
    <text x={x + 12} y={y + 20} className="cs-name">{name}</text>
    <text x={x + width - 9} y={y + 14} textAnchor="middle" className="cs-plus" aria-hidden="true">+</text>
    {tag && <text x={x + width - 20} y={y + 20} textAnchor="end" className="cs-tag">{tag}</text>}
    {note && <text x={x + 12} y={y + 36} className="cs-note">{note}</text>}
    {lines.map((line, i) => <text key={line} x={x + 12} y={y + 46 + i * 20} className="cs-state-line">{line}</text>)}
  </Term>
  </g>
);

const FigureLabel = ({ number, title }) => (
  <text x="0" y="12" className="cs-fig-label">
    <tspan className="cs-fig-number">FIG. {number}</tspan>
    <tspan dx="12">{title}</tspan>
  </text>
);

// A container drawn as a frame with a hoverable header strip, so hovering what's inside it
// shows the inner box's hint, not the container's.
const Frame = ({ x, y, width, height, name, note, term = name, shaded = false }) => (
  <g className={shaded ? "cs-shaded-frame" : undefined}>
    <rect x={x} y={y} width={width} height={height} className={shaded ? "cs-frame cs-frame-shaded" : "cs-frame"} />
    <path d={`M${x},${y} h7 L${x},${y + 7} z`} className="cs-fill-ink" />
    <Term term={term}>
      <rect x={x} y={y} width={Math.min(width, 420)} height="34" className="cs-hit" />
      <text x={x + 12} y={y + 21} className="cs-name">{name}</text>
      <text x={x + 12 + name.length * 8.4 + 10} y={y + 21} className="cs-note">{note}</text>
      <text x={x + width - 9} y={y + 14} textAnchor="middle" className="cs-plus" aria-hidden="true">+</text>
    </Term>
  </g>
);

// Fig. 01: the goal. Any entity gets its abilities from behaviors added as child nodes, mixed and
// matched per object; the folder and the ticket are two real compositions from the reception scene.
const goalBehaviors = ["Pressable", "Activatable", "Draggable"];
const compositions = [
  { name: "Folder", behaviors: ["Draggable", "Activatable"] },
  { name: "Ticket", behaviors: ["Draggable"] },
];

const GoalDiagram = () => (
  <svg viewBox="-24 -8 912 346" role="img" aria-label="The goal: simple, composable behaviors for entities. In the Godot scene tree, an entity has behaviors as child nodes: Pressable, Activatable, Draggable, and any number more. Different entities mix and match them: the folder has Draggable and Activatable; the ticket has only Draggable, the same behavior reused.">
    <FigureLabel number="01" title="THE GOAL: COMPOSABLE BEHAVIORS" />

    <text x="20" y="54" className="cs-note">IN THE GODOT SCENE TREE</text>
    <Node x={20} y={66} width={220} height={46} name="Entity" note="any game object" />
    <line x1="44" y1="112" x2="44" y2="296" className="cs-tree-line" />
    {goalBehaviors.map((name, i) => (
      <g key={name}>
        <line x1="44" y1={144 + i * 52} x2="70" y2={144 + i * 52} className="cs-tree-line" />
        <g className="cs-tone-green"><Node x={70} y={124 + i * 52} width={240} height={40} name={name} tag="CHILD NODE" /></g>
      </g>
    ))}
    <line x1="44" y1="296" x2="70" y2="296" className="cs-tree-line" strokeDasharray="3 3" />
    <text x="78" y="301" className="cs-note">… any number of behaviors</text>

    <line x1="400" y1="50" x2="400" y2="310" className="cs-lifeline" />

    <text x="440" y="54" className="cs-note">MIX AND MATCH PER OBJECT</text>
    {compositions.map(({ name, behaviors }, row) => (
      <g key={name}>
        <text x="440" y={108 + row * 84} className="cs-name">{name}</text>
        <text x="530" y={108 + row * 84} className="cs-state-line">=</text>
        {behaviors.map((behavior, i) => (
          <g key={behavior} className="cs-tone-green">
            <Node x={556 + i * 160} y={84 + row * 84} width={148} height={38} name={behavior} />
          </g>
        ))}
      </g>
    ))}
    <text x="556" y="228" className="cs-note">the same Draggable, reused unchanged</text>
    <text x="440" y="270" className="cs-state-line">No code written for the folder or the ticket themselves.</text>
  </svg>
);

const OverviewDiagram = () => (
  <svg viewBox="-25 -8 929 416" role="img" aria-label="Godot sends engine events to an entity. Inside the entity, its behavior coordinator, the messenger, owns an input coordinator, the referee. The messenger asks the referee whether each behavior may act, then delivers events through BehaviorBase to Pressable, Activatable and Draggable, which claim and release the mouse with the referee directly. The behaviors emit signals that the scene connects to the entity's own actions. The behaviors are the entity's child nodes in the Godot scene tree, and each registers itself with the BehaviorCoordinator the entity has.">
    <defs>
      <Arrowhead id="cs-arrow" />
      <Arrowhead id="cs-arrow-accent" className="cs-fill-accent" />
      <Arrowhead id="cs-arrow-yellow" className="cs-fill-yellow" />
    </defs>
    <FigureLabel number="02" title="INPUT ROUTING" />

    <Node x={360} y={36} width={180} name="Godot engine" />

    {/* One entity: everything inside this frame exists once per folder or paper. */}
    <Frame x={20} y={110} width={860} height={249} name="Entity" note="a typical game object that may have behaviors · forwards every event" />
    {/* The messenger, which owns the referee. */}
    {/* What the entity can do. Behaviors only signal; the scene connects signals to these. */}
    <g className="cs-solid-yellow"><Node x={44} y={166} width={186} height={80} name="Actions" note="owned by the entity" /></g>
    <text x="56" y="230" className="cs-state-line cs-on-yellow">e.g. Explode, Shrink</text>
    <Frame x={250} y={154} width={606} height={104} name="BehaviorCoordinator" note="the messenger" shaded />
    <g className="cs-solid-red"><Node x={500} y={178} width={340} height={64} name="InputCoordinator" note="the referee · owned by the messenger" accent /></g>
    <line x1="266" y1="218" x2="496" y2="218" className="cs-wire-accent" strokeDasharray="5 4" markerEnd="url(#cs-arrow-accent)" />
    <text x="381" y="210" textAnchor="middle" className="cs-note cs-accent-text">which behaviors may act?</text>

    <g className="cs-wire" markerEnd="url(#cs-arrow)">
      <line x1="450" y1="82" x2="450" y2="108" />
      <line x1="450" y1="144" x2="450" y2="152" />
      <line x1="264" y1="258" x2="264" y2="334" />
      <line x1="405" y1="258" x2="405" y2="334" />
      <line x1="700" y1="258" x2="700" y2="334" />
    </g>
    <text x="460" y="100" className="cs-note">clicks, keys, every frame</text>
    <text x="413" y="272" className="cs-note">delivers each event</text>

    {/* The seam */}
    <line x1="44" y1="282" x2="856" y2="282" className="cs-seam" strokeDasharray="2 5" />
    <Term term="BehaviorBase">
      <rect x="160" y="272" width="188" height="20" className="cs-seam-label-bg" />
      <text x="254" y="286" textAnchor="middle" className="cs-note cs-term-label">BehaviorBase</text>
    </Term>

    {/* Behaviors claim and release the mouse with the referee directly. */}
    <g className="cs-wire-accent" strokeDasharray="5 4">
      <line x1="200" y1="334" x2="200" y2="310" />
      <line x1="495" y1="334" x2="495" y2="310" />
      <line x1="790" y1="334" x2="790" y2="310" />
      <line x1="200" y1="310" x2="790" y2="310" />
      <line x1="820" y1="310" x2="820" y2="246" markerEnd="url(#cs-arrow-accent)" />
      <line x1="790" y1="310" x2="820" y2="310" />
    </g>
    <text x="812" y="300" textAnchor="end" className="cs-note cs-accent-text">ask &amp; take / let go</text>

    {/* Behaviors never act on the entity directly: they emit signals, wired to its actions. */}
    <g className="cs-wire-yellow" strokeDasharray="3 3">
      <line x1="90" y1="334" x2="90" y2="322" />
      <line x1="360" y1="334" x2="360" y2="322" />
      <line x1="650" y1="334" x2="650" y2="322" />
      <line x1="60" y1="322" x2="650" y2="322" />
      <line x1="60" y1="322" x2="60" y2="250" markerEnd="url(#cs-arrow-yellow)" />
    </g>
    <text x="68" y="304" className="cs-note cs-yellow-text">signals</text>

    {/* Behaviors straddle the entity's edge: child nodes added in the scene, not built by the entity. */}
    <g className="cs-tone-green"><Node x={44} y={336} width={240} height={46} name="Pressable" tag="CHILD NODE" /></g>
    <g className="cs-tone-green"><Node x={330} y={336} width={240} height={46} name="Activatable" tag="CHILD NODE" /></g>
    <g className="cs-tone-green"><Node x={616} y={336} width={240} height={46} name="Draggable" tag="CHILD NODE" /></g>


  </svg>
);

const lanes = [
  { x: 70, label: "Player" },
  { x: 260, label: "Coordinator", term: "BehaviorCoordinator" },
  { x: 450, label: "InputCoordinator", accent: true },
  { x: 640, label: "Activatable", blue: true },
  { x: 830, label: "Pressable · Draggable", term: "Pressable" },
];

// Not shown on the page right now (kept for later). Renumber its FigureLabel if it returns.
const SequenceDiagram = () => (
  <svg viewBox="-24 -8 948 346" role="img" aria-label="Sequence: right-click on a folder. The coordinator delivers it to Activatable, which claims a block and enters Activating. While blocked, clicks for Pressable and Draggable are skipped. When the animation completes, Activatable enters Active and releases the claim.">
    <defs>
      <Arrowhead id="cs-arrow-seq" />
      <Arrowhead id="cs-arrow-seq-accent" className="cs-fill-accent" />
      <pattern id="cs-hatch-seq" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" className="cs-hatch-line-accent" />
      </pattern>
    </defs>
    <FigureLabel number="03" title="A BLOCKING TRANSITION" />

    {lanes.map(({ x, label, accent, blue, term = label }) => (
      <g key={label}>
        <Term term={term}>
          <rect x={x - 80} y="32" width="160" height="22" className="cs-hit" />
          <text x={x} y="48" textAnchor="middle" className={accent ? "cs-name cs-accent-text" : blue ? "cs-name cs-blue-text" : "cs-name"}>{label}</text>
        </Term>
        <line x1={x} y1="58" x2={x} y2="320" className="cs-lifeline" />
      </g>
    ))}

    {/* While the claim is held, the other behaviors' lifeline is hatched out. */}
    <rect x="820" y="128" width="20" height="132" fill="url(#cs-hatch-seq)" className="cs-blocked" />
    <text x="830" y="278" textAnchor="middle" className="cs-note cs-accent-text">blocked</text>

    <g className="cs-wire" markerEnd="url(#cs-arrow-seq)">
      <line x1="70" y1="84" x2="256" y2="84" />
      <line x1="260" y1="108" x2="636" y2="108" />
      <line x1="260" y1="200" x2="818" y2="200" strokeDasharray="4 4" />
    </g>
    <g className="cs-wire-accent" markerEnd="url(#cs-arrow-seq-accent)">
      <line x1="640" y1="128" x2="454" y2="128" />
      <line x1="640" y1="260" x2="454" y2="260" />
    </g>

    <text x="165" y="78" textAnchor="middle" className="cs-note">right-click folder</text>
    <text x="450" y="102" textAnchor="middle" className="cs-note">deliver</text>
    <text x="545" y="122" textAnchor="middle" className="cs-note cs-accent-text">hold the mouse</text>
    <text x="545" y="254" textAnchor="middle" className="cs-note cs-accent-text">let go</text>
    <text x="350" y="194" textAnchor="middle" className="cs-note">next click → skipped</text>

    {/* State changes, marked on Activatable's lifeline */}
    <rect x="636" y="140" width="8" height="8" className="cs-fill-blue" />
    <text x="652" y="148" className="cs-state-line">Activating</text>
    <rect x="636" y="270" width="8" height="8" className="cs-fill-blue" />
    <text x="652" y="278" className="cs-state-line">Active</text>
    <text x="652" y="232" className="cs-note">animation done</text>
  </svg>
);

// A small behavior chip in Fig. 03: the owner, one that waits, or one that carries on.
// A behavior in Fig. 03: its name in a chip, and what it's doing right now underneath.
const Chip = ({ x, y, label, role, status }) => (
  <g className="cs-chip-surface">
    <rect x={x} y={y} width="124" height="30" className={`cs-chip cs-chip-${role}`} />
    {role === "waits" && <rect x={x} y={y} width="124" height="30" fill="url(#cs-hatch-modes)" />}
    <text x={x + 62} y={y + 20} textAnchor="middle" className="cs-state-line cs-chip-label">{label}</text>
    <text x={x + 62} y={y + 48} textAnchor="middle" className={role === "owner" ? "cs-note cs-accent-text" : "cs-note"}>{status}</text>
  </g>
);

// The folder's own two behaviors, in each of the three ways a claim can be held.
const modes = [
  {
    x: 0, term: "Take over", code: "InputClaim.Capture", say: "“Mine until I let go”",
    owner: ["Draggable", "holds"], other: ["Activatable", "waits", "waits"],
    example: ["Mid-drag, a right-click won't open", "the folder, and the drop still lands", "if the cursor slips off it."],
  },
  {
    x: 305, term: "Hold", code: "InputClaim.Block", say: "“Everyone wait”",
    owner: ["Activatable", "holds"], other: ["Draggable", "waits", "waits"],
    example: ["In Blocking mode, a drag", "started mid-animation does", "nothing."],
  },
  {
    x: 610, term: "Share", code: "InputClaim.Shared", say: "“Busy, but carry on”",
    owner: ["Activatable", "shares"], other: ["Draggable", "carries on", "free"],
    example: ["The folder's Graceful mode: you", "can pick it up while it's still", "opening."],
  },
];

const ModesDiagram = () => (
  <svg viewBox="-24 -8 948 306" role="img" aria-label="Three ways a behavior can hold the mouse, shown with the folder's two behaviors. Take over: Draggable holds the mouse and Activatable waits, so mid-drag a right-click won't open the folder and the drop still lands off it. Hold: Activatable holds and Draggable waits, so in Blocking mode a drag mid-animation does nothing. Share: Activatable shares and Draggable carries on, so in the folder's Graceful mode you can pick it up while it's opening.">
    <defs>
      <pattern id="cs-hatch-modes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" className="cs-hatch-line" />
      </pattern>
    </defs>
    <FigureLabel number="03" title="THREE WAYS TO HOLD THE MOUSE" />
    {modes.map(({ x, term, code, say, owner, other, example }) => (
      <g key={term} className="cs-component">
        <Node x={x} y={34} width={290} height={240} name={code} note={say} term={term} accent={term !== "Share"} />
        <Chip x={x + 12} y={92} label={owner[0]} status={owner[1]} role="owner" />
        <Chip x={x + 154} y={92} label={other[0]} status={other[1]} role={other[2]} />
        <line x1={x + 12} y1="164" x2={x + 278} y2="164" className="cs-lifeline" />
        <text x={x + 12} y={186} className="cs-note">ON THE FOLDER</text>
        {example.map((line, i) => <text key={line} x={x + 12} y={206 + i * 19} className="cs-state-line">{line}</text>)}
      </g>
    ))}
  </svg>
);

// Fig. 04: a behavior's machine holds named states; only the current one hears anything.
// What the same right-click means to each of Activatable's states (their ProcessInput).
const fsmStates = [
  { name: "Inactive", meaning: "would open it" },
  { name: "Activating", meaning: "would ignore it" },
  { name: "Active", meaning: "closes it" },
  { name: "Deactivating", meaning: "would ignore it" },
];

const MachineDiagram = () => (
  <svg viewBox="-24 -8 928 376" role="img" aria-label="When Activatable is added to an entity, it builds all four of its states at once, all ActivatableState, inside its finite state machine. Later, a right-click goes into the machine, which forwards it to the current state only. Active is current, so the right-click closes the folder. Had Inactive been current, the same click would open it; Activating and Deactivating would ignore it.">
    <defs>
      <Arrowhead id="cs-arrow-m" />
      <Arrowhead id="cs-arrow-m-accent" className="cs-fill-blue" />
    </defs>
    <FigureLabel number="04" title="EVERY STATE, FROM THE START" />
    <g className="cs-tone-green"><Node x={10} y={150} width={176} height={66} name="Activatable" note="listens for right-clicks" /></g>
    {/* Once, when the behavior is added: every state is built up front. */}
    <line x1="188" y1="166" x2="294" y2="166" className="cs-wire-blue" markerEnd="url(#cs-arrow-m-accent)" />
    <text x="236" y="158" textAnchor="middle" className="cs-note cs-blue-text">builds all</text>
    <text x="236" y="139" textAnchor="middle" className="cs-note cs-blue-text">once, on add:</text>
    {/* Every time after: input goes to the current state. */}
    <line x1="188" y1="200" x2="276" y2="200" className="cs-wire" markerEnd="url(#cs-arrow-m)" />
    <text x="232" y="220" textAnchor="middle" className="cs-note cs-accent-text">a right-click</text>

    <Frame x={280} y={40} width={600} height={304} name="FiniteStateMachine" note="holds named states" />
    <text x="300" y="104" className="cs-note">WHAT THAT SAME RIGHT-CLICK MEANS IN EACH STATE</text>

    {/* All four states share one base class. */}
    <rect x="296" y="118" width="568" height="104" className="cs-group" />
    <Term term="ActivatableState">
      <rect x="306" y="124" width="200" height="20" className="cs-hit" />
      <text x="310" y="139" className="cs-note cs-term-label">All four built together · ActivatableState</text>
    </Term>
    {fsmStates.map(({ name, meaning }, i) => {
      const x = 310 + i * 138;
      const current = name === "Active";
      return (
        <g key={name} className={current ? "cs-solid-blue" : "cs-dim"}>
          <Node x={x} y={150} width={126} height={58} name={name} note={meaning} term={name} />
        </g>
      );
    })}

    <Term term="Idle state"><rect x="306" y="230" width="150" height="20" className="cs-hit" /><text x="310" y="245" className="cs-note cs-term-label">idle: never hears it</text></Term>

    {/* Everything the machine receives goes to the current state only. */}
    <path d="M 300 296 H 649 V 212" className="cs-wire-blue" fill="none" markerEnd="url(#cs-arrow-m-accent)" />
    <text x="310" y="288" className="cs-note cs-blue-text">the right-click goes to the current state only</text>
    <Term term="Current state"><rect x="660" y="258" width="120" height="22" className="cs-hit" /><text x="660" y="274" className="cs-note cs-term-label">current state</text></Term>
  </svg>
);

// Fig. 05: the order of a state change, from FiniteStateMachineExperimental.ChangeState. The state's own
// code sits on the timeline; the optional callbacks (Godot Callables) branch off it to whatever the
// behavior attached.
const callbacks = [
  { x: 90, name: "OnExit" },
  { x: 365, name: "OnExitFinished" },
  { x: 530, name: "OnEnter" },
  { x: 845, name: "OnEnterFinished" },
];

const ChangeDiagram = () => (
  <svg viewBox="-24 -8 974 284" role="img" aria-label="Changing state, in order along a timeline: the OnExit callback fires if one is set, the old state's Exit method runs, the OnExitFinished callback fires; the machine makes the new state current; the OnEnter callback fires, the new state's Enter method runs and is told the previous state, and the OnEnterFinished callback fires. Callbacks are optional, and each calls a method on the behavior; for example, Activating's OnEnter calls Activatable's EmitActivating, which emits the Activating signal, which the scene wires to the folder's Open action.">
    <defs>
      <Arrowhead id="cs-arrow-c" />
      <Arrowhead id="cs-arrow-c-out" className="cs-fill-muted" />
    </defs>
    <FigureLabel number="05" title="CHANGING STATE" />
    <text x="20" y="44" className="cs-note">OPTIONAL CALLBACKS · EACH ONE CALLS A METHOD ON THE BEHAVIOR</text>

    {/* Callbacks: branch off the timeline, out to the behavior. */}
    {callbacks.map(({ x, name }) => (
      <g key={name}>
        <line x1={x} y1="135" x2={x} y2="88" className="cs-wire" strokeDasharray="3 3" markerEnd="url(#cs-arrow-c)" />
        <circle cx={x} cy="140" r="4" className="cs-callback-dot" />
        <Term term="Hook">
          <rect x={x - 66} y="60" width="132" height="24" rx="12" className="cs-pill" />
          <text x={x} y="76" textAnchor="middle" className="cs-state-line">{name}</text>
        </Term>
      </g>
    ))}

    {/* Timeline */}
    <line x1="20" y1="140" x2="926" y2="140" className="cs-wire" markerEnd="url(#cs-arrow-c)" />

    {/* The state's own code, on the timeline. */}
    <Node x={160} y={114} width={150} height={52} name="Exit()" note="old state's code" term="Enter / Exit" />
    <Node x={620} y={114} width={170} height={52} name="Enter(previous)" note="knows the last state" term="Enter / Exit" />

    {/* The swap between leaving and arriving. */}
    <line x1="447" y1="108" x2="447" y2="172" className="cs-wire-blue" strokeDasharray="3 3" />
    <text x="447" y="190" textAnchor="middle" className="cs-note cs-blue-text">current = new state</text>

    <text x="20" y="222" className="cs-note">OLD STATE LEAVES</text>
    <line x1="140" y1="218" x2="420" y2="218" className="cs-lifeline" />
    <text x="476" y="222" className="cs-note">NEW STATE ARRIVES</text>
    <line x1="600" y1="218" x2="920" y2="218" className="cs-lifeline" />

    {/* A worked example: callback -> behavior method -> signal -> entity action. */}
    <text x="20" y="256" className="cs-state-line">
      <tspan className="cs-note">E.G.  </tspan>
      <tspan className="cs-used-by">OnEnter</tspan> → Activatable's <tspan className="cs-used-by">EmitActivating()</tspan> → <tspan className="cs-accent-text">Activating</tspan> signal → scene wiring → the folder's <tspan className="cs-used-by">Open</tspan>
    </text>
  </svg>
);

// Fig. 06: Activatable's machine, the one behind the folder (ActivatableComponent).
// Lights up a state while the clip above is in it.
const LiveNode = ({ current, ...props }) => (
  <g className={current === props.name ? "cs-live" : undefined}><Node {...props} /></g>
);

// The four transitions, so the one just taken can flash.
const activatableEdges = [
  { id: "Inactive>Activating", x1: 292, y1: 94, x2: 608, y2: 94 },
  { id: "Activating>Active", x1: 725, y1: 136, x2: 725, y2: 248 },
  { id: "Active>Deactivating", x1: 608, y1: 290, x2: 292, y2: 290 },
  { id: "Deactivating>Inactive", x1: 175, y1: 248, x2: 175, y2: 136 },
];

const ActivatableDiagram = ({ current = null, edge = null }) => (
  <svg viewBox="-24 -8 937 376" role="img" aria-label="Activatable's states. It starts Inactive. A right-click calls back into Activatable's Activate, which asks to open; if the mouse can be claimed it moves to Activating, which emits Activating. When the animation finishes it moves to Active, which emits Activated and lets go of the mouse. A right-click asks to close, moving to Deactivating, which emits Deactivating. When that animation finishes it returns to Inactive, which emits Deactivated and lets go. In Graceful mode, a right-click mid-animation reverses between Activating and Deactivating.">
    <defs>
      <Arrowhead id="cs-arrow-a" />
      <Arrowhead id="cs-arrow-a-accent" className="cs-fill-accent" />
      <Arrowhead id="cs-arrow-a-blue" className="cs-fill-blue" />
    </defs>
    <FigureLabel number="06" title="THE FOLDER'S STATE MACHINE (ACTIVATABLE)" />

    <LiveNode current={current} x={60} y={70} width={230} height={64} name="Inactive" note="emits Deactivated · lets go" />
    <LiveNode current={current} x={610} y={70} width={230} height={64} name="Activating" note="emits Activating · animates" accent />
    <LiveNode current={current} x={610} y={250} width={230} height={64} name="Active" note="emits Activated · lets go" />
    <LiveNode current={current} x={60} y={250} width={230} height={64} name="Deactivating" note="emits Deactivating · animates" accent />

    {/* Start */}
    <circle cx="30" cy="102" r="6" className="cs-fill-ink" />
    <line x1="36" y1="102" x2="58" y2="102" className="cs-wire" markerEnd="url(#cs-arrow-a)" />

    {activatableEdges.map(({ id, ...line }) => (
      <line key={id} {...line} className={edge === id ? "cs-edge-live" : "cs-wire"}
        markerEnd={edge === id ? "url(#cs-arrow-a-blue)" : "url(#cs-arrow-a)"} />
    ))}
    <Term term="Callback">
      <rect x="330" y="72" width="240" height="18" className="cs-hit" />
      <text x="450" y="86" textAnchor="middle" className="cs-state-line">right-click → <tspan className="cs-term-label">callback: Activate()</tspan></text>
    </Term>
    <text x="450" y="112" textAnchor="middle" className="cs-note cs-accent-text">only if the mouse can be claimed</text>
    <text x="735" y="186" className="cs-state-line">animation finished</text>
    <text x="735" y="204" className="cs-note">(or at once, if not waiting)</text>
    <Term term="Callback">
      <rect x="320" y="268" width="260" height="18" className="cs-hit" />
      <text x="450" y="282" textAnchor="middle" className="cs-state-line">right-click → <tspan className="cs-term-label">callback: Deactivate()</tspan></text>
    </Term>
    <text x="450" y="308" textAnchor="middle" className="cs-note cs-accent-text">only if the mouse can be claimed</text>
    <text x="165" y="186" textAnchor="end" className="cs-state-line">animation finished</text>

    {/* Graceful mode: a right-click mid-animation reverses. */}
    <line x1="612" y1="132" x2="290" y2="252" className="cs-wire" strokeDasharray="5 4"
      markerStart="url(#cs-arrow-a)" markerEnd="url(#cs-arrow-a)" />
    <rect x="356" y="172" width="188" height="36" className="cs-seam-label-bg" />
    <text x="450" y="187" textAnchor="middle" className="cs-note">GRACEFUL MODE</text>
    <text x="450" y="202" textAnchor="middle" className="cs-state-line">right-click reverses</text>
  </svg>
);

// The folder's state machine figure, with the recorded clip driving it: the diagram follows the folder's real state.
const LiveActivatableFigure = () => {
  const [live, setLive] = useState({ state: "Inactive", edge: null });
  return (
    <figure className="cs-figure cs-figure-live">
      <FsmClipPlayer onStep={setLive} />
      <ActivatableDiagram current={live.state} edge={live.edge} />
      <CompactActivatable current={live.state} edge={live.edge} />
    </figure>
  );
};

// Two entities from the reception scene, recorded in the game, and what each one is made of.
const entities = [
  {
    name: "Folder",
    gif: folderGif,
    width: 940,
    height: 680,
    alt: "In the game's reception scene, a right-click opens the folder and a second right-click closes it. Then the folder is picked up, dragged a little and dropped.",
    summary: "Right-click to open and close it, drag it around the desk. The Folder owns what opening looks like; Activatable only decides when it happens.",
    simpleSummary: "Right-click to open and close it, and drag it around the desk. The folder decides what opening looks like; its open/close ability only decides when.",
    actions: ["Open", "Close", "Show open", "Show closed"],
    parts: [
      { name: "Draggable", kind: "Behavior", does: "Pick it up and move it around the desk.", simple: "Lets you pick it up and move it." },
      { name: "Activatable", kind: "Behavior", does: "Turns a right-click into \"activating\" and \"deactivating\" signals. It never opens anything itself. Folders share the mouse while animating, so a second right-click reverses mid-way.", simple: "Notices a right-click and says \"open now\" or \"close now\". A second click mid-animation turns it around." },
      { name: "Contents", kind: "Helper node", does: "Not a behavior: it only lets you reach the papers inside while the folder is open, and locks them during a drag.", simple: "Holds the papers inside. You can only reach them while it's open." },
    ],
  },
  {
    name: "Ticket",
    gif: ticketGif,
    width: 1000,
    height: 640,
    alt: "In the game's reception scene, the ticket dispenser is opened and its green button pressed. A green health permit prints onto the desk, and is then picked up and dragged across it.",
    summary: "Behavior reuse: the ticket is a completely different object from the folder, and it only exists once the dispenser prints it. It still drags exactly like the folder, because it has the same Draggable node. There's no ticket-specific drag code: the only ticket-specific part is what happens when a drag starts, and that's the ticket's own action.",
    simpleSummary: "Reuse: the ticket is a completely different object from the folder, yet it drags exactly the same way, because it was given the same drag ability. Nobody wrote dragging code just for tickets.",
    actions: ["Print", "Stop print animation"],
    parts: [
      { name: "Draggable", kind: "Behavior", reused: true, does: "The exact component the folder uses, unchanged. Adding the node is all it took for tickets to be picked up, moved and dropped. When a drag starts, its signal calls the ticket's Stop print animation.", simple: "The very same drag ability the folder has. Adding it was all it took." },
      { name: "Representation", kind: "Helper node", does: "Not a behavior: added by the printer to link the ticket to its miniature elsewhere in the scene.", simple: "Links the ticket to a small copy of it elsewhere in the room." },
    ],
  },
  {
    name: "Controllable Ticket",
    gif: controllableTicketGif,
    width: 1000,
    height: 640,
    alt: "In the game's reception scene, a ticket is printed and a SelectAndControllableComponent is attached to it. A click selects it: arrows and a dashed outline appear around it. The arrow keys then move it right, up, left and down, with the arrow for each direction lighting up, and Escape deselects it so the keys stop moving it.",
    summary: "The same ticket with one more behavior attached: click to select it, then move it with the arrow keys. Nothing about the ticket itself changed.",
    simpleSummary: "The same ticket with one more ability added: click it, then steer it with the arrow keys. The ticket itself didn't change at all.",
    footnote: "SelectAndControllable is a prototype for demo purposes. Ideally it would be two distinct behaviors: Selectable and Controllable.",
    actions: ["Print", "Stop print animation"],
    parts: [
      { name: "Draggable", kind: "Behavior", reused: true, does: "Same as the Ticket's, sharing left-click with selection.", simple: "Same as the ticket's." },
      { name: "SelectAndControllable", kind: "Behavior", fresh: true, does: "Click to select, arrow keys to move, Escape to let go.", simple: "Click to pick it, arrow keys to move it, Escape to let go." },
      { name: "Representation", kind: "Helper node", does: "Same as the Ticket's.", simple: "Same as the ticket's." },
    ],
  },
];

// Fig. 07: one item, two views. The booth (header viewport) and the desk (table) each hold a view of
// the same item; its ItemRepresentation shows one and hides the other, switching mid-drag.
const TwoViewsDiagram = () => (
  <svg viewBox="-24 -8 948 330" role="img" aria-label="One item, two views. The booth at the top holds the item's MiniDraggable, a small physics view that falls and pins to the board. The desk at the bottom holds its table entity, the full-size view with its behaviors. A line separates them; crossing it during a drag swaps which view is shown. One ItemRepresentation per item owns both views, showing one and hiding the other.">
    <defs><Arrowhead id="cs-arrow-07" /></defs>
    <FigureLabel number="07" title="ONE ITEM, TWO VIEWS" />

    <Frame x={20} y={36} width={560} height={110} name="Booth" note="header viewport · small, with physics" />
    <Node x={44} y={80} width={250} height={50} name="MiniDraggable" note="falls · pins to the board" />

    <line x1="20" y1="168" x2="580" y2="168" className="cs-seam" strokeDasharray="2 5" />
    <text x="300" y="162" textAnchor="middle" className="cs-note">the line: crossing it mid-drag swaps the view</text>

    <Frame x={20} y={190} width={560} height={110} name="Desk" note="table · full size, readable" />
    <Node x={44} y={234} width={250} height={50} name="Table entity" note="its behaviors handle input" />

    <g className="cs-solid-red"><Node x={660} y={136} width={240} height={64} name="ItemRepresentation" note="one per item · owns both" accent /></g>
    <g className="cs-wire" fill="none" markerEnd="url(#cs-arrow-07)">
      <path d="M660 156 H480 V105 H298" />
      <path d="M660 180 H480 V259 H298" />
    </g>
    <text x="780" y="226" textAnchor="middle" className="cs-note">shows one view,</text>
    <text x="780" y="243" textAnchor="middle" className="cs-note">hides the other</text>
  </svg>
);

const CompactTwoViews = () => (
  <div className="cs-compact">
    <div className="cs-compact-label"><b>Fig. 07</b> One item, two views</div>
    <div className="cs-compact-node">
      <div className="cs-compact-name">Booth · MiniDraggable</div>
      <p className="cs-compact-note">The small view at the top: falls, and pins to the board.</p>
    </div>
    <p className="cs-compact-explanation">Crossing the line mid-drag swaps the view.</p>
    <div className="cs-compact-node">
      <div className="cs-compact-name">Desk · Table entity</div>
      <p className="cs-compact-note">The full-size view, where the item's behaviors live.</p>
    </div>
    <div className="cs-compact-node" data-tone="accent">
      <div className="cs-compact-name">ItemRepresentation</div>
      <p className="cs-compact-note">One per item. Owns both views; shows one and hides the other.</p>
    </div>
  </div>
);

const EntityShowcase = ({ name, gif, width, height, alt, summary, simpleSummary = summary, actions, parts, footnote }) => (
  <div className="cs-entity">
    <CaseStudyMedia media={{ src: gif, width, height, name, alt, caption: `${name} · recorded in the reception scene` }} />
    <div className="cs-composition">
      <h4 className="typeset-card-title">{name}</h4>
      <p><Plain simple={simpleSummary}>{summary}</Plain></p>
      <p className="cs-eyebrow typeset-card-toner">Composition</p>
      <ul className="cs-parts">
        <li className="cs-part cs-part-root">
          <b>{name}</b>
          <span className="cs-kind typeset-card-toner">Entity</span>
          <span className="cs-does">
            <Plain simple="Can do:">Owns the actions:</Plain>{" "}
            {actions.map((action, i) => <span key={action}>{i > 0 && " · "}<span className="cs-action">{action}</span></span>)}
          </span>
        </li>
        {parts.map((part) => (
          <li key={part.name} className={part.kind === "Behavior" ? "cs-part" : "cs-part cs-part-helper"}>
            <b>{part.name}</b>
            <span className="cs-kinds">
              <span className="cs-kind typeset-card-toner">{part.kind}</span>
              {part.reused && <span className="cs-kind cs-kind-reused typeset-card-toner">Reused</span>}
              {part.fresh && <span className="cs-kind cs-kind-reused typeset-card-toner">New</span>}
            </span>
            <span className="cs-does"><Plain simple={part.simple ?? part.does}>{part.does}</Plain></span>
          </li>
        ))}
      </ul>
      {footnote && <p className="cs-entity-footnote cs-technical typeset-card-toner">* {footnote}</p>}
    </div>
  </div>
);

export const ThresholdCaseStudy = () => (
  <HintProvider lookup={entryFor}>
  <CompactDiagramTerms lookup={entryFor}>
  <CaseStudy className="case-study typeset-card-readable">
    <CaseStudyOpening id="project-2" summary="A game desk full of objects you can pick up, open, and use.">
      <p className="cs-eyebrow typeset-card-toner">Case study · Game systems · Godot / C#</p>
      <h1 className="typeset-title">Composing Behaviors: Input and State</h1>
      <p>A "Papers Please"-style game.</p>
      <p>
        <Plain simple={<>Every item on the desk (folders, papers, buttons, tools) is built from small, reusable{" "}
        <b>abilities</b>: one to press it, one to drag it, one to open it.</>}>Every item on its desk (folders, papers, buttons, tools) is an <b>entity</b> with small <b>behaviors</b>{" "}
        attached: pressable, draggable, activatable.</Plain>
      </p>
      <p>
        <Plain simple={<>Each ability also remembers what it's doing, like whether a folder is open or closed, so the same click can
        mean different things.</>}>Each behavior runs its own <b>finite state machine</b> to decide what an input means right now.</Plain>
      </p>
    </CaseStudyOpening>
<ReadingVersions overview={<> <section><h2 className="typeset-card-title">A working reception desk</h2><p>Move papers, use the desk tools, and hand documents back through the booth.</p><CaseStudyMedia media={{src:receptionPreview,width:960,height:600,name:"Reception desk",alt:"Papers are handed back through the reception booth.",caption:"The reception desk in play"}} /></section>
<section><h2 className="typeset-card-title">Small abilities, different objects</h2><p>A folder can open and move. A button can be pressed. Shared abilities make each object work.</p><figure className="cs-figure"><CompactGoal /></figure><CaseStudyMedia media={{src:folderGif,width:940,height:680,name:"Folder interaction",alt:"A folder opening and moving on the desk.",caption:"Open it. Move it. Close it."}} /></section>
<section><h2 className="typeset-card-title">One action at a time</h2><p>This diagram shows the folder moving between closed, opening, open and closing.</p><figure className="cs-figure"><CompactActivatable /></figure><CaseStudyMedia media={{src:ticketGif,width:1000,height:640,name:"Ticket interaction",alt:"A ticket being used on the desk.",caption:"The same interaction system, used for a ticket"}} /></section> </>}>


    <section>
      <h2 className="typeset-card-title">The Input System</h2>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">The goal</p>
        <p className="cs-callout-lead"><Plain simple={"Build every object by snapping together small abilities, like building blocks."}>Entities get their abilities by composing many possible behaviors.</Plain></p>
      </div>
      <HintCue />
      <figure className="cs-figure"><GoalDiagram /><CompactGoal /></figure>
      <div className="cs-solution">
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The solution</p>
          <ol className="cs-callout-points">
            <li><Plain simple={<>An object doesn't know which abilities it has. It only knows the <b>things it can do</b>, like open or close.</>}>The entity doesn't know its behaviors, only the <b>actions</b> it can do.</Plain></li>
            <li><Plain simple={<>A <b>coordinator</b> hears every click and key press, and decides which ability gets to respond.</>}>It passes every input to a <b>BehaviorCoordinator</b>, which makes sure the right behaviors invoke those actions at the right time.</Plain></li>
          </ol>
        </div>
      </div>
      <HintCue />
      <figure className="cs-figure"><OverviewDiagram /><CompactOverview /></figure>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">The Results: Behaviors in Action</h3>
      <p className="cs-prose">
        <Plain simple={"Examples from the game's reception desk. What each object can do comes from the abilities it was given, not from code written just for it."}>Two examples from the reception desk. Each is built from the same behaviors, so what they can do is decided
        by which child nodes they have, not by code written for that object.</Plain>
      </p>
      <div className="cs-entities">
        <EntityShowcase {...entities[0]} />
        <EntityShowcase {...entities[1]} />
        <EntityShowcase {...entities[2]} />
        <p className="cs-entity-pointer cs-technical">How do Draggable and Selectable share left-click? See <i>Extras</i> below.</p>
      </div>
      </div>

      <div className="cs-subsection cs-prose cs-conclusions">
      <h3 className="typeset-card-title">Conclusions</h3>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">Conclusion</p>
        <p className="cs-callout-body">
        <Plain simple={"Game engines come with ready-made ways to handle clicks and key presses, and they work fine. But building my own foundation leaves more room for creativity in everything built on top of it."}>Game engines already provide many tools for input handling. They're great for rapid development, and can
        even be used as-is throughout a whole game. But I find that there is more room for creativity when we get to
        define how things are built at a foundational level.</Plain>
        </p>
      </div>
      <blockquote>"Good foundations make for good games."</blockquote>
      </div>

      {/* Optional depth, closed by default so the main story reads cleanly. */}
      <details className="cs-subsection cs-extras cs-technical">
      <summary>
        <span className="cs-extras-kicker typeset-card-toner">Extras</span>
        <h3 className="typeset-card-title" data-outline-label="Extras: Input Claims (Draggable vs Selectable on a Left Click)">Input Claims <span className="cs-extras-sub">(Draggable vs Selectable on a Left Click)</span></h3>
        <span className="cs-extras-toggle typeset-card-toner" aria-hidden="true" />
      </summary>
      <p className="cs-prose">
        Behaviors claim input from the InputCoordinator. A claim is made per input kind, like the mouse or the
        keyboard, and each behavior declares whether it waits while another behavior holds that input. A claim can
        be held in three ways:
      </p>
      <HintCue />
      <figure className="cs-figure"><ModesDiagram /><CompactModes modes={modes} /></figure>

      <div className="cs-callout cs-callout-question">
        <p className="cs-callout-body">
          So on a left-click, Draggable takes an <code>InputClaim.Capture</code> on the mouse for the drag. Selectable
          only claims the keyboard and doesn't wait on mouse claims, so the drag's capture doesn't hide the click from
          it. The InputCoordinator delivers the one click to both, and a test checks it: one left-click starts a drag
          <i> and</i> selects.
        </p>
      </div>

      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">Ties</p>
        <p className="cs-callout-body">
          The coordinator itself never breaks a tie: claims are first come, first served. An exclusive claim refuses
          anyone who arrives after it, and only one behavior can capture an input at a time. Who arrives first is the
          delivery order: a behavior's <code>InputPriority</code>, then the order behaviors registered, which for
          behaviors placed in the scene is their order under the entity. The scene tree shows who wins a tie.
        </p>
      </div>
      </details>
    </section>

    <Separator className="cs-separator-section" />
    <section>
      <h2 className="typeset-card-title">The Finite State Machine</h2>
      <p className="cs-prose">
        <Plain simple={<>The first part decided <i>which</i> ability responds to a click. This part is about what the click{" "}
        <i>means right now</i>.</>}>The input system decides <i>who</i> gets an input. Each behavior's finite state machine decides what that
        input <i>means right now</i>.</Plain>
      </p>
      <p className="cs-prose">
        <Plain simple={<>A right-click means "open" to a closed folder and "close" to an open one. A <b>state machine</b> is simply
        the part that remembers which one the folder is.</>}>A right-click means "open" to a closed folder and "close" to an open one. The state machine is what
        remembers which one the folder is.</Plain>
      </p>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">A Behavior Must Own Its State</h3>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">The rule</p>
        <p className="cs-callout-body">
        <Plain simple={<>Every situation an ability can be in (closed, opening, open, closing) is prepared up front. Only the
        current one listens to clicks.</>}>When a behavior is added to an entity, it builds <i>all</i> of its states at once. None are created later:
        changing state only changes which one is current, and only the current one hears the input.</Plain>
        </p>
      </div>
      <HintCue />
      <figure className="cs-figure"><MachineDiagram /><CompactMachine states={fsmStates} /></figure>
      <p className="cs-caption">
        <Plain simple={"That's how one right-click can open or close the folder: whichever situation it's in decides."}>The same right-click closes an open folder and opens a closed one. The other states are already there;
        they just don't hear it.</Plain>
      </p>
      </div>

      <div className="cs-subsection cs-technical">
      <h3 className="typeset-card-title">Changing State</h3>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">The rule</p>
        <p className="cs-callout-body">
        A change always runs in the same order: the old state leaves completely before the new one arrives. The new
        state is told which state came before it.
        </p>
      </div>
      <HintCue />
      <figure className="cs-figure"><ChangeDiagram /><CompactChange callbacks={callbacks} /></figure>
      <p className="cs-caption">
        The pills are callbacks, not steps of the state itself. Each one calls a method on the behavior, and that
        method is what leads to an action: it emits a signal, and the scene wires the signal to the entity's own
        action. Callbacks a behavior leaves unset are simply skipped. Knowing the previous
        state matters too: Active only announces "Activated" when it was reached by opening, not when it was set
        directly.
      </p>
      </div>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">The Folder's State Machine</h3>
      <p className="cs-prose">
        <Plain simple={<>The folder's open/close ability has four situations: closed, opening, open and closing. The "-ing" ones
        give the animation time to play. Watch the diagram follow along with the game.</>}>Activatable, the behavior that opens and closes the folder, has four states. The "-ing" states exist so an
        animation can play before the change counts, and they're also where the two systems meet: starting one
        takes a claim on the mouse, and finishing one lets it go.</Plain>
      </p>
      <HintCue />
      <LiveActivatableFigure />
      <p className="cs-caption">
        <Plain simple={"Each step tells the folder what to show, like playing its opening animation. The ability never changes the folder directly."}>Each state emits a signal on arrival, and the scene wires those signals to the folder's own actions, like
        playing its opening animation. Activatable itself never touches the folder.</Plain>
      </p>
      </div>

      <div className="cs-subsection cs-prose cs-conclusions">
      <h3 className="typeset-card-title">Conclusions</h3>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">Conclusion</p>
        <p className="cs-callout-body">
        <Plain simple={'Instead of tracking everything that has happened, each ability only needs one answer: "what situation am I in?" That keeps each piece small and easy to change.'}>A state machine turns "what has happened so far?" into a single answer: the current state. Each state stays
        a few lines long because it never has to think about other behaviors; deciding who gets the input is the
        input system's job.</Plain>
        </p>
        <p className="cs-callout-body cs-technical">
        And when a behavior doesn't need states at all, it doesn't have to have them. Draggable has no state
        machine, and it plugs into the same input system as everything else.
        </p>
      </div>
      </div>
    </section>

    <Separator className="cs-separator-section" />

    <section>
      <h2 className="typeset-card-title">The Desk and the Booth</h2>
      <p className="cs-prose">
        <Plain simple={'Papers, Please splits the screen in two: a small booth window where people stand, and a big desk where you read their papers. Drag a paper across the line between them and it changes size.'}>
        Papers, Please is built on a split screen: a small booth view where the entrant stands, and a large desk where
        documents are read. Dragging a document across the line between them shrinks or enlarges it. Recreating that
        meant deciding what a document <i>is</i> when it exists in two places.</Plain>
      </p>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">The goal</p>
        <p className="cs-callout-lead">
          <Plain simple="A paper stays the same paper wherever it is: on the desk, in the booth, or in someone's hands.">
          One item, two views: a document moves between the booth and the desk as the same object, never a copy.</Plain>
        </p>
      </div>
      <HintCue />
      <figure className="cs-figure"><TwoViewsDiagram /><CompactTwoViews /></figure>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">One Item, Two Views</h3>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">The rule</p>
        <p className="cs-callout-body">
        <Plain simple="Every paper has one owner that keeps both its desk version and its booth version. Only one shows at a time, so a paper can never be in two places at once.">
        Each item has one ItemRepresentation that owns both of its views. Only one is visible at a time; the other is
        hidden, never destroyed, so the item's identity and contents can't split.</Plain>
        </p>
      </div>
      <p className="cs-caption">
        <Plain simple="While you drag, the paper changes size the moment it crosses the line. Let go and it stays on that side.">
        During a drag, every frame asks one question: is the pointer over the desk? The answer picks the visible view.
        Letting go commits the item's location; cancelling puts it back where it started.</Plain>
      </p>
      </div>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">Handing Things Over</h3>
      <div className="cs-entity">
        <CaseStudyMedia media={{ src: receptionPreview, width: 960, height: 600, name: "Bob's hand-over", alt: "In the reception scene, a ticket is dragged from the desk up into the booth and dropped in the basket, and Bob collects her papers and leaves.", caption: "Hand-over · recorded in the reception scene" }} />
        <div className="cs-composition cs-prose">
          <p>
            <Plain simple="When someone hands you their papers, they arrive already inside the folder. Anything you hand back goes into the basket, which records what you returned.">
            When a character hands over documents, the ItemProvisioner loads the requested papers into the folder first,
            then presents it at the character, so the folder never arrives empty. Papers handed back land in the
            basket, which scores them by type.</Plain>
          </p>
          <p className="cs-technical">
            Collected tickets are destroyed with their miniature, rather than hidden somewhere off-screen.
          </p>
        </div>
      </div>
      </div>

      <div className="cs-subsection cs-prose">
      <h3 className="typeset-card-title">Paper Only When Needed</h3>
      <p>
        <Plain simple="Nothing is made before it's needed. A paper's booth version appears the first time it's dragged up, and a ticket only exists once it's printed.">
        Booth views are created on first use, not at load: reception starts with no physics bodies at all. Tickets
        don't exist until they're printed: the printer reserves one from the day's stock, creates it, and returns the
        stock if creation fails.</Plain>
      </p>
      </div>

      <div className="cs-subsection cs-prose cs-conclusions">
      <h3 className="typeset-card-title">Conclusions</h3>
      <div className="cs-callout">
        <p className="cs-callout-label typeset-card-toner">Conclusion</p>
        <p className="cs-callout-body">
        <Plain simple="Because every paper has exactly one owner, everything else (the folder, the basket, the printer) can treat it as one thing, whichever size it's shown at.">
        Separating an item's identity from how it's shown is what made the hand-off simple. Dragging, folders, the
        basket and the printer all talk to one owner per item, and none of them care which view is on screen.</Plain>
        </p>
        <p className="cs-callout-body cs-technical">
        It's covered by 101 automated checks across the miniature (41), reception flow (22) and drag session (38)
        test suites.
        </p>
      </div>
      </div>
    </section>

  </ReadingVersions>
    </CaseStudy>
  </CompactDiagramTerms>
  </HintProvider>
);

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { FsmClipPlayer } from "./FsmClipPlayer.jsx";
import { CompactDiagramTerms, CompactOverview, CompactSequence, CompactModes, CompactMachine, CompactChange, CompactActivatable } from "./CompactDiagrams.jsx";
import { createPortal } from "react-dom";
import folderGif from "@/gifs/threshold-folder.gif";
import ticketGif from "@/gifs/threshold-ticket.gif";
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
];

const entryFor = (term) => glossary.find((entry) => entry.term === term);

// The figures tell the hint which box is active; null hides it.
const HintContext = createContext(() => {});

// Makes a figure element a hint target: hover or focus shows its definition, tap toggles it.
const Term = ({ term, children }) => {
  const showHint = useContext(HintContext);
  if (!entryFor(term)) return children;
  const show = (event) => showHint({ term, rect: event.currentTarget.getBoundingClientRect() });
  return (
    <g
      className="cs-term"
      tabIndex={0}
      role="button"
      aria-label={term}
      aria-describedby="cs-hint"
      onMouseEnter={show}
      onMouseLeave={() => showHint(null)}
      onFocus={show}
      onBlur={() => showHint(null)}
    >
      {children}
    </g>
  );
};

const HINT_WIDTH = 300;
const GAP = 10;

// The hint card, placed below the box (or above when there's no room), kept inside the window.
// It's portalled to the body so the figure's scroll box can't clip it.
const Hint = ({ hint }) => {
  if (!hint) return null;
  const { term, rect } = hint;
  const width = Math.min(HINT_WIDTH, window.innerWidth - 2 * GAP);
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, GAP), window.innerWidth - width - GAP);
  const below = window.innerHeight - rect.bottom > 180;
  const style = below
    ? { left, width, top: rect.bottom + GAP }
    : { left, width, bottom: window.innerHeight - rect.top + GAP };
  return createPortal(
    <div id="cs-hint" role="tooltip" className="cs-hint typeset-card-readable" style={style}>
      <p className="cs-hint-term typeset-card-toner">{term}</p>
      <div>{entryFor(term).definition}</div>
    </div>,
    document.body,
  );
};

// The cue that the figures are interactive, worded for the pointer the visitor has.
const HintCue = () => {
  const [touch] = useState(() => window.matchMedia("(hover: none)").matches);
  return <p className="cs-cue typeset-card-toner"><span className="cs-cue-mark" aria-hidden="true">+</span><span className="cs-cue-pointer">{touch ? "Tap" : "Hover"} any box for details</span><span className="cs-cue-compact">Tap a component to expand details</span></p>;
};

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

const OverviewDiagram = () => (
  <svg viewBox="0 0 900 536" role="img" aria-label="Godot sends engine events to an entity. Inside the entity, its behavior coordinator, the messenger, owns an input coordinator, the referee. The messenger asks the referee whether each behavior may act, then delivers events through BehaviorBase to Pressable, Activatable and Draggable, which claim and release the mouse with the referee directly. The behaviors emit signals that the scene connects to the entity's own actions. The behaviors are the entity's child nodes in the Godot scene tree, and each registers itself with the BehaviorCoordinator the entity has.">
    <defs>
      <Arrowhead id="cs-arrow" />
      <Arrowhead id="cs-arrow-accent" className="cs-fill-accent" />
      <Arrowhead id="cs-arrow-yellow" className="cs-fill-yellow" />
    </defs>
    <FigureLabel number="01" title="INPUT ROUTING" />

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

    {/* How it looks in Godot: the behaviors are the entity's child nodes, and each registers
        itself with the BehaviorCoordinator the entity holds. */}
    <g className="cs-tree" transform="translate(0 -50)">
      <text x="44" y="458" className="cs-note">IN THE GODOT SCENE TREE</text>
      <text x="44" y="484" className="cs-name">Entity</text>
      <line x1="98" y1="480" x2="212" y2="480" className="cs-tree-line" strokeDasharray="3 3" markerEnd="url(#cs-arrow)" />
      <text x="155" y="473" textAnchor="middle" className="cs-note">has</text>
      <text x="218" y="484" className="cs-name">BehaviorCoordinator</text>
      <line x1="52" y1="490" x2="52" y2="568" className="cs-tree-line" />
      {["Pressable", "Activatable", "Draggable", "…"].map((child, i) => (
        <g key={child}>
          <line x1="52" y1={508 + i * 20} x2="66" y2={508 + i * 20} className="cs-tree-line" />
          <text x="72" y={512 + i * 20} className={child === "…" ? "cs-note" : "cs-state-line"}>{child}</text>
          {child === "…"
            ? <line x1="256" y1={508 + i * 20} x2="300" y2={508 + i * 20} className="cs-wire" strokeDasharray="3 3" />
            : <line x1="164" y1={508 + i * 20} x2="300" y2={508 + i * 20} className="cs-wire" />}
        </g>
      ))}
      {/* Right-angled: each behavior joins one riser that goes up into the coordinator. */}
      <line x1="300" y1="568" x2="300" y2="490" className="cs-wire" markerEnd="url(#cs-arrow)" />
      <text x="310" y="530" className="cs-note">register</text>
      <text x="96" y="572" className="cs-note">any number of behaviors</text>
    </g>

  </svg>
);

const lanes = [
  { x: 70, label: "Player" },
  { x: 260, label: "Coordinator", term: "BehaviorCoordinator" },
  { x: 450, label: "InputCoordinator", accent: true },
  { x: 640, label: "Activatable", blue: true },
  { x: 830, label: "Pressable · Draggable", term: "Pressable" },
];

const SequenceDiagram = () => (
  <svg viewBox="0 0 900 330" role="img" aria-label="Sequence: right-click on a folder. The coordinator delivers it to Activatable, which claims a block and enters Activating. While blocked, clicks for Pressable and Draggable are skipped. When the animation completes, Activatable enters Active and releases the claim.">
    <defs>
      <Arrowhead id="cs-arrow-seq" />
      <Arrowhead id="cs-arrow-seq-accent" className="cs-fill-accent" />
      <pattern id="cs-hatch-seq" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" className="cs-hatch-line-accent" />
      </pattern>
    </defs>
    <FigureLabel number="02" title="A BLOCKING TRANSITION" />

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
const Chip = ({ x, y, label, role }) => (
  <g className="cs-chip-surface">
    <rect x={x} y={y} width="78" height="26" className={`cs-chip cs-chip-${role}`} />
    {role === "waits" && <rect x={x} y={y} width="78" height="26" fill="url(#cs-hatch-modes)" />}
    <text x={x + 39} y={y + 17} textAnchor="middle" className="cs-state-line cs-chip-label">{label}</text>
  </g>
);

const modes = [
  { x: 0, term: "Take over", say: "\u201cMine until I let go\u201d", others: "waits", note: "follows the cursor off the item", usedBy: "dragging" },
  { x: 305, term: "Hold", say: "\u201cEveryone wait\u201d", others: "waits", note: "nothing reacts mid-animation", usedBy: "a folder opening" },
  { x: 610, term: "Share", say: "\u201cBusy, but carry on\u201d", others: "carries on", note: "can be bumped by a take-over", usedBy: "Folder", usedFor: ["Allows dragging while", "mid activation"] },
];

const ModesDiagram = () => (
  <svg viewBox="0 0 900 290" role="img" aria-label="Three ways a behavior can hold the mouse. Take over: others wait and it follows the cursor off the item, used by dragging. Hold: others wait while a folder animates. Share: others carry on, and a take-over can bump it, used by the folder, which allows dragging while mid activation.">
    <defs>
      <pattern id="cs-hatch-modes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" className="cs-hatch-line" />
      </pattern>
    </defs>
    <FigureLabel number="03" title="THREE WAYS TO HOLD THE MOUSE" />
    {modes.map(({ x, term, say, others, note, usedBy, usedFor }) => (
      <g key={term} className="cs-component">
        <Node x={x} y={34} width={290} height={240} name={term} note={say} accent={term !== "Share"} />
        <Chip x={x + 12} y={96} label="this one" role="owner" />
        <Chip x={x + 104} y={96} label={others} role={others === "waits" ? "waits" : "free"} />
        <Chip x={x + 196} y={96} label={others} role={others === "waits" ? "waits" : "free"} />
        <text x={x + 12} y={154} className="cs-state-line">{note}</text>
        <line x1={x + 12} y1="174" x2={x + 278} y2="174" className="cs-lifeline" />
        <text x={x + 12} y={196} className="cs-note">USED BY</text>
        <text x={x + 12} y={214} className={usedFor ? "cs-state-line cs-used-by" : "cs-state-line"}>{usedBy}</text>
        {usedFor?.map((line, i) => <text key={line} x={x + 12} y={234 + i * 18} className="cs-note">{line}</text>)}
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
  <svg viewBox="0 0 900 360" role="img" aria-label="The same right-click goes from Activatable into its finite state machine, which holds four named states, all ActivatableState, and forwards it to the current one only. Active is current, so the right-click closes the folder. Had Inactive been current, the same click would open it; Activating and Deactivating would ignore it.">
    <defs>
      <Arrowhead id="cs-arrow-m" />
      <Arrowhead id="cs-arrow-m-accent" className="cs-fill-blue" />
    </defs>
    <FigureLabel number="04" title="ONE STATE AT A TIME" />
    <g className="cs-tone-green"><Node x={10} y={150} width={176} height={66} name="Activatable" note="listens for right-clicks" /></g>
    <line x1="188" y1="183" x2="276" y2="183" className="cs-wire" markerEnd="url(#cs-arrow-m)" />
    <text x="232" y="175" textAnchor="middle" className="cs-note cs-accent-text">a right-click</text>

    <Frame x={280} y={40} width={600} height={304} name="FiniteStateMachine" note="holds named states" />
    <text x="300" y="104" className="cs-note">WHAT THAT SAME RIGHT-CLICK MEANS IN EACH STATE</text>

    {/* All four states share one base class. */}
    <rect x="296" y="118" width="568" height="104" className="cs-group" />
    <Term term="ActivatableState">
      <rect x="306" y="124" width="200" height="20" className="cs-hit" />
      <text x="310" y="139" className="cs-note cs-term-label">ActivatableState · all four inherit it</text>
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
  <svg viewBox="0 0 940 268" role="img" aria-label="Changing state, in order along a timeline: the OnExit callback fires if one is set, the old state's Exit method runs, the OnExitFinished callback fires; the machine makes the new state current; the OnEnter callback fires, the new state's Enter method runs and is told the previous state, and the OnEnterFinished callback fires. Callbacks are optional, and each calls a method on the behavior; for example, Activating's OnEnter calls Activatable's EmitActivating, which emits the Activating signal, which the scene wires to the folder's Open action.">
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
  <svg viewBox="0 0 900 360" role="img" aria-label="Activatable's states. It starts Inactive. A right-click calls back into Activatable's Activate, which asks to open; if the mouse can be claimed it moves to Activating, which emits Activating. When the animation finishes it moves to Active, which emits Activated and lets go of the mouse. A right-click asks to close, moving to Deactivating, which emits Deactivating. When that animation finishes it returns to Inactive, which emits Deactivated and lets go. In Graceful mode, a right-click mid-animation reverses between Activating and Deactivating.">
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

// Fig. 06 with the recorded clip driving it: the diagram follows the folder's real state.
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
    alt: "In the game's reception scene, a right-click opens the folder and a second right-click closes it. Then the folder is picked up, dragged a little and dropped.",
    summary: "Right-click to open and close it, drag it around the desk. The Folder owns what opening looks like; Activatable only decides when it happens.",
    actions: ["Open", "Close", "Show open", "Show closed"],
    parts: [
      { name: "Draggable", kind: "Behavior", does: "Pick it up and move it around the desk." },
      { name: "Activatable", kind: "Behavior", does: "Turns a right-click into \"activating\" and \"deactivating\" signals. It never opens anything itself. Folders share the mouse while animating, so a second right-click reverses mid-way." },
      { name: "Contents", kind: "Helper node", does: "Not a behavior: it only lets you reach the papers inside while the folder is open, and locks them during a drag." },
    ],
  },
  {
    name: "Ticket",
    gif: ticketGif,
    alt: "In the game's reception scene, the ticket dispenser is opened and its green button pressed. A green health permit prints onto the desk, and is then picked up and dragged across it.",
    summary: "Behavior reuse: the ticket is a completely different object from the folder, and it only exists once the dispenser prints it. It still drags exactly like the folder, because it has the same Draggable node. There's no ticket-specific drag code: the only ticket-specific part is what happens when a drag starts, and that's the ticket's own action.",
    actions: ["Print", "Stop print animation"],
    parts: [
      { name: "Draggable", kind: "Behavior", reused: true, does: "The exact component the folder uses, unchanged. Adding the node is all it took for tickets to be picked up, moved and dropped. When a drag starts, its signal calls the ticket's Stop print animation." },
      { name: "Representation", kind: "Helper node", does: "Not a behavior: added by the printer to link the ticket to its miniature elsewhere in the scene." },
    ],
  },
];

const EntityShowcase = ({ name, gif, alt, summary, actions, parts }) => (
  <div className="cs-entity">
    <figure className="cs-gif">
      <img src={gif} alt={alt} loading="lazy" />
      <figcaption className="typeset-card-toner">{name} · recorded in the reception scene</figcaption>
    </figure>
    <div className="cs-composition">
      <h4 className="typeset-card-title">{name}</h4>
      <p>{summary}</p>
      <p className="cs-eyebrow typeset-card-toner">Composition</p>
      <ul className="cs-parts">
        <li className="cs-part cs-part-root">
          <b>{name}</b>
          <span className="cs-kind typeset-card-toner">Entity</span>
          <span className="cs-does">
            Owns the actions:{" "}
            {actions.map((action, i) => <span key={action}>{i > 0 && " · "}<span className="cs-action">{action}</span></span>)}
          </span>
        </li>
        {parts.map((part) => (
          <li key={part.name} className={part.kind === "Behavior" ? "cs-part" : "cs-part cs-part-helper"}>
            <b>{part.name}</b>
            <span className="cs-kinds">
              <span className="cs-kind typeset-card-toner">{part.kind}</span>
              {part.reused && <span className="cs-kind cs-kind-reused typeset-card-toner">Reused</span>}
            </span>
            <span className="cs-does">{part.does}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export const ThresholdCaseStudy = () => {
  const [hint, setHint] = useState(null);
  const showHint = useCallback((next) => setHint(next), []);

  useEffect(() => {
    if (!hint) return undefined;
    const hide = () => setHint(null);
    const onKey = (event) => event.key === "Escape" && hide();
    window.addEventListener("scroll", hide, { passive: true, capture: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", hide, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [hint]);

  return (
  <HintContext.Provider value={showHint}>
  <CompactDiagramTerms lookup={entryFor}>
  <article className="case-study typeset-card-readable">
    <header className="cs-prose">
      <p className="cs-eyebrow typeset-card-toner">Case study · Game systems · Godot / C#</p>
      <h1 className="typeset-title">How things on the desk respond to you</h1>
      <p>A "Papers Please"-style game.</p>
      <p>
        Every item on its desk (folders, papers, buttons, tools) is an <b>entity</b> with small <b>behaviors</b>{" "}
        attached: pressable, draggable, activatable.
      </p>
      <p>
        Each behavior runs its own <b>finite state machine</b> to decide what an input means right now.
      </p>
    </header>

    <section>
      <h2 className="typeset-card-title">The Input System</h2>
      <HintCue />
      <figure className="cs-figure"><OverviewDiagram /><CompactOverview /></figure>
      <p className="cs-caption"><b>The Goal:</b> Simple Composable Behaviors for Entities.</p>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">Behaviors in action</h3>
      <p className="cs-prose">
        Two examples from the reception desk. Each is built from the same behaviors, so what they can do is decided
        by which child nodes they have, not by code written for that object.
      </p>
      <div className="cs-entities">
        <EntityShowcase {...entities[0]} />
        {/* What happens inside the folder on that right-click, right after seeing it. */}
        <div className="cs-inside">
          <p className="cs-prose">
            Inside that right-click: Activatable's state change takes a claim on the mouse, and that claim changes
            what every <i>other</i> behavior receives. The two never call each other.
          </p>
          <HintCue />
          <figure className="cs-figure"><SequenceDiagram /><CompactSequence /></figure>
          <p className="cs-caption">
            Shown in Blocking mode, the default: the folder holds the mouse while it animates. The folder in the GIF
            uses Graceful mode instead, sharing the mouse so nothing is paused, and a second right-click mid-animation
            reverses it.
          </p>
        </div>
        <EntityShowcase {...entities[1]} />
      </div>
      </div>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">Holding the mouse, three ways</h3>
      <p className="cs-prose">
        Claiming input isn't all-or-nothing. Each behavior says how it holds the mouse, and separately whether it
        agrees to wait for others. That one split is what lets the same folder be clicked, dragged and opened
        without any of the three knowing about the others.
      </p>
      <HintCue />
      <figure className="cs-figure"><ModesDiagram /><CompactModes modes={modes} /></figure>
      </div>

      <div className="cs-subsection cs-prose cs-conclusions">
      <h3 className="typeset-card-title">Conclusions</h3>
      <p>
        Game engines already provide many tools for input handling. They're great for rapid development, and can
        even be used as-is throughout a whole game. But I find that there is more room for creativity when we get to
        define how things are built at a foundational level.
      </p>
      <blockquote>"Good foundations make for good games."</blockquote>
      </div>
    </section>

    <section>
      <h2 className="typeset-card-title">The Finite State Machine</h2>
      <div className="cs-prose">
        <p>
          The input system decides <i>who</i> gets an input. Each behavior's finite state machine decides what that
          input <i>means right now</i>.
        </p>
        <p>
          A right-click means "open" to a closed folder and "close" to an open one. The state machine is what
          remembers which one the folder is.
        </p>
      </div>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">One state at a time</h3>
      <p className="cs-prose">
        A behavior builds its machine once, when it's added to an entity, out of named states. From then on, only
        the current state hears anything: every frame and every click goes to it alone.
      </p>
      <HintCue />
      <figure className="cs-figure"><MachineDiagram /><CompactMachine states={fsmStates} /></figure>
      <p className="cs-caption">
        Within one behavior, the input never changes; only the current state does. The same right-click closes an
        open folder and opens a closed one, and the idle states never even hear it. Other behaviors may listen for
        different input altogether, each with its own machine.
      </p>
      </div>

      <div className="cs-subsection">
      <h3 className="typeset-card-title">Changing state</h3>
      <p className="cs-prose">
        A change always runs in the same order: the old state leaves completely before the new one arrives. The new
        state is told which state came before it.
      </p>
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
      <h3 className="typeset-card-title">The folder's state machine</h3>
      <p className="cs-prose">
        Activatable, the behavior that opens and closes the folder, has four states. The "-ing" states exist so an
        animation can play before the change counts, and they're also where the two systems meet: starting one
        takes a claim on the mouse, and finishing one lets it go.
      </p>
      <HintCue />
      <LiveActivatableFigure />
      <p className="cs-caption">
        Each state emits a signal on arrival, and the scene wires those signals to the folder's own actions, like
        playing its opening animation. Activatable itself never touches the folder.
      </p>
      </div>

      <div className="cs-subsection cs-prose cs-conclusions">
      <h3 className="typeset-card-title">Conclusions</h3>
      <p>
        A state machine turns "what has happened so far?" into a single answer: the current state. Each state stays
        a few lines long because it never has to think about other behaviors; deciding who gets the input is the
        input system's job.
      </p>
      <p>
        And when a behavior doesn't need states at all, it doesn't have to have them. Draggable has no state
        machine, and it plugs into the same input system as everything else.
      </p>
      </div>
    </section>

  </article>
  </CompactDiagramTerms>
  <Hint hint={hint} />
  </HintContext.Provider>
  );
};

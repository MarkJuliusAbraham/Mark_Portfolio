import { createContext, useContext } from "react";
import "./compact-diagrams.css";

const Terms = createContext(() => null);
export const CompactDiagramTerms = ({ lookup, children }) => <Terms.Provider value={lookup}>{children}</Terms.Provider>;

const Label = ({ number, children }) => <div className="cs-compact-label"><b>Fig. {number}</b> {children}</div>;

const Component = ({ name, term = name, note, tone, current, children }) => {
  const lookup = useContext(Terms);
  const definition = lookup(term)?.definition;
  return (
    <div className="cs-compact-node" data-tone={tone} data-current={current || undefined}>
      {current && <span className="cs-compact-current">Current state</span>}
      {definition ? (
        <details className="cs-compact-term">
          <summary>{name}<span aria-hidden="true">+</span></summary>
          <div className="cs-compact-definition">{definition}</div>
        </details>
      ) : <div className="cs-compact-name">{name}</div>}
      {note && <p className="cs-compact-note">{note}</p>}
      {children}
    </div>
  );
};

const Connection = ({ children }) => <div className="cs-compact-connection"><svg viewBox="0 0 20 24" aria-hidden="true"><path d="M10 1v20m-6-6 6 6 6-6" /></svg><span>{children}</span></div>;

const Flow = ({ steps }) => (
  <ol className="cs-compact-flow">
    {steps.map(({ connection, ...step }, i) => <li key={`${step.name}-${i}`}><Component {...step} />{connection && <Connection>{connection}</Connection>}</li>)}
  </ol>
);

export const CompactOverview = () => (
  <div className="cs-compact">
    <Label number="01">Input routing</Label>
    <Component name="Godot engine" note="Clicks, keys, and every frame" />
    <Connection>Forwards every event</Connection>
    <div className="cs-compact-group">
      <h4>Entity</h4>
      <p>A game object, such as a folder or paper.</p>
      <div className="cs-compact-group cs-compact-group-shaded">
        <h4>BehaviorCoordinator</h4>
        <p>The messenger owns the referee below.</p>
        <Component name="InputCoordinator" tone="red" note="Checks which behaviors may act" />
      </div>
      <Connection>Delivers each event through BehaviorBase</Connection>
      <div className="cs-compact-stack">
        {["Pressable", "Activatable", "Draggable"].map(name => <Component key={name} name={name} tone="green" note="Child node · registers with the coordinator" />)}
      </div>
      <p className="cs-compact-explanation">Each behavior asks the InputCoordinator to claim or release input. The behaviors never need to know about one another.</p>
      <Connection>Signals, connected by the scene</Connection>
      <Component name="Actions" note="Owned by the entity · e.g. Explode, Shrink" />
    </div>
  </div>
);

const sequence = [
  { name: "Player", note: "Right-clicks the folder", connection: "Input reaches the entity" },
  { name: "BehaviorCoordinator", note: "Delivers the click to Activatable", connection: "Requests a claim" },
  { name: "InputCoordinator", tone: "red", note: "Holds the mouse in Blocking mode", connection: "Claim accepted" },
  { name: "Activating", tone: "green", note: "The folder starts opening. Clicks for Pressable and Draggable are skipped while the claim is held.", connection: "Animation finishes" },
  { name: "Active", tone: "green", note: "The folder is open. Activatable releases its input claim." },
];

export const CompactSequence = () => <div className="cs-compact"><Label number="02">A blocking transition</Label><Flow steps={sequence} /></div>;

export const CompactModes = ({ modes }) => (
  <div className="cs-compact">
    <Label number="03">Three ways to hold the mouse</Label>
    <div className="cs-compact-stack">
      {modes.map(({ term, say, others, note, usedBy, usedFor }) => (
        <Component key={term} name={term} note={say} tone={term === "Share" ? undefined : "red"}>
          <div className="cs-compact-chips"><span>This one</span><span>{others}</span><span>{others}</span></div>
          <p>{note}</p>
          <p className="cs-compact-use">Used by <strong>{usedBy}</strong>{usedFor && <span>{usedFor.join(" ")}</span>}</p>
        </Component>
      ))}
    </div>
  </div>
);

export const CompactMachine = ({ states }) => (
  <div className="cs-compact">
    <Label number="04">One state at a time</Label>
    <Component name="Activatable" tone="green" note="Listens for right-clicks" />
    <Connection>The same right-click</Connection>
    <div className="cs-compact-group">
      <h4>FiniteStateMachine</h4>
      <p>Holds named states. All four inherit ActivatableState.</p>
      <div className="cs-compact-stack">{states.map(({ name, meaning }) => <Component key={name} name={name} note={meaning} current={name === "Active"} />)}</div>
      <p className="cs-compact-explanation">Only the current state receives the event. The other states stay idle and never hear it.</p>
    </div>
  </div>
);

export const CompactChange = ({ callbacks }) => (
  <div className="cs-compact">
    <Label number="05">Changing state</Label>
    <Flow steps={[
      { name: callbacks[0].name, term: "Hook", note: "Optional callback · old state leaves", connection: "Then" },
      { name: "Exit()", term: "Enter / Exit", note: "Runs the old state's code", connection: "Then" },
      { name: callbacks[1].name, term: "Hook", note: "Optional callback", connection: "The machine changes its current state" },
      { name: callbacks[2].name, term: "Hook", note: "Optional callback · new state arrives", connection: "Then" },
      { name: "Enter(previous)", term: "Enter / Exit", note: "Runs the new state's code, with the previous state", connection: "Then" },
      { name: callbacks[3].name, term: "Hook", note: "Optional callback" },
    ]} />
    <p className="cs-compact-explanation">Example: OnEnter calls EmitActivating() on Activatable. It emits the Activating signal, which the scene connects to the folder's Open action. Unset callbacks are skipped.</p>
  </div>
);

const activationCycle = [
  { name: "Inactive", note: "Emits Deactivated · lets go", connection: "Right-click → Activate(). Continues only if the mouse can be claimed." },
  { name: "Activating", note: "Emits Activating · opening animation", connection: "Animation finishes, or immediately if not waiting" },
  { name: "Active", note: "Emits Activated · lets go", connection: "Right-click → Deactivate(). Continues only if the mouse can be claimed." },
  { name: "Deactivating", note: "Emits Deactivating · closing animation", connection: "Animation finishes → back to Inactive" },
];

export const CompactActivatable = ({ current, edge }) => (
  <div className="cs-compact">
    <Label number="06">The folder's state machine</Label>
    <Flow steps={activationCycle.map(step => ({ ...step, current: step.name === current, tone: "green" }))} />
    <p className="cs-compact-status">{edge ? `Transition: ${edge.replace(">", " → ")}` : `Current state: ${current}`}</p>
    <p className="cs-compact-explanation">Graceful mode: a right-click during an animation reverses between Activating and Deactivating.</p>
  </div>
);

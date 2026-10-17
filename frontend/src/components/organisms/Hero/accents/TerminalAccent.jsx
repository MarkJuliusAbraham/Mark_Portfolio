import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { TypeCaret } from "@/components/atoms/TypeCaret.jsx";
import { useTypedText } from "@/hooks/useTypedText.js";
import { useAccentPaused } from "@/hooks/useAccentPaused.js";
import "./TerminalAccent.css";

const buildSequence = {
  command: "npm run build",
  typeDelay: 40,
  output: [
    { text: "transforming modules…", at: 180 },
    { text: "rendering chunks…", at: 620 },
    { text: "✓ build complete", at: 1060, success: true },
  ],
  promptAt: 1640,
};

/** One hover session; unmounting cancels typing and all pending output. */
const TerminalBuild = () => {
  const reducedMotion = useReducedMotion();
  const { text, typing } = useTypedText(buildSequence.command, { typeDelay: buildSequence.typeDelay });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (typing || reducedMotion) return;
    const timers = buildSequence.output.map(({ at }, index) =>
      setTimeout(() => setStage(index + 1), at),
    );
    timers.push(setTimeout(() => setStage(buildSequence.output.length + 1), buildSequence.promptAt));
    return () => timers.forEach(clearTimeout);
  }, [typing, reducedMotion]);

  const shown = reducedMotion ? buildSequence.output.length : stage;

  return (
    <span className="focus-terminal-viewport">
      <span className="focus-terminal-scroll" style={{ "--terminal-line": shown }}>
        <span className="focus-terminal-line" data-current={shown === 0}>
          <span className="focus-terminal-prompt">{"$ "}</span>
          <span className="focus-terminal-command">{text}</span>
          {typing && <TypeCaret typing />}
        </span>
        {buildSequence.output.map(({ text: output, success }, index) => (
          <span
            key={output}
            className="focus-terminal-line focus-terminal-output"
            data-current={shown === index + 1}
            data-success={Boolean(success)}
          >
            {output}
          </span>
        ))}
        <span className="focus-terminal-line focus-terminal-ready" data-current={shown > buildSequence.output.length}>
          <span className="focus-terminal-prompt">{"$ "}</span>
          <TypeCaret />
        </span>
      </span>
    </span>
  );
};

/** A fixed-height prompt with a faint previous line above it, outside the layout flow. */
export const TerminalAccent = ({ active, itemRef }) => {
  const paused = useAccentPaused(itemRef);

  return (
    <span className="focus-terminal" aria-hidden="true" data-paused={paused}>
      {active && !paused ? <TerminalBuild /> : (
        <span className="focus-terminal-line">
          <span className="focus-terminal-prompt">{"$ "}</span>
          <TypeCaret />
        </span>
      )}
    </span>
  );
};

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import {RotatingGifsHolder} from "@/components/custom/Image/RotatingGifsHolder.jsx";

const WHITE_KEY_WIDTH = 42;
const WHITE_KEY_HEIGHT = 170;
const BLACK_KEY_WIDTH = 26;
const BLACK_KEY_HEIGHT = 105;

// C4 → C6
const whiteKeys = [
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
  "A5",
  "B5",
  "C6",
];

const blackKeys = [
  { note: "C#4", after: "C4" },
  { note: "D#4", after: "D4" },
  { note: "F#4", after: "F4" },
  { note: "G#4", after: "G4" },
  { note: "A#4", after: "A4" },

  { note: "C#5", after: "C5" },
  { note: "D#5", after: "D5" },
  { note: "F#5", after: "F5" },
  { note: "G#5", after: "G5" },
  { note: "A#5", after: "A5" },
];

// Computer keyboard mapping
const keyMap = {
  // C4 → B4
  a: "C4",
  w: "C#4",
  s: "D4",
  e: "D#4",
  d: "E4",
  f: "F4",
  t: "F#4",
  g: "G4",
  y: "G#4",
  h: "A4",
  u: "A#4",
  j: "B4",

  // C5 → B5
  k: "C5",
  o: "C#5",
  l: "D5",
  p: "D#5",
  ";": "E5",
  z: "F5",
  "-": "F#5",
  c: "G5",
  v: "G#5",
  b: "A5",
  n: "A#5",
  m: "B5",
};

export const MyPiano = ({ className }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [activeNotes, setActiveNotes] = useState(new Set());
  const synthRef = useRef(null);
  const pressedKeysRef = useRef(new Map());
  const [successes, setSuccesses] = useState(0);

  // Create the synth only after the user interacts.
  const initializeAudio = async () => {
    await Tone.start();

    if (synthRef.current) return;

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle",
      },

      envelope: {
        attack: 0.002,
        decay: 2.5,
        sustain: 0,
        release: 2,
      },
    }).toDestination();

    synth.volume.value = -8;

    synthRef.current = synth;
  };

  const playNote = async (note) => {
    await initializeAudio();

    if (!synthRef.current) return;

    synthRef.current.triggerAttack(note);

    setActiveNotes((current) => {
      const next = new Set(current);
      next.add(note);
      return next;
    });

    handleNotePlayed(note);
  };

  const stopNote = (note) => {
    if (!synthRef.current) return;

    synthRef.current.triggerRelease(note);

    setActiveNotes((current) => {
      const next = new Set(current);
      next.delete(note);
      return next;
    });
  };

  const releaseAll = () => {
    synthRef.current?.releaseAll();

    pressedKeysRef.current.clear();

    setActiveNotes(new Set());
  };

  // Computer keyboard
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (event) => {
      if (event.repeat) return;

      const key = event.key.toLowerCase();
      const note = keyMap[key];

      if (!note) return;
      if (pressedKeysRef.current.has(key)) return;

      pressedKeysRef.current.set(key, note);

      playNote(note);
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      const note = pressedKeysRef.current.get(key);

      if (!note) return;

      pressedKeysRef.current.delete(key);

      stopNote(note);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSelected]);

  // Stop notes when piano is deselected.
  useEffect(() => {
    if (!isSelected) {
      releaseAll();
    }
  }, [isSelected]);

  // Stop notes when the browser loses focus.
  useEffect(() => {
    const handleBlur = () => {
      releaseAll();
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  const keyLabel = (note) => {
    const entry = Object.entries(keyMap).find(
      ([, mappedNote]) => mappedNote === note
    );

    return entry?.[0]?.toUpperCase();
  };


  // This is the sequence of Sparkle from "Your Name". I can't decide how many times the main melody should repeat.
  const targetSequence = ["B4", "C#5", "F#5","B4", "C#5", "F#5","B4", "C#5", "F#5","B4", "C#5", "F#5","B4", "C#5", "F#5","B4", "C#5", "F#5","B4", "C#5", "F#5","B4", "C#5", "F#5"];

  const sequenceRef = useRef([]);

  const handleNotePlayed = (note) => {
    const currentIndex = sequenceRef.current.length;

    // Sequence already completed
    if (currentIndex >= targetSequence.length) {
      return;
    }

    const expectedNote = targetSequence[currentIndex];

    // Wrong note
    if (note !== expectedNote) {
      sequenceRef.current = [];
      console.log("resetting")
      return;
    }

    // Correct note
    const nextSequence = [
      ...sequenceRef.current,
      note,
    ];

    sequenceRef.current = nextSequence;

    // Finished
    if (nextSequence.length === targetSequence.length) {
      setSuccesses((current) => current + 1);
    }
  };

  return (
    <div className={cn("inline-flex flex-col gap-2", className)}>
      {/* Header */}
      <div>
        {successes >= 0 && (
          <RotatingGifsHolder rotationMs={1951}/>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">
          Piano
        </span>

        <button
          type="button"
          onClick={() => {
            setIsSelected((selected) => !selected);
          }}
          className={cn(
            "rounded-md px-2.5 py-1",
            "text-xs font-medium",
            "transition-colors",
            "select-none",

            isSelected
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>

      {/* Keyboard */}

      <div
        className={cn(
          "inline-block rounded-lg bg-zinc-900 p-2",
          "transition-all",

          isSelected && "ring-2 ring-blue-500/40"
        )}
      >
        <div
          className="relative"
          style={{
            width: `${whiteKeys.length * WHITE_KEY_WIDTH}px`,
            height: `${WHITE_KEY_HEIGHT}px`,
          }}
        >
          {/* White keys */}

          {whiteKeys.map((note, index) => {
            const active = activeNotes.has(note);

            return (
              <button
                key={note}
                type="button"
                aria-label={`Piano key ${note}`}
                className={cn(
                  "absolute top-0",
                  "flex items-end justify-center",
                  "rounded-b-md border border-zinc-300",
                  "pb-2",
                  "touch-none select-none",
                  "outline-none",
                  "transition-colors",

                  active
                    ? "bg-blue-200"
                    : "bg-white hover:bg-zinc-100"
                )}
                style={{
                  left: index * WHITE_KEY_WIDTH,
                  width: WHITE_KEY_WIDTH,
                  height: WHITE_KEY_HEIGHT,
                  zIndex: 1,
                }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(
                    event.pointerId
                  );

                  playNote(note);
                }}
                onPointerUp={() => {
                  stopNote(note);
                }}
                onPointerCancel={() => {
                  stopNote(note);
                }}
              >
                <span className="text-[9px] font-medium text-zinc-400">
                  {keyLabel(note)}
                </span>
              </button>
            );
          })}

          {/* Black keys */}

          {blackKeys.map(({ note, after }) => {
            const index = whiteKeys.indexOf(after);
            const active = activeNotes.has(note);

            return (
              <button
                key={note}
                type="button"
                aria-label={`Piano key ${note}`}
                className={cn(
                  "absolute top-0",
                  "flex items-end justify-center",
                  "rounded-b-sm border border-black",
                  "pb-2",
                  "touch-none select-none",
                  "shadow-md",
                  "outline-none",
                  "transition-colors",

                  active
                    ? "bg-blue-600"
                    : "bg-zinc-950 hover:bg-zinc-800"
                )}
                style={{
                  left:
                    index * WHITE_KEY_WIDTH +
                    WHITE_KEY_WIDTH -
                    BLACK_KEY_WIDTH / 2,

                  width: BLACK_KEY_WIDTH,
                  height: BLACK_KEY_HEIGHT,
                  zIndex: 2,
                }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(
                    event.pointerId
                  );

                  playNote(note);
                }}
                onPointerUp={() => {
                  stopNote(note);
                }}
                onPointerCancel={() => {
                  stopNote(note);
                }}
              >
                <span className="text-[8px] font-bold text-zinc-400">
                  {keyLabel(note)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isSelected && (
        <div className="text-center text-[10px] text-zinc-400">
          Use your keyboard to play
        </div>
      )}
    </div>
  );
};
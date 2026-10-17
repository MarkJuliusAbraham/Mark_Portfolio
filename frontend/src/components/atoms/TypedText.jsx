import { TypeCaret } from "@/components/atoms/TypeCaret.jsx";
import { useTypedText } from "@/hooks/useTypedText.js";
import { cn } from "@/lib/utils";

/**
 * Text that types itself toward `text`, backspacing first when it has to. The cursor shows while
 * typing, or with `idleCursor` whenever any text is shown; a pending highlight-delete replaces it.
 * With `reserve`, the space of that text is held up front so typing never shifts the layout.
 * Decorative: give the real text to assistive technology elsewhere.
 */
export const TypedText = ({ text, reserve, idleCursor = false, className, selectionClassName, ...timing }) => {
  const { text: typed, highlight, typing } = useTypedText(text, timing);
  const kept = typed.slice(0, typed.length - highlight);
  const selected = typed.slice(typed.length - highlight);
  const showCaret = !selected && (typing || (idleCursor && typed));
  const reserved = reserve !== undefined;

  const content = (
    <span className={cn(reserved && "typed-slot-text", className)} aria-hidden={!reserved || undefined}>
      {kept}
      {selected && <span className={selectionClassName}>{selected}</span>}
      {showCaret && <TypeCaret typing={typing} />}
    </span>
  );

  return reserved ? (
    <span className="typed-slot" aria-hidden="true">
      <span className="typed-slot-sizer">{reserve}</span>
      {content}
    </span>
  ) : content;
};

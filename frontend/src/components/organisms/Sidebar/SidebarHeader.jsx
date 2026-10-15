import { TypedText } from "@/components/atoms/TypedText.jsx";
import { fullName, nameLines } from "@/content/profile.js";
import { useHiddenName } from "@/lib/nameTicker.js";

const reservedName = nameLines.join("\n");

/**
 * Types out whichever lines of the hero name have scrolled out of view. The full name's space is
 * reserved up front so typing never shifts the layout; with nothing typed it stays empty.
 */
export const SidebarHeader = ({ onClick }) => {
  const hiddenName = useHiddenName();
  return (
    <button type="button" className="sidebar-wordmark" onClick={onClick} aria-label={`${fullName} — go to home`}>
      <TypedText text={hiddenName} reserve={reservedName} idleCursor selectionClassName="sidebar-wordmark-selection" />
    </button>
  );
};

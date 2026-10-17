import { TypedText } from "@/components/atoms/TypedText.jsx";
import { fullName } from "@/content/profile.js";
import { useHiddenName } from "@/lib/nameTicker.js";

/**
 * Types the hidden hero name above the desktop sections and in the mobile header.
 */
export const SidebarHeader = ({ onClick }) => {
  const hiddenName = useHiddenName();
  return (
    <button
      type="button"
      className="sidebar-wordmark"
      onClick={onClick}
      aria-label={`${fullName} — go to home`}
    >
      <span className="sidebar-name-run">
        <TypedText text={hiddenName.replace(/\n/g, " ")} idleCursor selectionClassName="sidebar-wordmark-selection" />
      </span>
    </button>
  );
};

import { scrollToElement } from "@/lib/scroll.js";

/**
 * "On this page": the current project's sections, with their subsections indented beneath, in the
 * navbar's spare space. The one being read is marked; choosing one scrolls to it.
 */
export const SidebarOutline = ({ outline, activeId, onChoose }) => {
  if (!outline.length) return null;
  const activeSection = outline.find((section) =>
    section.id === activeId || section.children.some((child) => child.id === activeId))?.id;

  const go = (event, id) => {
    event.preventDefault();
    onChoose?.();
    const target = document.getElementById(id);
    // A heading inside a folded-away section opens it first, so there's something to scroll to.
    const folded = target?.closest("details:not([open])");
    if (folded) folded.open = true;
    scrollToElement(target);
  };

  return (
    <nav aria-label="On this page" className="sidebar-outline">
      <p className="sidebar-outline-title">On this page</p>
      <ol className="sidebar-outline-list">
        {outline.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="sidebar-outline-link"
              data-current={section.id === activeId || undefined}
              data-within={section.id === activeSection || undefined}
              aria-current={section.id === activeId ? "location" : undefined}
              onClick={(event) => go(event, section.id)}
            >
              {section.label}
            </a>
            {section.children.length > 0 && (
              <ol className="sidebar-outline-sublist">
                {section.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      className="sidebar-outline-link sidebar-outline-sublink"
                      data-current={child.id === activeId || undefined}
                      aria-current={child.id === activeId ? "location" : undefined}
                      onClick={(event) => go(event, child.id)}
                    >
                      {child.label}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

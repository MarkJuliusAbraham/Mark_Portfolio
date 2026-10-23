/**
 * Text with a plain-language version for the simplified reading mode (see CaseStudyOpening). Both
 * versions render; CSS shows the one matching the mode.
 */
export const Plain = ({ simple, children }) => (
  <><span className="cs-full">{children}</span><span className="cs-simple">{simple}</span></>
);

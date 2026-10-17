/** Text cursor: blinks while idle and holds steady while text is being typed or deleted. */
export const TypeCaret = ({ typing = false }) => (
  <span className="type-caret" data-typing={typing} aria-hidden="true" />
);

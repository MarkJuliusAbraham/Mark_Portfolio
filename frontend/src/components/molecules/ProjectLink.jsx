import { Link } from "react-router-dom";

/** Future-work cards retain their layout without opening an unfinished page. */
export const ProjectLink = ({ id, placeholder, className, children }) => (
  placeholder
    ? <div className={className}>{children}</div>
    : <Link to={`/projects/${id}`} className={className}>{children}</Link>
);

import runGif from "@/gifs/MitsuhaRun.gif";
import rollGif from "@/gifs/MitsuhaRoll.gif";
import tragedyGif from "@/gifs/Tragedy.gif";
import meteorGif from "@/gifs/TakiGazeMeteor.gif";
import loversGif from "@/gifs/StarCrossedLovers.gif";
import chaseGif from "@/gifs/MitsuhaChaseMeteor.gif";

// Placeholder previews until each project has its own.
const gifs = [runGif, rollGif, tragedyGif, meteorGif, loversGif, chaseGif];

// The same stand-in for a project every time, so it matches between the carousel and the grid.
const standIn = (id) => gifs[[...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % gifs.length];

/**
 * A project's preview inside a figure frame: its image, or for a placeholder project an empty
 * field marked "TBD".
 */
export const ProjectPreview = ({ id, placeholder, className }) => (placeholder ? (
  <span className={`${className} project-preview-empty`} aria-hidden="true">TBD</span>
) : (
  <img src={standIn(id)} alt="" loading="lazy" className={className} />
));

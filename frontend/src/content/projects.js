// `genre` and `year` fill each figure's spec table; a missing one shows as a dash. `featured`
// gives a project the large tile in the grid view.
export const projects = [
  {
    id: "project-1",
    featured: true,
    title: "Computer Vision",
    description: "Using computer vision to make decisions based on hand movements or object classification.",
    genre: "Computer vision",
    techStack: ["Python", "OpenCV", "MediaPipe"],
    year: null,
  },
  {
    id: "project-2",
    title: "\"Papers Please\"-Style Game: Systems Case Study",
    description: "A recreation of the game mechanics from the hit game \"Papers Please\" and more!",
    genre: "Game",
    techStack: ["C#", "Godot", "OOD", "Yarn", "PixelArt"],
    year: null,
  },
  {
    id: "project-3",
    title: "AI-Parsed Groceries App",
    description: "A native application that uses a Local LLM to perform query classification to enrich groceries data.",
    genre: "Desktop app",
    techStack: [".NET", "JavaScript", "C#", "Electron"],
    year: null,
  },
  // Placeholders that fill out the grid until real projects take their place; `placeholder`
  // marks them so cards show them as still to come.
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `prototype-${index + 1}`,
    title: `Prototype ${String(index + 1).padStart(2, "0")}`,
    description: "To be documented.",
    genre: "TBD",
    techStack: [],
    year: null,
    placeholder: true,
  })),
];

// `genre` and `year` fill each figure's spec table; a missing one shows as a dash. `featured`
// gives a project the large tile in the grid view.
export const projects = [
  {
    id: "project-1",
    featured: true,
    title: "Gesture Mapping Application",
    description: "A desktop application for mapping hand gestures to keyboard input, with editable profiles, live feedback, and tracking controls.",
    genre: "Input Simulation/Computer Vision",
    techStack: ["Python", "Tkinter", "OpenCV", "MediaPipe"],
    year: 2026,
  },
  {
    id: "project-2",
    title: "\"Papers Please\"-Style Game: Systems Case Study",
    description: "A recreation of the game mechanics from the hit game \"Papers Please\" and more!",
    genre: "Game",
    techStack: ["C#", "Godot", "OOD", "Yarn", "PixelArt"],
    year: 2026,
  },
  {
    id: "tree-systems",
    title: "Tree Systems",
    description: "Designing unfamiliar systems with AI tools: a procedural tree generator, live authoring controls, and debug views that make the rules visible.",
    genre: "Game systems",
    techStack: ["C#", "Godot", "Shaders"],
    year: 2026,
  },
  {
    id: "wind-system",
    title: "Wind System",
    description: "One wind shader for the whole forest: gust noise is drawn once into a world-space texture, and every trunk, leaf and foliage shadow samples it instead of computing noise per vertex. Wood bends more the higher it reaches; leaves get an extra push.",
    genre: "Game systems",
    techStack: ["C#", "Godot", "Shaders"],
    year: 2026,
  },
  // One buffer for future work.
  {
    id: "more-in-progress",
    title: "More in progress",
    description: "More projects are taking shape. Details to follow.",
    genre: "In progress",
    techStack: [],
    year: null,
    placeholder: true,
  },
];

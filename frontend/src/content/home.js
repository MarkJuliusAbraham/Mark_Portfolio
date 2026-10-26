import { nameLines } from "./profile.js";

export const heroProfile = {
  nameLines,
  description: "Designer / Developer",
  photos: Array.from({ length: 4 }, (_, index) => ({
    placeholder: `Photo ${String(index + 1).padStart(2, "0")} Coming Soon`,
  })),
};

// The focus strip under the hero. `accent` picks each area's flourish (see FocusAccents.jsx);
// `variants`, where given, are designs the hero takes on as the area is selected and selected
// again, one after another, before it goes back to its own (hero-variants.css). Without them,
// selecting the area shows the hero as it is.
export const focusAreas = [
  {
    toner: "01",
    accent: "spec",
    variants: [
      { id: "album", label: "Album" },
      { id: "bauhaus", label: "Bauhaus" },
      { id: "swiss", label: "Swiss" },
      { id: "vaporwave", label: "Vaporwave" },
    ],
    title: "UI/UX Design",
    readable: "Designing and building polished, responsive frontend experiences.",
  },
  {
    toner: "02",
    accent: "network",
    title: "AI Architecture",
    readable: "I believe AI should be accessible and useful to everyone.",
  },
  {
    toner: "03",
    accent: "terminal",
    title: "Software Engineering",
    readable: "Experience building scripts, web applications, and native software.",
  },
  {
    toner: "04",
    accent: "game",
    title: "Game Enthusiast",
    readable: "I love games. Playing them, studying them, and getting lost in them.",
  },
];

import bannerImage from "@/img/adam-hamel-MgmfPmixwE4-unsplash.jpg";
import { nameLines } from "./profile.js";

export const heroProfile = {
  nameLines,
  description: "Designer / Developer",
  // Draft line for the layout; replace with your own introduction.
  intro: "I design and build polished interfaces, the AI systems behind them, and the software that ties them together.",
  photo: {
    src: bannerImage,
    alt: "A camera held up against a blue sky",
    caption: "Looking up, always.",
    position: "50% 60%",
  },
};

// The focus strip under the hero. `accent` picks each area's flourish (see FocusAccents.jsx).
export const focusAreas = [
  {
    toner: "01",
    accent: "spec",
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

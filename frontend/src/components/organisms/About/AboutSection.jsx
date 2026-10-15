import { AboutEducation } from "./AboutEducation.jsx";
import { AboutExperience } from "./AboutExperience.jsx";
import { aboutContent } from "@/content/about.js";
import "./about.css";

export const AboutSection = ({ ref, educationRef, content = aboutContent }) => (
  <section className="about-section" aria-labelledby="about-title">
    <header className="about-section-header">
      <h2 ref={ref} id="about-title" className="section-anchor">About Me</h2>
      <span aria-hidden="true" className="about-heading-rule" />
    </header>

    <div className="about-layout">
      <div className="about-profile">
        <div className="about-introduction">
          <h3>{content.introduction.title}</h3>
          <div className="about-introduction-copy">
            {content.introduction.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <ul className="about-interests" aria-label="Areas of interest">
            {content.introduction.interests.map((interest) => <li key={interest}>{interest}</li>)}
          </ul>
        </div>
      </div>

      <AboutExperience entries={content.experience} />
      <AboutEducation ref={educationRef} education={content.education} />
    </div>

    <p className="about-draft-note">{content.draftNote}</p>
  </section>
);

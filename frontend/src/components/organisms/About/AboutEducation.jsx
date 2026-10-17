export const AboutEducation = ({ ref, education }) => (
  <section className="about-education" aria-labelledby="about-education-title">
    <header className="about-education-header">
      <h3 ref={ref} id="about-education-title" className="about-subheading section-anchor">Education</h3>
      <span className="about-education-period">{education.period}</span>
    </header>
    <h4>{education.institution}</h4>
    <p className="about-degree">{education.degree}</p>
    <dl className="about-study">
      <div><dt>Major</dt><dd>{education.major}</dd></div>
      <div><dt>Minor</dt><dd>{education.minor}</dd></div>
    </dl>
  </section>
);

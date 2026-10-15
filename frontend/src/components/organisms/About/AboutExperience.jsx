export const AboutExperience = ({ entries }) => (
  <section className="about-experience" aria-labelledby="about-experience-title">
    <h3 id="about-experience-title" className="about-subheading">Experience</h3>
    <ol className="about-timeline">
      {entries.map((entry) => (
        <li key={entry.id} className="about-timeline-entry">
          <time dateTime={entry.year} className="about-year">{entry.year}</time>
          <article className="about-role" aria-labelledby={`about-role-${entry.id}`}>
            <header className="about-role-header">
              <h4 id={`about-role-${entry.id}`}>{entry.role}</h4>
              <p className="about-organization">{entry.organization}</p>
            </header>
            <p className="about-role-summary">{entry.summary}</p>
            <p className="about-role-detail">{entry.sample}</p>
          </article>
        </li>
      ))}
    </ol>
  </section>
);

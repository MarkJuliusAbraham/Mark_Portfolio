# About Me

`AboutSection.jsx` composes the introduction, `AboutExperience.jsx` timeline, and
`AboutEducation.jsx` panel. `HomePage.jsx` mounts the section inside the existing
`ScrollingContent` layout.

## Copy

Edit `src/content/about.js`; `AboutSection` also accepts a `content` object with the same
shape. Experience entries provide `summary`, `detail`, and `period`. Keep entry
`id` values unique for list keys and accessible heading IDs. Career facts and
education reflect the supplied biography.

## Layout and navigation

Below a 720px **section-container** width, the reading order is introduction,
experience, then education. At 720px and above, introduction and education occupy
the left column while experience spans the right. At viewport widths up to 480px,
the timeline and education padding tighten. Content stays visible without an
entrance animation.

`HomePage` passes the outlet's `aboutRef` as `ref` and `educationRef` separately.
`AboutSection` attaches the first to the About Me h2; `AboutEducation` attaches the
second to its h3. Both use the existing `section-anchor` scroll offset. Preserve
these targets when rearranging the section.

## Appearance

`about.css` inherits Bahnschrift and the saved NieR Light/Dark theme through the
existing `--foreground`, `--muted-foreground`, `--card`, `--card-foreground`, and
`--border` roles. The education panel stays square. Headings, dates, employers,
and interest labels are bold (700); reading paragraphs are regular (400).
The section's sizes and spacing are local composition rules, not new global
design tokens.

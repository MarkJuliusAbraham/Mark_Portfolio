# About Me — local redesign

The user requested a better way to communicate About Me and explicitly allowed A TempTitle and Lorem Ipsum to populate the design. This is an existing portfolio section, not a replacement visual identity.

Mode: Experience. Keep the saved NieR Light/Dark palettes, Bahnschrift font family, square geometry, and the existing portfolio outside this section. Preserve supplied employers, roles, years, and education. Bold attention points; keep explanatory paragraphs regular.

Composition: a left-aligned section heading with a quiet rule; an introduction on the left and a dated career timeline on the right. Education sits beneath the introduction on desktop. Mobile order is introduction, experience, education. A short note identifies the temporary copy. Content is visible immediately; this section adds no animation.

Quality bar: clear scan hierarchy, readable longer paragraphs, no overflow at 320/390/820/1280 pixels or the user's desktop width, accessible h2/h3/h4 hierarchy, and working About/Education anchors. No fabricated career claims, stock illustration, replacement palette, or changes to project cards/navigation effects.

Source: frontend/src/components/custom/About/; composition entry: frontend/src/pages/HomePage.jsx. All placeholder copy and factual content live in aboutContent.js.

Build and scoped ESLint passed. Screenshot review targets are listed in the review packet. This is code-led local work; there is no approved comp or new world. PRODUCT.md and DESIGN.md were absent before the change.

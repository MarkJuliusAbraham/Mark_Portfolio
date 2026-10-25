# Tree Systems — implementation documentation

## Scope and disposition

This is an ordinary extension of the existing portfolio case-study system. It preserves the selected NieR appearance and Threshold reading layout; it introduces no new visual world, global tokens, or approved design-system changes. No global `DESIGN.md` or token sidecar is created or repaired by this documentation pass.

Review disposition supplied by the completed review: **Ship — no material findings**. Supporting captures are `desktop.png` (1440×1000 viewport) and `mobile.png` (390×844 viewport) in this directory. Existing validation and source provenance are recorded in `source-notes.md`; this documentation pass checked implementation files and capture presence rather than repeating browser tests.

## Implementation and narrative

`frontend/src/components/organisms/caseStudies/TreeSystemsCaseStudy.jsx` uses the requested heading exactly: **Tree Systems - Designing Unfamiliar Systems with the AI Tools**. `frontend/src/content/projects.js` retains the short card title **Tree Systems**, with Godot/C#/Shaders metadata. `frontend/src/pages/ProjectPage.jsx` maps `tree-systems` to the new case-study component.

The narrative leads with the real tree viewer and visible debug rules, then the enlarged leaf preview and authoring controls. It connects editable profiles, variants, geometry/shading responsibilities and saved resource ownership to working with AI while retaining visual judgment. Technical checks are described as checks present in Woods, without claiming benchmark results or that the Woods tests ran for this portfolio change.

## Preservation of the incumbent system

Direct comparison checked `ThresholdCaseStudy.jsx`, `CaseStudyOpening.jsx`, `Plain.jsx`, `case-study.css`, `CaseStudyMedia.jsx`, and `styles/nier-theme.css`.

- Both case studies import the shared reading stylesheet and reuse `CaseStudyOpening`, `Separator`, and `CaseStudyMedia`. The shared opening supplies the existing inverse-theme project preview, metadata table and remembered Simplify mode. Tree Systems keeps the existing gameplay GIF in that opening/card preview.
- Existing typography roles (`typeset-title`, `typeset-card-title`, `typeset-card-toner`, `typeset-card-readable`) remain the authority. Shared layout retains the 80rem article boundary, 66ch prose width, section rhythm, callouts, and diamond separators.
- `Plain` supplies full/plain text alternatives. Existing `.cs-technical` behavior hides selected detailed passages in Simplify mode, rather than introducing another reading-mode implementation.
- `CaseStudyMedia` supplies captions, accessible enlargement controls, native dialog, fit/zoom and original-file access. New media does not duplicate the viewer.
- The NieR stylesheet remains the palette and font authority. Local text and rules consume `--strong-foreground` and `--border`; the page inherits shared foreground and surface behavior. No theme-provider or global palette changes are part of this extension.

## Local additions

`tree-systems.css` contains page-specific selectors only:

- `.tree-case-title` allows long-title wrapping and balances the heading.
- `.tree-case-study .cs-callout` narrows the local callout border to 1px.
- `.tree-recording-toggle` adds spacing and a 44px minimum height while reusing the shared Simplify button appearance. `DebugViewerRecording` switches between the GIF and still, exposes pressed state and starts paused when reduced motion is preferred.
- `.tree-debug-key` lays out three explanatory entries and stacks them below 900px. `.tree-volume` and its puff/crown/leaf variants echo the captured debug overlays: blue `#78b8df`, pink `#c77ab0`, green `#b6d87a`. These are local evidence keys, not new theme tokens; written labels convey their meaning alongside color.
- `.tree-controls-reference` styles the semantic parameter table, permits local horizontal scrolling and tightens cell padding below 900px.
- `.tree-working-loop` styles the numbered AI/design workflow within the shared prose measure.

These selectors express this article's content and responsive needs without promoting its debug colors or composition into portfolio-wide rules.

## Asset provenance

Per `source-notes.md`, media came from the already open Godot `tree_viewer.tscn` editor in the read-only source project `C:/Users/mjabr/Documents/woods`. No profile was saved or shape settings changed. No AI-generated imagery is used.

| Asset in `frontend/src/gifs` | Provenance and use |
| --- | --- |
| `tree-viewer-debug.gif` | Three actual young-tree viewer captures, seed 7, variants 0/1/2, held 1.8 seconds each; Puffs, Crown and Leaf Shape enabled. Cropped and resized to 1600×828. This is a variant sequence, not a continuous orbit recording. |
| `tree-viewer-debug-still.png` | First captured debug state, 1600×828; used for pause and reduced motion. |
| `tree-viewer-leaf-controls.png` | Same viewer with Leaf Shape inspector expanded; cropped and resized to 1800×733. |

The source notes record capture crops and embedded GIF/PNG provenance metadata. The existing seven-second gameplay preview remains in the card/opening.

## Validation record and limitation

The prior validation record reports production build success with the pre-existing bundle-size warning, ESLint success for changed JSX/data, no page errors or horizontal page overflow at desktop/mobile sizes, decoded images, and tested media play/pause, dialog, zoom, close and Simplify behavior. Reduced-motion preference starts the variant sequence paused.

Impeccable context loading and detector execution were already unavailable: the bundled engine was not installed and its cache directory could not be created in the sandbox. This is a tooling limitation, not an implementation finding. Direct inspection of the incumbent theme and shared case-study components supplied the comparison; no detector result is claimed.

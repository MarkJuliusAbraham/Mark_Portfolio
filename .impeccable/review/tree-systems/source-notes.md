# Tree Systems case study — implementation evidence

## Direction
Extend the incumbent Threshold case-study layout and selected theme. Use shared CaseStudyOpening, Plain/Simplify, Separator and CaseStudyMedia. Keep the tree viewer and its inspectable rules central to the AI narrative. Retain the short Tree Systems card title and existing seven-second gameplay GIF. The page heading uses the exact longer title requested by the user.

## Source of truth
Read-only source: C:/Users/mjabr/Documents/woods.
- scripts/World/TreeProfile.cs: settings resource, shaping groups, material construction, leaf-shape parameters.
- scripts/World/BareTreeMesh.cs: branch generation, twig clustering, leaf cards, puff/crown metadata.
- scripts/World/TreeViewer.cs: live resource bindings, deferred rebuild, seed/variant, debug overlays, enlarged leaf preview, staging, profile saving.
- addons/tree_viewer_tools/TreeViewerInspector.cs: type/variant steppers, framing, canopy placement and Save Profile toolbar.
- scripts/World/TreeScatter.cs: shared profile consumers, limited generated variants, rotation/scale variation and profile updates across editor tabs.
- shaders/leaves.gdshader: shading from stand-in spheres.
- shaders/leaf_shape.gdshaderinc: cut-out logic shared by tree foliage and enlarged leaf preview.
- tests/verify_foliage_receives_shadows.gd: lit versus blocked comparison. Read only; Woods verification scripts were not run for this portfolio change.

## Media provenance
Captured the existing Godot tree_viewer.tscn editor window using the computer-use sky API. It was already showing the young profile, seed 7, variant 0 and all three debug flags enabled. No profile was saved or its shape settings edited.
- tree-viewer-debug.gif: three captured frames of variants 0, 1, 2, held for 1.8 seconds each. This is a sequence of actual viewer states, not a continuous orbit recording. Show Puffs, Show Crown and Show Leaf Shape stay enabled. Crop (550, 200)-(2540, 1230), resized to 1600x828. GIF comment records source.
- tree-viewer-debug-still.png: first captured debug state for pause/reduced-motion mode, 1600x828.
- tree-viewer-leaf-controls.png: same viewer, Leaf Shape inspector expanded. Crop (550, 400)-(2540, 1210), resized to 1800x733. PNG source metadata records origin.
No AI-generated imagery. The original gameplay GIF remains the project-card/opening preview.

## Validation
- Production build passes; pre-existing bundle size warning remains.
- ESLint passes for changed JSX/data files.
- Browser: 1440x1000 desktop and 390x844 mobile, full-page captures from top after fonts and images loaded. No page errors or horizontal overflow; all article images decode.
- Tested play/pause, media dialog, zoom, closing, and Simplify on both sizes. Reduced-motion preference starts variant sequence paused.
- Impeccable context/detector unavailable: bundled engine not installed and its cache directory cannot be created in the sandbox. Existing theme and shared case-study components inspected directly.

## Follow-up: browsable variants and clean captures
TreeVariantViewer now uses individual captured PNGs with previous/next, direct selection, and an interval that preserves the selected index when paused. Manual browsing and opening the enlarged view stop playback. Verified navigation, wraparound, resume, pause retention and enlargement at 1440px and 390px with no overflow. Recaptured every tool image with the cursor outside the crop, including replacement GIF frames. New PNGs include source metadata.

## Follow-up: all tree ages
Added Young, Mature and Aged selectors with three variants per age and a normal/debug toggle. All 18 images are direct SubViewport renders of the existing Woods TreeViewer scene and saved profiles (seed 7), produced by a hidden Godot process without desktop interaction. All images include PNG source metadata. Capture script retained in capture-age-samples.gd. Build and targeted lint pass. Desktop 1440px and mobile 390px browser checks verified every source decodes, all age/variant/debug combinations select correctly, navigation wraps, enlargement works, and there is no horizontal overflow.

## Follow-up: editor evidence in remaining sections
User explicitly approved desktop access for these captures. Added four actual Godot editor screenshots: mature profile Branches inspector; matching bare-branch view with Leaves temporarily disabled; main scene Trees node with Young/Mature/Aged profile assignments; and TreeViewer Look inspector. Captures show scene tree and inspector with viewport, cropped from y=90 to remove the cursor/title-bar glow and resized to 2000x1020. PNG metadata records source. Leaves, type, viewport zoom, inspector groups and window size restored; no profile or scene saved. Main scene Profiles group left expanded for discoverability. New figures reuse CaseStudyMedia and open/close correctly at 1440px and 390px. All article images decode, no horizontal overflow. Production build and changed-file lint pass.

## Live branch-profile recording
Replaced the bare-branch still in From Branches to Foliage with the user-provided 20261025-2112-36.2619402.mp4 recording, converted in full to tree-branch-profile.gif. 1600x637, 12 fps, 110 frames, approximately 9.2 seconds, 2.58 MB, infinite loop. Shows aged.tres being adjusted with foliage hidden. Shared media viewer labels it as a recording and supports enlargement. Build and changed-file lint pass.

## Leaf puff recording
Added Shaping the Canopy with Leaf Puffs under Turn Unfamiliar Ideas into Controls. The user recording 20261025-2117-57.0209972.mp4 shows puff spacing and radius changes, so the caption and prose explain foliage clustering rather than individual leaf shape. Converted only first 6.0 seconds: 1600x685, 12 fps, 72 frames, looping GIF, 3.87 MB.

# Polish

Polish improves an existing, mostly functional surface. It makes the UI feel intentional, aligned, resilient, and ready.

## Scope Map

- Rule and loop: inspect, patch, render again, compare.
- Screenshot artifacts: store operational evidence under `.agents/screenshots/`.
- Good polish: fix hierarchy, density, alignment, copy, states, motion, and token drift.
- Slop pass: remove visible generated defaults before calling the surface polished.
- Boundaries: do not turn polish into redesign, IA work, or a new design system.

## Rule

Polish is visual-first. Use the best available way to see the actual surface:

1. Native app, simulator, device screenshot, or preview.
2. Browser Use, Agent Browser, or in-app browser.
3. Project-native screenshot, snapshot, or preview tooling.
4. Existing screenshots or user-provided images.
5. Static code review only as fallback.

If the surface cannot be rendered, say so.

## Loop

Default to 1-3 focused passes unless the user asks for deep polish or screenshots show obvious defects.

1. Load any design- or taste-related files, adjacent UI, and current conventions.
2. Capture or inspect the current surface. Save new screenshots using the artifact routing below when the capture tool can write files.
3. If several screenshots or states show a repeated surface family, read [distill.md](distill.md) and name the visual rules before patching.
4. Name the top issues.
5. Choose a focused pass.
6. Patch.
7. Render again. Save after screenshots to the same folder when possible.
8. Run the slop detector on focused frontend files when available, then inspect and patch real issues.
9. Compare before and after.
10. Repeat while the surface is improving.

Stop when remaining issues are minor, out of scope, unverifiable, or require a redesign.

## Screenshot Artifacts

When saving polish screenshots, use one compact folder:

```text
.agents/screenshots/
```

Keep screenshots out of `docs/`, release notes, and design-source files. These are operational evidence, not documentation. Do not commit them unless the user asks.

Use sequence-friendly names that include a short surface slug:

- `<surface>-00-reference.png` for a provided reference copied into the folder
- `<surface>-00-current.png` for a single baseline capture
- `<surface>-01-before-pass-01-desktop.png`
- `<surface>-02-after-pass-01-desktop.png`
- `<surface>-03-before-pass-01-mobile.png`
- `<surface>-04-after-pass-01-mobile.png`

Include viewport or state in the filename when it matters: `mobile`, `desktop`, `empty`, `error`, `loading`, `dark`, `rtl`, or the route name. If a tool produces its own filenames, move or rename the files into this structure when practical.

When the user asks for comparison, evaluator review, or persisted artifacts, pass `.agents/screenshots/` as the evidence bundle. Exact file paths are optional, but the final response should name the screenshot folder and the viewports or states captured.

## Good Polish

Fix:

- weak hierarchy
- awkward density
- misalignment
- muddy typography
- arbitrary spacing
- text overflow
- unclear labels or CTAs
- rough empty/loading/error/success states
- missing hover, focus, pressed, disabled, selected, loading, or success states
- token/component drift
- inconsistent sibling screens
- janky or purposeless motion
- overly loud or overly timid visual intensity
- generated-template defaults: side stripes, gradient text, cream default palettes, ghost cards, numbered markers, identical card grids, filler copy
- small moments of earned delight in completion, onboarding, and recovery

Do not turn polish into:

- a new product direction
- a wholesale IA redesign
- a new design system
- broad performance work
- speculative feature creation
- unrelated refactors

## Pass Types

Read [lenses.md](lenses.md) for detailed tactics when a pass touches:

- typography
- layout rhythm
- brand landing pages
- imagery
- motion
- copy
- product micro-polish

Use these common pass intents:

- Typography: role scale, weight, line-height, measure, wrapping, stable numerals, font loading.
- Layout: spacing scale, grouping, density, visual rhythm, alignment, structural hierarchy.
- Color: semantic meaning, contrast, token use, color strategy, product/brand dosage.
- Copy: labels, CTAs, errors, empty states, confirmations, tooltips.
- Motion: state feedback, continuity, reduced motion, smoothness.
- Intensity: make it bolder through clarity and hierarchy, or quieter through reduced noise.
- Design-system alignment: replace one-offs with shared components or tokens when the match is clear.
- Generated-pattern pass: read [bans.md](bans.md), inspect detector findings, and remove visible hard-ban patterns that the local system does not earn.

## Finish

Report what changed, what was inspected, which viewports or states were checked, what the detector found or why it was skipped, the screenshot folder when artifacts were saved, and what remains unverified.

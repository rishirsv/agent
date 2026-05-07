# Mockups

Use mockups to make interface direction visible before or alongside implementation. Mockups are decision artifacts, not implementation truth. When the user asks for generated or edited mockup images, use the available `imagegen` skill or image-generation tool for the raster output, then inspect the result before presenting it.

If the user asks for implemented UI, use mockups only when they clarify direction; then return to `craft` and build with the real stack.

## Contents

- [Workflow](#workflow)
- [Artifact Types](#artifact-types)
- [Prompt Contract](#prompt-contract)
- [Variation Discipline](#variation-discipline)
- [Platform Guidance](#platform-guidance)
- [Reference Images And Edits](#reference-images-and-edits)
- [Handoff To Implementation](#handoff-to-implementation)
- [Evaluation](#evaluation)

## Workflow

1. Load the smallest useful design context: `docs/DESIGN.md`, `AGENTS.md`, brand docs, design-system files, existing screenshots, current components, tokens, and product copy.
2. Classify the artifact: mobile screen, mobile flow, web app screen, responsive set, isolated component, component-in-context, state matrix, A/B/C option board, reference edit, asset study, or north-star direction.
3. Classify register: product or brand. Product mockups optimize operational clarity. Brand mockups optimize point of view, imagery, typography, and memorability.
4. Decide fidelity: sketch, wireframe, mid-fi, high-fi, north-star, asset study, state matrix, or responsive set.
5. Decide variation depth: tight, moderate, or wide.
6. Write the prompt with artifact type, platform, user job, required UI, composition, visual system, exact text, preserve rules, vary rules, and avoid list.
7. Generate the mockup image.
8. Inspect the image. If one narrow fix would materially improve the artifact, iterate once with a targeted prompt.
9. Return the mockup, final prompt or prompt set, what varied, what stayed fixed, and the decision the artifact helps make.

## Artifact Types

- Mobile screen: one full iOS, Android, or platform-neutral screen large enough to inspect.
- Mobile flow: 2-4 phone screens showing a coherent progression with labels outside the devices.
- Web app screen: browser or viewport-framed workspace, dashboard, editor, detail page, form, or responsive state.
- Responsive set: desktop, tablet, and mobile views side by side when responsive behavior is the design question.
- Isolated component: a control, row, card, toolbar, sheet, chart, form, or module on a neutral canvas.
- Component-in-context: a cropped parent surface when surrounding state affects the component.
- State matrix: the same component repeated across states with labels outside the component.
- A/B/C option board: two or three labeled directions in one image or separate matched images.
- Reference edit: transform an existing image while preserving named invariants.
- Asset study: imagery, texture, badges, marks, illustration, or product-art direction.
- North-star direction: aspirational composition and tone to carry into code, not literal UI truth.

## Prompt Contract

Use this order:

1. Intended use and artifact type.
2. Platform, viewport, or device.
3. Presentation frame: full screen, clean device frame, browser viewport, neutral canvas, board, or crop.
4. User job and screen state.
5. Required regions or components.
6. Composition and hierarchy.
7. Visual system: type, color strategy, surface language, density, imagery, depth, icon style, motion implication.
8. Exact text for headings, buttons, labels, and critical values.
9. Preserve, vary, and avoid rules.

Keep UI text sparse. Ask for readable text, strong contrast, plausible controls, realistic content, and no unrelated features. Put exact text in quotes. Spell unusual product names if accuracy matters. Do not ask image generation to solve dense tables of tiny text; use fewer labels and larger inspection surfaces.

## Variation Discipline

Tight variation changes exactly one named dimension. Keep structure, data, palette, typography, device, and surrounding context fixed.

Moderate variation is the default for "show options." Keep product identity and key content fixed; vary layout grouping, emphasis, density, navigation treatment, or control model.

Wide variation is for explicit reimagining. Vary structure, metaphor, density, motion implication, and visual language while preserving product semantics, core task, and required content.

Defaults:

- "A/B" means two options.
- "A/B/C", "a few", "several", or unspecified options means three.
- More than three usually lowers inspection quality.
- Label options, variant names, and agent notes outside the UI, not inside app navigation, product copy, or accessibility text.
- For each variant, define: thesis, what varies, what is preserved, and best-for.
- Good axes: density, navigation depth, action placement, summary-first vs ledger-first, inline editing vs staged confirmation, current-state vs future-state emphasis, component shape.
- Poor axes: random palette changes, arbitrary icon changes, different fake data, different product names, more decoration, generic premium vs more generic premium.

## Platform Guidance

For mobile:

- Name iOS, Android, or platform-neutral mobile.
- Specify screen type: home, detail, editor, player, settings, search, modal sheet, empty, error, onboarding, or stateful component.
- Include safe areas, navigation, bottom bars, sheets, keyboard state, and scroll behavior when relevant.
- Prefer native spacing, native controls, and platform-appropriate hierarchy.
- Avoid generic mobile tropes: purple-blue gradients, floating glass cards, fake stats, meaningless icons, tiny labels, decorative blobs, and stock people.

For web and desktop app surfaces:

- State desktop, tablet, mobile web, or responsive board.
- Say whether browser chrome appears.
- Include key regions only when useful: nav, workspace, inspector, filters, table/list, chart, preview, command bar, or form.
- Product UI defaults to dense but calm information design. Prefer plain layout, lists, tables, dividers, and grouped sections over decorative card grids.
- Avoid marketing heroes when the task is app UI.

For components:

- Use a neutral canvas unless context is needed.
- Show only meaningful states: default, active, selected, focused, disabled, loading, empty, error, expanded, compact, and long-content stress.
- Preserve component size, alignment, typography, palette, and surrounding canvas across state matrices.
- Use realistic data and long-content stress cases when the component will face real variation.
- Do not turn every component into a card.

For brand mockups:

- Apply the color strategy, scene sentence, named references, imagery rule, and typography guidance from `SKILL.md`.
- When imagery is expected, use real or generated imagery direction. Do not substitute colored rectangles.
- First screen must make the brand, product, place, object, or offer unmistakable.
- Mock the art direction, not a generic stock page.

## Reference Images And Edits

Label every input image role before prompting:

- Edit target: the image to change.
- Style reference: visual language to borrow.
- Product reference: current app or object that must remain recognizable.
- Supporting insert: image, texture, mark, or asset to place into the output.

For edits, repeat invariants in every prompt: change only X; preserve Y. If the user wants a departure from the current design, name what stays recognizable and what may change.

## Handoff To Implementation

Before coding from a mockup, translate the image into implementable decisions:

- carry forward: composition, hierarchy, density, type scale, color strategy, imagery treatment, component relationships, motifs, and motion cues
- do not literalize: rasterized text, fake controls, impossible shadows, unusable contrast, random generated icons, tiny labels, phantom features, and layout artifacts

Generated mockups can suggest visual direction. They do not override product semantics, platform affordances, accessibility, repo components, or real content.

## Evaluation

Gating checks:

- Correct artifact type, platform, and fidelity.
- Required UI elements are present.
- Critical exact text is readable and close enough.
- Option/state labels are visible outside the UI when requested.
- Preserve constraints were honored.
- No unrelated features or fake product behavior were added.

Design checks:

- Primary action or state is clear at a glance.
- Hierarchy can be understood in a few seconds.
- Controls look interactive and plausible.
- Text is sparse enough to render legibly.
- Visual system fits repo guidance or the named departure.
- Variants differ on meaningful axes.
- Components stay stable across states unless change is intentional.
- Product mockups pass the operator scan: headings, labels, and numbers explain the page.
- Brand mockups avoid the AI-made read: timid palette, average layout, weak imagery, no point of view.

Common targeted fixes:

- Keep the same composition, but make all UI text larger and more readable.
- Preserve the palette and device frame; remove extra decorative elements.
- Change only Option B to use a denser ledger layout; keep A and C unchanged.
- Restore the requested product name and remove unrelated labels.
- Keep the same component size across all states.

Stop when the artifact answers the design question. Do not over-iterate for pixel polish unless the user asked for production-quality visuals.

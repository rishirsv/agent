# UI Prototype

Use UI prototypes when the question is what something should look like, how an interaction should feel, or which visual direction deserves production implementation.

Choose the smallest output that answers the design question:

- **Imagegen mockups and boards**: visual decision artifacts. Use for interface mockup images, A/B/C option boards, 3-6-up contact sheets, mobile flow boards, component studies, state matrices, reference-based refinements, responsive sets, asset studies, or north-star direction.
- **Selected reference images**: polished mockups retained to guide implementation. Use when the user wants the chosen option rebuilt as a full-resolution reference before coding the feature.
- **Runnable route variants**: throwaway code the user can flip through in the real app. Use when the decision depends on live density, real data, app chrome, interaction feel, or side-by-side variants in context.

Prefer imagegen first when a visual direction is unclear, the user asks for mocks, or several screens/directions need to be compared quickly. Prefer route variants when the user needs to play with the app, compare interaction models, or judge the design against real layout constraints. Use both when a mockup helps choose a direction before building route variants.

If the question is about business logic, state transitions, or data shape, use [LOGIC.md](LOGIC.md).

## Source Context For UI Prototypes

Before generating image mockups, building standalone HTML, or editing route variants, use the strongest available visual reference without stopping for a screenshot hunt:

1. Repo-maintained app screenshots or captures, especially folders named `screens`, `screenshots`, `captures`, `snapshots`, `previews`, `fixtures`, or visual evidence under `docs/`.
2. Rendered UI from browser, simulator, preview, snapshot, or project tooling.
3. Existing components, routes, tokens, CSS, native views, product copy, and adjacent screens.
4. Static code and repo conventions.

Do a quick file sweep for likely visual references, for example:

```bash
rg --files | rg -i '(^|/)(screens?|screenshots?|captures?|snapshots?|previews?|fixtures?)/|\\.(png|jpe?g|webp)$'
```

Prefer current-app screenshots over external references. Use nearby or adjacent surfaces as anchors for frame, density, navigation, spacing, typography, color, component shape, copy tone, and platform chrome. If screenshots exist, reference them explicitly in the prompt or HTML notes and keep the prototype recognizable as the same product. If screenshots do not exist, infer the frame and UI from code, docs, and available tooling. Do not ask the user just to obtain screenshots.

For radically different exploration, do not over-anchor on current screenshots. Preserve only the product semantics, required content, and recognizable identity the user named; let structure, hierarchy, density, and visual language diverge.

## Imagegen Mockup Workflow

1. Load the smallest useful context: `docs/DESIGN.md`, `AGENTS.md`, product specs, current components, tokens, screenshots, assets, and product copy.
2. Classify the artifact: mobile screen, mobile flow, web app screen, responsive set, isolated component, component-in-context, state matrix, A/B/C option board, reference edit, asset study, or north-star direction.
3. Classify register: product or brand. Product mockups optimize operational clarity. Brand mockups optimize point of view, imagery, typography, and memorability.
4. Decide fidelity: sketch, wireframe, mid-fi, high-fi, north-star, asset study, state matrix, or responsive set.
5. Decide variation depth: tight, moderate, wide, or radical.
6. Write the imagegen prompt with artifact type, platform, viewport, source references, user job, required UI, composition, visual system, exact text, preserve rules, vary rules, and avoid list.
7. Generate the mockup image.
8. Inspect and analyze the image. If one narrow fix would materially improve the artifact, iterate once with a targeted prompt.
9. Return the mockup, final prompt or prompt set, concise analysis, what varied, what stayed fixed, and the decision the artifact helps make.

## Standalone HTML Prototype Workflow

Use standalone HTML when the user wants an inspectable interactive prototype but production source should stay untouched.

1. Run the source-reference sweep above and choose the smallest relevant screenshot set.
2. Read only the app files needed to understand content, states, and behavior.
3. Build one self-contained HTML/CSS/JS artifact outside production source, such as under `.agents/tmp/`.
4. Match the existing app's visual language from screenshots first, then fill gaps from design docs, tokens, and components.
5. Simulate interaction, detents, focus, keyboard, state changes, and failure prompts with local browser state only.
6. Include a short note in the artifact or final response naming which screenshots or rendered references anchored the prototype.
7. Inspect the HTML in a browser when possible and report what was checked.

## Board And Contact Sheet Workflow

Use this workflow when the user wants multiple directions for one feature, multiple screens in a flow, or a quick visual search before committing.

1. Decide what the board compares:
   - **Direction board**: 3-6 variations of the same screen or component.
   - **Flow board**: 3-6 screens or states of one feature.
   - **Hybrid board**: 2-3 directions, each with 2-3 key screens.
2. Keep the board focused. More panels are not better if each one becomes too small to inspect.
3. Preserve the core product semantics, required content, device/frame, and important copy across panels unless the user asks for radical exploration.
4. Vary meaningful design axes: layout, hierarchy, density, action model, navigation, grouping, tone, information reveal, and visual system.
5. Generate the board or contact sheet with clear labels outside the UI, such as `A - Dense workspace`, `B - Guided flow`, or `C - Editorial summary`.
6. Inspect and analyze the result immediately after generation.
7. If the prompt or user asks for a recommendation, choose one direction or a specific blend. If the prompt asks to wait for the user, stop after the analysis.
8. If a winner is chosen and the board has small panels, generate a full-resolution version of the chosen screen or flow so it can serve as a strong implementation reference.

### Analysis After Generation

Always inspect generated boards, mockups, and reference images before handing them over. Keep the analysis terse, designerly, and useful.

Use this shape:

- **A**: one short sentence on the visual thesis and tradeoff.
- **B**: one short sentence on the visual thesis and tradeoff.
- **C**: one short sentence on the visual thesis and tradeoff.
- **Preference**: choose the strongest option or blend, with one reason tied to hierarchy, clarity, density, brand fit, or implementation value.
- **Next reference**: say whether a full-resolution rebuild is useful, and which panel should drive it.

For 4-6 panels, keep each note to a fragment or one compact sentence. Do not write a long critique. Do not overrule the user's stated taste, prompt, product constraints, or instruction to wait for selection.

Good preference language:

- `I would take B: it has the clearest workspace hierarchy, and the primary action sits where the eye naturally lands.`
- `C is the best reference for implementation, but steal A's calmer header density.`
- `For a radical exploration, D is most useful; for shippability, B is safer.`

Avoid generic language such as "modern", "clean", "sleek", or "premium" unless you immediately explain what concrete design choice creates that effect.

### Full-Resolution Reference Pass

When the user or prompt says to proceed with the recommendation, or when a selected panel is too small to guide implementation:

1. Pick the chosen panel or blend.
2. Write a new imagegen prompt that focuses only on that selected screen or flow.
3. Preserve the winning composition, hierarchy, density, visual language, and exact UI semantics.
4. Improve legibility, spacing, frame fidelity, and realistic content.
5. Remove board labels and comparison scaffolding from inside the UI.
6. Generate at the target implementation frame or device resolution.
7. Analyze the full-resolution output in 2-4 terse bullets: what to carry into code, what not to literalize, and any implementation hazards.

Keep the selected full-resolution mock as a reference artifact when it materially guides the UI build.

### UI Output Contract

For generated UI artifacts, end with:

- the artifact or artifact path
- the concise option analysis or full-resolution reference analysis
- the recommended direction only when the user or prompt allows recommendation
- the carry-forward implementation notes
- any important limitations, such as unreadable generated text, speculative data, or missing live rendering

### Artifact Types

- **Mobile screen**: one full iOS, Android, or platform-neutral screen large enough to inspect.
- **Mobile flow**: 2-4 phone screens showing a coherent progression with labels outside the devices.
- **Web app screen**: browser or viewport-framed workspace, dashboard, editor, detail page, form, or responsive state.
- **Responsive set**: desktop, tablet, and mobile views side by side when responsive behavior is the design question.
- **Isolated component**: a control, row, card, toolbar, sheet, chart, form, or module on a neutral canvas.
- **Component-in-context**: a cropped parent surface when surrounding state affects the component.
- **State matrix**: the same component repeated across states with labels outside the component.
- **A/B/C option board**: two or three labeled directions in one image or separate matched images.
- **Reference edit**: transform an existing image while preserving named invariants.
- **Asset study**: imagery, texture, badges, marks, illustration, or product-art direction.
- **North-star direction**: aspirational composition and tone to carry into code, not literal UI truth.

### Prompt Contract

Use this order:

1. Intended use and artifact type.
2. Platform, viewport, device, or source screenshot dimensions.
3. Presentation frame: full screen, clean device frame, browser viewport, neutral canvas, board, or crop.
4. Source references and what role each one plays: edit target, style reference, product reference, or supporting insert.
5. User job and screen state.
6. Required regions or components.
7. Composition and hierarchy.
8. Visual system: type, color strategy, surface language, density, imagery, depth, icon style, and motion implication.
9. Exact text for headings, buttons, labels, and critical values.
10. Preserve, vary, and avoid rules.

Keep UI text sparse. Ask for readable text, strong contrast, plausible controls, realistic content, and no unrelated features. Put exact text in quotes. Spell unusual product names if accuracy matters. Do not ask imagegen to solve dense tables of tiny text; use fewer labels and larger inspection surfaces.

### Variation Discipline

Tight variation changes exactly one named dimension. Keep structure, data, palette, typography, device, and surrounding context fixed.

Moderate variation is the default for "show options." Keep product identity and key content fixed; vary layout grouping, emphasis, density, navigation treatment, or control model.

Wide variation is for explicit reimagining. Vary structure, metaphor, density, motion implication, and visual language while preserving product semantics, core task, and required content.

Radical variation is for "radically different", "north-star", "surprise me", or early exploration. Keep only the user job, product semantics, required content, accessibility expectations, and any named identity anchors. Avoid preserving current layout just because a screenshot exists.

## Design Boundary

UI prototypes are exploration artifacts. Use this file to compare directions, generate references, or make disposable route variants. Use `$interface-craft` for production UI craft, polish, critique, hardening, design docs, or taste distillation.

When analyzing prototype options, prefer the direction that best answers the user question. Do not promote generated visuals, placeholder copy, fake controls, or throwaway route code into production requirements.

### Variation Defaults

- "A/B" means two options.
- "A/B/C", "a few", "several", or unspecified options means three.
- More than three usually lowers inspection quality.
- Label options, variant names, and agent notes outside the UI, not inside app navigation, product copy, or accessibility text.
- For each variant, define: thesis, what varies, what is preserved, and best-for.
- Good axes: density, navigation depth, action placement, summary-first vs ledger-first, inline editing vs staged confirmation, current-state vs future-state emphasis, component shape.
- Poor axes: random palette changes, arbitrary icon changes, different fake data, different product names, more decoration, generic premium vs more generic premium.

### Platform Guidance

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

- Name the physical usage scene before choosing style.
- When imagery is expected, use real or generated imagery direction. Do not substitute colored rectangles.
- First screen must make the brand, product, place, object, or offer unmistakable.
- Mock the art direction, not a generic stock page.

### Reference Images And Edits

Label every input image role before prompting:

- **Edit target**: the image to change.
- **Style reference**: visual language to borrow.
- **Product reference**: current app or object that must remain recognizable.
- **Supporting insert**: image, texture, mark, or asset to place into the output.

For edits, repeat invariants in every prompt: change only X; preserve Y. If the user wants a departure from the current design, name what stays recognizable and what may change.

### Handoff To Implementation

Before coding from a mockup, translate the image into implementable decisions:

- carry forward: composition, hierarchy, density, type scale, color strategy, imagery treatment, component relationships, motifs, and motion cues
- do not literalize: rasterized text, fake controls, impossible shadows, unusable contrast, random generated icons, tiny labels, phantom features, and layout artifacts

Generated mockups can suggest visual direction. They do not override product semantics, platform affordances, accessibility, repo components, or real content.

### Imagegen Evaluation

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

## Runnable UI Variants

Use this only when the user explicitly asks for variants inside the running app or when imagegen/standalone HTML cannot answer the interaction question. Do not choose this path from "prototype" alone.

For design-only or production-source-prohibited prototypes, build a standalone HTML/CSS/JS artifact or generate image mockups instead of editing app source.

Generate several radically different UI variations on a single route, switchable from a floating bottom bar. The user flips between variants in the browser, picks one or steals bits from each, then throws the rest away.

### Two Shapes

Strongly prefer **sub-shape A**. A UI prototype is easier to judge when it butts up against the rest of the app: real header, real sidebar, real data, real density.

#### Sub-shape A - Adjustment To An Existing Page

The route already exists. Variants are rendered on the same route, gated by a `?variant=` URL search param. Existing data fetching, params, and auth all stay. Only the rendered subtree changes per variant.

This is the default. If the prototype is for something that does not yet have a page but would naturally live inside one, mount the variants inside the host page.

#### Sub-shape B - A New Page

Use only when the thing being prototyped genuinely has no existing page to live inside: an entirely new top-level surface, or a flow that cannot be embedded anywhere sensible.

Create a throwaway route following the project's routing convention. Name it so it is obviously a prototype, such as including `prototype` in the path or filename. Use the same `?variant=` pattern.

### Process

1. **State the question and pick N.** Default to 3 variants. More than 5 stops being radically different and starts being noise. Cap there.
2. **Write the plan in place.** One top-of-file comment or local README line is enough: `Three variants of the settings page, switchable via ?variant=, on the existing /settings route.`
3. **Generate radically different variants.** Variants must disagree about structure: layout, information hierarchy, density, navigation, control model, or primary affordance. Three slightly tweaked card grids are not a prototype.
4. **Wire them together.** Keep existing data fetching above the switcher for existing pages; only the rendered subtree changes per variant.
5. **Build the floating switcher.** A small fixed-position bottom-center bar has previous arrow, current variant label, and next arrow. Clicking arrows updates the URL search param. Keyboard left and right arrows cycle unless an input, textarea, select, or `[contenteditable]` is focused. Hide the switcher in production builds.
6. **Hand it over.** Surface the URL and `?variant=` keys.
7. **Capture the answer and clean up.** Delete losing variants and the switcher, then fold the winner into production code under normal constraints.

Pseudo-code:

```tsx
const variant = searchParams.get("variant") ?? "A";

return (
  <>
    {variant === "A" && <VariantA />}
    {variant === "B" && <VariantB />}
    {variant === "C" && <VariantC />}
    {isPrototypeEnabled && <PrototypeSwitcher current={variant} />}
  </>
);
```

## Anti-Patterns

- Variants that differ only in color or copy.
- Sharing so much code that variants cannot disagree about layout.
- Wiring variants to real mutations. If a variant needs to mutate, point it at a stub.
- Promoting prototype code directly to production. Rewrite properly when folding in the winning direction.
- Treating generated image text, icons, shadows, or invented features as production requirements.

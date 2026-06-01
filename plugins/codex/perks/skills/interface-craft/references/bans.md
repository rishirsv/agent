# Bans

Use this reference when creating, auditing, polishing, or hardening frontend UI that could drift into generated-template defaults. These bans are defaults, not taste law: keep an exception only when the brief, brand, or existing system clearly earns it.

## Hard Bans

### Palette

- Do not default to cream, sand, beige, tan, parchment, linen, bone, espresso, slate, navy, purple-blue, or brown-orange as the whole product mood. Use those families only when a real brand, material, setting, or product context earns them.
- Do not let one hue family dominate the full surface through several lightness variants. Add a real neutral, semantic color, material contrast, or a second named role.
- Do not use category reflex palettes without checking intent: healthcare teal, finance navy/gold, crypto neon black, AI purple-blue, luxury beige, developer mono-dark.

### Layout And Surface

- Do not use numbered section markers as decoration: `01`, `02`, `03` beside generic sections. Use real navigation, labels, iconography, or hierarchy.
- Do not use thick side stripes on cards, list items, alerts, or callouts. Prefer full borders, surface tints, icon anchors, leading metadata, or structure.
- Do not make ghost cards: white or tinted panels with a hairline border plus a large soft shadow repeated everywhere.
- Do not nest cards inside cards. Page sections are bands or unframed layouts; cards are for repeated comparable items, modals, and genuinely framed tools.
- Do not over-round everything. Cards default to 8px radius or less unless the local system says otherwise; pills are reserved for pills.
- Do not use repeating stripe backgrounds, discrete orbs, gradient orbs, bokeh blobs, or abstract decoration as the primary visual idea.
- Do not use identical icon-card grids as the default way to explain features. Vary section architecture or remove the cards.

### Hero And Brand

- Do not hide the brand or object in small nav text. It must be a first-viewport signal.
- Do not put hero text inside a card by default.
- Do not use a split text/media hero where a card sits on one side and text sits on the other when an immersive scene, real image, product view, or full-bleed composition can carry the subject.
- Do not use a hero metric template unless real data is the story. If numbers matter, design a real data presentation.
- Do not substitute gradients, abstract SVGs, or atmospheric stock images when the user needs to inspect a product, place, person, menu, venue, app state, or artifact.

### Type And Copy

- Do not use gradient text as default emphasis. Use size, weight, placement, contrast, or one solid accent.
- Do not scale font size directly with viewport width. Use rem scales and `clamp()` only for true display text.
- Do not use negative letter spacing.
- Do not use repeated tiny uppercase eyebrow labels as the main rhythm.
- Do not use all-caps body copy.
- Do not use "actually X", "not just X", "X theater", "seamless", "supercharge", "empower", "unlock", "next-generation", or "enterprise-grade" unless that is real product language.
- Do not surface implementation details, enum names, feature flags, permission scopes, state-machine names, scaffold explanations, or agent rationale as UI copy.

### Motion And Interaction

- Do not animate layout properties such as width, height, margin, padding, top, left, or grid tracks for routine UI. Prefer transform, opacity, blur, clip, platform-native transitions, or stateful layout without animation.
- Do not make image hover zoom the only interaction idea.
- Do not make hover the only way to discover controls.
- Do not ship motion without reduced-motion behavior when the stack supports it.

### Resilience

- Do not let text overflow, clip, or occlude neighboring content.
- Do not let controls resize because labels, counters, hover states, badges, or loading text changed.
- Do not use fixed-height containers for user-generated or translated copy unless overflow behavior is deliberate and verified.
- Do not leave fake links, dead controls, filler data, sample prose, or unused scaffold visible in production UI.

## Detector Interpretation

Run [scripts/detect-ui-slop.mjs](../scripts/detect-ui-slop.mjs) on focused frontend files near the end of implementation or audit work. Use its output this way:

- `warn`: inspect in rendered UI; fix when the pattern is visible or repeated.
- `info`: consider whether the pattern compounds with other weak defaults.

False positives are acceptable. The point is to force attention on known agent failure modes before the final answer.

## Fast Rewrite Patterns

- Replace a side stripe with an icon, semantic surface tint, section header, or full-border treatment.
- Replace an identical card grid with an editorial stack, comparison table, feature rail, screenshots, alternating media bands, or one hero detail plus supporting bullets.
- Replace gradient text with a solid accent, tighter type hierarchy, stronger wording, or a real logo/mark treatment.
- Replace beige default background with a product-neutral surface plus a named accent, or with a real material/photographic scene when the brand needs warmth.
- Replace "not just X" copy with the user-visible outcome and the next action.

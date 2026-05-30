# Lenses

Use these tactical lenses when a lane needs more design specificity.

## Scope Map

- Color and theme: choose a deliberate strategy before tokens.
- Typography and layout: set hierarchy, measure, rhythm, and spacing.
- Brand, imagery, motion, and product polish: apply only when relevant to the surface.
- Design-system discipline, bans, reflex checks, detector findings, and self-checks: use as final pressure tests.

## Hard Frontend Rules

- You make sure to use icons in buttons for tools, swatches for color, segmented controls for modes, toggles/checkboxes for binary settings, sliders/steppers/inputs for numeric values, menus for option sets, tabs for views, and text or icon+text buttons only for clear commands (unless otherwise specified). Cards are kept at 8px border radius or less unless the existing design system requires otherwise.
- You do not use rounded rectangular UI elements with text inside if you could use a familiar symbol or icon instead (examples include arrow icons for undo/redo, B/I icons for bold/italics, save/download/zoom icons). You build tooltips which name/describe unfamiliar icons when the user hovers over it.
- You do not put UI cards inside other cards. Do not style page sections as floating cards. Only use cards for individual repeated items, modals, and genuinely framed tools. Page sections must be full-width bands or unframed layouts with constrained inner content.
- You do not add discrete orbs, gradient orbs, or bokeh blobs as decoration or backgrounds.
- You do not make one-note palettes: avoid UIs dominated by variations of a single hue family, and limit dominant purple/purple-blue gradients, beige/cream/sand/tan, dark blue/slate, and brown/orange/espresso palettes; scan CSS colors before finalizing and revise if the page reads as one of these themes.
- You do not scale font size with viewport width. Letter spacing must be 0, not negative.
- You run the slop detector on focused frontend files when available and inspect every finding before finalizing.
- You use Three.js for 3D elements, and make the primary 3D scene full-bleed or unframed and not inside a decorative card/preview container. Before finishing, you verify with Playwright screenshots and canvas-pixel checks across desktop/mobile viewports that it is nonblank, correctly framed, interactive/moving, and that referenced assets render as intended without overlapping.
- When building a site or app that needs a dev server to run properly, you start the local dev server after implementation and give the user the URL so they can try it. If there's already a server on that port, you use another one. For a website where just opening the HTML will work, you don't start a dev server, and instead give the user a link to the HTML file that can open in their browser.

## Color Strategy

Pick a color strategy before choosing colors:

- Restrained: tinted neutrals plus one accent at <=10% of the surface. This is often the product default and a valid brand-minimalist choice.
- Committed: one saturated color carries 30-60% of the surface. Use when identity or campaign energy should be unmistakable.
- Full palette: 3-4 named roles used deliberately. Use for brand campaigns, product data visualization, or surfaces with real semantic color needs.
- Drenched: the surface is the color. Use for brand heroes and campaign pages that earn a bold first impression.

Do not collapse everything to Restrained by reflex. The <=10% accent rule applies only to Restrained.

Use OKLCH where the stack supports it. Reduce chroma as lightness approaches 0 or 100; high chroma at extremes looks garish. Avoid pure `#000` or `#fff` for large surfaces. Tint neutrals toward the brand hue, even chroma 0.005-0.01 is enough.

For brand color, name a real reference before picking a strategy — a real product, brand, place, or material whose color use you would honestly compare yourself to. Unnamed ambition becomes generic.

## Theme

Theme comes from a physical usage scene, not a category. "Observability dashboard" does not force an answer. "SRE glancing at incident severity on a 27-inch monitor at 2am in a dim room" does. Run the sentence, not the category.

## Typography Selection

For greenfield brand typography:

1. Write three concrete brand-voice words. Avoid "modern", "clean", "elegant", and "premium"; use physical words like "warm", "mechanical", "clinical", "inked", "ceramic", "restless", "precise".
2. Note your reflex picks — the first two or three fonts that come to mind. If the final choice matches that reflex without earning it, restart.
3. Browse a real catalog with the physical words in mind. Think museum label, field manual, receipt, watch dial, cheap newsprint, fabric tag, concert poster, lab notebook.
4. Cross-check against the original reflex. If the final pick is just the first reflex with a rationale, restart.

System-default sans choices like Inter, DM Sans, or platform UI fonts are legitimate when product clarity is the goal. The reflex check is about whether the pick is deliberate, not about banning specific families.

Product UI usually does not need this. Use a tuned system or familiar sans stack unless the product has an established brand type system.

Typography carries most of the interface:

- Body/prose measure: 65-75ch.
- Limit most systems to two typefaces max.
- Product type: system fonts are legitimate. Use a fixed rem scale, ratio 1.125-1.2. Do not use display fonts in UI labels, buttons, or data.
- Brand type: choose voice, not default prettiness. Use fluid `clamp()` for display headings when the surface benefits from breathing across viewports.
- Light-on-dark text usually needs 0.05-0.1 more line-height because light type reads lighter and needs more air.
- Use tabular or stable numerals when changing values would otherwise jitter.

Pairing patterns by genre:

- Editorial, long-form, luxury: display serif plus sans body.
- Tech, dev tools, fintech: one committed sans, with weight contrast inside a single family.
- Consumer, food, travel: warmer pairings, often humanist sans plus script or display serif.
- Creative studios and agencies: rule-breaking is allowed, including mono-only, display-only, or custom-drawn type when the voice earns it.

## Layout Rhythm

- Vary spacing. Same padding everywhere is monotony.
- Use proximity for grouping before adding containers.
- Use cards only when items are distinct, actionable, or comparable.
- Choose a depth language: shadow, outline, hairline, material, elevation, or native surface. Do not mix several casually.
- If an inner rounded element sits close to an outer rounded container, the outer radius should visually account for the gap.
- Icons, arrows, play symbols, asymmetric glyphs, and mixed text-icon controls often need optical centering adjustments.
- When the visible control is small, extend the hit area without overlapping neighboring hit regions.
- Media usually needs a subtle edge treatment so it feels intentional against the background.
- If a panel can become plain layout without losing meaning, remove the card treatment.
- Keep radius, stroke weight, shadow language, and accent behavior consistent across the surface.

For landing pages, give each section a dominant device: poster hero, editorial stack, asymmetrical feature rail, pinned story band, restrained grid, product proof, testimonial strip. Avoid repeating the same architecture twice in a row.

For generated-template failure modes and direct replacement patterns, read [bans.md](bans.md).

## Brand Landing Pages

Before building, commit to:

- Visual thesis: one sentence naming mood, material, and energy.
- Content plan: hero, support, detail, proof, final CTA.
- Interaction thesis: 2-3 motion or interaction ideas that change the feel of the page.

Each section gets one job, one dominant visual idea, and one primary takeaway or action.

Hero rules:

- The hero itself should run edge-to-edge on branded landing pages. Constrain the inner text/action column, not the whole first viewport.
- If there is a sticky header, it counts against the first viewport.
- The combined header and hero content must fit within the initial viewport at common desktop and mobile sizes.
- Brand first, headline second, body third, CTA fourth.
- No hero cards, stat strips, logo clouds, pill soup, or floating dashboards by default.
- Keep hero headlines to roughly 2-3 lines on desktop and readable in one glance on mobile.
- Keep the text column narrow and anchored to a calm area of the image.
- If the first viewport still works after removing the image, the image is too weak.
- If the brand disappears after hiding the nav, hierarchy is too weak.
- Leave a hint of the next section visible when possible so the page has forward motion.

## Imagery

If the brief implies real-world subject matter, use real or generated imagery. Do not substitute abstract CSS blocks for restaurants, hotels, travel, food, fashion, photography, places, venues, products, or people.

For greenfield web work without assets, Unsplash is acceptable when network/source use is allowed. URL shape:

```text
https://images.unsplash.com/photo-ID?auto=format&fit=crop&w=1600&q=80
```

Use photo IDs you are confident exist. If unsure, use fewer images and make them stronger. Alt text is part of the voice.

Prefer in-situ photography over abstract gradients or fake 3D objects. Avoid images with embedded signage, logos, or typographic clutter that fight the UI. Do not generate images with built-in UI frames, splits, cards, or panels. Treat images before placing them: crop for calm text zones and use tonal adjustments when needed so the page feels art-directed rather than stock.

## Motion

- State feedback: 100-150 ms.
- Product state changes: 150-250 ms.
- Larger reveals or modal/drawer entries: 250-400 ms.
- Exit is usually 60-80% of entrance duration.
- Use ease-out-quart, ease-out-quint, or ease-out-expo. Avoid bounce and elastic unless the brand is explicitly playful and the interaction earns it.
- Prefer transform, opacity, blur, symbol transition, matched geometry, or platform-native animation over layout-property animation.
- Bound expensive effects and verify smoothness on the target surface.
- Motion must retarget when user intent changes.
- For visually led work, ship 2-3 intentional motions: one hero entrance, one scroll-linked/sticky/depth effect, and one hover/reveal/layout transition that sharpens affordance.
- Motion should be noticeable in a quick recording, smooth on mobile, and removed if ornamental only.

## Copy

For product copy, accessibility text, empty states, errors, and labels, read [ui-copy.md](ui-copy.md). It is the canonical source for preventing implementation leakage and scaffold-as-UI.

## Product Micro-Polish

- Use skeleton states when content structure is known.
- Use stable numerals or stable containers for dynamic numbers.
- Use tabular numbers in ledgers, timers, tables, charts, and counters.
- Make focus states visible and consistent with the platform.
- Preserve touch target size even when the visible icon is small.
- Do not let hover be the only way to discover functionality.
- Align sibling screens. Repeated product tasks should feel like the same tool, not separate mini-sites.

## App Surfaces

Organize product UI around:

- primary workspace
- navigation
- secondary context or inspector
- one clear accent for action or state

Default to calm surface hierarchy, strong typography and spacing, few colors, dense but readable information, and minimal chrome. Avoid dashboard-card mosaics, decorative gradients behind routine UI, thick borders on every region, multiple competing accent colors, and ornamental icons that do not improve scanning.

## Design-System Discipline

Establish the core system before polishing details:

- type pairing or single-family strategy
- radius family
- border behavior
- shadow/depth language
- accent strategy
- icon style
- motion vocabulary

Pick one depth language per surface — shadow, outline, hairline, tonal layer, native material, or translucency — and apply it consistently. Mixing several casually reads as indecision rather than collision. Translucent/glass material is a legitimate choice when the platform, brand, or product context calls for it; treat it as one depth language, not a decorative effect layered on top of another.

## Default Refusals

Refuse these patterns unless the user explicitly asks for them or the brief clearly justifies the choice:

- Thick side-stripe borders on cards, list items, alerts, or callouts. Use full borders, surface tints, icons, numbers, or structure.
- Gradient text used as default emphasis. A single solid color with size, weight, placement, or contrast usually reads stronger; gradient text is a real brand move when the identity earns it.
- Hero-metric templates without real data presentation: big number, small label, supporting stats, decorative accent. If real data matters, design a real data presentation; the template form is a legitimate fintech/analytics pattern when the numbers actually carry the story.
- Identical card grids. Vary composition, span, rhythm, section type, or remove the cards.
- Modal as first thought. Exhaust inline, route-level, drawer, popover, undo, progressive disclosure, or direct manipulation alternatives first.
- Monospace as lazy shorthand for technical or developer. If the brand is not actually technical, mono reads as costume.
- All-caps body copy. Reserve caps for short labels, metadata, and headings.
- Large rounded-corner icons above every heading. This is template behavior, not identity.

## Category Reflex Check

Before committing to a visual direction, run one pass: if someone could guess the theme and palette from the product category alone — healthcare → white and teal, finance → navy and gold, crypto → neon on black — rework. A direction can still be conventional if conventional is correct, but it should be a deliberate choice, not the first thing the category suggests.

## Self-Check

- Is the brand or product unmistakable in the first screen?
- Is there one strong visual anchor?
- Can the page be understood by scanning headlines only?
- For product UI, can an operator scan only headings, labels, and numbers and understand the page immediately?
- Do the headline, primary action, and support text tell the person what to do next?
- Does each section have one job?
- Are cards actually necessary?
- Would the design still feel premium if decorative shadows were removed?
- Are radius, borders, shadows, and accents behaving like one deliberate system?
- Does layout rhythm change enough from section to section to avoid a template feel?
- Do controls, motion, media, and typography feel precise at the detail level?

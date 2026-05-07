# Lenses

Use these tactical lenses when a lane needs more design specificity.

## Typography Selection

For greenfield brand typography:

1. Write three concrete brand-voice words. Avoid "modern", "clean", "elegant", and "premium"; use physical words like "warm", "mechanical", "clinical", "inked", "ceramic", "restless", "precise".
2. List the fonts you would pick by reflex. If they include saturated defaults from `SKILL.md`, reject them.
3. Browse a real catalog with the physical words in mind. Think museum label, field manual, receipt, watch dial, cheap newsprint, fabric tag, concert poster, lab notebook.
4. Cross-check against the original reflex. If the final pick is just the first reflex with a rationale, restart.

Product UI usually does not need this. Use a tuned system or familiar sans stack unless the product has an established brand type system.

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

For product copy, accessibility text, empty states, errors, labels, and mockup UI text, read [ui-copy.md](ui-copy.md). It is the canonical source for preventing implementation leakage and scaffold-as-UI.

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

Do not mix soft glass cards, brutal borders, editorial typography, native material, and decorative gradients in one surface unless the brief explicitly demands collision.

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

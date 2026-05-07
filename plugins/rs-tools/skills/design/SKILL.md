---
name: design
description: Use explicitly for high-craft UI and product design work across web, native apps, dashboards, tools, landing pages, onboarding, empty states, and design systems. Handles interface mockup images, A/B/C option boards, mobile flow boards, component studies, state matrices, reference-based visual refinements, creating and redesigning interfaces, initializing or refreshing docs/DESIGN.md, screenshot-led polish, UX/design critique, technical UI audits, accessibility, adaptive layout, typography, color, motion, microcopy, production hardening, and product/brand design judgment. Not for backend-only work.
---

# Design

Design produces real working interfaces, committed design choices, and inspected craft. Match implementation complexity to the vision: maximalism needs elaborate code; minimalism needs precision. Vary across projects. Never converge on the same safe answer.

## Start Here

1. Read the request literally. If the user asks for changes, make changes. If they ask for review, stay read-only.
2. Load `docs/DESIGN.md` first when it exists. Treat it as the strongest design context unless the user explicitly asks to depart from it.
3. Gather adjacent context: `AGENTS.md`, product specs, active plans, existing components, tokens, previews, screenshots, assets, and running UI.
4. Classify the surface as `product` or `brand`.
5. Choose the lane below and read its reference.
6. Inspect the rendered surface whenever tools exist. Code-only design work is a fallback, not normal design work.

## Lanes

- `init`: create `docs/DESIGN.md` when the repo lacks a design source of truth. Read [references/init.md](references/init.md).
- `refresh`: update `docs/DESIGN.md` from the current implemented system. Read [references/init.md](references/init.md).
- `mockup`: create interface mockup images, option boards, flow boards, component studies, state matrices, or reference-based refinements. Read [references/mockups.md](references/mockups.md).
- `craft`: create or substantially redesign a surface, with mockups when useful. Read [references/craft.md](references/craft.md).
- `audit`: evaluate a surface without changing code. Covers UX critique and technical UI audit. Read [references/audit.md](references/audit.md).
- `polish`: improve an existing functional surface through visual passes. Read [references/polish.md](references/polish.md).
- `harden`: make an existing surface survive real data, errors, devices, accessibility, and localization. Read [references/harden.md](references/harden.md).

Plain-language requests route naturally:

- "mock this", "make A/B/C options", "visualize this flow", "make a state matrix", "generate UI mockups" -> `mockup`
- "shape this", "make a new flow", "build this screen", "redesign this surface" -> `craft`
- "critique this", "review the design", "what's wrong with this UI" -> `audit`
- "make it quieter", "fix the type", "tighten the layout", "make it bolder", "add delight" -> `polish`
- "handle edge cases", "make it production-ready", "test long text" -> `harden`
- "create the design file", "initialize design docs" -> `init`

If the user asks for a lane not listed, choose the closest listed lane and say the mapping briefly.

## Product Or Brand

Product surfaces are app UIs, dashboards, settings, tools, data tables, forms, authenticated screens, and repeated workflows. Design serves the task. Familiarity is often a feature. The product slop test is: would a user fluent in the category's best tools trust this interface immediately, or pause at subtly-off components? Product UI fails through strangeness without purpose.

Product can afford system fonts, standard navigation, density, and consistency over surprise. Use those permissions. A good product surface often disappears into the task.

Brand surfaces are landing pages, marketing pages, campaign pages, portfolios, public long-form, product showcases, venues, people, objects, or places. Design is part of the deliverable. The brand slop test is: if someone could say "AI made that" without hesitation, it failed. Brand fails through timid palettes, average layouts, no imagery when imagery is expected, and no point of view.

Brand can afford ambitious first-load motion, single-purpose viewports, typographic risk, unexpected color strategies, and art direction per section. Use those permissions when the surface earns them.

If a surface is mixed, let the current task decide. A product can have a brand-led welcome screen. A marketing site can contain product UI examples.

## Color

Pick a color strategy before choosing colors:

- Restrained: tinted neutrals plus one accent at <=10% of the surface. Product default; brand minimalism.
- Committed: one saturated color carries 30-60% of the surface. Brand default for identity-driven pages.
- Full palette: 3-4 named roles used deliberately. Brand campaigns and product data visualization.
- Drenched: the surface is the color. Brand heroes and campaign pages.

Do not collapse everything to Restrained by reflex. The <=10% accent rule applies only to Restrained.

Use OKLCH where the stack supports it. Reduce chroma as lightness approaches 0 or 100; high chroma at extremes looks garish. Never use pure `#000` or `#fff` for large surfaces. Tint neutrals toward the brand hue, even chroma 0.005-0.01 is enough.

For brand color, name a real reference before picking a strategy: Klim #ff4500 orange drench, Stripe purple-on-white restraint, Liquid Death acid-green full palette, Vercel black monochrome. Unnamed ambition becomes beige.

## Theme

Theme comes from a physical usage scene, not a category. "Observability dashboard" does not force an answer. "SRE glancing at incident severity on a 27-inch monitor at 2am in a dim room" does. Run the sentence, not the category.

## Typography

Typography carries most of the interface.

- Body/prose measure: 65-75ch.
- Limit most systems to two typefaces max. One family with committed weight and size contrast is often stronger than a timid pairing.
- Product type: system fonts are legitimate. `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` is a valid native-feeling stack. One well-tuned sans usually carries headings, labels, buttons, body, and data. Use a fixed rem scale, ratio 1.125-1.2. Do not use display fonts in UI labels, buttons, or data.
- Brand type: choose voice, not default prettiness. Use fluid `clamp()` for display headings when the surface benefits from breathing across viewports. Use >=1.25 ratio between hierarchy steps; flat scales read as uncommitted.
- Light-on-dark text usually needs 0.05-0.1 more line-height because light type reads lighter and needs more air.
- Use tabular or stable numerals when changing values would jitter.

For new brand typography, reject reflex picks before browsing. Common saturated defaults: Fraunces, Newsreader, Lora, Crimson, Playfair Display, Cormorant, Syne, IBM Plex, Space Mono, Space Grotesk, Inter, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans, Instrument Serif. Existing brand identity wins, but greenfield choices must look further.

## Layout

Space is a design material.

- Same padding everywhere is monotony. Use tight grouping for related items and generous separation between distinct ideas.
- Do not wrap everything in containers. Most things do not need one.
- Cards are not layout. Use them only when they frame distinct, actionable or comparable units. Never nest cards.
- If a panel can become plain layout without losing meaning, remove the card treatment.
- Commit either to asymmetry or to a strict visible grid. Splitting the difference becomes a generic centered stack.
- Avoid centered hero stacks with icon, title, subtitle, and card grid unless the brief truly earns that template.
- Avoid repeating the same section architecture more than once in a row. Do not default to text-left, image-right for every section.
- Each section gets one job, one dominant visual idea, and one primary takeaway or action.

## Motion

Motion explains state, continuity, feedback, or reveal.

- Product motion is usually 150-250 ms. No orchestrated page-load sequences on task surfaces.
- Use ease-out-quart, ease-out-quint, or ease-out-expo curves. No bounce or elastic by default.
- Do not casually animate layout properties such as width, height, top, left, or margins. Prefer transform, opacity, matched geometry, symbol transitions, or platform-native state animation.
- Exit motion should usually be softer and shorter than entrance motion.
- Toggles, drawers, menus, panels, hover states, and selection changes should retarget smoothly when the user changes intent.
- Respect reduced motion.

## Absolute Bans

Match and refuse. If one of these appears in your planned design, rewrite the element with a different structure.

- Thick side-stripe borders on cards, list items, alerts, or callouts. Use full borders, surface tints, icons, numbers, or structure.
- Gradient text. Use a single solid color; create emphasis with size, weight, placement, or contrast.
- Decorative glassmorphism. Use blur/glass only when it is rare, purposeful, and technically verified.
- Hero-metric templates: big number, small label, supporting stats, gradient accent. If real data matters, design a real data presentation.
- Identical card grids. Vary composition, span, rhythm, section type, or remove the cards.
- Modal as first thought. Exhaust inline, route-level, drawer, popover, undo, progressive disclosure, or direct manipulation alternatives first.
- Monospace as lazy shorthand for technical or developer. If the brand is not actually technical, mono reads as costume.
- All-caps body copy. Reserve caps for short labels, metadata, and headings.
- Large rounded-corner icons above every heading. This is template behavior, not identity.

## Reflex Checks

Run two passes before committing to a visual direction:

1. First-order: if someone could guess the theme and palette from the category alone, such as healthcare -> white and teal, finance -> navy and gold, crypto -> neon on black, rework.
2. Second-order: if someone could guess the aesthetic from category-plus-anti-reference, such as AI workflow tool that is not SaaS cream -> editorial typography, or fintech that is not navy-and-gold -> terminal dark mode, rework again.

## Product Rules

- Skeleton states usually beat spinners floating in content.
- Empty states should teach the interface and offer the next useful action.
- Component vocabulary must be consistent. If the save button looks different in two places without reason, one is wrong.
- Do not reinvent standard affordances for flavor: custom scrollbars, weird form controls, non-standard modals, unclear tabs.
- Heavy color and full-saturation accents do not belong on inactive states.
- Use product copy, not implementation leakage. Visible text, accessibility text, alt text, notifications, errors, and mockup UI text must not expose internal states, scopes, flags, enum names, agent rationale, or scaffold-as-UI. For copy work, read [references/ui-copy.md](references/ui-copy.md).
- App UI should organize around a primary workspace, navigation, secondary context or inspector, and one clear accent for action or state.
- Avoid dashboard-card mosaics, thick borders on every region, ornamental icons, and decorative gradients behind routine work.
- Operator scan test: if someone scans only headings, labels, and numbers, can they understand the page immediately?

## Brand Rules

- Image-led briefs need imagery. Restaurants, hotels, magazines, photography, hobby communities, food, travel, fashion, venues, and product showcases should not ship as colored rectangles. Zero imagery is a bug unless the brand truly earns a type-only treatment.
- One decisive image beats five mediocre ones. Search for the physical object or moment, not the generic category.
- Tech and dev-tool brands can be image-light when typography, diagrams, code, or product artifacts carry the voice.
- On branded landing pages, the brand or object must be a first-viewport signal, not tiny nav text.
- Brand first, headline second, body third, CTA fourth.
- No hero cards, stat strips, logo clouds, pill soup, or floating dashboards by default.
- Keep hero headlines to roughly 2-3 lines on desktop and readable in one glance on mobile.
- Text over imagery must sit on a calm tonal area with strong contrast and clear tap targets.
- Visually led brand work should include 2-3 intentional motions: a hero entrance, a scroll/depth effect, and a hover/reveal/layout transition when the surface earns them.

## Self-Checks

Run these before calling a design done:

- Is the brand or product unmistakable in the first screen?
- Is there one strong visual anchor?
- Can the page be understood by scanning headlines only?
- Does each section have one job?
- Are cards actually necessary?
- Would the design still feel premium if decorative shadows were removed?
- Are radius, borders, shadows, and accents behaving like one deliberate system?
- Does layout rhythm change enough from section to section to avoid a template feel?

## Visual Evidence

Use the strongest available way to see the UI:

1. Native app, simulator, device, preview, or screenshot tooling.
2. Browser Use, Agent Browser, or in-app browser for web/local targets.
3. Project-native screenshot, snapshot, or preview tooling.
4. Existing screenshots or user-provided images.
5. Static code review only when rendering is unavailable.

If rendering is unavailable, say what could not be verified.

## Output

For implementation lanes, end with what changed, what was visually checked, and any unverified states. For audit, lead with findings ordered by severity. Keep explanations tied to the user, the surface, and the design system.

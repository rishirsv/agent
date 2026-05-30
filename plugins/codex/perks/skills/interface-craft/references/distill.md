# Distill

Distill is the Taste Engine. It turns screenshots, product captures, generated boards, brand assets, decks, or reference images into a concrete taste system that future design work can actually follow.

Use it when the user asks to analyze a design corpus, learn from screenshots, improve a design system, extract taste, compare generated directions, ingest a brand, or update a design skill from visual evidence. Also use it as a lightweight side pass during `craft`, `polish`, `refresh`, or `audit` when several screenshots reveal a repeated surface family.

## Scope Map

- Core rule: analyze aesthetic DNA, not product meaning.
- Context and corpus: choose the right evidence and labels.
- Passes: per-image analysis, canonical synthesis, rule extraction, and artifact promotion.
- Output: reusable taste rules and what to ignore.

## Core Rule

Analyze aesthetic DNA, not product meaning. Extract style, layout, hierarchy, density, typography, color, material, light, depth, spacing, composition, rhythm, control treatment, restraint, and visual tension.

Treat content, names, counts, app category, domain nouns, fixture data, depicted objects, slide topic, screen workflow, and generated-image mistakes as incidental unless they reveal a transferable visual rule. Translate domain-specific observations into domain-independent visual principles.

## Context

Before distilling, look for existing design context:

- design- or taste-related files
- design workflow docs
- image-generation guidance
- brand docs, asset inventories, deck templates, or previous visual references
- current components, tokens, previews, screenshots, and rendered UI

If durable taste guidance already exists, treat it as the target to refine. Do not create a second grammar brief.

## Corpus

Keep the corpus focused:

- current product screenshots or rendered captures
- adjacent screens that frame the target surface
- selected generated boards or reference mockups
- brand assets, decks, logos, imagery, and examples when the task touches brand posture
- external references only when the user asks for comparison, departure, or north-star direction

Index the corpus with stable labels, source paths, dimensions when known, and surface family. Remove duplicates and obviously broken evidence before analysis. Prefer splitting a large corpus by surface family: home, settings, detail pages, dashboards, onboarding, checkout, marketing hero, slide title pages, data slides, etc. A small specific corpus beats a broad mixed pile.

## Passes

### 1. Per-Image Analysis

For each image, write concise notes under these headings:

1. Visual composition only
2. What makes the aesthetic strong
3. Layout and composition principles
4. Typography principles
5. Color, material, light, and depth principles
6. Aesthetic mood or posture
7. Transferable aesthetic principles
8. What to ignore as incidental
9. Aesthetic tags

Keep the analysis visual. Do not explain the product, slide topic, workflow, or business context except to discard it as incidental.

### 2. Canonical Synthesis

For each surface family, reconcile the per-image notes into one canonical note:

- visual summary: major shapes, alignment, hierarchy, surfaces, density, and focal points
- why the aesthetic works: the strongest visual moves and why they matter
- transferable principles: 12-18 reusable visual rules
- pattern categories: layout, typography, color, material, density, detail, restraint
- incidental or too-literal content: what must not become doctrine
- evidence tags: concise visual tags that help cluster the family later

Correct overfunctional, content-specific, brand-literal, or overstated observations. Keep sharp evidence-backed insights even when they are subtle.

### 3. Strict Rule Extraction

Convert the canonical notes into production rules. The goal is a rule set a future model or designer can execute without making open-ended aesthetic decisions.

A good rule is:

- visible in the evidence
- specific enough to implement
- transferable across surfaces or clearly scoped to one family
- declarative rather than optional
- about typography, color, shadows, radius, spacing, density, alignment, borders, surfaces, icon/detail treatment, composition, motion, imagery, or state treatment

A bad rule is:

- vague mood language
- broad praise such as "make it premium", "make it elegant", or "make it beautiful"
- an invitation for the model to invent a style
- tied to product domain, copy, content, screenshots, slide topic, or fixture data
- a stereotype shortcut such as luxury serif, beige editorial, neon tech, or generic SaaS cards

Phrase rules as commands: "Use...", "Set...", "Keep...", "Reserve...", "Avoid...", "Do not...". Include numeric or relational constraints when exact values are unavailable: one accent max, low saturation, thin borders, large soft blur, localized density, few type weights, generous internal padding, etc.

### 4. Rule Disposition

Every candidate rule must land in one bucket:

- Promote: durable repo-wide or brand-wide taste rule.
- Keep local: useful for one surface family, feature, campaign, deck type, or artifact class.
- Discard: content, copy, data, subject matter, generated artifact, or one-off execution detail.
- Verify: promising but needs more evidence, rendered proof, or user judgment.

Only `Promote` and stable `Keep local` rules become directive taste guidance. Keep `Discard` and `Verify` in the final output as guardrails and open questions so the design docs do not become a junk drawer.

## Taste Output

When the user wants durable guidance, create or update one design or taste artifact. Prefer the existing path if the repo already has one; otherwise follow the repo's docs convention.

Write the artifact as strict, platform-agnostic design guidance for the project or brand. Make it concrete and somewhat long if specificity is needed. Do not mention models, APIs, experiments, prompt chains, or source-image process in directive sections.

Use this structure:

```markdown
# Taste

## Use This When
What kinds of design work should load this taste guidance.

## Core Directive
The primary visual behavior in plain imperative language.

## Non-Negotiable Defaults
Durable rules that should hold unless the user explicitly asks otherwise.

## Typography
Concrete type hierarchy, scale, weight, spacing, density, and typeface rules.

## Color
Palette behavior, accent count, contrast, saturation, mode-specific rules, and color anti-patterns.

## Surfaces, Shadows, And Borders
Rules for fills, materials, radius, elevation, outlines, dividers, translucency, and depth.

## Layout, Spacing, And Density
Rules for grid, focal mass, whitespace, grouping, alignment, responsive behavior, and repetition.

## Details, States, And Components
Rules for icons, controls, cards, charts, tables, empty/error/loading states, imagery, motion, and repeated elements.

## Content Neutrality
Rules that prevent names, copy, categories, avatars, filler data, or decorative props from carrying the aesthetic.

## Forbidden Shortcuts
Concrete visual or content shortcuts the design must not rely on.

## Local Rules
Rules that apply only to named surface families, deck types, campaigns, or feature areas.

## Open Questions
Rules marked Verify, with the evidence needed to promote or discard them.

## Generation Checklist
A concrete checklist the design must pass before finishing.
```

Avoid empty trigger words as the only style guidance: premium, elegant, sophisticated, tasteful, beautiful, refined, modern, clean. These describe nothing concrete on their own. Words like warm, atmospheric, cinematic, editorial, tactile, or object-like are usable when paired with specific evidence about typography, color, material, or composition.

## Promotion

Promote only stable rules.

- Put the canonical taste system in the repo's existing design or taste guidance path.
- Put repo-specific design contract rules in the repo's existing design source of truth when they govern implementation.
- Put feature-family rules in the `Local Rules` section of the durable guidance artifact unless a nearby spec is clearly the better owner.
- Put transient corpus notes in an ignored temp folder such as `.agents/tmp/<task>/`.
- Put reusable, repo-agnostic workflow improvements back into this skill.

Do not promote exact copy, data values, screen counts, fixture state, specific icons, one-off artwork, slide topic, or generated mockup errors into design rules.

## Output

For read-only distillation, return the artifact path and the highest-signal `Promote`, `Keep local`, `Discard`, and `Verify` decisions. For docs updates, summarize where the durable guidance changed, what was promoted, what stayed local, what was discarded, and what evidence informed the change.

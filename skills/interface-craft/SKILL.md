---
name: interface-craft
description: Use when creating, redesigning, polishing, auditing, or hardening product interfaces, brand surfaces, frontend UI, visual systems, screenshot-led UX, design docs, or taste rules; not for backend-only tasks, generic styling chores, ordinary copyediting, or disposable prototypes.
---

# Interface Craft

Interface Craft handles production UI, product surfaces, brand pages, visual systems, UX critique, polish, hardening, design docs, and taste distillation. Match the work to the surface: product UI should earn trust through clarity and repeatable controls; brand surfaces need a point of view strong enough to survive the first viewport.

## Scope

Use this skill for explicit interface work:

- create or redesign a UI surface
- critique UX or visual quality
- polish a rendered surface
- harden UI states, accessibility, layout, and copy
- initialize or refresh durable design guidance
- distill screenshots, references, or existing UI into reusable taste guidance
- translate visual references into implementation guidance

Do not use this skill for backend-only work, generic code cleanup, ordinary copyediting, or disposable prototypes.

## Start

1. Read the request literally: edit when asked to edit; stay read-only when asked to review.
2. Look for any design- or taste-related files before asking for direction.
3. Prefer the repo's existing design guidance path and naming convention over inventing a new one.
4. Gather only relevant context: screenshots, previews, components, tokens, assets, brand docs, product specs, active plans, and existing routes.
5. Classify the work as `product`, `brand`, or mixed.
6. Decide whether the surface is greenfield, an existing product surface, or a generated prototype being raised to production quality.
7. Choose one lane and load only the needed reference.
8. Inspect rendered output whenever tools allow it.

## Lane Selection

- `init`: create or refresh durable design guidance; read [references/init.md](references/init.md).
- `distill`: extract visual rules from screenshots, references, generated mockups, or surface families; read [references/distill.md](references/distill.md).
- `craft`: create or substantially redesign a surface in the real stack; read [references/craft.md](references/craft.md).
- `audit`: critique or audit without editing; read [references/audit.md](references/audit.md).
- `polish`: improve an existing functional surface through visual passes; read [references/polish.md](references/polish.md).
- `harden`: make an existing surface survive real data, failure states, accessibility, devices, and localization; read [references/harden.md](references/harden.md).

For typography, color, layout, imagery, motion, brand landing pages, product micro-polish, and design-system discipline, read [references/lenses.md](references/lenses.md) only when that axis matters.

For repeated generated-UI failure modes, hard visual bans, and detector interpretation, read [references/bans.md](references/bans.md).

For visible UI text, labels, alt text, empty states, errors, notifications, and accessibility copy, read [references/ui-copy.md](references/ui-copy.md).

## Product Or Brand

Product surfaces are app UIs, dashboards, settings, tools, data tables, forms, authenticated screens, and repeated workflows. Design serves task completion and category trust.

Brand surfaces are landing pages, marketing pages, campaign pages, portfolios, showcases, and public narrative surfaces. Design is part of the deliverable and must carry a memorable point of view.

Mixed surfaces should follow the current task. A product can have a brand-led welcome screen; a marketing site can contain product UI examples.

## Visual Evidence

Use the strongest available way to see the UI:

1. Native app, simulator, device, preview, or screenshot tooling.
2. Browser, Agent Browser, or in-app browser for web or local targets.
3. Project-native screenshot, snapshot, or preview tooling.
4. Existing screenshots or user-provided images.
5. Static code review only when rendering is unavailable.

If rendering is unavailable, say what could not be verified.

## Slop Detector

Use [scripts/detect-ui-slop.mjs](scripts/detect-ui-slop.mjs) when the task touches frontend source files and Node is available. Pass changed files or a focused UI directory:

```bash
node <skill-dir>/scripts/detect-ui-slop.mjs path/to/ui
```

The script reports pattern-level risks such as cream default palettes, gradient text, side stripes, ghost cards, over-rounded controls, layout-property animation, and generic marketing copy. A finding is not proof that the UI is bad; it is a mandatory inspection target. Fix real violations, justify intentional exceptions briefly, and report when the script could not run.

## Quality Contract

End every design task with:

- intent
- primary user state
- evidence inspected
- changes made or findings
- checks run, including viewports and states where relevant
- slop detector findings or reason skipped when frontend files were in scope
- accessibility checks where relevant
- unresolved risk

For audits, lead with findings ordered by severity. For implementation lanes, lead with what changed and what was verified. Never present a detector pass as rendered proof.

## Guardrails

- Do not invent a new product direction during polish.
- Do not let generated mockups override product semantics, accessibility, platform conventions, or real content.
- Do not ship uninspected UI when rendering is available.
- Do not expose implementation leakage in user-facing copy.
- Do not keep hard-banned generated patterns unless the brief explicitly earns them.
- Preserve useful local design doctrine; move deeper reasoning into the appropriate reference rather than deleting it.

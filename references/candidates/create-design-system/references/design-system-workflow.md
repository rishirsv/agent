# Design System Workflow

This reference preserves the detailed extracted guidance behind the `create-design-system` skill.

## What This Skill Produces

A design system here is a filesystem package containing:

- typography guidance
- colors and token definitions
- copied visual assets
- brand tone guidance
- CSS foundations
- recreated UI kits
- optional slide examples

The package should help future design agents build faithful brand work rather than improvise from memory.

## First Pass

Start with a task list, then inspect all provided sources:

- codebases
- Figma files
- decks
- asset folders
- screenshots used only as a backup visual reference

Create `README.md` with:

- company and product context
- the different product surfaces represented
- the exact source paths or links used

Call `set_project_title` with a short brand-derived title.

If a required codebase or Figma source is inaccessible, stop and ask the user to restore access.

## Required Root Artifacts

Unless told otherwise, create these at the root:

- `README.md`
- `colors_and_type.css`
- `fonts/`
- `assets/`
- `preview/`
- `ui_kits/`
- `slides/` when slide material exists
- `SKILL.md`

## README Sections

Keep `README.md` updated with:

- source inventory
- content fundamentals
- visual foundations
- iconography
- manifest or file index

Content fundamentals should cover writing style, tone, pronouns, casing, emoji usage, and vibe, with concrete examples.

Visual foundations should cover as many of these as the source supports:

- colors
- typography
- spacing
- backgrounds
- imagery treatment
- gradients and textures
- motion and easing
- hover and press states
- border and shadow systems
- blur or transparency usage
- corner radii
- card styling
- layout rules

## Fonts And Icons

- Copy real fonts when possible.
- If fonts are missing, choose the nearest Google Fonts substitute and flag it.
- Copy the product's icon set first.
- If the icon set is unavailable, use the nearest CDN-available substitute and flag that substitution.
- Never hand-draw a half-correct icon system when the original can be copied.

## Preview Cards

Create small preview cards in `preview/` that feed the design-system gallery.

Guidelines:

- aim for many small cards instead of a few dense ones
- target roughly `700px` wide
- split concepts into separate cards
- avoid extra framing inside the cards

Use consistent asset-registration groups:

- `Type`
- `Colors`
- `Spacing`
- `Components`
- `Brand`

## UI Kits

For each product surface, create a UI kit under `ui_kits/<product>/`.

Each kit should include:

- `README.md`
- `index.html`
- reusable component files

Expectations:

- recreate the real design closely
- use code or Figma context as the truth source when possible
- create click-through, high-fidelity facsimiles
- keep components modular
- do not reinvent the product under the guise of a UI kit

## Slides

If slide templates or decks were provided:

- create representative slide examples under `slides/`
- preserve the visual system from the source deck
- register each slide preview at `1280x720`

If no deck source was provided, skip slide creation.

## Finish

Create a cross-compatible `SKILL.md` so the system can travel as a portable design skill.

Close by surfacing:

- caveats
- uncertain substitutions
- the clearest user ask for the next iteration

Also remind the user to set the file type to Design System in the Share menu so others in the org can discover it.

---
name: interface-mockups
description: Generate or refine UI mockup images for app and web interfaces using imagegen. Use when Codex should create full-screen mobile or web mockups, isolated component concepts, state matrices, labeled A/B/C design options, repo-grounded visual studies, or prompt-shaped interface images relative to the current app or product.
---

# Interface Mockups

Use this skill to turn a rough interface idea into one or more useful generated UI mockups. This skill shapes the prompt, chooses the right reference guidance, and then uses `$imagegen` for the actual raster image generation or edit.

Default goal: create design artifacts that help decide direction. Do not treat generated mockups as implementation truth.

## Required Pairing

- Use `$imagegen` for all generated or edited image output.
- If the user asks for implemented UI, use this skill only for visual exploration and then switch to the relevant implementation skill.
- If the user provides reference images, label each input role before prompting: edit target, style reference, product reference, or supporting insert.

## Workflow

1. Classify the artifact:
   - full mobile screen
   - mobile flow or multi-screen board
   - web app screen
   - isolated component
   - component state matrix
   - labeled A/B/C option board
   - edit or reference-based visual refinement
2. Gather design context:
   - If the repo has `DESIGN.md`, `docs/DESIGN.md`, `AGENTS.md`, brand docs, or design-system files, read the smallest useful set first.
   - Treat the current app's design docs, existing UI, product copy, and platform conventions as the source of truth.
   - If the user explicitly asks to depart from the current design, name what is being kept and what is allowed to change.
3. Read only the relevant references:
   - Mobile screens and flows: `references/mobile.md`
   - Web screens: `references/web.md`
   - Components and states: `references/components.md`
   - Options and A/B/C variation: `references/variants.md`
   - Prompt construction: `references/openai-image-guidance.md` and `references/prompt-patterns.md`
   - Output review: `references/evaluate.md`
4. Decide variation depth:
   - Tight variation when the user names what may vary.
   - Moderate variation when the user asks for options without strict constraints.
   - Wide variation only when the user asks to reimagine, break from the current design, or explore very different directions.
5. Write the image prompt:
   - State intended use, artifact type, platform, subject, visual system, composition, required UI elements, exact text, constraints, and avoid list.
   - For edits, repeat invariants: change only X; preserve Y.
   - For variants, generate separate prompts or a single comparison-board prompt with visibly labeled A, B, and C.
6. Generate with `$imagegen`.
7. Inspect the output:
   - Check artifact type, label accuracy, readable text, plausible UI, required states, and design-system fit.
   - If one targeted fix would materially improve the artifact, iterate once with a narrow follow-up.
8. Return:
   - PNGs grouped by artifact or option.
   - The final prompt or prompt set.
   - A brief note describing what varied and what stayed fixed.

## Variation Defaults

- If the user asks for "a few options", create three labeled options: A, B, and C.
- If the user asks for "two options", create A and B.
- If the user asks for "several" or "many", prefer three unless they specify a number.
- Put option labels outside the UI itself when possible so the product UI remains realistic.
- Keep the same device, background, palette, and app identity across variants unless those are the intended variables.

## Full-Screen vs Component Rules

- For a full mobile screen, generate the full iPhone screen and place it inside a realistic device or clean presentation frame.
- For a multi-screen mobile flow, show 2-4 full iPhone screens with coherent progression.
- For a component, do not invent a full app shell unless context is needed; use a clean neutral canvas or a cropped product surface.
- For a state matrix, show the same component repeated across states with clear labels outside the component.
- For web, show enough surrounding layout to understand navigation, hierarchy, and workspace context.

## Repo-Grounded Rules

- Follow repo design docs before generic taste guidance.
- Do not add fallback designs, compatibility designs, or alternate systems unless the user asks for transition options.
- If the user says not to use the current design, use the current design as a contrast point and make the departure explicit in the prompts.
- Do not allow image-generation polish to override product semantics, feature ownership, or platform behavior.

## Output Quality Bar

- UI text must be sparse, readable, and plausible.
- The primary action or state must be clear at a glance.
- Controls should look interactive and platform-native.
- Avoid fake complexity, tiny illegible labels, lorem ipsum, random charts, decorative clutter, and unrequested features.
- For product UI, prefer operational clarity over marketing drama.

# OpenAI Image Prompting Guidance

Use this reference to shape prompts for generated UI artifacts. Keep prompts specific enough to control the image, but not so overloaded that the model loses the main design decision.

Sources:

- OpenAI gpt-image-1.5 prompting guide: https://developers.openai.com/cookbook/examples/multimodal/image-gen-1.5-prompting_guide
- OpenAI GPT image models prompting guide: https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- OpenAI image generation tool options: https://developers.openai.com/api/docs/guides/tools-image-generation
- OpenAI image evals for UI mockups: https://developers.openai.com/cookbook/examples/multimodal/image_evals

## Prompt Order

Use a consistent order:

1. Intended use and artifact type.
2. Platform and screen/component type.
3. Scene or presentation frame.
4. Subject and required UI elements.
5. Composition and hierarchy.
6. Visual system.
7. Exact text.
8. Constraints and avoid list.

For complex requests, use short labeled sections or compact paragraphs.

## UI Mockup Specifics

UI mockups are product artifacts, not just pretty images. Prompts should make the output plausible as an interface:

- State platform and screen type.
- Name required components.
- Include exact headings, labels, and calls to action when text matters.
- Explain what the user can do.
- Make hierarchy constraints explicit.
- Disallow unrelated extras.
- Ask for readable text and realistic controls.

## Text Rules

- Put exact text in quotes.
- Keep text sparse.
- Spell unusual product names letter-by-letter if rendering accuracy matters.
- Prefer a few important labels over many tiny labels.
- Ask for strong contrast and readable type.

## Composition Rules

- Specify framing: close crop, full screen, multi-screen board, top-down board, front-facing device, or browser viewport.
- Specify viewpoint and placement when layout matters.
- Give comparison boards consistent scale, gutters, and labels.
- Do not rely on vague quality words alone; describe materials, spacing, hierarchy, and surface behavior.

## Preserve Rules For Edits

For edits or reference-based work:

- State what changes.
- State what must be preserved.
- Repeat invariants in every follow-up.
- Use "change only X; keep everything else the same" when the target image should stay stable.

## Iteration

Start with one strong base prompt. If the result is close, iterate with one targeted change:

- make text larger
- remove extra elements
- restore the original layout
- reduce card density
- increase contrast
- tighten labels

Avoid broad second prompts that change everything.

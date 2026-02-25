# Writing Standards

This playbook defines consulting-grade writing standards for KPMG-style slides.

## Tone And Style

- Executive, factual, and specific. Prefer concrete nouns, numbers, and time periods over adjectives. Remove hedging unless it is required for accuracy.
- Actionable, not academic. Every section should answer: what does this mean for the decision-maker, and what should they do next?
- Use topic titles such as "Revenue overview" or "Market overview" when the user asks for them. These are usually best as divider titles.
- Use sentence case for slide titles. Example: `Business overview`.
- Name the unit and period in the title or strapline when the claim is quantitative. Example: `FY2023-FY2025`, `LTM`, `Q4`.
- Avoid vague verbs like "drives," "enhances," and "improves" unless quantified.
- Avoid assurance language.

## Page-Level Narrative Structure

For each slide, use the same structure:

- Title: the claim.
- Strapline: the "so what" in one sentence. Optional, but strongly preferred on decision slides.
- Body: 3-6 bullets providing evidence and interpretation.
- Source line: compact citation for externally derived facts and non-obvious calculations.

For analysis slides with charts or tables, enforce the triad:

- What the evidence says: describe the pattern.
- Why it matters: state the decision implication.
- What to do: specify action, owner, and timing.

## Executive Summary Standards

Use this standard by deck length:

- Decks with 7 slides or fewer:
  - Executive summary is often Slide 2.
  - Include one-line story, 3-4 key findings, and 2-3 actions.
- Decks with 8-15 slides:
  - Use 2 executive summary slides.
  - Slide 2: four-box "Key messages" summary (`titleStrapline4TextBoxes`).
  - Slide 3: "Implications and next steps" narrative (`oneColumnText`).
- Decks with 15 or more slides:
  - Add a third executive summary slide only when needed.
  - Recommended topics: "Risks and sensitivities" or "Decision asks."

## Evidence Integration Rules

- If a claim is driven by numbers, do not bury numbers in prose. Use a chart or table layout that makes evidence legible.
- If a claim is driven by logic (for example operating model or risk chain), use narrative layouts and keep logic MECE and stepwise.
- If evidence is missing, label the gap explicitly and convert it into a "what we need" data request. Do not invent detail.

## Bullet Writing Standard

- For dense and extensive slides, write each bullet as a micro-story: claim; evidence; implication.
- Lead with the label, then detail.
- Prefer quantified evidence over generic descriptors.
- Keep bullets precise and decision-linked, not descriptive for its own sake.

## Common Writing Anti-Patterns

- Kitchen sink slides:
  - Symptom: too many unrelated bullets that do not ladder to one claim.
  - Fix: split into two slides with narrower claims.
- Empty claims:
  - Symptom: strong title with no supporting evidence.
  - Fix: add evidence or rewrite the title to match what can be proven.
- Unsourced numbers:
  - Symptom: money or percentage values with no source line.
  - Fix: add `source`, `noteSource`, or `chart.source`.

# Writing Standards

This playbook defines consulting-grade writing standards for KPMG-style slides.

## Tone And Style

- Executive, factual, and specific. Prefer concrete nouns, numbers, and time periods over adjectives. Remove hedging unless it is required for accuracy.
- Actionable, not academic. Every section should answer: what does this mean for the decision-maker, and what should they do next?
- Use topic titles such as "Revenue overview" or "Market overview" when the user asks for them. These are usually best as divider titles.
- Use sentence case for slide titles. Example: `Business overview`.
- Name the unit and period in the title or strapline when the claim is quantitative. Example: `FY2023-FY2025`, `LTM`, `Q4`.
- Write in active voice.
- Vary sentence length when useful to improve readability and rhythm.
- Follow language controls in this file for prohibited terms and substitutions.

## Page-Level Narrative Structure

For each slide, use the same structure:

- Title: the claim.
- Strapline: the "so what" in one sentence. Optional, but strongly preferred on decision slides.
- Body: 3-6 bullets providing evidence and interpretation.
- Source line: compact citation for externally derived facts and non-obvious calculations.
- For dense sections, use subheadings to structure bullets (for example `{ "text": "Heading", "subheader": true }` in `textArray`).

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
- Present evidence before implication in body copy and bullets.

## Bullet Writing Standard

- For dense and extensive slides, write each bullet as a micro-story: claim; evidence; implication.
- Lead with the label, then detail.
- Prefer quantified evidence over generic descriptors.
- Keep bullets precise and decision-linked, not descriptive for its own sake.
- Use subheadings to group dense bullets instead of long undifferentiated lists.
- Use nested bullets only when a child point directly depends on its parent point.
- Prefer 1-2 nested levels for readability; use deeper nesting only when detail is essential.
- For nested bullets in `deckSpec`, use `{ "text": "...", "children": [...] }` rather than nested arrays.

## Language Controls (Mandatory)

### Active voice rule

- Avoid: `Differences were adjusted by the Company.`
- Prefer: `The Company adjusted differences of $2.3M.`

### Must avoid

- Assurance terms: `ensure`, `accurate`, `fair`, `reasonable`, `appropriate`
- Vague magnitude terms without figures: `significant`, `substantial`, `material`
- Purpose statements: `in order to`, `designed to`, `for the purpose of`
- Process descriptions: `we analyzed`, `we reviewed`, `we performed`
- Emotional language: `drastically`, `impressively`, `disappointingly`
- Opinion language: `we believe`, `appears to be`, `seems to`
- Qualitative claims: `better represents`, `more accurately reflects`
- Implication connectors: `consequently`, `therefore`, `as a result`, `enhancing`

### Word substitutions

| Avoid | Use instead |
|---|---|
| `ensure` / `ensures` | `results in`, `creates` |
| `significant` | exact percentage or amount |
| `drastically` | exact percentage or amount |
| `we analyzed` | `the data shows`, `the analysis identified` |
| `we believe` | `the data indicates`, `historical patterns suggest` |
| `it was noted` | `[subject] showed`, `[subject] indicated` |
| `there were` | `[subject] included`, `[subject] contained` |
| `is considered` | `is`, `represents` |
| `in order to` | remove purpose phrase |
| `was performed` | `[subject] completed`, `[subject] conducted` |

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

# Global writing conventions

This file defines rules that apply to every FDD section contract.
Do not duplicate these rules in each section unless a section needs an explicit override.

## Core writing standard

- Write in an executive, factual, decision-useful tone.
- Keep statements specific and time-anchored.
- Use active voice.
- Avoid promotional or absolute language.
- Separate facts from interpretation.

## Placeholder policy (global)

When source data is missing, use inline placeholders in square brackets.
Do not create open-item sections or open-item bullets.

Allowed placeholders:
- `$[x]`
- `[x]%`
- `[Date]`
- `[FY20XX]`
- `[Period]`
- `[Customer name]`

Placeholder examples:
- `Revenue increased by $[x] in [FY20XX], primarily due to [driver].`
- `As of [Date], the Company operated [x] sites across [regions].`

## Evidence and source policy (global)

- Do not add a source line to every sentence.
- Use a compact source note only when needed:
  - numerical claims that are not common in context
  - sensitive claims (concentration, legal exposure, covenant risk)
  - non-obvious adjustments or assumptions
- Preferred pattern: one source note per block or exhibit, not per bullet.

Source note pattern:
- `Source note: Management KPI pack and FY[20XX]-FY[20XX] financials.`

## Verbosity and length policy (global)

Default target by section depth:
- `concise`: 160-260 words
- `standard`: 260-420 words
- `deep`: 420-700 words

Default density rules:
- 4-8 bullets per section block
- one core idea per bullet
- sentence length usually 12-28 words
- split paragraphs that exceed 4 sentences

## Language controls (global)

Avoid:
- `ensure`, `accurate`, `fair`, `reasonable`, `appropriate`
- `significant`, `substantial`, `material` without numbers
- `we analyzed`, `we reviewed`, `we performed`
- `we believe`, `appears to`, `seems to`
- `therefore`, `as a result`, `consequently` when unsupported

Prefer:
- concrete subject + verb + metric/time anchor
- claim -> evidence -> implication micro-structure in dense bullets

## Structural preflight (global)

Before finalizing any section:
1. Required blocks exist and are in order.
2. No unsupported headings were added.
3. No open-item sections appear.
4. Missing data is expressed via inline placeholders.
5. Numeric statements are period-labeled.
6. Tone and language controls pass.

## QA workflow (global)

1. Draft to contract.
2. Run structural preflight.
3. Apply one fix pass for clarity and density.
4. Recheck consistency of periods, units, and placeholders.
5. Deliver with clear status: `pass`, `pass_with_placeholders`, or `blocked`.

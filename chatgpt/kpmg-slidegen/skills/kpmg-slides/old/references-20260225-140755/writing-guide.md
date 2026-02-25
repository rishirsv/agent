# Writing Guide (Executive Slide Copy)

This guide helps you write slide copy that reads executive, stays defensible, and survives overflow/QA constraints.

## Two Profiles

### `kpmg_exec` (default)

Use for client-ready diligence content:
- Claim-led titles.
- Factual tone; minimal adjectives.
- Evidence language: what happened, why it matters, what to do next.
- Short sentences; no hype.

Good:
- "Control execution is inconsistent across business units, creating uneven incident response quality."

Weak:
- "There are various things that may potentially indicate room for improvement."

### `consulting_crisp` (optional)

Use when the user asks for tighter consulting voice:
- Hypothesis-led title (answer first).
- Bullets: implication -> support.
- One idea per bullet; minimal qualifiers.

Good:
- "Detection maturity lags peers; close monitoring gaps before expanding automation."

## Slide Construction Pattern (Use Everywhere)

1. **Title**: the claim (what this slide proves).
2. **Strapline** (if present): why it matters in one sentence.
3. **Body**: 3-6 high-signal bullets/paragraphs that support the claim.
4. **Sources**: cite numbers and externally-derived facts.

## Writing In Outline Mode vs Final Mode

Outline mode:
- Keep copy short.
- Focus on slide jobs, not perfect prose.
- Use placeholders only where needed to convey evidence shape.

Final mode:
- Tighten wording for scannability.
- Remove duplicated lines across slides.
- Ensure every number has a source line.

## Title Rules (Most Important)

- Make it a claim, not a topic.
- Name the metric/time period where relevant.
- Avoid vague verbs: "improves", "enhances", "drives" (unless quantified).

Patterns:
- "Revenue growth is concentrated in Segment A; Segment B is flat"
- "Working capital volatility increased; cash conversion is less predictable"

## Bullet Rules (Overflow-Safe)

- One idea per bullet (no "and and and").
- Prefer 1 line; 2 lines maximum.
- Start with the implication, then add a short reason.
- Use parallel structure across bullets.

Bad (too long):
- "Because the team has not fully implemented monitoring controls across all systems, the company may be exposed to additional risks that could impact..."

Better:
- "Monitoring coverage remains incomplete across core systems."
- "This increases detection lag and incident response variability."

## Quantitative Claims (Defensibility)

For any number or chart/table:
- Specify units and period: `$M`, `%`, `bps`, `FY2025`, `LTM`, `Q4`.
- Keep scale consistent across slides (e.g., always `$M`, not sometimes `$MM`).
- Add a source line (`chart.source`, `source`, or `noteSource`).

## Using Subheaders In `textArray`

Use inline subheaders to structure dense slides without extra shapes:
- `{ "text": "What changed", "subheader": true }`
- `{ "text": "Why it matters", "subheader": true }`
- `{ "text": "What to do next", "subheader": true }`

## Tightening Recipe (Use When QA Flags Overflow/Overlap)

Apply in order:
1. Remove adjectives and hedges ("significant", "potentially", "various").
2. Replace clauses with short statements (split one bullet into two).
3. Move details into a table slide (if it is data-heavy).
4. Split the slide into two intentional slides with narrower claims.

## Final Slide Checklist (10-Second Read Test)

Before calling a deck "Ready to share":
1. Can a reader understand the slide message in under 10 seconds?
2. Does each bullet add new information (no repetition)?
3. Are units/time periods consistent and explicit?
4. Are quantitative claims sourced?

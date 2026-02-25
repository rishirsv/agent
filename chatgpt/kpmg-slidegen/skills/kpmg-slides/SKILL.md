---
name: kpmg-slides
description: Write KPMG-branded PowerPoint decks end-to-end from planning to writing content to generating the .pptx to iterations. Use when the user asks to create or revise slides, a deck, presentation, pitch deck, board deck, diligence deck, or needs a KPMG-branded .pptx produced from notes, documents, spreadsheets, or web research. Supports outline-first collaboration, deckSpec editing, generation runs, and QA/overflow fixes. Not for pixel-level editing of an existing .pptx.
---

# KPMG Slides

This skill produces KPMG-branded `.pptx` decks from a `deckSpec` JSON file and gives you a QA loop to fix what breaks.

This skill is a **general-purpose, consulting-grade slide writer** that generates a KPMG-branded PPTX via `deckSpec` and a QA fix loop.

## Workflow Decision Tree

What type of task is this?

```
┌─ Creating a new deck
│  └─→ Follow "KPMG Slide Creation Workflow" below
│
├─ Editing existing populated slides?
│  └─→ Extract current content, modify, revalidate
│
└─ Fixing formatting issues on existing slides?
   └─→ See "Common Failures" table, apply targeted fixes
```

- If the user provides `qa.json`, an output folder, or mentions overflow/overlap → **QA triage mode** (read `references/qa-and-fix-loop.md`).
- Else if the user provides a `deckSpec` JSON or `*.deckSpec.json` → **deckSpec edit mode** (edit surgically, then regenerate).
- Else → **new deck mode** (outline-first planning, then draft deckSpec, then generate).

## KPMG Slide Creation Workflow

### Step 1: Ingest Context

Summarize the goal, audience, and key inputs from the conversation and uploaded documents. Ask the user the minimum amount of clarifying questions to obtain this information if you do not have it.

### Step 2: Verbosity and Density

Resolve settings into a deterministic contract before writing any slides.

Store the contract in `deckSpec.metadata` for traceability:

- `metadata.textAmount`: `sm|md|lg|xl`
- `metadata.densityProfile`: `dense|denser|densest` (or mirror `textAmount`)
- `metadata.slideCountPolicy`: `user|auto`
- `metadata.styleIntent`: `diligence|strategy|generic`

Set `metadata.allowSparse` to `false` by default. Only set `true` when the user explicitly wants a sparse draft.

#### Settings precedence (binding)

1. If the user provides explicit numeric constraints (slide count, bullets per slide, table rows), follow them.
2. Else follow verbosity tier mapping:

- `Minimal -> sm`
- `Concise -> md`
- `Detailed -> lg`
- `Extensive -> xl`

3. Else default to `lg`.

#### Non-negotiable validation guardrails

- Never exceed title hard limits. Titles are treated as hard limits in validation and most slide types cap title `maxChars` at 50
- Omit optional slots instead of emitting empty strings. If a slot exists but is empty and `allowEmpty: false`, validation can warn or error
- Only set `bodyStyle` to exactly `bullets` or `paragraphs`

#### Pagination-aware guardrails (must apply while writing)

- Pagination estimates line usage and chunks bullets to avoid overlap.
- Fallback text boxes used by pagination (when precise geometry is unavailable):
  - `oneColumnText` body fallback: `{ w: 11.1596, h: 5.6 }`
  - `twoColumnText` left/right fallbacks: `{ w: 5.7, h: 5.7 }` and `{ w: 5.2, h: 5.7 }`
  - `analysisWideChart2ColsText` body fallback: `{ w: 5.6, h: 5.4 }`
  - `analysisWideChartTableText` body fallback: `{ w: 11.1596, h: 2.2 }`
- `analysisNarrowTable` pagination can warn on dense rows and orphan-row splits.
- Post-pagination slide validation disables density enforcement (`enforceDensity: false`), so avoid creating giant bullet lists that auto-split unevenly.
- Prefer intentional split slides with explicit titles like `(1/2)` and `(2/2)` over implicit overflow splits.

#### Density budgets by tier and slide type

Use these as generation targets above template minima.

`oneColumnText`

- `sm`: 4-5 bullets, about 12-16 words each, strapline only if meaningful.
- `md`: 5-6 bullets, about 14-18 words each, include strapline, include source when data-backed.
- `lg`: 6-7 bullets, about 16-22 words each, include strapline + source on most slides.
- `xl`: 7-9 bullets, about 18-26 words each, include strapline + source unless pure narrative.
- `xl` writing rule: use `label + evidence + implication` inside each bullet to increase density without only increasing bullet count.

`twoColumnText`

- `sm`: 2-3 bullets per column, about 8-12 words each.
- `md`: 3-4 bullets per column, about 10-14 words each.
- `lg`: 4-5 bullets per column, about 10-16 words each.
- `xl`: 5-6 bullets per column, about 12-18 words each.
- Guardrail: keep bullets crisp; narrow columns can trigger rapid wrap growth and pagination splits.

`analysisWideChart2ColsText`

- `sm`: 4 bullets, about 12-16 words, simple 1-series chart.
- `md`: 4-5 bullets, about 14-18 words, 1-2 series chart where comparison is needed.
- `lg`: 5-6 bullets, about 14-20 words, include explicit "so what" bullet.
- `xl`: 6-7 bullets, about 16-22 words, include assumptions/source.
- Guardrail: avoid pushing beyond 7 bullets; body wraps quickly in fallback geometry.

`analysisWideChartTableText`

- `sm`: 4 bullets, about 10-14 words, include table only when needed.
- `md`: 4-5 bullets, about 12-16 words, table with 4-6 rows when present.
- `lg`: 5 bullets, about 12-18 words, table with 6-8 rows, include `noteSource`.
- `xl`: 5-6 bullets, about 14-20 words, table with 8-12 rows, always include `noteSource` when chart/table used.
- Guardrail: do not chase density by only adding bullets; body area is small (`h: 2.2`). Increase information richness and leverage the table.

`analysisNarrowTable`

- `sm`: table 4-6 rows, 2-3 insight bullets.
- `md`: table 6-8 rows, 3-4 insight bullets.
- `lg`: table 8-12 rows, 4-5 insight bullets, include `insightTitle`.
- `xl`: table 10-16 rows (watch row density), 4-6 insight bullets, add notes if needed.
- Guardrail: keep table cells close to one line to reduce dense-row warnings/orphan splits.

`titleStrapline4TextBoxes`

- Engine density is less protective for this layout. Enforce structure in writing:
  - 4 columns, each with short heading + 3-5 bullets.
  - `sm`: 3 bullets per column.
  - `md`: 3-4 bullets per column.
  - `lg`: 4 bullets per column.
  - `xl`: 4-5 bullets per column, including one implication bullet per column.

`divider`

- Always format as `01`, `02`, etc. Never `1`, `2`.

`contents`

- Include by default if 3 sections or greater. Otherwise omit unless requested.

#### Dense bullet writing pattern (required for `xl`)

- One bullet should read as a micro-story: `claim; evidence; implication`.
- Put label first, then specifics.
- Use numbers whenever possible; if unknown, state assumptions clearly and keep them consistent.
- This increases practical density via bullet payload (not only via bullet count), which aligns with weighted density behavior.
- Example:

```
Variable expenses mainly consist of cost of goods sold (“COGS”) of $x.x million relating to cloud hosting and customer support and $x.x million in pass-through expenses, relating to third-party software licenses and data services. The Company generated a gross margin of xx.x% in the trailing twelve-month period.
```

#### Tier-based slide count policy (when user did not specify count)

- `sm`: 8-12 slides
- `md`: 12-18 slides
- `lg`: 18-30 slides
- `xl`: 30-60 slides (add appendix section when applicable)
- Rationale: report-like depth for `xl` should come from both per-slide density and total deck structure.

#### Robustness checklist before final deckSpec

- Keep titles <= 50 chars for common layouts; title overflow can be a hard error.
- Omit optional slots instead of empty strings when `allowEmpty: false`.
- Charts: include `chart.data`; every series must have non-empty `values`.
- Tables: include `headers` and `rows`; keep row width consistent.
- Divider `sectionNumber` must be two digits.
- Avoid accidental sparse continuation slides by intentionally splitting long sections before pagination.

### Step 3: Planning

Choose one planning mode before writing slides:

Mode A: Expand

- Use when user input is high-level (topic + a few constraints) or lacks slide-by-slide structure.
- Output a complete sectioned outline (cover -> dividers -> content slides -> appendix/back cover as needed).

Mode B: Compile

- Use when the user provides a detailed outline (slide-by-slide instructions, explicit section headers, or `---` separators).
- Preserve the provided structure.
- Only add the density required by the selected tier (evidence, numbers, implication/"so what"), and ensure template minima.

Create the draft outline from topic/settings and the selected mode. Keep style consistent with verbosity and deck shape. Present in concise markdown. Wait for approval unless user says "skip outline".

## Step 4: Write content deckSpec

Copy `deckspec-starter.json`.
Read `references/slide-contract.md` and `references/layout-policy.md` entirely.
Draft `deck-spec.json` based on the outline with a skeleton and detailed fill pass.
Self check the content meets the outline and user request.

## Step 5: Generate `.pptx`

4. **Draft deckSpec**: Use a skeleton pass then a fill pass. Follow `references/slide-contract.md` and `references/layout-policy.md`.
5. **Generate + QA loop**: Run `scripts/run_kpmg_slides.sh`, read `qa.json`, apply fix recipes, and rerun until blocking issues are cleared.
6. **Deliver**: Use the standard response contract and include the LibreOffice rendering disclaimer.

## Quick commands

- Copy starter:
  `cp skills/kpmg-slides/assets/templates/deckspec-starter.json decks/<name>.deckSpec.json`
- Generate:
  `skills/kpmg-slides/scripts/run_kpmg_slides.sh --in decks/<name>.deckSpec.json --out-dir outputs/<run-name>`

## References

Start here: `references/INDEX.md`

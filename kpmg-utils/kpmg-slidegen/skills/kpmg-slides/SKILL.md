---
name: kpmg-slides
description: Write KPMG-branded PowerPoint decks end-to-end from planning to writing content to generating the .pptx to iterations. Use when the user asks to create or revise slides, a deck, presentation, pitch deck, board deck, diligence deck, or needs a KPMG-branded .pptx produced from notes, documents, or spreadsheets. Supports outline-first collaboration, deckSpec editing, generation runs, and QA/overflow fixes. Not for pixel-level editing of an existing .pptx.
---

# KPMG Slides

This skill produces KPMG-branded `.pptx` decks from a `deckSpec` JSON file and gives you a QA loop to fix what breaks.

This skill is a **general-purpose, consulting-grade slide writer** that generates a KPMG-branded PPTX via `deckSpec` and a QA fix loop.

This skill does not support creating or scaffolding new slide layout types. Use only the existing slide types already defined in the bundled template and schema references.

## Dependencies

- `npm install` - installs `pptxgenjs` and `image-size` from the skill-local `package.json`
- `python3 -m pip install -r requirements.txt` - installs preview, montage, and overflow runtime dependencies from the skill-local `requirements.txt`
- LibreOffice (`soffice`) - PPTX to PDF conversion
- Poppler (`pdftoppm`, `pdfinfo`) - PDF to images

Install location:

- Run both install commands from the skill root.
- The skill ships with its own `package.json` and `requirements.txt`; do not depend on any parent repo files or paths.
- Keep authored `deckSpec` files and generated outputs in the user's working directory, not inside the skill bundle.
- Treat the skill folder as runtime/tooling only; pass working-directory paths to the runner.

## Workflow Decision Tree

What type of task is this?

```
┌─ Creating a new deck
│  └─→ Follow "KPMG Slide Creation Workflow" below
│
├─ Revising specific slides or sections?
│  └─→ Edit target slide content in `deckSpec`, regenerate deck, re-verify affected slides
│
├─ Performing quality assurance / fixing issues?
│  └─→ Follow `references/quality_assurance.md` (engine QA + visual QA + storyline QA)
│
└─ Editing an existing `.pptx` directly?
   └─→ Not supported in this skill. Use `deckSpec` edit-and-regenerate workflow instead.
```

- If the user provides `qa.json`, an output folder, or mentions overflow/overlap → **QA triage mode** (read `references/quality_assurance.md`).
- Else if the user provides a `*.deckSpec.json` file, or asks to revise specific slides → **deckSpec edit mode** (edit target slide entries, regenerate, then re-verify affected slides).
- Else → **new deck mode** (outline-first planning, then draft deckSpec, then generate).

## KPMG Slide Creation Workflow

Default behavior is outline-first. Do not draft deck content or run generation until the user explicitly approves the outline, unless the user explicitly says to skip outline.

### Step 1: Ingest Context

Summarize the goal, audience, and key inputs from the conversation and uploaded documents. Ask the user the minimum amount of clarifying questions to obtain this information if you do not have it.

### Step 2: Verbosity and Density

Resolve settings into a deterministic contract before writing any slides.

Store the contract in `deckSpec.metadata` for traceability:

- `metadata.textAmount`: `sm|md|lg|xl`
- `metadata.slideCountPolicy`: `user|auto`
- `metadata.styleIntent`: `diligence|strategy|generic`

Always write `metadata.textAmount` explicitly. The generator no longer infers or defaults missing verbosity metadata.

Set `metadata.allowSparse` to `false` by default. Only set `true` when the user explicitly wants a sparse draft.

Start from the matching starter when possible:

- `assets/templates/presets/concise.deckSpec.json`
- `assets/templates/presets/detailed.deckSpec.json`
- `assets/templates/presets/extensive.deckSpec.json`

#### Settings precedence (binding)

1. If the user provides explicit numeric constraints (slide count, bullets per slide, table rows), follow them.
2. Else follow verbosity tier mapping:

- `Concise -> md`
- `Detailed -> lg`
- `Extensive -> xl`
- `simple -> md`
- `detailed deck -> lg`
- `most detailed` or `extensive -> xl` unless the user explicitly sets a different `textAmount`

3. Else default to `lg`.

#### Non-negotiable validation guardrails

When in doubt, treat `references/slide-contract.md`, `references/deckspec.schema.json`, and `assets/slidegen/templates/kpmg-diligence/package/layouts.json` as source of truth.

- Do not exceed title hard limits. Titles are treated as hard limits in validation and most slide types cap title `maxChars` at 50; shorten or rewrite the title instead of formatting around the limit.
- Omit optional slots instead of emitting empty strings. If a slot exists but is empty and `allowEmpty: false`, validation can warn or error
- Only set `bodyStyle` to exactly `bullets` or `paragraphs`
- Treat `contents.sections[].pageRange` as runtime-managed; normally leave it unset in authored `deckSpec`.
- Treat `metadata.splitPolicy` as advisory for planning workflow only; current runtime does not enforce split modes from this field.
- Prefer explicit `dividerDark`/`dividerLight` when you need that visual style; reserve neutral `divider` for style-agnostic section breaks.
- For continuation/drop/recompute behavior, follow `references/slide-contract.md` instead of inferring behavior from older examples.

#### Pagination-aware guardrails (must apply while writing)

- Pagination estimates line usage and chunks bullets to avoid overlap.
- Pagination uses canonical template geometry contracts from `assets/slidegen/templates/kpmg-diligence/package/layouts.json`; runtime does not use hardcoded fallback text boxes.
- If required geometry is missing for a layout, generation fails fast; keep copy concise and prefer intentional split slides for dense content.
- `analysisBridge` supports dynamic `analysisColumns` (1-4 phases); keep per-phase copy concise to avoid pagination splits.
- `businessOverview` paginates `overviewBody`; keep right-side bullets concise when chart is present.
- `analysisNarrowTable` pagination can warn on dense rows and orphan-row splits.
- Post-pagination slide validation disables density enforcement (`enforceDensity: false`), so avoid creating giant bullet lists that auto-split unevenly.
- Prefer intentional split slides with explicit titles like `(1/2)` and `(2/2)` over implicit overflow splits.

Override defaults when needed with this precedence: user constraints > contract validity/readability > tier defaults, and note any override reason in the response summary.

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

`analysisBridge`

- `sm`: 1-2 phases, 2 bullets per phase, 5-10 bridge steps.
- `md`: 2-3 phases, 2-3 bullets per phase, 8-14 bridge steps.
- `lg`: 3 phases, 2-4 bullets per phase, 10-18 bridge steps.
- `xl`: 3-4 phases, 3-4 bullets per phase, 12-22 bridge steps.
- Guardrails:
  - Use only when values reconcile from start to end.
  - Keep `analysisColumns` to 1-4 and match phase count to story complexity.
  - Use 4 phases only if each phase has clear, non-overlapping drivers.

`businessOverview`

- `sm`: 2-3 right-side bullets, compact structure labels.
- `md`: 3-4 right-side bullets, optional compact chart.
- `lg`: 4-6 right-side bullets, optional chart with source.
- `xl`: 6-8 right-side bullets, expect continuation slide when chart is present.
- Guardrails:
  - Use for transaction-perimeter structure + company profile narrative.
  - Keep node labels short; move long explanations into right-side bullets.
  - Keep chart secondary; move chart-heavy analysis to chart-first layouts.

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

#### Nested bullet decision rules

- Use flat bullets by default.
- Use nested bullets only when a child bullet is dependent detail for a specific parent bullet.
- Keep nested depth shallow for readability (usually 1-2 child levels).
- `deckSpec` shape for nesting is object `children`:
  - `{ "text": "Parent", "children": [{ "text": "Child" }] }`
- Do not emit legacy nested arrays (for example `[["Child"]]`); they are invalid.
- Do not attach `children` to `header`/`subheader` label lines.

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
- Bridges: ensure `bridge` reconciles (`startValue` + steps ~= `endValue`) and `analysisColumns` is between 1 and 4.
- Business overview: ensure `structure.topTier` and `structure.bottomTier` are populated and connector indices are valid.
- Tables: include `headers` and `rows`; keep row width consistent.
- Divider `sectionNumber` must be two digits.
- Avoid accidental sparse continuation slides by intentionally splitting long sections before pagination.

### Step 3: Planning

**YOU MUST ALWAYS PRESENT AN OUTLINE BEFORE GENERATING THE CONTENT AND DECK**
Use `references/layout-policy.md` during planning to map intent/evidence to slide types.

Planning protocol:

1. Grounding pass first (non-mutating): inspect user inputs, existing deckSpec/qa (if revision), and available evidence.
2. Ask only unresolved high-impact questions; use concise either/or choices when possible.
3. Choose planning mode:
   - Mode A (`Expand`): use when input is high-level; produce full sectioned outline.
   - Mode B (`Compile`): use when user already gave a slide-by-slide structure; preserve structure and add required density.
4. Produce `## Outline` in standard shape and wait for approval unless user explicitly says to skip.

Planning questions checklist (ask only missing items):

- Objective and decision ask.
- Audience and meeting context.
- Slide count/time constraint (or confirm tier-driven default).
- Must-include sections/slides and must-use data sources.
- Style intent (`diligence|strategy|generic`) and QA speed preference (`full|fast`).

#### Outline Approval Gate (Hard Stop)

- Applies to new-deck workflows (Mode A/Mode B).
- After presenting `## Outline`, stop and wait for explicit user approval.
- Do not draft `<name>.deckSpec.json`, run generation, or output `Deck Delivered` before approval.
- Treat only explicit approvals as proceed signals (for example: `approve`, `approved`, `proceed`, `continue`, `looks good`).
- Bypass only when the user explicitly asks to skip outline.

## Step 4: Write content deckSpec

Use `<name>.deckSpec.json` as the standard filename.
Create and edit that file in the user's working directory, not in the skill folder.
During draft and self-check, validate against `references/slide-contract.md` and `references/deckspec.schema.json`.
Apply writing voice and language controls from `references/writing-standards.md`.

Create `<name>.deckSpec.json` in three passes:

1. Skeleton: copy starter, set final slide `type` + claim title, replace placeholders, align slide count/sections.
2. Fill: populate only supported slots, keep one-message-per-slide, and use evidence-first layouts (chart/table/bridge) for numeric claims.
3. Self-check: required slots only, no unsupported slots, valid `bodyStyle`, aligned numeric chart arrays, and full alignment to outline + verbosity contract.
   - Keep runtime-managed fields (`contents.sections[].pageRange`) out of authored content unless explicitly required.
   - Do not author runtime-reserved slide keys (`masterName`, `geometry`, `assets`).

## Step 5: Generate `.pptx`

1. Run the generator on the current `<name>.deckSpec.json`.
   - Pass the deckSpec path exactly as it exists in the user's working directory.
2. Select QA mode (`full` default, `fast` for speed, `skip_subagent_visual` only if user explicitly requests it).
3. Run QA loop from `references/quality_assurance.md` until pass criteria or loop cap for the selected mode.
4. Deliver using the standard output contract.

## Execution Protocol (Mandatory)

Follow this sequence for every run:

1. Ingest context and confirm objective, audience, and constraints.
2. Resolve verbosity/density settings into `metadata` contract fields.
3. Produce an outline in the standard `Outline` response shape.
4. Wait for approval unless user explicitly says to skip outline.
5. Draft deckSpec and self-check against slide contract and layout policy.
6. Generate deck and read QA output.
7. Run the QA workflow from `references/quality_assurance.md` using `full`, `fast`, or `skip_subagent_visual` (skip mode only with explicit user request).
8. Deliver artifacts in the standard `Deck Delivered` response shape.
9. For edits/revisions, always provide the standard `Revision Diff` response shape.

## Standard Output Contract (Mandatory)

Use these three shapes with minimal fields.

### 1) Outline

```markdown
## Outline

- Objective: <decision/problem>
- Audience: <primary audience>
- Style intent: <diligence|strategy|generic>
- Verbosity contract: <textAmount, slideCountPolicy>

| #   | Type  | Title (claim) | Evidence shape | Slot plan       |
| --- | ----- | ------------- | -------------- | --------------- |
| 1   | cover | ...           | narrative      | title, subtitle |
```

Requirements: each line includes `type`, claim title, evidence shape, and slot plan for non-trivial slides.

### 2) Deck Delivered

```markdown
## Deck Delivered

- Status: <pass|pass_with_warnings|blocked>
- DeckSpec: <path>
- PPTX: <path>
- QA: <path>
- QA mode: <full|fast|skip_subagent_visual>
- Slide counts: <input -> output>
- Settings: <textAmount, slideCountPolicy, styleIntent, allowSparse>

## QA Summary

- Blocking: <count + key issues>
- Non-blocking: <count + key issues>
- Storyline QA: <short verdict>
```

### 3) Revision Diff

```markdown
## Revision Diff

- Scope: <what changed>
- Why: <driver>

| Slide # | Change | Before        | After                      | Reason                    |
| ------- | ------ | ------------- | -------------------------- | ------------------------- |
| 9       | layout | oneColumnText | analysisWideChart2ColsText | numeric claim needs chart |

- QA delta: <before -> after>
- Artifacts: <deckspec path>, <pptx path>, <qa path>
```

Requirements: include slide-level changes, reasons tied to request/contract/QA, and QA delta when generation was run.

## Quick commands

Use two locations intentionally:
- Install from the skill root.
- Create the `deckSpec` and run generation from the user's working directory so relative `--in` and `--out-dir` paths stay local to the work product.

- Copy a starter from the skill bundle into the working directory as `<name>.deckSpec.json`.
- Preferred starter source files:
  - `assets/templates/presets/concise.deckSpec.json`
  - `assets/templates/presets/detailed.deckSpec.json`
  - `assets/templates/presets/extensive.deckSpec.json`
- Run the skill runner from the working directory and point to the local deckSpec:
  `<path-to-skill>/scripts/run_kpmg_slides.sh --in <name>.deckSpec.json --out-dir <out-dir>`

## References

Start here: `references/INDEX.md`

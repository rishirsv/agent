# Quality Assurance

Use this as the single QA policy for kpmg-slides.

## Table of Contents
- Objective
- QA Modes (User-selectable)
- QA Workflow (Validate -> Fix -> Repeat)
- Phase 1: Engine QA (Generator + qa.json)
- Pagination Policy QA Checks (Mandatory for Paginated Decks)
- Phase 2: Deterministic Fix Recipes
- Stopping Rules (Mandatory)
- Storyline QA Gate (Mandatory Before Delivery)
- Visual QA
- Converting to Images
- Delivery Requirements

## Objective

Deliver decks that are both technically valid and client-ready.

Pass criteria:
- Generator/contract QA has no blocking issues.
- Visual QA has no unresolved layout/readability defects for `full` and `fast` modes.
- Storyline QA passes the quality bar.

## QA Modes (User-selectable)

Choose one mode before running visual QA:

- `full` (default):
  - Use subagents for visual QA on all slides (or all affected sections for revisions).
  - Run at least one fix-and-verify cycle before delivery.
- `fast`:
  - Use subagents only on changed slides plus anchor slides (`cover`, one dense content slide, one back section slide).
  - Run one focused fix pass for blocking/severe visual issues.
  - Re-render only affected slides for re-check.
- `skip_subagent_visual` (user-authorized only):
  - Skip subagent-based visual QA when user explicitly asks to skip.
  - Still run engine QA and storyline QA.
  - Perform a quick manual montage/preview sweep and disclose reduced confidence.
  - Delivery must state: `visual QA skipped per user request`.

## QA Workflow (Validate -> Fix -> Repeat)

Follow this sequence every time:

1. Select QA mode: `full`, `fast`, or `skip_subagent_visual` (only with explicit user request).
2. Generate deck artifacts with engine QA output.
3. Read `qa.json` and classify blocking vs non-blocking findings.
4. Apply deterministic fixes by issue class.
5. Regenerate and re-check.
6. Run visual QA based on selected mode.
7. Run storyline QA before delivery.

## Phase 1: Engine QA (Generator + qa.json)

Run generation from the user's working directory so the deckSpec and outputs stay with the project files. The skill folder only provides the runner and bundled assets.

Preferred command:

```bash
<path-to-skill>/scripts/run_kpmg_slides.sh --in <deckspec-path>.json --out-dir <out-dir>
```

Expected artifacts:
- `<out-dir>/<topic>.pptx`
- `<out-dir>/qa.json`
- `<out-dir>/preview/` (slide images)
- `<out-dir>/montage.png`

Classify `qa.json` findings:
- Blocking: `qa.outcome.blockingIssueCount`, blocking `qa.findings`, and blocking checks with status `fail` or `error`.
- Blocking by policy: missing or invalid `metadata.textAmount` is a hard contract failure, not a warning.
- High-priority non-blocking: `qa.checks` with status `warn`, repeated verbosity-contract findings, and visual-overflow findings when strict mode is off.
- Advisory: informational or warning findings that do not prevent delivery.

## Pagination Policy QA Checks (Mandatory for Paginated Decks)

Run these checks whenever any slide can paginate (`oneColumnText`, `analysisWide*`, `analysisBridge`, `businessOverview`, `analysisNarrowTable`, `contents`):

1. Check the `pagination` entry inside `qa.checks` for:
   - unexpected split spikes in `details.decisions`
   - incorrect `mode` for slide type
   - missing `policyKey` metadata in decision details
2. Check `qa.findings` for `auto_split` and table warning codes:
   - unexpected `splitInto` spikes
   - incorrect `mode` for slide type
   - repeat split behavior on slides that should stay single-page
3. Check `qa.checks[].details.recomputeFields` on the `pagination` check:
   - if contents slides exist and page ranges should update, `contentsPageRanges` should be present.
4. Check continuation side-effects against expected policy behavior:
   - `oneColumnText`, `analysisWideChart2ColsText`, `analysisWideChartTableText`: continuation slides should drop `callouts`.
   - `businessOverview`: continuation slides should drop `chart`.
5. If continuation drops remove essential narrative or evidence unexpectedly, treat as high-priority non-blocking and refactor content (split intentionally or move key content to retained slots).

## Phase 2: Deterministic Fix Recipes

Apply fixes by failure class:
- Missing or invalid required slots:
  - Fill required slot content first.
  - Remove unsupported slots for that slide type.
- Density and sparsity issues:
  - Add evidence-rich bullets or supporting facts.
  - Split overloaded slides rather than overstuffing.
- Overflow and pagination issues:
  - Reduce bullet length, rebalance columns, split long tables/slides intentionally.
- Contract mismatches:
  - Enforce valid `bodyStyle`, section number format, chart/table structure.

## Stopping Rules (Mandatory)

Cycle cap is 3 unless the user explicitly asks to continue.

- Cycle 1: Fix obvious blocking issues and highest-impact QA defects.
- Cycle 2: Fix remaining blocking issues and major readability/story issues.
- Cycle 3: Final attempt.

After cycle 3:
- If blocking issues remain, escalate with an unresolved-issues list.
- If only non-blocking issues remain, deliver with explicit residual risk notes.
- Continue beyond 3 only if user explicitly requests continued iteration.

## Storyline QA Gate (Mandatory Before Delivery)

Automated QA is necessary but not sufficient. Run this check before final delivery:

1. Executive scan test: titles + straplines alone communicate the story.
2. One-slide-one-message: each slide proves one claim.
3. Evidence sufficiency: each claim has data, sourced facts, or a clear logic chain.
4. Cross-slide consistency: units, periods, and key numbers match everywhere.
5. Sourcing coverage: every externally derived number has a source line.

## Visual QA

Default behavior (`full`): use subagents for visual QA. Fresh eyes catch layout defects faster and more reliably than self-review.

`fast` mode optimization:
- Inspect only changed slides plus 2-3 anchor slides.
- Prioritize severe defects first: overlap, cutoff, collisions, and major spacing failures.
- Re-render only affected slides after fixes (`pdftoppm -f N -l N ...`) instead of full deck rerender.

`skip_subagent_visual`:
- Allowed only when the user explicitly requests skipping subagent QA.
- Do a brief manual preview/montage sweep and record the risk in delivery output.

Convert slides to images (see Converting to Images), then use this prompt:

```text
Visually inspect these slides. Assume there are issues - find them.

Look for:
- Overlapping elements (text through shapes, lines through words, stacked elements)
- Text overflow or cut off at edges/box boundaries
- Decorative lines positioned for single-line text but title wrapped to two lines
- Source citations or footers colliding with content above
- Elements too close (< 0.3" gaps) or cards/sections nearly touching
- Uneven gaps (large empty area in one place, cramped in another)
- Insufficient margin from slide edges (< 0.5")
- Columns or similar elements not aligned consistently
- Low-contrast text (for example, light gray text on cream background)
- Low-contrast icons (for example, dark icons on dark backgrounds without contrast circle)
- Text boxes too narrow causing excessive wrapping
- Leftover placeholder content

For each slide, list issues or areas of concern, even if minor.

Read and analyze these images:
1. /path/to/slide-01.jpg (Expected: [brief description])
2. /path/to/slide-02.jpg (Expected: [brief description])

Report ALL issues found, including minor ones.
```

### Verification Loop

1. Generate slides -> convert to images -> inspect.
2. List issues found (if none, inspect again more critically).
3. Fix issues.
4. Re-verify affected slides. One fix often introduces another issue.
5. Repeat until a full pass reveals no new issues.

For `full` and `fast` modes, do not declare success until at least one fix-and-verify cycle has completed.

## Converting to Images

Engine-native path (preferred):
- `<path-to-skill>/scripts/run_kpmg_slides.sh` already generates preview images in `<out-dir>/preview/`.

Manual conversion path:

```bash
soffice --headless --convert-to pdf output.pptx
pdftoppm -jpeg -r 150 output.pdf slide
```

This creates `slide-01.jpg`, `slide-02.jpg`, and so on.

Re-render a specific slide after fixes:

```bash
pdftoppm -jpeg -r 150 -f N -l N output.pdf slide-fixed
```

## Delivery Requirements

Before delivery, provide:
- QA mode used (`full`, `fast`, or `skip_subagent_visual`).
- QA status from `qa.outcome.status` (`pass`, `warn`, `fail`, or `error`).
- Blocking vs non-blocking summary.
- Residual risks and recommended next actions.
- Paths to updated `deckSpec`, `.pptx`, `qa.json`, and preview images.

## Role
You are a principal engineer reviewing system design.

## Context
I am uploading `context.zip` containing a minimal subset of our repo and two reference decks. Treat the zip as authoritative.

Rules:
- Use only what you can support from files in the zip plus the explicit assumptions listed below.
- Cite file paths (and line anchors where possible) for concrete claims.
- Do not ask clarifying questions. If something is missing, proceed with clearly labeled assumptions.
- Focus on correctness-per-token: minimum fluff, maximum actionable detail.

## Files in zip
- `generator/app/cli.js`
- `generator/index.js`
- `generator/runtime/render-deck.js`
- `generator/runtime/paginate.js`
- `templates/kpmg-diligence/package/layouts.json`
- `references/Project North_(Jun-24) RF Draft report_21-Aug-24 vS.pptx`
- `references/Project Coffee_buy side_FDD (Consumer & Retail - F&B).pptx`

## Goal
We want very tunable prompt-driven control of content density and verbosity.

Target outcome:
- `extensive` should reliably produce output density/verbosity comparable to:
  - `references/Project North_(Jun-24) RF Draft report_21-Aug-24 vS.pptx`
  - `references/Project Coffee_buy side_FDD (Consumer & Retail - F&B).pptx`

## Known Gamma behavior (explicit assumptions from our reverse engineering)
Assume these are true and design against them:
1. Gamma runs a staged pipeline with explicit state handoff, not one monolithic generation call.
2. Stage 0 persists a settings contract before generation (observed mutation pattern): fields include `numCards`, `textMode`, `textAmount`, `imageProvider`, `cardDimensions`, `defaultContentWidth`, `styleTemplate`, and `scaleContentToFit`.
3. Stage 1 is outline generation:
- prompt key: `GenerateOutlineStory`
- core variables: `topic`, `numBullets`, `format`, `language`, `textAmount`, `model`
- observed model routing for outline: `exa`
4. Stage 2 is layout-aware deck generation:
- wrapper prompt key: `GenerateDeckWithLayout`
- base prompt key: `GenerateDeck2.5`
- core variables: `textAmount`, `textMode`, `numCards`, `input` (markdown)
- observed model routing for deck: `claude-opus-4-6`
5. Preserve/edit path appears distinct:
- base prompt variant: `GenerateDeck2.5Preserve`
- observed model routing: `claude-sonnet-4-6`
- likely instruction bias: preserve claims/structure; split for overflow before rewriting.
6. UI verbosity maps deterministically to compact backend tiers:
- Minimal -> `sm`
- Concise -> `md`
- Detailed -> `lg`
- Extensive -> `xl`
7. Control precedence is explicit:
- structured controls (cards/text settings) beat natural-language hints
- `numBullets`/card count overrides prose instructions like “make 3 cards” when conflicting.
8. Structure hints are passed through:
- markdown `---` separators survive into downstream generation and influence splitting/card boundaries.
9. Outline regeneration is explicit user action; setting changes do not always imply automatic outline rewrite.
10. Verbosity is treated as a bounded budget signal; output length is not perfectly monotonic run-to-run without additional deterministic constraints.
11. Prompt catalog is likely modular (not single prompt), including families like settings resolution, outline, deck/card generation, edit, and speaker notes.

## Current implementation signals you should use
- CLI exposes `--allow-sparse` but no explicit user-facing verbosity tier flag:
  - `generator/app/cli.js` (`parseCliOptions`, `allowSparse`) around lines 32-56.
- Validation and QA enforce slot minimums and character/item thresholds:
  - `generator/runtime/render-deck.js`
    - slot validation (`minItems`, `minChars`, `maxChars`, severity behavior) around lines 264-340
    - density scoring (`computeDensity`, `minScore`, `acceptableFloor`, sparse/thin states) around lines 342-387
    - validation integration and sparse/thin handling around lines 460-557
    - deck-level QA aggregation (`densityFindings`, slot issues/metrics, repair suggestions) around lines 559-722
    - render-time pagination/overflow capture and QA passthrough around lines 1056-1158.
- Overflow handling is deterministic and split-oriented:
  - `generator/runtime/paginate.js` (auto-splitting, overflow events, pagination decisions) around lines 324-420.
- QA report construction and exposure of density/overflow outputs:
  - `generator/index.js` (builds `densityFindings`, `densitySummary`, `overflowRisks`, repair suggestions) around lines 171-335.
- Layout contracts define per-slide slot budgets and density targets:
  - `templates/kpmg-diligence/package/layouts.json`
  - `oneColumnText` slots + density target around lines 611-686
  - `twoColumnText` slots + density target around lines 833-949
  - global `densityRules` around lines 4417-4433.

## Task
Provide a deeply detailed recommendation for how we should tune our prompt strategy and control contract so verbosity/density becomes highly tunable and predictable, with strong emphasis on making `extensive` consistently hit the two reference deck styles.

Specifically cover:
1. A proposed end-to-end control architecture (settings resolver -> outline -> slide writer -> QA feedback loop) mapped to our code surface.
2. A concrete verbosity contract with deterministic budgets by tier (`minimal/concise/detailed/extensive`) and by slide archetype (`oneColumnText`, `twoColumnText`, and at least one analysis layout).
3. How to combine prompt-level constraints with our existing hard guards (`minChars/minItems/maxChars`, density score thresholds, overflow splitting) so generation is both expressive and bounded.
4. A conflict-resolution policy (which control wins when instructions disagree: user prose, explicit control knobs, layout constraints, overflow constraints).
5. A plan to calibrate `extensive` against the two reference PPTX files, including measurable heuristics and acceptance criteria.
6. Exact prompt text patterns we should use (system + developer + user-message conventions) to get tunable density without brittle prompt hacks.
7. An iterative tuning loop that uses QA output fields to auto-repair under-dense and over-dense slides in subsequent passes.
8. Risks and failure modes (mode collapse, verbosity drift, hallucinated filler, layout oscillation), with mitigations.

## Output format
### Answer
1-3 sentences with your final recommendation direction.

### Key Points
Bullets with high-signal reasoning and references to file paths.

### Recommended Next Steps
Concrete, ordered implementation steps in this repo, including where to add or modify code.

### Risks / Unknowns
Bullets for anything that may materially change the recommendation.

### Proposed Prompt Contract
Provide a copy-pasteable prompt contract we can implement immediately:
- settings schema
- tier-to-budget mapping
- precedence rules
- generation instructions
- QA repair instructions
Keep this practical and concise enough for production use.

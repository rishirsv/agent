# Text Amount Payload Cap Plan

## Goal

Simplify the starter model to three useful levels, then recalibrate `textAmount` so slides scale like real consulting / due diligence decks: fuller commentary by default, but with layout-specific payload caps that prevent avoidable overflow.

## Locked Product Decisions

- Remove the `minimal` preset.
- Keep exactly three user-facing levels: `concise`, `detailed`, and `extensive`.
- Keep slide layout IDs unchanged. This is a preset / verbosity refactor, not a layout taxonomy rename.
- Treat real diligence decks as the reference style for default payload.
- Favor "fill the slide" behavior through richer paragraph payloads, not uncontrolled item-count growth.

## Measured Reference Findings

Reference decks reviewed:

- `references/north_fdd.pptx` (`80` slides)
- `references/coffee_fdd.pptx` (`122` slides)

Method:

- Extract slide text directly from PPTX shapes.
- Measure paragraph and total slide character counts.
- Convert representative slides to PNG and visually inspect them for layout behavior.

Measured character findings:

- Real diligence slides regularly carry `1,000` to `2,500+` characters of total on-slide text without feeling sparse.
- North:
  - median total slide text: `1,024` chars
  - p75 total slide text: `1,764` chars
  - p90 total slide text: `2,553` chars
  - median paragraph length for paragraphs `>= 60` chars: `225`
  - p75 paragraph length for paragraphs `>= 60` chars: `350`
- Coffee:
  - median total slide text: `1,251` chars
  - p75 total slide text: `2,247` chars
  - p90 total slide text: `2,870` chars
  - median paragraph length for paragraphs `>= 60` chars: `212`
  - p75 paragraph length for paragraphs `>= 60` chars: `322`

Observed behavior from the real decks:

- Narrative commentary is materially denser than our current low-end examples.
- Paragraph-style bullets are normal; "presentation" one-liners are not the diligence default.
- Dense slides still respect layout geometry. They do not solve density by endlessly increasing row count or box count.
- Table-led and four-box layouts stay visually controlled by limiting how much text each slot is allowed to absorb.

## Calibration Artifacts

Generated during the pre-implementation calibration pass:

- script: `scripts/run-payload-calibration.mjs`
- deckspecs: `presets/authoring/payload-calibration/`
- rendered review bundle: `/Users/rishi/Desktop/kpmg-slidegen-payload-calibration`
- output metrics: `/Users/rishi/Desktop/kpmg-slidegen-payload-calibration/analysis.json`

Calibration method:

- Generate controlled `concise`, `detailed`, and `extensive` decks with intentional character budgets per layout.
- Render real `.pptx` outputs through the existing generator.
- Convert the outputs to PDF / PNG and inspect the slides visually.
- Extract slide-level and paragraph-level text-character metrics from the generated PPTX files.

Calibration headline result:

- The narrative layouts can carry consulting-style payload safely.
- The table-led layouts split much earlier than their current row-count rules suggest.
- The four-box layout is more robust than the old synthetic samples implied, provided the bullet count stays flat.

Post-implementation output check:

- Final review decks render without auto-splits across `concise`, `detailed`, and `extensive`.
- Final generated deck medians remain below North / Coffee at the whole-deck level because the review bundle includes divider / cover slides and deliberately conservative constrained-layout caps.
- The final review bundle now reaches these output ranges:
  - `concise`: slide-total median `621.5`, p75 `823.8`, p90 `1,021.9`
  - `detailed`: slide-total median `753.5`, p75 `1,197.5`, p90 `1,288.1`
  - `extensive`: slide-total median `791.5`, p75 `1,336.8`, p90 `1,550.9`
  - `extensive` paragraph-length p90: `235`, which is directionally inside the consulting-style range observed in North / Coffee for substantive commentary

## Product Interpretation

The correct default model is:

- `concise`: useful working deck, not sparse
- `detailed`: normal consulting / diligence baseline
- `extensive`: fully supported diligence output, but still inside safe layout budgets

The important change is semantic:

- `textAmount` should primarily control payload richness.
- Bullet count becomes a secondary control.
- Character and line caps become mandatory on constrained layouts.

## Proposed Payload Strategy

### Narrative-first layouts

Layouts:

- `oneColumnText`
- `twoColumnText`
- `analysisWideChart2ColsText`

Strategy:

- Scale mainly by richer commentary and only modestly by count.
- Default bullet payload should sit in the consulting range, roughly `140-260` characters for substantial commentary bullets.
- `extensive` should mean deeper bullets and stronger evidence, not a large jump in bullet count.

### Constrained layouts

Layouts:

- `analysisWideChartTableText`
- `analysisNarrowTable`
- `analysisBridge`
- `businessOverview`
- `titleStrapline4TextBoxes`

Strategy:

- Add explicit payload caps before allowing higher item counts.
- Keep row growth and box growth modest.
- Use `detailed` and `extensive` to enrich safe slots first.
- Cap the layouts that are visually brittle at high density.

## Proposed Level Targets

These targets are the implementation baseline to validate against before code changes.

### `oneColumnText`

- `concise`: `5-6` bullets at roughly `120-180` chars each
- `detailed`: `5-6` bullets at roughly `160-230` chars each
- `extensive`: `6-7` bullets at roughly `190-260` chars each

### `twoColumnText`

- `concise`: `3-4` bullets per side at roughly `90-150` chars each
- `detailed`: `3-4` bullets per side at roughly `120-180` chars each
- `extensive`: `4` bullets per side at roughly `140-210` chars each

### `analysisWideChart2ColsText`

- `concise`: `3-4` bullets at roughly `140-210` chars each
- `detailed`: `4-5` bullets at roughly `170-250` chars each
- `extensive`: `4-5` bullets at roughly `190-280` chars each

### `analysisWideChartTableText`

- rows: approximately `4-5 / 5-6 / 5-6`
- commentary bullets: approximately `3-4 / 4 / 4`
- add a hard cap on long text cells so row height cannot run away

### `analysisNarrowTable`

- rows: approximately `4-5 / 5-6 / 6-7`
- narrative bullets: approximately `3 / 3-4 / 3-4`
- use stricter per-cell caps than wide-table layouts

### `analysisBridge`

- steps: approximately `8-10 / 10-12 / 10-12`
- enrich per-step commentary before adding steps at `extensive`

### `businessOverview`

- overview bullets: approximately `3-4 / 4-5 / 4-5`
- enrich wording rather than expanding bullet count beyond the geometry's safe limit

### `titleStrapline4TextBoxes`

- bullets per box: approximately `2-3 / 3 / 3`
- add a hard per-box char or line cap
- this layout must never scale like a full-body text slide

## Calibration Findings And Revised Recommendations

### Overall density comparison

Generated output metrics from the calibration bundle:

- `concise`
  - median slide total: `654` chars
  - p75 slide total: `850`
  - p90 slide total: `1,031`
- `detailed`
  - median slide total: `897` chars
  - p75 slide total: `1,231`
  - p90 slide total: `1,271`
- `extensive`
  - median slide total: `965` chars
  - p75 slide total: `1,173`
  - p90 slide total: `1,768`

Interpretation:

- The calibration outputs are directionally closer to North / Coffee on the narrative slides than our previous synthetic decks.
- The deck-level medians still sit below the North / Coffee medians because the constrained layouts split across pages and because divider / continuation slides reduce the aggregate median.

### Layout-specific findings

#### `oneColumnText`

- `7` bullets at roughly `235` chars each renders well.
- This is the closest match to the "fill the slide" diligence feel without becoming crowded.

Recommendation:

- keep `5 / 6 / 7` bullets
- use richer bullet payload as the primary scaling lever

#### `twoColumnText`

- `4` bullets per side at roughly `185` chars each still fits comfortably.
- This layout remains visually lighter than real diligence slides, but it behaves well and can absorb denser wording.

Recommendation:

- use `3 / 4 / 4` bullets per side
- scale through char budget more than count

#### `analysisWideChart2ColsText`

- `5` bullets at roughly `245` chars each holds up visually.
- This layout can carry richer commentary without obvious stress.

Recommendation:

- use `4 / 5 / 5` bullets
- allow higher per-bullet chars at `detailed` and `extensive`

#### `analysisWideChartTableText`

- The layout split even before the extensive stress case.
- `5` rows already paginated in the concise pass; `6` rows paginated in detailed / extensive; `7` rows is a clear stress failure.
- The governing factor is the read-through cell height, not just the row count.

Recommendation:

- treat this as a hard-capped layout under the current geometry
- immediate safe target should assume `4` rows as the dependable single-page limit when read-through cells carry real diligence wording
- if we want richer table commentary with `5+` rows, the layout itself likely needs redesign

#### `analysisNarrowTable`

- The layout paginated much earlier than its current verbosity rule implies.
- `5` rows with diligence-style read-through text already split in concise; `6-8` rows clearly exceed the single-page budget.

Recommendation:

- treat this as the most constrained content layout in the current system
- use a lower row cap than the current rule suggests
- if we want true North / Coffee-style table density here, we likely need a geometry rethink, not just a contract tweak

#### `analysisBridge`

- `12` steps, `3` phases, and `2` commentary bullets per phase held up visually.
- The bridge can support moderate narrative richness as long as phase bullet counts stay controlled.

Recommendation:

- keep step growth modest
- use `2` phase bullets as the practical default even at `extensive`

#### `businessOverview`

- `4` bullets at roughly `215` chars each rendered well.
- `5` bullets at roughly `235` chars each spilled into a continuation slide.

Recommendation:

- do not scale this layout by adding a fifth overview bullet
- keep the count flat at the high end and enrich the existing bullets instead

#### `titleStrapline4TextBoxes`

- `3` bullets per box at roughly `132-146` chars rendered cleanly.
- The `3x160` stress case still held up materially better than the old synthetic extensive sample.
- This layout is constrained more by bullet count than by moderate increases in per-bullet chars.

Recommendation:

- keep the count flat at `3` bullets per box across all three levels
- use a modest char ladder instead of count growth

## Implemented Recommendation

The calibrated direction was implemented without changing the base layout geometry. The shipped contract is:

- `oneColumnText`
  - `concise`: `5` bullets at about `150` chars
  - `detailed`: `6` bullets at about `195` chars
  - `extensive`: `7` bullets at about `235` chars
- `twoColumnText`
  - `concise`: `3` bullets per side at about `120` chars
  - `detailed`: `4` bullets per side at about `150` chars
  - `extensive`: `4` bullets per side at about `185` chars
- `analysisWideChart2ColsText`
  - `concise`: `4` bullets at about `175` chars
  - `detailed`: `5` bullets at about `215` chars
  - `extensive`: `5` bullets at about `245` chars
- `analysisWideChartTableText`
  - hold to `4` commentary bullets
  - treat `4` rows as the dependable single-page ceiling with diligence-style read-through cells
  - redesign the layout later if we want `5+` rich rows without pagination
- `analysisNarrowTable`
  - hold insight bullets around `3 / 4 / 4`
  - set a much lower row ceiling than current rules; likely `4` dependable rich rows under current geometry
  - redesign later if we want real diligence-style dense table commentary on one page
- `analysisBridge`
  - `9 / 11 / 12` steps
  - `2 / 2 / 2` bullets per phase
- `businessOverview`
  - `4 / 4 / 4` overview bullets
  - increase char budget, not bullet count
- `titleStrapline4TextBoxes`
  - `3 / 3 / 3` bullets per box
  - about `118 / 132 / 146` chars per bullet as the initial safe ladder

## Final Implementation Outcomes

- The starter surface now exposes exactly three user-facing presets: `concise`, `detailed`, and `extensive`.
- `minimal` was removed from the parent repo and the portable skill bundle.
- `textAmount` now evaluates layouts with mixed count and character budgets instead of count-only growth.
- Narrative layouts were allowed to carry materially richer consulting-style commentary.
- Constrained layouts were capped to prevent avoidable overflow and pagination.
- The Desktop review bundle was regenerated with root-level `.pptx` files for direct review.
- The portable skill bundle was re-synced and verified after the contract change.

Review artifacts:

- Desktop review bundle: `/Users/rishi/Desktop/kpmg-slidegen-verbosity-density-matrix`
- Root review decks:
  - `/Users/rishi/Desktop/kpmg-slidegen-verbosity-density-matrix/concise.pptx`
  - `/Users/rishi/Desktop/kpmg-slidegen-verbosity-density-matrix/detailed.pptx`
  - `/Users/rishi/Desktop/kpmg-slidegen-verbosity-density-matrix/extensive.pptx`
  - `/Users/rishi/Desktop/kpmg-slidegen-verbosity-density-matrix/all-layouts-sample.pptx`

Validation results:

- `npm run test:fixtures`: pass
- `npm run test:structure`: pass
- `npm run test:render`: pass
- `npm run test:dist`: pass
- Review decks: no auto-splits across `concise`, `detailed`, or `extensive`

Residual non-blocking observations:

- `analysisNarrowTable` still emits an advisory density warning in QA under the richer consulting-style payload, but it remains visually acceptable in the regenerated review set.
- Minor overlap heuristics can still appear as warnings in some generated outputs, but there are no blocking verification failures.

## Phase Outcomes

### Phase 1: Lock the new product model

Outcome:
The user-facing model becomes simpler and more useful: three real deck levels instead of a sparse starter level that does not match consulting work.

### Phase 2: Re-anchor the system to real diligence payload

Outcome:
`textAmount` reflects the density of actual North and Coffee-style diligence decks, so the generator's expectations match the kind of slides teams really want.

### Phase 3: Calibrate payload caps before implementation

Outcome:
We verify the right character budgets in rendered slides before changing the runtime. This lets us choose the final `concise`, `detailed`, and `extensive` targets from real visual evidence instead of only from theory.

### Phase 4: Add slot-aware payload caps

Outcome:
Layouts that are visually constrained stop breaking at higher levels because they scale by safe slot budgets, not just by more rows or bullets.

### Phase 5: Refactor parent and skill together

Outcome:
The runtime, presets, fixtures, docs, and skill bundle all explain and enforce the same three-level payload model.

### Phase 6: Regenerate review decks and validate visually

Outcome:
We get a fresh review set that proves the new model looks like a real diligence workflow, not just a passing QA contract.

### Phase 7: Run end-to-end calibration against North and Coffee

Outcome:
The refactor is only accepted if the generated decks are directionally aligned to the consulting reference decks on both visual density and text-character payload. If the outputs still look too thin or too overloaded, we revise the caps and rerun the comparison.

## Implementation Checklist

- [x] 1.0 Lock the three-level preset direction
  - [x] 1.1 Remove `minimal` from the target product model
  - [x] 1.2 Keep `concise`, `detailed`, and `extensive` as the user-facing levels
  - [x] 1.3 Keep slide layout IDs unchanged
- [x] 2.0 Quantify real consulting payload from North and Coffee
  - [x] 2.1 Locate the reference diligence decks in `references/`
  - [x] 2.2 Extract text for paragraph and slide-level measurements
  - [x] 2.3 Convert representative slides to PNG for visual inspection
  - [x] 2.4 Summarize reference character ranges and layout behavior
- [x] 3.0 Run a pre-implementation payload calibration pass
  - [x] 3.1 Create calibration deckspecs with intentional character-count ladders for each key layout family
  - [x] 3.2 Render those calibration decks to PPTX, PDF, and PNG
  - [x] 3.3 Measure actual slide-level and paragraph-level character counts from the generated outputs
  - [x] 3.4 Visually inspect the rendered slides to identify the highest safe payload for each layout and level
  - [x] 3.5 Freeze the final recommended caps only after user confirmation
- [x] 4.0 Rework `textAmount` semantics around payload
  - [x] 4.1 Replace count-only expectations with mixed count + character targets in `generator/runtime/verbosity-contract.js`
  - [x] 4.2 Decide where char caps, line caps, and count caps belong for each layout family
  - [x] 4.3 Tune the `concise`, `detailed`, and `extensive` ladder around the approved targets
- [x] 5.0 Add constrained-layout protections
  - [x] 5.1 Add hard payload caps for `titleStrapline4TextBoxes`
  - [x] 5.2 Add hard payload caps for `analysisWideChartTableText`
  - [x] 5.3 Add hard payload caps for `analysisNarrowTable`
  - [x] 5.4 Rebalance `analysisBridge` and `businessOverview` high-end growth
- [x] 6.0 Refactor the full product surface across parent and skill
  - [x] 6.1 Update presets and starter deck specs
  - [x] 6.2 Update fixtures and fixture governance checks
  - [x] 6.3 Update docs and skill guidance
  - [x] 6.4 Sync the skill bundle and verify portability
- [x] 7.0 Re-export and validate
  - [x] 7.1 Regenerate review decks on the Desktop
  - [x] 7.2 Regenerate the all-layouts sample deck
  - [x] 7.3 Validate QA output and pagination behavior
  - [x] 7.4 Spot-check visually against the consulting reference style
- [x] 8.0 Run end-to-end density calibration
  - [x] 8.1 Render the updated review decks and representative fixture decks to PPTX, PDF, and PNG
  - [x] 8.2 Extract slide-level and paragraph-level text-character metrics from the regenerated outputs
  - [x] 8.3 Compare generated output ranges against `north_fdd.pptx` and `coffee_fdd.pptx`
  - [x] 8.4 Review representative slides side-by-side for visual density, whitespace balance, and overflow behavior
  - [x] 8.5 Revise payload caps and rerun the comparison if the output is still materially thinner or more overloaded than the references

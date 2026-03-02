# Deterministic Layout Onboarding Workflow

This is the standard workflow for turning a reference PowerPoint slide into a new deterministic generator layout with strict visual parity gates.

Use this when you provide:
- a reference `.pptx` file
- the target slide number in that file
- the slide type name to implement in this repo

## Outcome

When this workflow is complete:
- the new layout is implemented in deterministic generator code
- slot contract and validation are updated
- theming/component conventions are preserved
- visual parity test is green only if the generated slide PNG is pixel-identical to the reference slide PNG

## Non-Negotiable Rules

1. No ad-hoc runtime slide drawing outside the builder contract.
2. No direct `tokens.js` imports inside builders. Use `context.theme`.
3. No builder-local magic geometry when layout boxes can live in template geometry/layout contract.
4. No bypassing parity: test stays red until exact PNG hash match is achieved.
5. If significant new primitives are needed, pause and align with the user before implementing.

## Inputs Required

1. Reference PPTX path.
2. Reference slide index (1-based).
3. New/existing slide type name.
4. A fixture deckSpec path for the candidate slide.

## Phase 1: Intake + Artifact Capture

1. Create a working folder:

```bash
mkdir -p outputs/layout-onboarding/<layout-name>
```

2. Copy reference PPTX into that folder.
3. Create a short notes file (`contract-notes.md`) with:
- intended narrative purpose of the layout
- expected slots (title, strapline, body, chart, table, source, etc.)
- any special behaviors (pagination, callouts, badges, connectors)

## Phase 2: Reverse-Engineer the Layout Contract

1. Render reference slide PNG for visual inspection:

```bash
npm run test:visual:reference-parity -- \
  --reference-pptx /abs/path/reference.pptx \
  --reference-slide 7 \
  --candidate-deck decks/layout-onboarding-placeholder.deckSpec.json \
  --candidate-slide 1 \
  --out-dir /Users/rishi/Desktop/slides-tests/<layout-name>-parity
```

Note: this command will fail until candidate output matches reference; use it as the parity gate throughout implementation.

2. Extract slide XML for geometry and structure clues:

```bash
mkdir -p /tmp/<layout-name>-xml
unzip -o /abs/path/reference.pptx -d /tmp/<layout-name>-xml
```

3. Inspect:
- `/tmp/<layout-name>-xml/ppt/slides/slide<index>.xml`
- `/tmp/<layout-name>-xml/ppt/slides/_rels/slide<index>.xml.rels`

4. Translate findings into template geometry boxes in `templates/kpmg-diligence/package/layouts.json`.

## Phase 3: Contract + Validation First

1. Add/update slide type slots in `templates/kpmg-diligence/package/layouts.json`.
2. Enforce shape-safe validation in `generator/runtime/render-deck.js` for complex slots if needed.
3. Keep schema/docs aligned:
- `skills/kpmg-slides/references/slide-contract.md`
- `skills/kpmg-slides/references/deckspec.schema.json` (if contract shape changes)

## Phase 4: Builder Implementation (Theme + Components Only)

1. Add/update builder in `generator/builders/`.
2. Consume:
- geometry from `context.layoutContract`
- styling/tokens from `context.theme`
- shared blocks from `generator/helpers/slide-components.js`

3. If repeated UI primitives are needed, extract a component helper instead of copy/paste in multiple builders.
4. Do not spread internal runtime objects into user slide spec payloads.

## Phase 5: Regression Tests

Add tests for behavior and safety, not just happy path:

1. Contract/validation tests:

```bash
npm run test:contracts
```

2. Drift guard tests:

```bash
npm run test:drift:ast:strict
npm run test:drift:grep:strict
```

3. Layout-specific unit/regression tests in `scripts/` for pagination, overflow, metadata persistence, or slot validation changes.

## Phase 6: Visual Parity Gate (Must Be Exact)

Run:

```bash
npm run test:visual:reference-parity -- \
  --reference-pptx /abs/path/reference.pptx \
  --reference-slide <ref-slide-index> \
  --candidate-deck decks/<candidate>.deckSpec.json \
  --candidate-slide <candidate-slide-index> \
  --out-dir /Users/rishi/Desktop/slides-tests/<layout-name>-parity
```

Pass criteria:
- candidate QA valid
- candidate overflow visual check pass
- candidate and reference PNG dimensions match
- candidate and reference PNG `sha256` hashes match exactly

If hash mismatch occurs, keep iterating geometry/typography/component details until green.

## Phase 7: Human Visual Signoff

Even after hash green, verify:
1. Text alignment and spacing look correct at full slide view.
2. Footer/chrome boundaries are respected.
3. Pagination behavior remains deterministic with dense content.

Save signoff PNG artifacts under:
- `/Users/rishi/Desktop/slides-tests/<layout-name>-parity`

## Phase 8: Ship + Skill Sync

1. Run relevant regression scripts for impacted layouts.
2. Sync skill bundle:

```bash
npm run skill:sync
npm run skill:verify
```

3. Update any skill docs touched by the contract or workflow.

## Escalation Gates (Pause And Align With User)

Pause and discuss before coding if any of these are true:

1. New cross-layout component is required (for example, a new reusable chart/table/text primitive).
2. Theme needs new semantic tokens or component metrics not present in current theme map.
3. Layout contract cannot represent the design without adding new named boxes or slot semantics.
4. The slide requires behavior that is not deterministic under current pagination/validation model.

When escalating, present:
- exact issue in plain language
- minimal architecturally-sound fix
- potential regressions and mitigation


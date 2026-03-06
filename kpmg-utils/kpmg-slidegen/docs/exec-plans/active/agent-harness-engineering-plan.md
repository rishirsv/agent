---
status: active
last-reviewed: 2026-03-06
review-cycle-days: 14
source-of-truth: repo audit of kpmg-slidegen tests/docs/scripts plus OpenAI evaluation guidance
verification-state: verified
---

# Agent Harness Engineering Plan

## Why This Plan Exists

This plan is the operating model for turning `kpmg-slidegen` into a layout platform that can grow from the current 14 layout types to 40+ without quality collapse, heroics, or repeated manual cleanup.

The immediate priority is testing. The harness must make it cheap to add a layout, cheap to tell whether it is good enough, and cheap to reject or retire weak fixtures, weak tests, and weak onboarding paths. Once the testing layer is disciplined, the rest of harness engineering can sit on top of it.

## What Success Looks Like

When this plan is complete, adding a new layout should feel like a guided production workflow instead of a custom debugging project:

1. Capture reference XML and reference PNG once.
2. Scaffold the layout with one canonical fixture family, not a one-off script pile.
3. Run contracts, pagination, verbosity, and visual checks in one harness command.
4. Get a machine-readable scorecard with exact reasons for failure.
5. Let the harness drive bounded repair iterations until the layout clears the bar or is explicitly kicked to human review.
6. Promote the layout into the baseline set only when its fixture pack, artifacts, and docs are complete.

## Phase Outcomes

### Phase 1: Reset the surface

Outcome:
- The repo has one fixture system, one preset system, and one public harness surface.
- The old `decks/` pile and one-off test scripts are gone, so contributors cannot accidentally extend the wrong system.

### Phase 2: Normalize machine feedback

Outcome:
- Every generation run emits one `qa.json` contract that is easy for tests, agents, and humans to read.
- Verbosity and density settings stop being prompt-only guidance and start showing up in runtime checks.

### Phase 3: Rebuild confidence lanes

Outcome:
- Fast checks cover contracts, fixtures, structure, render, and distribution.
- Slower checks cover visual inspection and onboarding evidence without bloating the PR lane.

### Phase 4: Make the bundle portable

Outcome:
- Parent repo testing remains deep, while the skill bundle only proves sync, portability, and smoke execution.
- Default output paths work from the caller's working directory instead of repo-local assumptions.

## Implementation Checklist

- [x] 1.0 Replace the legacy fixture and test surface
  - [x] 1.1 Create curated `fixtures/harness/` fixture packs
  - [x] 1.2 Create `presets/authoring/` starter deckSpecs for `sm|md|lg|xl`
  - [x] 1.3 Remove legacy `decks/*.deckSpec.json` inputs and old one-off test scripts
- [x] 2.0 Re-architect `qa.json`
  - [x] 2.1 Normalize the report around `schemaVersion`, `run`, `outcome`, `checks`, `findings`, `slides`, and `artifacts`
  - [x] 2.2 Add runtime verbosity-contract evaluation tied to `textAmount` and `densityProfile`
  - [x] 2.3 Store artifact paths relative to the run root
- [x] 3.0 Rebuild the public harness lanes
  - [x] 3.1 Add contract, fixture, structure, render, visual, onboarding, PR, nightly, and distribution lane scripts
  - [x] 3.2 Update `package.json` to expose the new lane commands
  - [x] 3.3 Run and stabilize every lane against the new QA contract
- [x] 4.0 Make the skill bundle portable and preset-aware
  - [x] 4.1 Sync parent presets into the bundle
  - [x] 4.2 Update the runner default output root to `outputs/kpmg-slidegen/<timestamp>/`
  - [x] 4.3 Repoint bundle smoke verification to the synced presets
- [x] 5.0 Align docs and close verification
  - [x] 5.1 Update README, architecture, skill, and QA reference docs for the new contract
  - [x] 5.2 Record final verification results in this plan

## Final Verification Results

Completed on 2026-03-06:

- `node scripts/test-contracts.mjs`
- `node scripts/test-fixtures.mjs`
- `node scripts/test-structure.mjs`
- `node scripts/test-render.mjs`
- `node scripts/test-visual.mjs`
- `node scripts/test-onboarding.mjs`
- `node scripts/test-dist.mjs`
- `node scripts/test-pr.mjs`
- `node scripts/test-nightly.mjs`
- `npm run -s generate:minimal`
- `npm run -s generate:concise`
- `npm run -s generate:detailed`
- `npm run -s generate:extensive`

## Harness Principles

These principles should govern every testing and harness decision in this repo:

1. Evaluate the exact task we care about, not a proxy that is convenient to script.
2. Prefer small, reliable, task-specific checks over one giant opaque suite.
3. Log every run with artifacts so failures are explainable and reproducible.
4. Separate blocking fast gates from slower confidence-building sweeps.
5. Keep humans in calibration and approval loops, but automate the repetitive inspection work.
6. Delete or demote tests that do not produce trusted signal.

These principles align with OpenAI's public guidance on eval-driven development, practical agent workflows, and using structured evaluation loops instead of ad hoc manual judging. See [Evals design guide](https://platform.openai.com/docs/guides/evals-design), [Evaluating model performance](https://platform.openai.com/docs/guides/evals), and [A practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf).

## Current Compliance Snapshot

This section is the verified baseline as of 2026-03-06.

### Strong Today

- Fast contract coverage exists and passes:
  - `npm run -s test:contracts`
  - `npm run -s test:contracts:registry`
- Smoke generation exists and passes:
  - `npm run -s smoke`
- The visual runtime preflight exists and passes:
  - `npm run -s validate:visual`
- QA golden coverage already checks:
  - all current layout types
  - all slots
  - chart type coverage
  - short and verbose narrative presence

### Partial Today

- Pagination regression coverage exists, but it is fragmented into narrow scripts rather than one canonical matrix.
- Visual regression coverage exists, but it is mostly script-per-layout or script-per-feature instead of family-first orchestration.
- Theme drift and builder grep guards exist and already contribute useful fast-gate signal.
- Manual scenario coverage exists in `testing/manual-test-plan.md`, but it is not integrated with automated harness promotion rules.

### Missing or Weak Today

- No repo CI workflows are present, so the plan's PR/nightly/release lanes are not enforced.
- No changed-family detection exists for layout-affecting pull requests.
- No automated onboarding loop exists for "extract XML + render PNG + iterate until acceptable".
- No deckSpec quality rubric exists for deciding which fixtures stay, graduate, or get removed.
- No verbosity matrix exists even though narrative density is already important to layout success.
- No unified artifact contract exists for every harness run.
- No scorecard exists for flake rate, pass rate, coverage gaps, or test retirement decisions.

### Verified Gaps and Quality Debt

- Broken advertised entrypoints:
  - `generate` points to a missing fixture in [package.json](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/package.json#L8)
  - `generate:layouts` points to a missing fixture in [package.json](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/package.json#L9)
- Broken advertised validation test:
  - `test:validation:failure` depends on a missing deck in [package.json](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/package.json#L14) and [scripts/test-validation-failure.mjs](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/scripts/test-validation-failure.mjs#L9)
- Layout scaffolding is still manual and non-portable:
  - the scaffold emits only a console stub for visual validation in [scripts/new-layout.mjs](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/scripts/new-layout.mjs#L113)
  - the scaffold references outdated schema/doc paths in [scripts/new-layout.mjs](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/scripts/new-layout.mjs#L136)
  - the scaffold hardcodes a desktop output path in [scripts/new-layout.mjs](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/scripts/new-layout.mjs#L147)
- README accuracy is mixed:
  - it documents missing workflow/spec files in [README.md](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/README.md#L146)
  - it acknowledges broken entrypoints instead of fixing them in [README.md](/Users/rishi/Code/ai-tools/kpmg-utils/kpmg-slidegen/README.md#L131)

## Reorganized Harness Model

The harness should be reorganized around evidence lanes, not around historical scripts.

### Lane Model

1. `L0` Schema and contract lane
   - registry parity
   - template parity
   - geometry required keys
   - pagination policy coverage
   - no silent fallbacks

2. `L1` DeckSpec quality lane
   - fixture metadata validity
   - slide-type intent coverage
   - source completeness
   - density and verbosity tagging
   - fixture ownership and retention status

3. `L2` Pagination and structural behavior lane
   - continuation behavior
   - nested bullets
   - table splits
   - contents pagination
   - section semantics

4. `L3` Visual and postprocess lane
   - preview render
   - montage render
   - overflow visual inspection
   - baseline comparison
   - reference parity

5. `L4` Layout onboarding lane
   - reference extraction
   - candidate render
   - structural diff
   - visual diff
   - bounded retry loop
   - human promotion step

6. `L5` CI and scheduled confidence lane
   - PR fast gate
   - PR changed-family visual gate
   - nightly full matrix
   - weekly cleanup and retirement review

## Required Artifact Contract

Every blocking or promotable harness run must emit the same artifact set:

1. input deckSpec or fixture id
2. rendered `.pptx`
3. `qa.json`
4. reference XML snapshot when applicable
5. per-slide PNGs
6. montage PNG when applicable
7. structured grading summary
8. command manifest with tool versions
9. baseline comparison report when a baseline exists
10. failure classification with one primary owner lane

If a test does not produce enough evidence for someone else to understand why it passed or failed, it should not remain in the blocking path.

## DeckSpec Governance Model

DeckSpecs are part of the harness, not just examples. Every fixture must be classified and curated.

### Fixture Classes

1. `golden`
   - canonical all-layout or all-family coverage
   - stable and reviewed

2. `regression`
   - reproduces a previously broken behavior
   - must name the exact failure mode

3. `stress`
   - intentionally hard cases for density, overflow, or pagination

4. `scenario`
   - realistic multi-slide narrative deck used for end-to-end behavior

5. `reference-parity`
   - candidate vs extracted reference comparison input

6. `invalid`
   - expected-failure fixture for validation behavior

### Required Metadata for Every Fixture

Each retained fixture pack must eventually declare:

- fixture class
- owner
- covered layout family or families
- verbosity band
- density band
- expected pass/fail state
- whether it is baseline-bearing
- whether it is safe for PR blocking
- origin of the content and whether it is synthetic or reference-derived

### Remove or Rewrite a DeckSpec When

- it is not tied to a named risk
- it duplicates another fixture without adding coverage
- it only exists because a historical script wanted a one-off input
- it cannot be explained by a clear layout family or failure mode
- it depends on local machine paths or hidden external data
- it does not have enough content quality to tell us whether the layout is actually good

## Verbosity and Density Matrix

The future layout count will only stay manageable if content shape is tested systematically.

Every narrative-capable layout family must eventually be exercised across:

1. terse
2. target
3. verbose
4. extreme-but-valid

And each relevant fixture should declare:

1. density band
2. expected pagination outcome
3. expected QA outcome
4. whether the result should remain one slide or split

This is how we stop discovering fit problems only after a human eyeballs a PNG late in the loop.

## Automated Layout Onboarding Loop

This is the core workflow this plan must enable.

### Outcome

A new layout should be onboarded through one scripted harness path that can reach "good enough for human review" without hand-assembling ad hoc tests.

### Loop

1. ingest source material
   - extracted XML
   - reference slide PNG
   - reference layout metadata

2. scaffold candidate package
   - builder stub
   - registry entry stub
   - template contract stub
   - canonical fixture set
   - quality checklist

3. run deterministic gates
   - contracts
   - deckSpec quality checks
   - pagination expectations

4. run reference comparison gates
   - candidate PNG vs reference PNG
   - structural checks against extracted geometry
   - allowed variance thresholds

5. issue structured repair guidance
   - missing boxes
   - wrong pagination behavior
   - density mismatch
   - visual mismatch
   - unsupported slot usage

6. retry automatically up to a bounded limit
   - default max three automated repair attempts
   - every retry must store artifacts and diffs

7. gate promotion
   - promote only if all required lanes pass
   - otherwise mark as manual-review-required with preserved evidence

## Test Retirement Policy

Low-quality tests must be removed or downgraded. Keeping them is expensive because they make the harness look stronger than it is.

### A Test Is Low Quality If It Is Any Of

1. broken by default
2. non-portable
3. redundant with a better test
4. dependent on missing fixtures
5. impossible to interpret when it fails
6. coupled to personal machine paths
7. too narrow to justify a top-level npm entry
8. not tied to a stated risk or acceptance bar

### Allowed Actions

1. fix and keep
2. merge into a family runner
3. demote to non-blocking/manual
4. archive
5. delete

## Phase Outcomes (Non-Technical)

### Phase 0: The current harness can be trusted at face value

Commands, docs, and fixtures stop lying about what works.

### Phase 1: Tests are organized by signal, not history

The repo has one clear view of fast checks, structural checks, visual checks, and end-to-end checks.

### Phase 2: Fixtures become curated assets

DeckSpecs are classified, tagged, and pruned so they help rather than confuse.

### Phase 3: Content-shape coverage becomes intentional

Verbosity and density are tested on purpose instead of being discovered accidentally.

### Phase 4: Visual quality scales by family

Adding more layouts does not require adding more fragile one-off scripts at the same rate.

### Phase 5: New layouts follow one automated path

Reference extraction, candidate generation, scoring, and bounded retries become one onboarding loop.

### Phase 6: CI reflects real confidence levels

Fast lanes block regressions early, and deeper lanes run on the right cadence with artifacts.

### Phase 7: Weak signal is continuously retired

Old scripts, bad fixtures, and flaky checks do not accumulate quietly.

### Phase 8: Harness docs become operational

Anyone can see how quality is enforced, what evidence is produced, and how a layout graduates.

## Implementation Checklist

- [ ] 0.0 Establish the truthful baseline
  - [ ] 0.1 Replace or remove broken `generate` and `generate:layouts` entrypoints.
  - [ ] 0.2 Replace or repair `test:validation:failure` with a real invalid fixture.
  - [ ] 0.3 Audit every npm test command as `keep | merge | demote | delete`.
  - [ ] 0.4 Add one canonical test inventory doc with lane, owner, fixture set, and blocking status.
  - [ ] 0.5 Validation for 0.0: every documented test command is runnable or explicitly marked non-blocking/manual.

- [ ] 1.0 Reorganize the test surface around lanes
  - [ ] 1.1 Add aggregate commands for `contracts:all`, `deckspec:all`, `pagination:all`, `visual:families`, and `harness:pr`.
  - [ ] 1.2 Reclassify current scripts into lane folders or a documented lane map.
  - [ ] 1.3 Remove top-level prominence from one-off scripts that should not be the public interface.
  - [ ] 1.4 Ensure every lane writes artifacts to a predictable location and schema.
  - [ ] 1.5 Validation for 1.0: a new contributor can explain the harness from the lane map without reading individual scripts.

- [ ] 2.0 Build deckSpec quality governance
  - [ ] 2.1 Create a fixture registry covering every retained deckSpec in `decks/`.
  - [ ] 2.2 Tag fixtures by class, family, verbosity, density, owner, and retention status.
  - [ ] 2.3 Add checks for missing metadata, duplicate purpose, and uncategorized fixtures.
  - [ ] 2.4 Define promotion criteria for a fixture becoming baseline-bearing.
  - [ ] 2.5 Remove or archive low-quality deckSpecs that fail the rubric.
  - [ ] 2.6 Validation for 2.0: every retained fixture is explainable through the registry alone.

- [ ] 3.0 Add content-shape coverage
  - [ ] 3.1 Define canonical verbosity bands and density bands for narrative layouts.
  - [ ] 3.2 Build family fixture packs that cover terse, target, verbose, and extreme-but-valid cases.
  - [ ] 3.3 Add expectations for split/no-split behavior per band.
  - [ ] 3.4 Add a single report showing which families lack verbosity coverage.
  - [ ] 3.5 Validation for 3.0: layout fit failures become reproducible by fixture band, not anecdote.

- [ ] 4.0 Consolidate structural behavior tests
  - [ ] 4.1 Merge narrow pagination scripts into one pagination matrix runner.
  - [ ] 4.2 Add expected-failure fixtures for invalid deckSpec behavior.
  - [ ] 4.3 Add assertions for continuation semantics, nested content preservation, and table metadata carry-forward.
  - [ ] 4.4 Include QA evidence checks in the structural lane so pagination is not judged by slide count alone.
  - [ ] 4.5 Validation for 4.0: one command shows the full structural health of the generator.

- [ ] 5.0 Consolidate visual regression testing by family
  - [ ] 5.1 Define layout families as the visual unit of scale.
  - [ ] 5.2 Merge duplicate or overlapping per-layout scripts into family runners where possible.
  - [ ] 5.3 Standardize visual artifacts: preview PNGs, montage, hash report, and overflow report.
  - [ ] 5.4 Separate deterministic blocking visual checks from exploratory manual suites.
  - [ ] 5.5 Keep exact reference-parity tooling, but wire it into onboarding instead of leaving it as a standalone niche command.
  - [ ] 5.6 Validation for 5.0: visual coverage grows sublinearly as layout count grows.

- [ ] 6.0 Automate layout onboarding
  - [ ] 6.1 Replace the current `new:layout` scaffold with a real onboarding harness.
  - [ ] 6.2 Accept reference assets as first-class inputs: XML extraction, slide PNG, and metadata.
  - [ ] 6.3 Emit a candidate package with required tests, fixtures, and docs.
  - [ ] 6.4 Run bounded repair iterations with structured failure categories.
  - [ ] 6.5 Gate final promotion on contracts, structure, verbosity coverage, and visual comparison.
  - [ ] 6.6 Validation for 6.0: one command can take a new reference layout from raw assets to review-ready candidate.

- [ ] 7.0 Introduce CI and scheduled procedures
  - [ ] 7.1 Add PR fast gate for contracts, deckSpec quality, pagination, smoke, and strict drift.
  - [ ] 7.2 Add PR visual gate for changed families and theme end-to-end coverage.
  - [ ] 7.3 Add nightly full matrix for all family visuals, QA golden, and coverage reports.
  - [ ] 7.4 Add weekly cleanup job for retirement candidates, flake review, and scorecard updates.
  - [ ] 7.5 Validation for 7.0: the same harness story exists locally and in CI.

- [ ] 8.0 Add scorecards and retirement loops
  - [ ] 8.1 Track pass rate, flake rate, missing coverage, and time-to-debug per lane.
  - [ ] 8.2 Track which fixtures and tests are pending retirement review.
  - [ ] 8.3 Add thresholds for when a test is demoted from blocking.
  - [ ] 8.4 Add a recurring review pass for deleting dead harness surface area.
  - [ ] 8.5 Validation for 8.0: harness complexity can shrink as well as grow.

- [ ] 9.0 Publish the operator docs
  - [ ] 9.1 Add `docs/harness/README.md` as the table of contents.
  - [ ] 9.2 Add `docs/harness/lane-map.md` mapping risks to checks and commands.
  - [ ] 9.3 Add `docs/harness/fixture-governance.md` for deckSpec quality rules.
  - [ ] 9.4 Add `docs/harness/layout-onboarding.md` for the automated onboarding loop.
  - [ ] 9.5 Add `docs/harness/e2e-procedures.md` for PR, nightly, and weekly procedures.
  - [ ] 9.6 Validation for 9.0: a human or agent can follow the docs to add a layout without inventing process.

## Recommended Sequence

1. first repair truthfulness problems
   - broken commands
   - broken fixtures
   - broken docs

2. then create the fixture registry and retirement rubric
   - this prevents more harness sprawl while we refactor

3. then merge structural and visual tests into lane-based runners
   - this creates the platform for scale

4. then automate layout onboarding
   - this is where XML extraction and PNG inspection become part of one loop

5. then wire CI and scorecards
   - only after the local harness model is coherent

## Acceptance Criteria For This Plan

This plan should be considered fulfilled only when all of the following are true:

1. a new layout can be added through one documented onboarding path
2. the onboarding path produces artifacts and a structured grading summary
3. deckSpecs are curated, tagged, and pruned under a published rubric
4. verbosity and density are tested intentionally across layout families
5. low-quality tests have been removed, merged, or demoted
6. CI reflects the same lanes used locally
7. the repo can explain its harness quality posture without tribal knowledge

## Explicit Non-Goals For The First Pass

These are intentionally deferred until the testing-first reorganization is stable:

1. broad product feature expansion unrelated to harness quality
2. support for fallback compatibility paths that hide broken layouts
3. bespoke one-off visual scripts for every future layout
4. adding more fixture volume without adding fixture governance

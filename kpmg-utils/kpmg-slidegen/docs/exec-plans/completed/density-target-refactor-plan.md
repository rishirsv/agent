---
status: completed
last-reviewed: 2026-03-07
review-cycle-days: 14
source-of-truth: user-approved comprehensive parent-plus-skill refactor to remove densityProfile and rebaseline densityTarget around the current denser standard
verification-state: completed
---

# Density Target Refactor Plan

## Why This Plan Exists

This plan removes `densityProfile` from the parent application and the portable skill bundle, while keeping structural density enforcement through `densityTarget`. The enforcement baseline will be recalibrated around the current denser standard so the application keeps a strong readability guardrail without exposing a confusing extra setting.

## What Success Looks Like

When this work is complete:

1. `textAmount` is the only authored verbosity setting in both the parent repo and the skill bundle.
2. `densityTarget` remains active as an internal layout guardrail and reflects the denser baseline.
3. Parent docs, skill docs, presets, fixtures, QA, and tests all describe the same simplified model.
4. Fresh review/sample exports exist for the post-refactor layout surface.

## Phase Outcomes

### Phase 1: One Content Model Across Parent And Skill

Outcome:
- The repo and the skill bundle use one clear content model with no lingering `densityProfile` contract.

### Phase 2: Denser Baseline Becomes The Default Guardrail

Outcome:
- Layout density enforcement stays in place, but the default threshold reflects the denser standard the team actually wants.

### Phase 3: Parent And Skill Stay In Lockstep

Outcome:
- Runtime, schema, presets, QA, tests, and docs all move together with no dual-path behavior.

### Phase 4: Fresh Review Artifacts

Outcome:
- Updated sample decks and exported review artifacts show the new model without density-profile permutations.

## Implementation Checklist

- [x] 1.0 Remove `densityProfile` from the contract everywhere
  - [x] 1.1 Remove it from parent schema in `references/deckspec.schema.json`.
  - [x] 1.2 Remove it from skill schema mirror in `skills/kpmg-slides/references/deckspec.schema.json`.
  - [x] 1.3 Remove it from runtime validation in `generator/runtime/verbosity-contract.js`.
  - [x] 1.4 Remove it from skill runtime mirrors.
  - [x] 1.5 Remove it from QA output fields in parent and skill mirrors.

- [x] 2.0 Rebaseline layout density enforcement around the current denser standard
  - [x] 2.1 Audit every `densityTarget` in `templates/kpmg-diligence/package/layouts.json`.
  - [x] 2.2 Define the new baseline rule for `minScore` and `acceptableFloor`.
  - [x] 2.3 Update the parent template layout density targets.
  - [x] 2.4 Sync the updated template into the skill bundle.
  - [x] 2.5 Verify pagination, overlap, and sparse-slide behavior still make sense under the tighter baseline.

- [x] 3.0 Simplify presets and authored inputs in parent and skill
  - [x] 3.1 Rewrite `presets/authoring/presets.manifest.json` to be `textAmount`-only.
  - [x] 3.2 Update `minimal`, `concise`, `detailed`, and `extensive` starter deck specs.
  - [x] 3.3 Update skill preset mirrors.
  - [x] 3.4 Update onboarding defaults and promotion scripts.
  - [x] 3.5 Update generated sample/review scripts.

- [x] 4.0 Migrate fixtures, manifests, and tests comprehensively
  - [x] 4.1 Update fixture manifests under `fixtures/harness/`.
  - [x] 4.2 Update all fixture deck specs that currently declare `densityProfile`.
  - [x] 4.3 Update preset and fixture governance tests.
  - [x] 4.4 Update structure and render tests that currently expect density-profile metadata.
  - [x] 4.5 Update skill portability checks affected by the contract change.

- [x] 5.0 Rewrite docs and skill instructions so the model is unambiguous
  - [x] 5.1 Update parent docs and references.
  - [x] 5.2 Update skill `SKILL.md` and mirrored references.
  - [x] 5.3 Remove user-facing density-profile vocabulary.
  - [x] 5.4 Document `densityTarget` as an internal layout guardrail, not a user setting.

- [x] 6.0 Re-export post-refactor review artifacts
  - [x] 6.1 Replace the current textAmount × densityProfile matrix with a `textAmount`-only review set.
  - [x] 6.2 Regenerate the Desktop review bundle.
  - [x] 6.3 Regenerate an updated all-layouts sample deck.
  - [x] 6.4 Verify parent outputs and skill-bundle outputs stay aligned.

- [x] 7.0 Final verification
  - [x] 7.1 Run fixture, structure, render, and dist verification.
  - [x] 7.2 Spot-check representative slides visually.
  - [x] 7.3 Confirm no remaining `densityProfile` references in parent or skill except intentionally preserved historical docs.

## Final Verification Results

Completed on 2026-03-07:

- Removed `densityProfile` from parent and skill schemas, runtime validation, QA reporting, presets, fixtures, onboarding scaffolds, and mirrored skill assets.
- Rebased key layout `densityTarget.minScore` values to the new default `0.75` baseline for the main narrative/table content layouts.
- Synced the skill bundle and confirmed no remaining `densityProfile` references in `skills/kpmg-slides/assets/`.
- Regenerated the Desktop review bundle as a `textAmount`-only set plus an updated all-layouts sample deck.
- Passed `npm run test:fixtures`, `npm run test:structure`, `npm run test:render`, and `npm run test:dist`.

## Notes

- Intentionally sparse layouts such as `cover` and `backCover` keep their layout-specific lower or zero density thresholds.
- The Desktop review bundle now represents the post-refactor surface with four root-level preset decks plus one all-layouts sample deck.

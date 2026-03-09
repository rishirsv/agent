---
status: completed
last-reviewed: 2026-03-07
review-cycle-days: 14
source-of-truth: user request to create reviewable sample decks for every textAmount and densityProfile permutation
verification-state: completed
---

# Verbosity Density Matrix Samples Plan

## Why This Plan Exists

This plan creates a review-ready set of sample decks that shows every supported `textAmount` and `densityProfile` combination. The goal is to make the repo's verbosity contract easy to inspect visually instead of only reading the metadata and validation rules.

## What Success Looks Like

When this work is complete:

1. A reviewer can open a Desktop folder and inspect one rendered deck for each supported permutation.
2. Each deck uses the same overall storyline and slide family mix so differences are easy to compare.
3. Each sample deck writes explicit metadata for `textAmount`, `densityProfile`, `slideCountPolicy`, `styleIntent`, and `allowSparse`.
4. The generated sample decks remain reproducible from a repo script instead of being one-off manual files.

## Phase Outcomes

### Phase 1: Define The Review Matrix

Outcome:
- We have a clear 4 x 3 matrix covering all supported verbosity and density settings.
- The sample format is consistent enough that reviewers can compare decks directly.

### Phase 2: Create Reproducible Deck Specs

Outcome:
- The repo can generate all sample `deckSpec` inputs from a single script.
- Each generated input is explicit, readable, and safe to re-run.

### Phase 3: Render Review Artifacts

Outcome:
- Every permutation is rendered to a Desktop review folder with deck and QA artifacts.
- Reviewers can inspect both the `.pptx` outputs and the authored `deckSpec` inputs in one place.

### Phase 4: Verify And Close

Outcome:
- The generated matrix renders successfully.
- The plan records what was produced and where the review artifacts live.

## Implementation Checklist

- [x] 1.0 Define the full permutation matrix
  - [x] 1.1 Confirm all supported `textAmount` values.
  - [x] 1.2 Confirm all supported `densityProfile` values.
  - [x] 1.3 Choose a common review storyline and layout mix.

- [x] 2.0 Build reproducible sample inputs
  - [x] 2.1 Add a script that generates one sample deck spec per permutation.
  - [x] 2.2 Write generated deck specs to a stable repo folder.
  - [x] 2.3 Include a review manifest that explains the matrix in plain language.

- [x] 3.0 Render the matrix to Desktop
  - [x] 3.1 Generate all 12 deck specs.
  - [x] 3.2 Render all 12 `.pptx` outputs plus `qa.json` artifacts.
  - [x] 3.3 Copy review inputs and manifest into the Desktop bundle.

- [x] 4.0 Verify completion
  - [x] 4.1 Confirm the Desktop bundle contains all permutations.
  - [x] 4.2 Spot-check render success from QA outputs.
  - [x] 4.3 Mark the plan complete and move it to the completed folder.

## Final Verification Results

Completed on 2026-03-07:

- Generated 12 review deck specs under `presets/authoring/review-matrix/`
- Rendered 12 `.pptx` decks and 12 `qa.json` files to `/Users/rishi/Desktop/kpmg-slidegen-verbosity-density-matrix`
- Confirmed all 12 permutations pass the verbosity contract
- Confirmed the Desktop bundle includes a plain-language `README.md` plus one folder per permutation

## Notes

- Overall QA outcome is `warn` for all rendered samples because some review decks intentionally trigger advisory pagination and minor overlap warnings on denser analytical layouts.
- The samples are still review-ready and non-blocking because no permutation reported blocking failures.

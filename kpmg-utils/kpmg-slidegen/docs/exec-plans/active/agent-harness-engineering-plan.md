---
status: active
last-reviewed: 2026-03-06
review-cycle-days: 14
source-of-truth: repo audit of kpmg-slidegen docs, package scripts, and harness scripts
verification-state: verified
---

# Agent Harness Engineering Plan

## Why This Plan Exists

This plan keeps the public `kpmg-slidegen` harness truthful, compact, and usable by both repo contributors and skill-bundle maintainers.

The current repo supports generation, repo-only layout onboarding, a normalized `qa.json` contract, curated fixture lanes, and portable skill verification. Repo docs should describe onboarding truthfully as a parent-repo-only workflow and should keep the portable skill boundary explicit.

## What Success Looks Like

When this plan is healthy:

1. Contributors can understand the supported harness surface from the docs alone.
2. Every documented command exists in `package.json` and maps to a real script.
3. Repo docs and skill docs describe the same QA, artifact, and portability model.
4. Repo-only onboarding and portable-skill boundaries stay explicit instead of being implied by stale docs.

## Current Supported Command Surface

### Generation

- `npm run generate`
- `npm run generate:concise`
- `npm run generate:detailed`
- `npm run generate:extensive`

### Fast And Deep Harness Lanes

- `npm run qa`
- `npm run test:contracts`
- `npm run test:fixtures`
- `npm run test:structure`
- `npm run test:render`
- `npm run test:visual`
- `npm run test:pr`
- `npm run test:nightly`
- `npm run test:dist`
- `npm run smoke`

### Skill Bundle Maintenance

- `npm run skill:sync`
- `npm run skill:verify`
- `npm run skill:smoke`

### Local Sample Helpers

- `npm run dev:cover`
- `npm run dev:analysis-narrow`

These two `dev:*` commands are sample render helpers only. They are not part of the blocking QA or distribution surface.

## Phase Outcomes

### Phase 1: Truthful Public Surface

Outcome:
- README, AGENTS, testing docs, and active plans all describe the command surface that actually exists today.
- Repo-only onboarding is presented as supported, and portable-skill sync remains clearly separate.

### Phase 2: Stable Evaluation Lanes

Outcome:
- The public harness surface stays centered on contracts, fixtures, structure, render, visual, PR, nightly, and distribution checks.
- The normalized `qa.json` contract remains the shared evidence model across these lanes.

### Phase 3: Portable Skill Confidence

Outcome:
- Parent-repo docs remain clear about which commands are repo maintenance commands.
- Skill-facing docs remain portable and avoid repo-root assumptions.

### Phase 4: Onboarding Boundary Stays Explicit

Outcome:
- Repo-only onboarding is documented as supported, while portable-skill sync and later bundle publication remain clearly separate follow-up concerns.

## Current Reality Snapshot

### Strong Today

- The public npm script surface for generation, QA lanes, skill sync, and skill verification is present in `package.json`.
- The active harness lanes map to real scripts under `scripts/`.
- The repo and skill now share a normalized `qa.json` contract and portable output-path guidance.
- Repo-only layout onboarding is now a supported parent-repo workflow.

### Deferred By Design

- Portable-skill sync as part of onboarding
- Any documentation that implies draft onboarding artifacts belong in the portable skill bundle

### Documentation Boundaries

- Repo docs may reference repo-maintenance commands such as `npm run skill:sync` and `npm run skill:verify`.
- Skill docs must stay portable and describe only commands that work from the shipped skill bundle.
- Manual testing docs should point only at testing inputs and helpers that exist on disk.

## Implementation Checklist

- [x] 1.0 Keep the command surface truthful
  - [x] 1.1 Document only current `package.json` commands.
  - [x] 1.2 Remove references to missing scenario maps and retired onboarding paths.
  - [x] 1.3 Keep `dev:*` helpers clearly documented as optional local samples, not QA lanes.

- [x] 2.0 Keep QA and artifact docs aligned
  - [x] 2.1 Keep the normalized `qa.json` contract documented consistently across repo and skill docs.
  - [x] 2.2 Keep output-path guidance aligned with caller-root execution and topic-based default deck naming.
  - [x] 2.3 Keep manual testing docs anchored to the actual generated data directories.

- [x] 3.0 Keep the skill bundle maintenance story clean
  - [x] 3.1 Preserve `skill:sync`, `skill:verify`, and `skill:smoke` as the parent-repo distribution surface.
  - [x] 3.2 Keep skill-facing references portable and aligned to the shipped references set.

- [x] 4.0 Keep onboarding boundary truthful
  - [x] 4.1 Document repo-only layout onboarding as supported now that the end-to-end workflow exists.
  - [x] 4.2 Keep portable-skill sync and later bundle publication clearly outside the onboarding workflow.

- [x] 5.0 Verify this doc refresh against the repo
  - [x] 5.1 Audit `package.json` against the on-disk `scripts/` surface.
  - [x] 5.2 Audit README, AGENTS, testing docs, and skill references against files that exist today.

## Final Verification Results

Completed on 2026-03-06:

- Reviewed `package.json` script inventory against `scripts/`
- Reviewed `README.md` documentation map against on-disk docs
- Reviewed `AGENTS.md` against the current `skills/kpmg-slides/references/` set
- Reviewed `testing/README.md` and `testing/manual-test-plan.md` against the actual testing data helpers and directories

## Acceptance Criteria For This Plan

This plan is considered fulfilled when all of the following remain true:

1. Every documented public command exists and is runnable from the repo surface it is documented for.
2. Repo docs describe layout onboarding truthfully as a parent-repo workflow and do not imply that draft onboarding assets belong in the portable skill.
3. No testing doc points at missing support files.
4. Repo-facing docs and skill-facing docs stay clear about their different execution environments.

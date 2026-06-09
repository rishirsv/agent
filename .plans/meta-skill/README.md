# Meta Skill Planning Package

This folder holds the executable implementation plans produced from the Meta
Skill architecture/work-tracker assist review. The plans are repo-owned
planning artifacts; they are not plugin runtime payload and should not be
synced into generated plugin packages.

## Synthesis

The App Server/Python runner foundation is in good shape. The next development
cycle should be consolidation and measurement, not new platform. The highest
value path is:

1. clean up shipped language and stale maintainer docs that can mislead agents;
2. make existing run evidence readable through a deterministic report;
3. add no-skill baseline comparison so skill impact is measurable;
4. encode missing evaluation methodology in `skill-evaluator`;
5. dogfood the router and writer lanes with seed suites;
6. add deterministic draft-eval scaffolding and package readiness gates;
7. add `skill-autoresearch` last as a guidance-only lane that composes the
   existing CLI and stops at recommendation.

The rejected direction is broader platform work: registry, SaaS, dashboard,
daemon, database, generic thread manager, concurrency, permission-profile
machinery, or autonomous apply/publish/sync behavior before the evidence loop
is readable and proven.

## True North Goals

| Lane | True North |
|---|---|
| `meta-skill` | Skinny lifecycle router and orchestrator for skill-related work; it routes to workers and does not do worker jobs inline. |
| `skill-writer` | Convert recurring workflows, source packs, threads, or fuzzy skill ideas into portable, reusable, well-triggered skill payloads. |
| `skill-doctor` | Improve existing skills through evidence-backed review or diagnosis, proposing scoped edits only after human approval. |
| `skill-evaluator` | Encode evaluation craft for skills and artifacts: suites, visible/hidden boundaries, calibration, validators, candidate measurement, coverage limits, and gated outcomes. |
| `skill-autoresearch` | Future lane: with an existing eval suite and permission, generate isolated candidate attempts, measure train/dev/held-out impact, and recommend a gated winner without applying changes. |

## Accepted Constraints

- Meta Skill remains local-first and file-backed.
- App Server is for eval trial execution, judge grading, and evidence capture,
  not generic Desktop thread management.
- The CLI is an agent-facing command layer; `.meta-skill/` files are the source
  of truth.
- Prefer Markdown/JSON reports and deterministic fixtures before UI.
- Every feature must improve authoring quality, review quality, eval quality,
  candidate comparison, lifecycle reporting, or readiness decisions.
- Review, eval, and autoresearch may recommend; mutation requires explicit
  human approval.
- Generated evals and model grades are scaffolding/evidence, not proof unless
  calibrated or validated.
- Human grade rows in `grades.jsonl` must not be overwritten by re-grading.
- Maintainer docs under `meta-skill/.meta-skill/docs/` must be reconciled or
  deleted when superseded.
- Generated plugin mirrors are not source.
- Optimize for the smallest system that reliably improves skill quality over
  repeated use.

## Plan Index

| Order | Plan | Scope |
|---|---|---|
| 1 | [lane-hygiene-pass.md](lane-hygiene-pass.md) | Remove shipped draft markers, TODOs, stale `context.md`, CLI doc drift, runner naming confusion, and unused grader defaults. |
| 2 | [eval-report-command.md](eval-report-command.md) | Add read-only `eval list` / `eval report` over existing run evidence. |
| 3 | [evaluator-methodology-references.md](evaluator-methodology-references.md) | Add the missing evaluation methodology layer without changing code. |
| 4 | [baseline-impact-comparison.md](baseline-impact-comparison.md) | Add a no-skill baseline candidate and impact categories. |
| 5 | [seed-lane-evals.md](seed-lane-evals.md) | Build small dogfood suites for router routing and writer interview behavior. |
| 6 | [eval-generate-draft-scaffolds.md](eval-generate-draft-scaffolds.md) | Add deterministic, labeled starter-eval generation. |
| 7 | [package-readiness-check.md](package-readiness-check.md) | Add local readiness gates over existing validation/review/eval evidence. |
| 8 | [skill-autoresearch-v1-lane.md](skill-autoresearch-v1-lane.md) | Add a guidance-only future worker lane for bounded candidate improvement loops. |

## Local Verification Before Adoption

- Run `python3 meta-skill/src/characterize_meta_skill.py` and
  `scripts/meta-skill doctor --json` before adopting implementation claims.
- Confirm `meta-skill/.meta-skill/docs/context.md` is truly superseded before
  deletion.
- Reconcile the tracker reference to
  `.plans/meta-skill-minimal-eval-generate-exec-plan.md`; that file was cited
  but is not currently present in this repo.
- If skill payload files under `meta-skill/skills/` are edited later, review
  changed skill files directly, run deterministic validation, then run
  `scripts/sync-plugins.sh` before committing.

# Meta Skill Work Tracker

Use this tracker to keep the Meta Skill plugin roadmap centered on evaluation
truth. Current source lives under `meta-skill/`: the Python CLI is
`meta-skill/src/meta_skill/`, the active lanes are `skill-writer`,
`skill-doctor`, and `skill-evaluator`, and generated plugin package copies are
not source.

Current CLI surface:

```text
scripts/meta-skill doctor
scripts/meta-skill workbench init
scripts/meta-skill eval materialize
scripts/meta-skill eval run
scripts/meta-skill eval progress
scripts/meta-skill eval grade
scripts/meta-skill validate
scripts/meta-skill package
```

## Current Planning Package

The current repo-owned implementation package lives under
`.plans/meta-skill/`. It was synthesized from an external architecture,
work-tracker, roadmap, and skill-language review. Treat those plans as the
current incremental roadmap until the tracker is explicitly revised again.

Core conclusion: the App Server/Python runner foundation is healthy enough; the
next cycle should consolidate the evidence loop instead of building a broader
platform. Prioritize shipped-language hygiene, readable eval reporting,
baseline-vs-candidate impact, evaluator methodology, dogfood suites, readiness
gates, and only then a guidance-only `skill-autoresearch` lane.

Accepted constraints:

- Meta Skill remains local-first and file-backed.
- App Server is for eval trial execution, judge grading, and evidence capture,
  not generic Desktop thread management.
- The CLI is an agent-facing command layer; `.meta-skill/` files are the source
  of truth.
- Prefer Markdown/JSON reports and deterministic fixtures before UI.
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

### Executable Plan Index

| Order | Plan | Scope |
|---|---|---|
| 1 | `.plans/meta-skill/lane-hygiene-pass.md` | Fix shipped draft markers, TODOs, stale `context.md`, CLI doc drift, runner naming confusion, and unused grader defaults. |
| 2 | `.plans/meta-skill/eval-report-command.md` | Merge "eval viewing" and "lifecycle report" into read-only `eval list` / `eval report`. |
| 3 | `.plans/meta-skill/evaluator-methodology-references.md` | Add evaluation methodology: splits, variance, taxonomy, scaffold-vs-proof, baseline thinking, uncertainty, and when not to evaluate. |
| 4 | `.plans/meta-skill/baseline-impact-comparison.md` | Add a no-skill baseline candidate and per-case impact categories. |
| 5 | `.plans/meta-skill/seed-lane-evals.md` | Add router and writer dogfood cases for routing and interview behavior. |
| 6 | `.plans/meta-skill/eval-generate-draft-scaffolds.md` | Add deterministic, labeled starter eval generation. |
| 7 | `.plans/meta-skill/package-readiness-check.md` | Add local package/readiness gates over existing evidence. |
| 8 | `.plans/meta-skill/skill-autoresearch-v1-lane.md` | Add a guidance-only `skill-autoresearch` worker lane that stops at recommendation. |

### Tracker Reconciliation

- Merge "Upgrade Eval Viewing" and "Polish The Skill Lifecycle Report" into
  `eval-report-command.md`; they are one renderer over the same run evidence.
- Promote the hygiene/doc-drift pass; it was missing from the tracker and
  should happen before deeper feature work.
- Treat "Deepen `skill-doctor` Review" as ongoing quality polish after the
  hygiene pass, not a standalone feature build.
- Keep "Skillify Session Mining" deferred until draft eval generation and
  reporting are stable.
- Keep inventory, staleness, security-lite, thread-management, concurrency,
  and broad platform surfaces deferred.
- Reconcile the tracker reference to
  `.plans/meta-skill-minimal-eval-generate-exec-plan.md`; that file is cited
  below but is not present in this repo.
- Track failure reproduction guidance as a doctor quality polish item: triggering
  failures should use natural prompts in clean child threads, while behavior
  failures should force invocation with the failing input.
- Graduate recurring deterministic failure checks into shared
  `meta-skill/src/` validation instead of creating worker-local script folders.

### Seed Evals For Skill Writer Routing And Interview

- Recommendation: Worth exploring
- Evidence: `skill-writer` now owns new-skill authoring, but routing, source
  intake, and conversation-to-skill behavior still need executable cases.
- Where: a workbench beside the target skill project, using
  `meta-skill/skills/skill-writer/` as source evidence.
- Finding: The new authoring behavior is unverified by executable evals.
- Suggested improvement: Add evals for capture-from-conversation extraction, implicit bypass when context already answers the required set, and the skill-or-not stop gate.
- Verification: `scripts/meta-skill workbench init`, then
  `scripts/meta-skill eval materialize`, `eval run`, and `eval grade` against
  skill-writer cases.

### Make Skillify Executable Session Mining

- Recommendation: Later
- Evidence: Session-capture and source-distillation guidance exists in
  `meta-skill/skills/skill-writer/references/`, but no tool reads real sessions,
  classifies lessons, and emits a Skillify Brief or seed evals.
- Where: a future `meta-skill` path over Codex session JSONL.
- Finding: The current workflow is guidance-only; session mining remains manual.
- Suggested improvement: Only after review and eval-view loops exist, consider a deterministic session reader that produces a Skillify Brief and draft evals. Overlaps with "Generate Draft Starter Evals."
- Verification: Fixture session JSONL produces a deterministic brief and draft evals.

## ROADMAP

These roadmap items should track the current Python implementation, not the
historical TypeScript surface. Keep Meta Skill local and evidence-first; do not
copy external package-manager or public-registry behavior wholesale. The useful
product shape is clear quality review, impact comparison, generated starter
scenarios, readable eval views, and package/readiness gates.

### Deepen `skill-doctor` Review

- Recommendation: Strong.
- Evidence: Public skill reviews split quality into validation checks plus LLM-judged discovery/activation and implementation scores, with per-vector reasoning and recommendations.
- Where: `meta-skill/skills/skill-doctor/`, especially
  `references/rubric.md`, plus `meta-skill/src/meta_skill/validation.py` and
  `.meta-skill/review.md`.
- Finding: Meta Skill does not expose a `meta-skill review` CLI command. Review
  is currently a `skill-doctor` workflow that writes a scored Quality page, and
  deterministic validation is delegated to `scripts/meta-skill validate`.
- Suggested improvement: Keep the single `.meta-skill/review.md` artifact and make the review lane better at filling Discovery, Implementation, Quality Score, and combined findings without fabricating judge evidence.
- Verification: Add focused fixtures around review rendering guidance and
  deterministic validation. Run `scripts/meta-skill validate <skill-dir>`,
  `python3 meta-skill/src/characterize_meta_skill.py`, and `git diff --check`.

### Upgrade Eval Viewing Before Adding More Eval Modes

- Recommendation: Strong.
- Evidence: Public registry pages make quality, impact, evals, security/advisory, and files legible in one view; current Meta Skill run output is terse and file-first.
- Where: `meta-skill/src/meta_skill/cli.py`,
  `meta-skill/src/meta_skill/runner.py`,
  `meta-skill/src/meta_skill/grading.py`, and a future eval-view/report module.
- Finding: Meta Skill has suite manifests, materialized cases, run files,
  progress, final outputs, App Server events, token usage, and grades, but no
  first-class eval viewer. Users still need manual file drilling.
- Suggested improvement: Add `meta-skill eval list <project>` and `meta-skill eval view <project> [--run <id>|--last] [--json]`. Show run status, eval status, missing checks, execution errors, final answer previews, turn-evidence links, token totals/availability, tests, review artifacts, human decisions, and manual-review flags.
- Verification: Add fixture runs for clean, failed, no-verdict, missing-check, token-unavailable, and turn-evidence-rich evals. Verify Markdown/JSON output remains deterministic.

### Polish The Skill Lifecycle Report

- Recommendation: Strong.
- Evidence: The isolated App Server runner dogfood proved the end-to-end loop, but the useful story was spread across review files, run directories, grade JSON, judge traces, and a hand-authored E2E report.
- Where: `meta-skill/src/meta_skill/runner.py`, `meta-skill/src/meta_skill/grading.py`, `meta-skill/src/meta_skill/workbench.py`, future lifecycle report rendering, and `.meta-skill/report.md`.
- Finding: The workflow can now create, review, run, grade, revise, and compare skills, but the user experience still feels like a harness. Review scores, runner completion, rubric grades, validator results, feedback, and candidate comparison are separate artifacts with overlapping score language.
- Suggested improvement: Add a first-class lifecycle report that leads with the human decision: which candidate won, what failed, what improved, and what to do next. Keep raw artifacts linked, but separate runner completion from behavioral grades, connect failed evals back to review findings, standardize feedback paths, normalize temp paths, and make baseline-vs-revised comparison a table instead of a manual JSON read.
- Verification: Use the quick exact-token and hefty release-note dogfood fixtures to assert deterministic Markdown/JSON report output, distinct status labels, linked review/eval evidence, and a clear winner/recommended-next-action section.

### Make Baseline-Vs-Candidate Impact First-Class

- Recommendation: Strong.
- Evidence: The strongest external eval concept is impact: compare task performance with and without skill context. Meta Skill can run working-payload or no-skill executions today, but only one source per run.
- Where: `meta-skill/src/meta_skill/manifest.py`,
  `meta-skill/src/meta_skill/candidates.py`,
  `meta-skill/src/meta_skill/runner.py`,
  `meta-skill/src/meta_skill/grading.py`, run artifacts, eval-view rendering,
  and `meta-skill/skills/skill-evaluator/`.
- Finding: Candidate-scoped runs exist, but users still do manual score
  comparison across candidates and no-skill or prior-skill baselines.
- Suggested improvement: Add a future `scripts/meta-skill eval compare --run <id>`
  or `eval run --compare baseline`. Store baseline and candidate evidence per
  eval, never pool token usage, and report evals as candidate improves,
  candidate regresses, both fail, baseline already succeeds, or requires human
  review.
- Verification: Add fake-runner tests for baseline/candidate eval execution, source-specific evidence, unavailable source evidence, no pooled tokens, and report status categories.

### Generate Draft Starter Evals

- Recommendation: Strong.
- Evidence: Public registry workflows support scenario generation; Meta Skill already has a separate minimal eval-generation plan, but the tracker should keep this product gap visible in the main roadmap.
- Where: `.plans/meta-skill-minimal-eval-generate-exec-plan.md`,
  `meta-skill/src/meta_skill/workbench.py`,
  `meta-skill/src/meta_skill/manifest.py`, `meta-skill/src/meta_skill/cli.py`,
  and `meta-skill/skills/skill-evaluator/`.
- Finding: New skill projects still start with empty eval coverage unless the user hand-authors evals.
- Suggested improvement: Add deterministic `meta-skill eval generate <project> --count <n> --strategy merge|replace` that creates draft starter evals from the skill description and body. Generated evals must be labeled manual-review scaffolds and must not become release proof until tests, judges, feedback, or human decisions resolve them.
- Verification: Use generator-owned metadata to protect hand-authored evals, test merge/replace/dry-run/JSON output, and run lint compatibility checks on generated evals.

### Connect Review To Evidence-Backed Improve

- Recommendation: Strong after `review` exists.
- Evidence: External review tooling exposes optimize-style flows, but Meta Skill should keep the more careful "improve" language and human-gated edit semantics.
- Where: `meta-skill/skills/skill-doctor/`, future review artifacts, a future
  improve/decision module if the CLI grows one, and candidate run artifacts.
- Finding: Meta Skill does not yet have a tight chain from review findings to scoped edit proposals to validation.
- Suggested improvement: Add an improve flow that can read a review ID or run/case evidence, propose bounded source edits, rerun relevant lint/evals, and require human approval before package, publish, install, sync, or accept decisions. Keep `review` read-only.
- Verification: Add tests that review evidence can be referenced by improve and decision artifacts and that improve mode refuses to edit without explicit edit intent.

### Add Publish / Package Readiness Gates Instead Of A Registry

- Recommendation: Worth exploring.
- Evidence: External publish paths bundle skills, run automatic review/evaluation, version the package, and surface registry quality. Meta Skill should not become a registry, but it can provide local readiness gates.
- Where: `meta-skill/src/meta_skill/packaging.py`,
  `meta-skill/src/meta_skill/validation.py`, future review/eval summaries, and
  package docs.
- Finding: `package` validates and packages the portable payload, but it does not yet answer whether the skill is ready to share.
- Suggested improvement: Add `meta-skill package --check` or `meta-skill publish-readiness <project>` that verifies lint clean, review present and above configured threshold, baseline eval evidence exists when required, no unresolved execution failures, package excludes `.meta-skill/`, runtime resource links are intact, and human decisions are recorded for accepted changes.
- Verification: Add readiness fixtures for missing review, stale eval, unresolved failures, clean package, and package exclusion behavior.

### Add Skill Inventory, Staleness, And Security-Lite Later

- Recommendation: Later.
- Evidence: Registry and related skill-insights surfaces show quality, impact, security/advisory, files, versioning, staleness, and duplicate/registry-search signals across skill sets.
- Where: future inventory command over local skill roots, package metadata, git history, lint/review summaries, and resource link validation.
- Finding: Once individual skill review/eval loops work, a multi-skill owner needs to know which skills are stale, duplicate, low quality, broken, or missing evidence.
- Suggested improvement: Add `meta-skill inventory <root>` and `meta-skill stale <root>` later. Start deterministic: git last touched, broken runtime links, missing review/eval evidence, package metadata, duplicate trigger risk, and security-lite warnings for risky scripts or external-action gates.
- Verification: Use a local fixture inventory with multiple skills, broken references, old git timestamps, duplicate triggers, and scripts requiring gates.

## Completed Items

- The active Meta Skill CLI is Python-backed and lives under
  `meta-skill/src/meta_skill/`.
- The supported command surface is `doctor`, `workbench init`,
  `eval materialize`, `eval run`, `eval progress`, `eval grade`, `validate`,
  and `package`.
- `skill-doctor` owns review and improvement workflow guidance. It writes a
  single `.meta-skill/review.md` Quality page; there is no
  `.meta-skill/reviews/` namespace and no current `meta-skill review`
  subcommand.
- `skill-writer` owns new-skill authoring. Historical `skill-create` naming is
  superseded.
- `skill-evaluator` owns systematic measurement. Historical `skill-eval` naming
  is superseded.
- The compact workbench shape is `.meta-skill/evals.json`,
  `.meta-skill/cases/<case-id>/`, and `.meta-skill/runs/<run-id>/`.
- The App Server runner records events, outputs, progress, results, and grades
  through the Python runner and grading modules.
- Rubric/model grades and deterministic validator grades are written by
  `scripts/meta-skill eval grade`.
- Historical TypeScript implementation notes, old PR numbers, and old lane
  names are superseded context rather than active roadmap coordinates.

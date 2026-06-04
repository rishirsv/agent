# Add Meta Skill Unified Reporting

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

## Purpose / Big Picture

Meta Skill currently creates useful evidence at several lifecycle stages: `lint` validates structure, `review` writes a quality review, `eval run` writes behavior evidence and HTML, `eval list` summarizes saved runs, `release` writes release metadata, and `package` writes package metadata. The evidence is useful, but the read path is fragmented. A user or agent who asks "what is the state of this skill?", "is it ready to release?", or "what evidence should I inspect next?" must mentally join several files and commands.

After this change, Meta Skill has one preferred, stage-agnostic read path:

    meta-skill report <project>
    meta-skill report <project> --json
    meta-skill report <project> --view status|eval|full
    meta-skill report <project> --run <run-id>

This is intentionally a lean v1. It adds a unified read path and makes that path the recommended way for agents to inspect state. It does not remove or rewrite existing compatibility surfaces such as `eval open`, `eval list`, `eval view`, or `review` output in the first implementation. Real consolidation can follow once the new read path proves stable.

The report command reads existing local evidence and builds one flat project report model. The default human output is a concise Markdown-style status view with the relevant slices of the full report. JSON exposes the full model for agents and future app surfaces. There is no new HTML renderer in v1; existing eval `report.html` remains owned by `eval open`.

The observable outcome is simple: after implementation, a user can run `node scripts/meta-skill.js report <fixture-skill>` and see one answer with current readiness, latest lint/review/eval/release evidence, blockers, unresolved work, and the next useful command. The command must be fast by default and must not run App Server, eval scenarios, judges, promotion, release, or package steps unless the user invokes those existing commands separately.

## Progress

- [x] (2026-06-02 23:20Z) PR #19 merged the Meta Skill package reshape, so this plan targets the root package layout under `plugins/meta-skill/src/` and `plugins/meta-skill/scripts/meta-skill.js`.
- [x] (2026-06-02 23:30Z) Reviewed the prior chat-first router draft and the code review comments. The prior design duplicated the `AGENTS.md` orchestrator and overfit a CLI-side natural-language router.
- [x] (2026-06-02 23:50Z) Reframed the feature as one unified reporting path that is agnostic of lifecycle stage and dynamically renders the relevant view.
- [x] (2026-06-02 23:55Z) Inspected current report producers: `plugins/meta-skill/src/lint.ts`, `plugins/meta-skill/src/review.ts`, `plugins/meta-skill/src/report.ts`, `plugins/meta-skill/src/eval/runs.ts`, `plugins/meta-skill/src/versions.ts`, and `plugins/meta-skill/src/package.ts`.
- [x] (2026-06-03 00:35Z) Addressed review feedback that the original plan over-engineered v1 by adding too many views, a `views` submodel, a second HTML path, a normalized finding taxonomy, and claims of consolidation before old surfaces were actually removed.
- [ ] Add a flat report model in `plugins/meta-skill/src/report-model.ts` that embeds or references existing evidence shapes.
- [ ] Add a report builder that gathers existing evidence without executing lifecycle work.
- [ ] Add Markdown rendering for `status`, `eval`, and `full` views.
- [ ] Add `meta-skill report` to the command dispatcher with `--run`, `--view`, and `--json`.
- [ ] Update Meta Skill skill guidance so agents use `meta-skill report --json` as the default state read before answering broad status, eval, review, improvement, release, or next-step questions.
- [ ] Add focused tests that prove the report is stage-agnostic, fast, read-only, and safe.
- [ ] Validate with `npm test`, `npm run typecheck`, CLI smoke commands, and `git diff --check`.

## Surprises & Discoveries

- Observation: The prior router plan duplicated existing routing. `plugins/meta-skill/AGENTS.md` already tells the agent to understand user intent, route to the right lane, and translate requests into next commands. The CLI is better used for deterministic state reporting than for phrase-map intent classification.
  Evidence: The pasted review notes that `AGENTS.md` already owns natural-language routing and every lifecycle command already prints a `next step:` line.

- Observation: Meta Skill already has one strong normalized eval report, but only for run evidence. `writeEvalReport` builds `report.json`, `report.html`, and `.meta-skill/evals/runs/index.json` from saved run files. That shape should become one slice of a larger project report, but the old HTML should remain in place for v1.
  Evidence: `plugins/meta-skill/src/report.ts` defines `writeEvalReport`, `buildRunReport`, `renderEvalReportHtml`, and `updateRunsIndex`.

- Observation: `review` already writes a structured `review.json` and a Markdown `report.md`, but it is separate from eval readiness and release metadata. The unified report should read the latest review evidence and present it inside the status/full views. A first-class `review` view is deferred.
  Evidence: `plugins/meta-skill/src/review.ts` writes `.meta-skill/reviews/<review-id>/lint.json`, `review.json`, and `report.md`.

- Observation: `lint` returns a useful `LintReport` but has no saved project-level report unless it is attached to review or eval evidence. The unified report can run lint by default because it is local and deterministic, but the read-only guarantee depends on calling `lintProject(project, { executeTests: false })` without a `runId`.
  Evidence: `plugins/meta-skill/src/lint.ts` exposes `lintProject(target, options)` and `formatLintReport(report)`. The `runId` path can write eval test evidence, so the builder must avoid that path.

- Observation: Release metadata already captures source-run readiness and payload digests when release is called with `--from-run`. The unified report should surface whether a release snapshot exists, what run it cites, and whether a newer run exists. It should not call the release "bad" merely because a newer experimental run exists.
  Evidence: `plugins/meta-skill/src/versions.ts` writes `.meta-skill/versions/release/version.json` with `source_run_id`, `readiness_summary`, `payload_digest`, and `file_digests`.

- Observation: The original model both precomputed `views` and also passed a whole report plus `view` selector to the renderer. That duplicates responsibility and creates drift. The model should stay flat; the renderer should slice it.
  Evidence: The original JSON example omitted `views`, which confirmed the `views` subobject was not part of the essential report contract.

- Observation: Codex App Server should remain an evidence producer, not a default report dependency. App Server is valuable for eval runs and judges, but the report command should be fast by reading saved files. Optional future semantic synthesis can use App Server only when explicitly requested.
  Evidence: `plugins/meta-skill/src/eval/run.ts` owns App Server-backed scenario execution; `plugins/meta-skill/src/report.ts` can summarize saved evidence without starting App Server.

## Decision Log

- Decision: Build `meta-skill report` before building any new `start` or chat-first router command.
  Rationale: The desired UX is a report that dynamically exposes the relevant parts of the full state. Once `report` has `summary.next_action`, a future "what next" command can be a thin alias over the status view instead of a separate routing product.
  Date/Author: 2026-06-02 / Codex

- Decision: Treat v1 as a unified read path, not as completed report-surface consolidation.
  Rationale: Keeping `eval open`, `eval list`, `eval view`, and `review` output intact is the right compatibility move, but it means fragmentation is not reduced yet. The honest v1 promise is one preferred read path plus guidance that points agents there.
  Date/Author: 2026-06-03 / Codex

- Decision: Keep evidence-producing commands separate from report rendering.
  Rationale: `lint`, `review`, `eval run`, `eval judge`, `eval feedback import`, `release`, and `package` create or modify evidence. `report` reads and renders evidence. This separation keeps the default report fast, safe, and repeatable.
  Date/Author: 2026-06-02 / Codex

- Decision: Use one flat report model with no precomputed `views` subobject.
  Rationale: The model should contain project state, summary, existing evidence, readiness, and next action. `--view` is a renderer concern. Removing `views` avoids duplicating `summary`, `readiness`, `next_action`, and evidence projections.
  Date/Author: 2026-06-03 / Codex

- Decision: Reuse or embed existing evidence shapes instead of renormalizing them.
  Rationale: `RunReport`, `RunIndexRow`, `review.json`, and `version.json` already carry the important facts. Recreating them as parallel `ReportEvidence` and `ReportReadiness` hierarchies invites drift. Thin projections are allowed only where the report needs a smaller stable wrapper.
  Date/Author: 2026-06-03 / Codex

- Decision: Do not add a cross-stage `ReportFinding` taxonomy in v1.
  Rationale: The first renderer only needs to show lint failures/warnings and eval unresolved items in a Findings section. A typed taxonomy can wait until more than one consumer needs it.
  Date/Author: 2026-06-03 / Codex

- Decision: Default output is human-readable Markdown-style text, and `--json` emits the full flat model. No new HTML renderer or `--output` flag ships in v1.
  Rationale: JSON plus Markdown cover the agent-read and human-read cases that motivate the feature. A second HTML path would add the most work while leaving the existing eval HTML surface in place.
  Date/Author: 2026-06-03 / Codex

- Decision: Limit first-class views to `status`, `eval`, and `full`.
  Rationale: `status` answers "what next?" and `eval` drills into the highest-value evidence. Review and release can appear as sections inside `status` or `full` before becoming dedicated views.
  Date/Author: 2026-06-03 / Codex

- Decision: App Server usage is explicit and optional.
  Rationale: The user wants iterative looping as quickly as possible and reduced runtime. Default report generation should not perform model calls or start an App Server. Existing eval and judge commands can refresh evidence when deeper judgment is needed.
  Date/Author: 2026-06-02 / Codex

## Outcomes & Retrospective

No implementation has happened yet. When implementation completes, record what the unified read path replaced in agent behavior, which old surfaces remain for compatibility, whether runtime improved, and what remains separate by design. Compare the final behavior against this v1 goal: one preferred read path, existing evidence sources, three useful views, and fast local iteration.

## Context and Orientation

Meta Skill is a Codex plugin under `plugins/meta-skill/`. Its CLI is written in TypeScript. Source files live and run directly in `plugins/meta-skill/src/`; `plugins/meta-skill/scripts/meta-skill.js` imports `src/main.ts`. The package root is `plugins/meta-skill/`.

A portable skill project is a directory containing `SKILL.md`. A maintained skill project can also contain `.meta-skill/`, the hidden workbench that stores authoring and evidence state. Important workbench folders are:

    .meta-skill/evals/
    .meta-skill/evals/runs/
    .meta-skill/reviews/
    .meta-skill/plans/
    .meta-skill/sessions/
    .meta-skill/versions/release/
    .meta-skill/tests/

Existing evidence producers are:

    meta-skill lint <project>
    meta-skill review <project>
    meta-skill eval run <project>
    meta-skill eval judge <project> ...
    meta-skill eval feedback import <project> ...
    meta-skill release <project>
    meta-skill package <project>

Existing report-like outputs are:

    formatLintReport(report) in plugins/meta-skill/src/lint.ts
    writeReviewReport(reviewRoot, review) in plugins/meta-skill/src/report.ts
    writeEvalReport(runRoot) in plugins/meta-skill/src/report.ts
    renderEvalReportHtml(report) in plugins/meta-skill/src/report.ts
    eval open/list/view in plugins/meta-skill/src/eval/runs.ts

The new design adds one preferred read path while preserving the existing commands as evidence producers and compatibility surfaces.

Define these terms in implementation comments and user-facing docs where needed:

Flat report model: the single JSON object that represents current project state, latest evidence, readiness, and next action. It embeds existing evidence shapes where possible.

View: a human-readable renderer mode, such as `status`, `eval`, or `full`. A view is not a precomputed model subobject.

Evidence producer: a command that creates or updates facts, such as `eval run` or `review`.

Renderer: code that converts the flat model into Markdown text without changing evidence.

## Plan of Work

### Milestone 1 - Define the flat report model

Create `plugins/meta-skill/src/report-model.ts`. This file should define stable TypeScript interfaces for the project-level report. It should not read files or render output; it only owns data shape.

The top-level model should be flat:

    export interface MetaSkillReport {
      schema_version: 1;
      generated_at: string;
      project: ProjectReportState;
      summary: ReportSummary;
      evidence: ReportEvidence;
      readiness: ReportReadiness;
      next_action: ReportAction;
    }

Do not include a `views` subobject. Do not create `StatusView`, `EvalView`, `ReviewView`, or `ReleaseView` interfaces for v1. Do not create a cross-stage `ReportFinding` taxonomy.

`ProjectReportState` should include resolved project path, skill name, whether `SKILL.md` exists, whether `.meta-skill/` exists, and key workbench paths.

`ReportSummary` should include headline status, latest evidence IDs, and counts. It should be small enough to render the "At a Glance" section without recomputing.

`ReportReadiness` should reuse the existing `RunReport.readiness` shape where eval evidence exists:

    status: "ready" | "needs_review" | "blocked" | "unknown"
    summary
    blockers
    unresolved
    basis

If there is no eval evidence, the builder can synthesize the same readiness shape from project/lint/review state.

`ReportEvidence` should embed existing evidence where possible:

    lint?: {
      status: "passed" | "failed" | "unknown";
      report?: LintReport;
    }
    latest_review?: {
      review_id: string;
      review_path: string;
      report_md_path?: string;
      review: unknown;
    }
    latest_eval_run?: {
      run_id: string;
      run_root: string;
      report_path?: string;
      html_path?: string;
      report?: RunReport;
    }
    runs: RunIndexRow[];
    release?: {
      exists: boolean;
      version_path?: string;
      version?: unknown;
      source_run_id?: string;
      payload_digest?: string;
      newer_run_exists?: boolean;
      freshness_note?: string;
    }
    plans?: Array<{ plan_id: string; status?: string; path: string }>
    sessions?: Array<{ session_id: string; status?: string; path: string }>

Use concrete imported types for `LintReport`, `RunReport`, and `RunIndexRow` once their source exports are confirmed. If a current type is not exported, export it from the source module rather than redefining a parallel structure. Use `unknown` for review/version payloads only until their source modules expose stable types.

`ReportAction` should include:

    label
    why
    command: string | null

This milestone is complete when `report-model.ts` compiles and the model can represent lint-only, review-only, eval-run, release-ready, and blocked states without requiring separate view shapes.

### Milestone 2 - Build the report from existing evidence

Create `plugins/meta-skill/src/report-builder.ts`. It should export:

    export interface BuildMetaSkillReportOptions {
      project: string;
      runId?: string;
      executeLint?: boolean;
    }

    export async function buildMetaSkillReport(options: BuildMetaSkillReportOptions): Promise<MetaSkillReport>

The builder is allowed to run `lintProject(project, { executeTests: false })` by default because lint is local and deterministic. It must never pass `runId` to `lintProject`; that path can append eval test evidence and refresh eval reports. Add a short code comment at the lint call site because the report command's read-only guarantee depends on it.

The builder must not run eval scenarios, judges, review creation, promotion, release, or package. If future performance requires it, callers can set `executeLint: false`; implement that option now if it is simple.

Use `projectPaths` from `plugins/meta-skill/src/project.ts` to locate workbench paths. If `SKILL.md` is missing, return a report with `project.has_skill: false`, readiness `blocked`, and next action pointing to `meta-skill create`; do not throw unless the path itself is invalid.

Read the latest review by sorting directories under `.meta-skill/reviews/` and reading `review.json` when present. Read the selected or latest eval run through existing report logic. If `--run <run-id>` is supplied, the eval slice must use that run. If no run is supplied, use the latest run from `.meta-skill/evals/runs/`.

For eval evidence, prefer existing `report.json`. If `report.json` is missing but `run.json` exists, do not silently ignore it. Either call `buildRunReport(runRoot)` and return an in-memory report without writing, or report that the run needs refresh and set next action to `meta-skill eval open <project> --run <run-id>`. Prefer the in-memory path if it is straightforward. Do not call `writeEvalReport` in the default report builder.

Read `.meta-skill/evals/runs/index.json` when present; if absent, derive a minimal run list from run folders. Read release metadata from `.meta-skill/versions/release/version.json`. If a release cites a run older than the latest run, set `newer_run_exists: true` and word the freshness note as "A newer run exists." Do not label the release invalid or stale solely because a newer experimental run exists.

Render-time Findings should be derived directly from evidence:

    lint failures
    lint warnings
    eval readiness blockers
    eval readiness unresolved items
    missing or refresh-needed eval report
    release has newer run available

Do not normalize those into a dedicated `ReportFinding` interface in v1.

Compute readiness in one place. Readiness should be:

    blocked: missing SKILL.md, lint failures, eval failure classifications, eval readiness.status === "blocked", release requested but latest evidence blocked
    needs_review: lint warnings, latest eval run needs_review, no eval evidence for release questions, manual review required, newer run exists after release
    ready: lint passes, latest eval readiness ready when eval evidence exists, no blockers or unresolved items
    unknown: insufficient state to classify

Compute `next_action` from readiness and evidence:

    missing skill -> create skill
    missing workbench -> project init
    lint failures -> fix lint failures, then lint again
    no eval manifest -> eval init
    no scenarios -> add scenarios and run lint
    no eval runs -> eval run
    latest eval missing report -> eval open --run
    latest eval needs_review -> eval open --run, or judge/feedback if the report has judgeable scenarios
    latest eval blocked -> inspect report and fix blockers
    ready and no release -> release --from-run
    release exists and no newer run -> package --source release

This milestone is complete when a unit test can construct fixture projects in temporary directories and get the correct `readiness.status`, derived findings text, and `next_action` without creating any new evidence files.

### Milestone 3 - Render Markdown and JSON views

Create `plugins/meta-skill/src/report-render.ts`. It should export:

    export type ReportView = "status" | "eval" | "full";

    export function renderReportMarkdown(report: MetaSkillReport, view: ReportView): string

There is no new HTML renderer in v1. Keep `renderEvalReportHtml` and `report.html` behavior under existing eval commands.

Default text should be Markdown-style plain text. It should be concise enough for the skill UX to quote directly. The default `status` view should look like:

    # Meta Skill Report: <skill-name>

    ## At a Glance
    - Readiness: needs_review
    - Latest eval run: 001-initial-candidate
    - Lint: passed with 1 warning
    - Review: 84%
    - Release: missing

    ## Recommended Next Step
    - Inspect latest eval evidence
    - Why: The latest run has unresolved scenarios, so it is useful evidence but not pass proof.
    - Command: `meta-skill report . --run 001-initial-candidate --view eval`

    ## Findings
    - Lint warning: Runtime script has no unit test entry.
    - Eval unresolved: 2 scenarios still need deterministic, judge, or human review.

    ## Evidence
    - Lint: no failures, 1 warning
    - Review: latest review available
    - Eval: latest run needs review
    - Release: no release snapshot

The `eval` view should show run status, readiness, scenario rows, token usage availability, tests, judges, feedback, artifacts, and evidence paths. It should rely on the embedded `RunReport`.

The `full` view should concatenate the major sections: status, lint details, review summary, eval details, release snapshot, plans/sessions if present, and evidence paths. Review and release get sections inside `full`; they are not first-class views in v1.

This milestone is complete when tests prove the same report model can render status Markdown, eval Markdown, and full Markdown without recomputing evidence.

### Milestone 4 - Add the `report` command

Update `plugins/meta-skill/src/commands.ts`. Add this help line:

    meta-skill report <project> [--run <run-id>] [--view status|eval|full] [--json]

Add a `case "report": return commandReport(rest);`.

`commandReport` should parse value flags `run` and `view`, plus boolean flag `json`. The default project positional is `"."`; default view is `status`. Reject unknown views with `CliError(..., 2)`.

Behavior:

    no flags -> print Markdown status view to stdout
    --view eval -> print Markdown eval view to stdout
    --view full -> print Markdown full view to stdout
    --json -> print full flat JSON model to stdout

If `--json` and `--view` are both supplied, prefer the simplest convention: `--json` still emits the full flat model and ignores the human view selector. Document this in help or command docs. Do not add `--format`, `--html`, or `--output` in v1.

This milestone is complete when these smoke commands work on a fixture skill:

    node scripts/meta-skill.js report /tmp/meta-skill-report-fixture
    node scripts/meta-skill.js report /tmp/meta-skill-report-fixture --json
    node scripts/meta-skill.js report /tmp/meta-skill-report-fixture --view eval --run 001-initial-candidate

### Milestone 5 - Keep compatibility surfaces, document the preferred read path

Do not delete or rewrite existing `eval open`, `eval list`, `eval view`, or `review` output in the first implementation. Instead:

1. Keep `meta-skill review` writing `.meta-skill/reviews/<review-id>/review.json` and `report.md`.
2. Keep `meta-skill eval open` refreshing `report.json`, `report.html`, and the runs index.
3. Keep `eval list` and `eval view` behavior for compatibility.
4. Add docs that `meta-skill report --view eval --run <run-id>` is the preferred unified read path for agents and users who want state, readiness, or next action.
5. Defer real output-surface consolidation until after users and tests exercise `meta-skill report`.

This milestone is complete when docs and tests prove compatibility: old commands still pass existing tests, and the new report command can show the same critical eval and review facts.

### Milestone 6 - Update skill UX guidance

Update `plugins/meta-skill/AGENTS.md` so agents use `meta-skill report <project> --json` as the default state read before answering broad questions like "what next?", "is this ready?", "what failed?", or "what evidence exists?". The orchestrator should still route user intent itself; the report command supplies state and evidence.

Update `plugins/meta-skill/skills/skill-eval/SKILL.md` so interpretation guidance prefers:

    meta-skill report . --view eval --run <run-id>

while still naming raw files for deep inspection. Update `plugins/meta-skill/skills/skill-improve/SKILL.md` so evidence-backed planning can cite the unified report plus the underlying run/review IDs. Update `plugins/meta-skill/skills/skill-create/references/cli-conventions.md` to list `meta-skill report`.

If any source skill files under `plugins/meta-skill/skills/` change, run native TypeScript validation. Do not hand-edit generated plugin mirrors under `plugins/codex/agent/` or `plugins/claude/agent/`.

This milestone is complete when the skill text teaches agents to excerpt relevant report views, not dump full report JSON or duplicate lifecycle reasoning.

### Milestone 7 - Tests and validation

Add tests near existing report/review/eval tests. A good split is:

    plugins/meta-skill/src/report-builder.test.ts
    plugins/meta-skill/src/report-render.test.ts
    plugins/meta-skill/src/commands.test.ts

Fixture coverage:

    portable-only skill -> readiness needs_review or unknown, next action project init
    skill with lint failure -> blocked, lint failure appears in rendered Findings
    skill with review only -> status/full includes review summary
    eval run ready -> readiness ready and release next action
    eval run needs_review -> readiness needs_review and no release recommendation
    eval run blocked -> readiness blocked and blockers surfaced
    release version citing latest ready run -> full view says release snapshot exists and package next action
    release version with newer run available -> full/status says a newer run exists, not that the release is bad
    --json returns parseable flat model
    existing `review`, `eval open`, `eval list`, and `eval view` tests still pass

Run validation from `plugins/meta-skill/`:

    npm test
    node scripts/meta-skill.js --help
    node scripts/meta-skill.js report <fixture-skill>
    node scripts/meta-skill.js report <fixture-skill> --json

Run from repository root:

    git diff --check

If source skill guidance changes and repository sync rules require it, run:

    scripts/sync-plugins.sh

This milestone is complete when all tests and typecheck pass, and `git diff --check` reports no whitespace errors.

## Concrete Steps

Work from the repository root:

    cd /Users/rishi/Code/agent

Inspect the current reporting code before editing:

    sed -n '1,260p' plugins/meta-skill/src/report.ts
    sed -n '1,220p' plugins/meta-skill/src/review.ts
    sed -n '1,180p' plugins/meta-skill/src/lint.ts
    sed -n '1,220p' plugins/meta-skill/src/eval/runs.ts
    sed -n '1,140p' plugins/meta-skill/src/versions.ts

Implement the model:

    plugins/meta-skill/src/report-model.ts

Implement the builder:

    plugins/meta-skill/src/report-builder.ts

Implement the Markdown renderer:

    plugins/meta-skill/src/report-render.ts

Patch the command dispatcher:

    plugins/meta-skill/src/commands.ts

Add tests:

    plugins/meta-skill/src/report-builder.test.ts
    plugins/meta-skill/src/report-render.test.ts
    plugins/meta-skill/src/commands.test.ts

Update docs and skill guidance:

    plugins/meta-skill/architecture.md
    plugins/meta-skill/AGENTS.md
    plugins/meta-skill/skills/skill-eval/SKILL.md
    plugins/meta-skill/skills/skill-improve/SKILL.md
    plugins/meta-skill/skills/skill-create/references/cli-conventions.md

Build and test:

    cd /Users/rishi/Code/agent/plugins/meta-skill
    npm test

Smoke the CLI on a real or temporary fixture skill:

    node scripts/meta-skill.js report /tmp/meta-skill-report-fixture
    node scripts/meta-skill.js report /tmp/meta-skill-report-fixture --json
    node scripts/meta-skill.js report /tmp/meta-skill-report-fixture --view eval --run 001-initial-candidate

Return to the repository root:

    cd /Users/rishi/Code/agent
    git diff --check

## Validation and Acceptance

The feature is accepted when `meta-skill report` can answer the following without requiring the user or agent to combine separate report surfaces:

On a portable-only skill with no workbench, `meta-skill report <project>` prints an at-a-glance state and recommends `meta-skill project init <project>`.

On a skill with lint failures, `meta-skill report <project>` marks readiness `blocked`, lists lint findings, and recommends fixing lint before eval or release.

On a skill with a latest eval run whose `report.json` says `readiness.status: "needs_review"`, `meta-skill report <project> --view status` does not recommend release. It recommends inspecting eval evidence, adding deterministic tests, running judges, or importing feedback depending on available evidence.

On a skill with a latest eval run whose `readiness.status` is `ready`, no manual review is required, and no blockers or unresolved items exist, `meta-skill report <project>` recommends `meta-skill release <project> --from-run <run-id>` when no release exists.

On a skill with a release snapshot that cites the latest known ready run, `meta-skill report <project> --view full` shows the release source run, payload digest, readiness basis, and recommends `meta-skill package <project> --source release`.

On a skill with a release snapshot and a newer run, `meta-skill report <project> --view full` says a newer run exists. It does not claim the release is invalid solely from that fact.

`meta-skill report <project> --json` emits one parseable flat JSON model with lint, review, eval, release, readiness, and next action.

Existing `meta-skill review`, `meta-skill eval open`, `meta-skill eval list`, and `meta-skill eval view` tests continue to pass.

`npm test` and `npm run typecheck` from `plugins/meta-skill/` pass.

`git diff --check` passes from the repository root.

## Idempotence and Recovery

The default report command is read-only. Re-running it should not change `.meta-skill/` evidence. It must not run App Server, eval scenarios, judges, promotion, release, or packaging by itself.

The lint read in the builder must call:

    lintProject(project, { executeTests: false })

and must not pass `runId`. Passing `runId` can trigger eval evidence writes, which would violate the report command's read-only contract.

If a report needs fresher eval evidence, it should recommend the existing evidence-producing command, such as:

    meta-skill eval open <project> --run <run-id>
    meta-skill eval judge <project> --run <run-id> ...
    meta-skill lint <project> --run <run-id>

If native TypeScript validation fails, run `npm test` and `npm run typecheck` from `plugins/meta-skill/` and fix `src/` directly.

If implementation touches generated plugin mirrors under `plugins/codex/agent/` or `plugins/claude/agent/`, stop and remove those generated edits unless a deliberate sync step was requested. The source of this feature is `plugins/meta-skill/`.

## Artifacts and Notes

The default report should feel like this:

    # Meta Skill Report: source-pack-triage

    ## At a Glance
    - Readiness: needs_review
    - Lint: passed with 1 warning
    - Latest review: 002-quality-review, 84%
    - Latest eval run: 003-initial-candidate, needs_review
    - Release: missing

    ## Recommended Next Step
    - Inspect latest eval evidence
    - Why: The latest run has 2 unresolved scenarios. `needs_review` is useful evidence, not pass proof.
    - Command: `meta-skill report . --view eval --run 003-initial-candidate`

    ## Findings
    - Lint warning: Runtime script has no unit test entry.
    - Eval unresolved: 2 scenarios still need deterministic, judge, or human review.

    ## Evidence
    - Lint: no failures, 1 warning
    - Review: 84%, suggestions available
    - Eval: 4 scenarios, 2 unresolved, token usage unavailable for 4 sides
    - Release: no release snapshot

The JSON model should feel like this:

    {
      "schema_version": 1,
      "generated_at": "2026-06-03T00:35:00.000Z",
      "project": {
        "path": "/tmp/source-pack-triage",
        "skill_name": "source-pack-triage",
        "has_skill": true,
        "has_workbench": true
      },
      "summary": {
        "status": "needs_review",
        "headline": "Latest eval run has unresolved scenarios."
      },
      "evidence": {
        "runs": []
      },
      "readiness": {
        "status": "needs_review",
        "summary": "Latest eval run has unresolved scenarios.",
        "blockers": [],
        "unresolved": ["003-initial-candidate:R1", "003-initial-candidate:F1"],
        "basis": ["eval"]
      },
      "next_action": {
        "label": "Inspect latest eval evidence",
        "why": "The latest run has unresolved scenarios.",
        "command": "meta-skill report . --view eval --run 003-initial-candidate"
      }
    }

The report command should make skill UX easier: the agent reads the full JSON and responds with the relevant Markdown slice. It should not paste the whole report unless the user asks for the full report.

## Interfaces and Dependencies

Use Node built-ins and existing Meta Skill modules only. Do not add package dependencies.

Create or update these files:

    plugins/meta-skill/src/report-model.ts
    plugins/meta-skill/src/report-builder.ts
    plugins/meta-skill/src/report-render.ts
    plugins/meta-skill/src/commands.ts
    plugins/meta-skill/src/report-builder.test.ts
    plugins/meta-skill/src/report-render.test.ts
    plugins/meta-skill/src/commands.test.ts
    plugins/meta-skill/architecture.md
    plugins/meta-skill/AGENTS.md
    plugins/meta-skill/skills/skill-eval/SKILL.md
    plugins/meta-skill/skills/skill-improve/SKILL.md
    plugins/meta-skill/skills/skill-create/references/cli-conventions.md

Keep or adapt these existing functions and types:

    lintProject in plugins/meta-skill/src/lint.ts
    formatLintReport in plugins/meta-skill/src/lint.ts
    buildRunReport in plugins/meta-skill/src/report.ts
    writeEvalReport in plugins/meta-skill/src/report.ts
    renderEvalReportHtml in plugins/meta-skill/src/report.ts
    writeReviewReport in plugins/meta-skill/src/report.ts
    listRunSummaries/openRun in plugins/meta-skill/src/evals.ts and src/eval/runs.ts
    RunReport and RunIndexRow from existing eval/report modules

The long-term direction is to let existing report-like commands become compatibility wrappers around the unified model. Do not force that migration in the first implementation.

Revision note: This ExecPlan replaces the earlier `start` next-step command plan and revises the first unified-reporting draft. The lean v1 reflects the user's desired design while addressing the over-engineering gaps: stage-agnostic read path, flat model, no precomputed view subobjects, no new HTML, only `status|eval|full` views, reused existing evidence shapes, direct findings rendering, and fast default iteration without unnecessary App Server runtime.

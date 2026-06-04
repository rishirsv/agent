# Implement Minimal Meta Skill Eval Scenario Generation

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

No repository-local `PLANS.md` contract was found during planning. This plan follows the ExecPlan contract from the local `improve-plan` skill and the repository rule that plan documents live under `.plans/`.

## Purpose / Big Picture

Meta Skill users can already run App Server-backed evals and inspect a per-run `report.html`, but a new skill project still starts with an empty `.meta-skill/evals/scenarios/` directory. After this change, `meta-skill eval generate <project>` creates a small starter set of valid scenario folders, so a user can immediately run `meta-skill eval run <project>` and inspect behavior evidence in `report.html`.

The generated scenarios are scaffolds for manual review. They are not pass/fail proof by themselves, because the current App Server runner force-attaches the staged skill and normal scenario execution returns `needs_review` until deterministic tests, judges, or human feedback resolve the evidence. This feature must make that limitation visible in CLI output, scenario metadata, docs, and tests.

The user-visible outcome is:

    meta-skill eval generate .
    meta-skill lint .
    meta-skill eval run .

The first command writes `R`, `F`, and `G` scenario folders. The second validates their shape. The third produces a report that can be inspected as forced-skill behavior evidence, not trigger-routing or no-skill uplift proof.

## Seed Response From The Planning Conversation

The seed idea given to subagents was:

Meta Skill now has a useful `report.html`, so the next missing piece is getting useful eval scenarios created automatically when a skill is created or improved. The current workflow has a gap:

    Create skill
    -> manually write eval scenarios
    -> eval run
    -> inspect report.html
    -> improve skill

Minimal scenario generation fills that manual authoring gap with a small, honest first version of `meta-skill eval generate`. The command already exists as a CLI slot but throws. Scenario folders already have a contract:

    .meta-skill/evals/scenarios/R1-basic-behavior/
      task.md
      scenario.json
      criteria.json
      turns.json      optional

The original proposal was to generate three starter scenarios: normal behavior, failure or boundary behavior, and a gate/missing-context scenario. It explicitly rejected native trigger-routing proof, no-skill uplift proof, artifact-writing proof, judge generation, and dashboard work. It framed the next feature as the bridge from "I wrote a skill" to "I have evidence about whether this skill behaves well when invoked."

Subagent critique kept the direction but tightened it: hard-cut `T` trigger from the active eval contract, state that generated scenarios are manual-review scaffolds, choose deterministic templates instead of hidden LLM generation, generate only source-supported requirements, and define collision and replacement rules before writing code.

## Progress

- [x] (2026-06-03) Inspected repo guidance. Plan documents belong under `.plans/`; generated plugin packages under `plugins/codex/agent/` and `plugins/claude/agent/` are not edit surfaces.
- [x] (2026-06-03) Inspected `plugins/meta-skill/src/commands.ts`; `commandEvalGenerate()` currently parses flags and throws.
- [x] (2026-06-03) Inspected scenario contracts in `plugins/meta-skill/src/models.ts`, `plugins/meta-skill/src/eval/scenarios.ts`, and `plugins/meta-skill/src/lint.ts`.
- [x] (2026-06-03) Inspected eval docs in `plugins/meta-skill/skills/skill-eval/SKILL.md` and `plugins/meta-skill/skills/skill-eval/references/cli.md`; they still mention unsupported generation and `T`.
- [x] (2026-06-03) Ran subagent plan critique and incorporated the blocking findings.
- [ ] Hard-cut `T` trigger from active eval family/type contracts.
- [ ] Implement deterministic R/F/G generator planning and writing.
- [ ] Wire `meta-skill eval generate`.
- [ ] Add tests for generation, idempotence, dry-run, JSON output, lint compatibility, and `T` rejection.
- [ ] Update docs and run native TypeScript validation.
- [ ] Run validation and record results in this plan.

## Surprises & Discoveries

- Observation: Source and docs still expose `T` even though current eval work should be R/F/G only.
  Evidence: `plugins/meta-skill/src/models.ts` defines `ScenarioFamilyCode = "R" | "F" | "T" | "G"`; `plugins/meta-skill/src/lint.ts` allows trigger family/type; `plugins/meta-skill/src/commands.ts` help and validation accept `--family T`.
- Observation: Manual-review-only scenarios are structurally valid but warn.
  Evidence: `plugins/meta-skill/src/lint.ts` warns when criteria have no deterministic tests and warns again when they have no judges.
- Observation: Generated scenarios cannot produce green proof by themselves.
  Evidence: current App Server scenario execution is forced-skill and unresolved until tests, judges, or feedback turn evidence into a decision.

## Decision Log

- Decision: This plan includes a hard cut from `R/F/T/G` to `R/F/G` for active eval family and type contracts.
  Rationale: Leaving `T` in help, lint, or type surfaces lets users create trigger-looking evidence even though the runner cannot prove trigger routing.
  Date/Author: 2026-06-03 / Codex after subagent critique.
- Decision: `eval generate` is deterministic and template-based.
  Rationale: V1 must be cheap, testable, and predictable. LLM-backed generation would add token cost, App Server availability, schema-repair, and privacy questions.
  Date/Author: 2026-06-03 / Codex after subagent critique.
- Decision: Generated scenarios are manual-review scaffolds, not pass/fail evidence.
  Rationale: Empty `tests` and `judges` arrays are intentional in v1, so the expected run status is `needs_review` until evidence is resolved.
  Date/Author: 2026-06-03 / Codex after subagent critique.
- Decision: Replacement may touch only generator-owned scenarios.
  Rationale: User-authored scenarios are source evidence and must not be overwritten by a convenience command.
  Date/Author: 2026-06-03 / Codex after subagent critique.

## Outcomes & Retrospective

Not started. At completion, record `npm test`, `git diff --check`, and the manual smoke transcript here. Also record whether `scripts/sync-plugins.sh` was necessary. This feature should not require root `skills/`, `.codex/agents/`, `assets/agent/`, or `AGENTS.md`.

## Context and Orientation

The working directory is `/Users/rishi/Code/agent`.

Editable Meta Skill source lives and runs directly under `plugins/meta-skill/src/`. Main Agent generated plugin packages live under `plugins/codex/agent/` and `plugins/claude/agent/`; do not edit them.

A portable skill project is a directory containing `SKILL.md`. Its authoring workbench is `.meta-skill/`. Eval scenarios live under `.meta-skill/evals/scenarios/<ID-slug>/`. Each scenario needs `task.md`, `scenario.json`, and `criteria.json`; `turns.json` is optional.

Relevant source files:

- `plugins/meta-skill/src/models.ts`: eval family/type and scenario data model.
- `plugins/meta-skill/src/lint.ts`: folder naming, family/type, and criteria validation.
- `plugins/meta-skill/src/eval/scenarios.ts`: eval init, load, select, and snapshot helpers.
- `plugins/meta-skill/src/commands.ts`: CLI help, argument parsing, and `commandEvalGenerate()`.
- `plugins/meta-skill/src/evals.ts`: public eval module exports.
- `plugins/meta-skill/src/commands.test.ts`, `plugins/meta-skill/src/lint.test.ts`, and likely a new `plugins/meta-skill/src/eval/generate.test.ts`: test surfaces.
- `plugins/meta-skill/skills/skill-eval/SKILL.md` and references under `plugins/meta-skill/skills/skill-eval/references/`: user-facing eval guidance.

## Scope

Implement `meta-skill eval generate <project>` as a deterministic starter-scenario generator.

The command should:

- Require or initialize a portable skill workbench with existing helpers.
- Generate only `R`, `F`, and `G`.
- Write valid `task.md`, `scenario.json`, and `criteria.json`.
- Use empty `tests` and `judges` arrays in v1 and explain that manual review is expected.
- Mark generated scenarios with metadata: `generated_by`, `generator_version`, `template`, `evidence_mode: "forced_skill"`, and `review_status: "starter_manual_review"`.
- Support `--dry-run`, `--json`, `--count`, `--family`, `--topic`, and `--strategy merge|replace`.
- Print concise human output with scenario ids, folders, forced-skill mode, and the next useful command.

## Non-Goals

Do not implement baseline or no-skill comparison.

Do not implement native trigger routing or `T` scenarios.

Do not generate judges, deterministic test commands, or eval-test scripts.

Do not generate artifact-writing scenarios that require the solver to write files.

Do not build dashboards, live watch mode, transcript rendering, final-answer diffing, or cross-run analytics.

Do not touch `plugins/codex/agent/`, `plugins/claude/agent/`, or root Agent source surfaces unless the user expands scope.

## Milestone 0: Hard-Cut The Active Eval Contract To R/F/G

Before generating scenarios, remove trigger-era affordances from active eval contracts.

Edit `plugins/meta-skill/src/models.ts` so `ScenarioFamilyCode` is `"R" | "F" | "G"`, `ScenarioFamily` removes `"trigger"`, and `ScenarioType` removes `"trigger"` unless another existing non-trigger type still needs to remain. Keep `"artifact"` only if existing non-trigger code or tests require it; do not generate artifact scenarios in this plan.

Edit `plugins/meta-skill/src/lint.ts` so prefix validation accepts only `R`, `F`, and `G`, and valid families no longer include trigger. Edit `plugins/meta-skill/src/commands.ts` help and `commandEvalRun()` validation so `--family T` is rejected, not merely unsupported in generation.

Update tests that still expect `T` to be valid. Acceptance for this milestone is a focused test proving `--family T` is rejected and lint no longer accepts a `T` scenario as valid.

## Milestone 1: Add The Generator API

Create `plugins/meta-skill/src/eval/generate.ts`.

Export a small API close to:

    export type GeneratedScenarioFamilyCode = "R" | "F" | "G";

    export interface EvalGenerateOptions {
      project: string;
      count?: number;
      family?: GeneratedScenarioFamilyCode;
      topics?: string[];
      strategy?: "merge" | "replace";
      dryRun?: boolean;
    }

    export interface EvalGenerateResult {
      project: string;
      scenariosRoot: string;
      evidenceMode: "forced_skill";
      dryRun: boolean;
      created: GeneratedScenarioSummary[];
      skipped: GeneratedScenarioSummary[];
      replaced: GeneratedScenarioSummary[];
      warnings: string[];
    }

Use existing helpers from `plugins/meta-skill/src/project.ts`: `requirePortableSkill`, `createWorkbench`, `projectPaths`, `parseSkillFrontmatter`, `readText`, `writeText`, `writeJson`, `exists`, `ensureDir`, and `slugify`.

The generator must first build an in-memory plan. Dry-run and write mode must use the same plan so preview cannot drift from writes.

## Milestone 2: Deterministic Templates

Read `SKILL.md` frontmatter. Use frontmatter `name` as the skill label when present. Use `description` to derive a capability phrase by stripping leading `Use when` and splitting off `; not for ...` if present. Fall back to `the skill's documented workflow` when parsing is not useful. Optionally read `.meta-skill/spec.md` for wording, but do not depend on complex parsing.

Default generation creates one scenario per family:

- `R<number>-core-behavior`: family `regression`, type `behavior`, template `core_behavior`.
- `F<number>-boundary-behavior`: family `failure_mode`, type `behavior`, template `boundary_behavior`.
- `G<number>-missing-context-gate`: family `gate`, type `gate`, template `missing_context_gate`.

Every generated `scenario.json` must include `schema_version`, `id`, `family`, `type`, `title`, `topics`, and generator metadata. Every `criteria.json` must include `schema_version`, `what_it_tests`, `expected_behavior`, at least three assertions, and empty `tests` and `judges` arrays.

The wording for `F` must say "forced-skill boundary behavior" and must not say "should not trigger."

## Milestone 3: Safe Writes, Merge, Replace, And Counts

Default `--strategy merge` creates missing generated templates and skips existing generator-owned templates. It must scan existing scenario ids and allocate the next available number per family, such as `R2` when `R1` already exists.

`--strategy replace` may delete and recreate only scenarios whose `scenario.json.metadata.generated_by` is `meta-skill eval generate` and whose `metadata.template` matches a selected template. It must never delete hand-authored scenarios.

Flag semantics:

- No `--family`, no `--count`: generate `R`, `F`, and `G`.
- `--family R|F|G`: generate only that family.
- `--count n` without family: generate up to the available templates in R, F, G order. Since v1 has only three templates, counts above three should return a warning.
- `--count n` with family: generate the one available template for that family and warn when `n > 1`.
- Repeated `--topic` values are copied into `scenario.json.topics`.
- `--dry-run` writes nothing.
- `--json` prints the full `EvalGenerateResult`.

## Milestone 4: Wire The CLI

Export the generator from `plugins/meta-skill/src/evals.ts`.

Replace the scaffolded throw in `commandEvalGenerate()` in `plugins/meta-skill/src/commands.ts`. Validate `--count`, `--strategy`, and family. Reject `--family T` with exit code 2 and a message explaining that trigger-routing scenarios are out of scope while the runner force-attaches the skill.

Human output should be compact:

    generated scenarios: 3
    created: R1-core-behavior, F1-boundary-behavior, G1-missing-context-gate
    mode: forced-skill behavior evidence; manual review required
    next step: meta-skill lint <project>

If merge skips everything, say that no new scenarios were written and still print the next step.

## Milestone 5: Tests

Add focused tests before broad validation.

Minimum test coverage:

- `generateScenarios` creates R/F/G starter scenarios for a temp project.
- Dry-run reports planned scenarios and writes no scenario folders.
- Merge is idempotent for generated templates.
- Replace preserves hand-authored scenarios.
- Generated scenario shape passes lint with only expected warnings for no tests and no judges.
- `runCommand eval generate` prints human output and writes scenarios.
- `runCommand eval generate --json` prints machine-readable output.
- `eval generate --family T` rejects trigger generation.
- `eval run --family T` is rejected after the hard cut.

Use temp projects and existing helpers from tests in `plugins/meta-skill/src/project.test.ts`, `plugins/meta-skill/src/lint.test.ts`, and `plugins/meta-skill/src/commands.test.ts`.

## Milestone 6: Docs And Generated Output

Update docs:

- `plugins/meta-skill/skills/skill-eval/SKILL.md`
- `plugins/meta-skill/skills/skill-eval/references/cli.md`
- `research/tessl/review/review-design.md`
- `plugins/meta-skill/skills/skill-create/references/cli-conventions.md` only if it contains stale eval-generate guidance.

Docs must stop saying `eval generate` is unsupported. They must say generation supports R/F/G starter scenarios, produces manual-review scaffolds, and remains forced-skill behavior evidence.

Do not recreate `plugins/meta-skill/app/`. Running `npm test` executes `src` directly and `npm run typecheck` enforces erasable TypeScript syntax.

## Validation

Run focused validation during development:

    cd /Users/rishi/Code/agent/plugins/meta-skill
    npm test
    npm run typecheck

Run full validation:

    cd /Users/rishi/Code/agent/plugins/meta-skill
    npm test

Then run:

    cd /Users/rishi/Code/agent
    git diff --check

Manual smoke:

    cd /Users/rishi/Code/agent
    tmp="$(mktemp -d)"
    node plugins/meta-skill/src/main.ts create "$tmp/demo-skill" --project --slug demo-skill --title "Demo Skill" --description "Use when turning rough notes into a concise implementation brief; not for writing production code." --job "Turn rough notes into a brief."
    node plugins/meta-skill/src/main.ts eval generate "$tmp/demo-skill" --dry-run
    test ! -d "$tmp/demo-skill/.meta-skill/evals/scenarios/R1-core-behavior"
    node plugins/meta-skill/src/main.ts eval generate "$tmp/demo-skill"
    node plugins/meta-skill/src/main.ts lint "$tmp/demo-skill"
    node plugins/meta-skill/src/main.ts eval generate "$tmp/demo-skill" --dry-run --json
    node plugins/meta-skill/src/main.ts eval generate "$tmp/demo-skill" --family T

Expected observations:

- Dry-run prints planned R/F/G scenarios and writes nothing.
- Real generation writes three scenario folders.
- Lint has no scenario-shape failures; manual-review warnings are acceptable.
- JSON output includes `evidenceMode: "forced_skill"` and arrays for `created`, `skipped`, and `replaced`.
- `--family T` exits 2 and explains the trigger limitation.

## Idempotence and Recovery

Generated scenario identity is metadata-based, not folder-name-only. Use `metadata.generated_by = "meta-skill eval generate"` and `metadata.template` to decide whether an existing scenario is generator-owned.

If a write fails halfway, inspect `.meta-skill/evals/scenarios/` and remove only incomplete generator-owned folders from the failed command. Do not delete hand-authored folders.

If `npm test` fails because compiled output is stale, run `npm run build` in `plugins/meta-skill`, then rerun `npm test`. Do not hand-edit compiled files.

## Reviewer Gates

After Milestone 0, review for stale `T` surfaces:

    rg -n "R\\|F\\|T\\|G|trigger|--family T|trigger-routing" plugins/meta-skill/src plugins/meta-skill/skills/skill-eval

Some explanatory mentions of trigger-routing may remain only when they explicitly say it is out of scope or not proof.

After Milestone 3, review idempotence and replacement safety. Confirm `replace` cannot delete hand-authored scenarios.

After Milestone 6, review evidence honesty. No generated criteria, command output, or docs should imply native trigger routing, no-skill uplift, artifact-writing proof, or release readiness.

## Completion Standard

The feature is complete when:

1. `meta-skill eval generate <project>` writes R/F/G starter scenarios.
2. `meta-skill lint <project>` accepts generated scenario shape without failures.
3. Generated scenarios are visibly marked as forced-skill manual-review scaffolds.
4. `T` trigger scenarios are no longer part of active family/type contracts.
5. `--dry-run`, `--json`, merge idempotence, safe replace, and `--family T` rejection are tested.
6. `npm test` passes in `plugins/meta-skill`.
7. `git diff --check` passes from `/Users/rishi/Code/agent`.
8. This plan's `Outcomes & Retrospective` records the final validation and any residual risk.

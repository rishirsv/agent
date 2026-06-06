# Meta Skill Work Tracker

Use this tracker to keep the Meta Skill plugin roadmap centered on evaluation truth. The immediate goal is now to spend the simplified surface on App Server capabilities that a plain model API cannot provide: event trajectories, sandbox evidence, and forkable threads.

### Seed Evals For skill-create Routing And Interview

- Recommendation: Worth exploring
- Evidence: The 2026-06-05 session added Routing, the Interview surface, and skillify with no eval coverage.
- Where: `plugins/meta-skill/skills/skill-create/.meta-skill/cases/` (project mode).
- Finding: The new authoring behavior is unverified by cases.
- Suggested improvement: Add R/F/G cases: capture-from-conversation extraction (R), implicit bypass when context already answers the required set (F), and the skill-or-not stop gate (G).
- Verification: `meta-skill project init` then `meta-skill run` on skill-create.

### Make Skillify Executable Session Mining

- Recommendation: Later
- Evidence: Open questions in `docs/research/skillify/session-to-skill-research.md`.
- Where: a future `meta-skill` path over Codex session JSONL.
- Finding: `references/skillify.md` is authoring guidance only; no tool reads real sessions, classifies lessons, and emits a Skillify Brief or seed evals.
- Suggested improvement: Only after review and eval-view loops exist, consider a deterministic session reader that produces a Skillify Brief and draft cases. Overlaps with "Generate Draft Starter Cases."
- Verification: Fixture session JSONL produces a deterministic brief and draft cases.

## ROADMAP

These roadmap items came from a 2026-06-05 review of Tessl's public skill review, registry, CLI, and scenario/eval surfaces against the current Meta Skill implementation. Keep Meta Skill local and evidence-first; do not copy Tessl's package manager or public registry wholesale. The useful import is the product shape: clear quality review, impact comparison, generated starter scenarios, readable eval views, and publish/readiness gates.

### Add A Real `meta-skill review`

- Recommendation: Strong.
- Evidence: Tessl skill reviews split quality into validation checks plus LLM-judged discovery/activation and implementation scores, with per-vector reasoning and recommendations.
- Where: `plugins/meta-skill/src/commands.ts`, `plugins/meta-skill/src/lint.ts`, new review module, `plugins/meta-skill/src/report.ts`, and `.meta-skill/reviews/<review-id>/`.
- Finding: Meta Skill currently has deterministic lint and eval evidence, but no first-class quality review command. The old heuristic review fallback was removed because it was too shallow and not real judge evidence.
- Suggested improvement: Add read-only `meta-skill review <project> [--json]`. Run deterministic lint first, then invoke a dedicated reviewer judge/subagent for Discovery, Implementation, and Validation. Store `review.json`, `report.md`, and lint context under `.meta-skill/reviews/<review-id>/`. If judge review is unavailable, mark Discovery/Implementation unavailable rather than guessing.
- Verification: Add tests for deterministic-only unavailable review, full review report rendering, JSON shape, and no source edits. Run `npm test`, `npm run typecheck`, and `git diff --check`.

### Upgrade Eval Viewing Before Adding More Eval Modes

- Recommendation: Strong.
- Evidence: Tessl registry pages make quality, impact, evals, security/advisory, and files legible in one view; current Meta Skill run output is terse and file-first.
- Where: `plugins/meta-skill/src/commands.ts`, a future eval-view module, view tests, and optional local static HTML under run evidence or generated on demand.
- Finding: Meta Skill has useful case definitions, trajectories, final answers, lint output, and token usage, but no first-class eval viewer. Users still need manual file drilling.
- Suggested improvement: Add `meta-skill eval list <project>` and `meta-skill eval view <project> [--run <id>|--last] [--json]`. Show run status, case status, missing checks, execution errors, final answer previews, turn-evidence links, token totals/availability, tests, review artifacts, human decisions, and manual-review flags.
- Verification: Add fixture runs for clean, failed, no-verdict, missing-check, token-unavailable, and turn-evidence-rich cases. Verify Markdown/JSON output remains deterministic.

### Make Baseline-Vs-Candidate Impact First-Class

- Recommendation: Strong.
- Evidence: Tessl's strongest eval concept is impact: compare task performance with and without skill context. Meta Skill can run working-payload or no-skill executions today, but only one source per run.
- Where: `plugins/meta-skill/src/eval/run.ts`, `plugins/meta-skill/src/models.ts`, run result artifacts, eval-view rendering, and `skill-eval` docs.
- Finding: Separate `--no-skill` runs are honest manual control evidence, but they do not give users a direct impact table showing where the skill helped, regressed, or was unnecessary.
- Suggested improvement: Add `meta-skill run <project> --compare baseline` or a future `meta-skill eval run <project> --compare baseline`. Store baseline and candidate evidence per case, never pool token usage, and report cases as candidate improves, candidate regresses, both fail, baseline already succeeds, or requires human review.
- Verification: Add fake-runner tests for baseline/candidate case execution, source-specific evidence, unavailable source evidence, no pooled tokens, and report status categories.

### Generate Draft Starter Cases

- Recommendation: Strong.
- Evidence: Tessl supports scenario generation workflows; Meta Skill already has a separate minimal eval-generation plan, but the tracker should keep this product gap visible in the main roadmap.
- Where: `.plans/meta-skill-minimal-eval-generate-exec-plan.md`, `plugins/meta-skill/src/eval/`, `plugins/meta-skill/src/commands.ts`, and `skill-eval` docs.
- Finding: New skill projects still start with empty eval coverage unless the user hand-authors cases.
- Suggested improvement: Add deterministic `meta-skill eval generate <project> --count <n> --strategy merge|replace` that creates draft R/F/G starter cases from the skill description and body. Generated cases must be labeled manual-review scaffolds and must not become release proof until tests, judges, feedback, or human decisions resolve them.
- Verification: Use generator-owned metadata to protect hand-authored cases, test merge/replace/dry-run/JSON output, and run lint compatibility checks on generated cases.

### Connect Review To Evidence-Backed Improve

- Recommendation: Strong after `review` exists.
- Evidence: Tessl exposes `skill review --optimize`, but Meta Skill should keep the more careful "improve" language and human-gated edit semantics.
- Where: `plugins/meta-skill/skills/skill-improve/`, future review artifacts, a future improve module, and decision artifacts.
- Finding: Meta Skill does not yet have a tight chain from review findings to scoped edit proposals to validation.
- Suggested improvement: Add an improve flow that can read a review ID or run/case evidence, propose bounded source edits, rerun relevant lint/evals, and require human approval before package, publish, install, sync, or accept decisions. Keep `review` read-only.
- Verification: Add tests that review evidence can be referenced by improve and decision artifacts and that improve mode refuses to edit without explicit edit intent.

### Add Publish / Package Readiness Gates Instead Of A Registry

- Recommendation: Worth exploring.
- Evidence: Tessl's publish path bundles skills, runs automatic review/evaluation, versions the package, and surfaces registry quality. Meta Skill should not become a registry, but it can provide local readiness gates.
- Where: `plugins/meta-skill/src/package.ts`, `plugins/meta-skill/src/lint.ts`, future review/eval summaries, and package docs.
- Finding: `package` validates and packages the portable payload, but it does not yet answer whether the skill is ready to share.
- Suggested improvement: Add `meta-skill package --check` or `meta-skill publish-readiness <project>` that verifies lint clean, review present and above configured threshold, baseline eval evidence exists when required, no unresolved execution failures, package excludes `.meta-skill/`, runtime resource links are intact, and human decisions are recorded for accepted changes.
- Verification: Add readiness fixtures for missing review, stale eval, unresolved failures, clean package, and package exclusion behavior.

### Add Skill Inventory, Staleness, And Security-Lite Later

- Recommendation: Later.
- Evidence: Tessl registry and related skill-insights surfaces show quality, impact, security/advisory, files, versioning, staleness, and duplicate/registry-search signals across skill sets.
- Where: future inventory command over local skill roots, package metadata, git history, lint/review summaries, and resource link validation.
- Finding: Once individual skill review/eval loops work, a multi-skill owner needs to know which skills are stale, duplicate, low quality, broken, or missing evidence.
- Suggested improvement: Add `meta-skill inventory <root>` and `meta-skill stale <root>` later. Start deterministic: git last touched, broken runtime links, missing review/eval evidence, package metadata, duplicate trigger risk, and security-lite warnings for risky scripts or external-action gates.
- Verification: Use a local fixture inventory with multiple skills, broken references, old git timestamps, duplicate triggers, and scripts requiring gates.

## Completed Items

- 2026-06-05: skill-create restructured — `Routing` (skill-or-not gate plus context-source selection) split from a `Workflow` of flight phases; the Interview is the primary surface with implicit, question-by-question bypass and a logged Skill Specification.
- 2026-06-05: Added `skills/skill-create/references/skillify.md` for session-to-skill capture (classify lesson, recurrence evidence, trajectory extraction, distillation gates, eval seeding), grounded in `docs/research/skillify/session-to-skill-research.md`.
- 2026-06-05: `lint` validates the agentskills.io `SKILL.md` frontmatter spec via `parseSkillFrontmatterFull` — `name` ≤64, `description` ≤1024 (warn >500), `compatibility` ≤500, metadata/allowed-tools/license checks, and unknown-key warnings.
- 2026-06-05: `lint` adds markdown link integrity (broken links, plugin-escaping bounded via `.codex-plugin/plugin.json`, `.meta-skill/` leak), the description workflow-shortcut warning, and a project-mode spec placeholder scan; first `src/lint.test.ts` unit tests (47 pass, 1 skip).
- PR #20 / `6b4086da`: Eval runs use one execution source at a time, and no-skill runs stay manual control evidence.
- PR #21 / `03bc2b4d`: Execution status and verdict evidence are separate, so successful execution is not pass/fail proof.
- PR #22 / `5911f432`: Token evidence lives on case trial facts as the canonical summary source.
- `f03a2307`: Manual cross-run inspection stays separate from in-run eval execution and automated uplift language.
- `ec8485b7`: CLI help, dispatch, docs, and tests reflect the supported command surface.
- `57c4ebe0`: App Server recovery uses one explicit orchestration retry.
- `9e36774d`: Bounded client-side App Server event retention while keeping `rpc.jsonl` as the durable raw trace.
- `888cda97`: Evidence bundles keep token reporting and file-output reporting in their canonical locations.
- `65051c8f`: Case taxonomy uses one executable type axis.
- `b462f507`: Cases live in case folders.
- `a2d749ff`: Meta Skill eval runtime uses the compact current workbench shape.
- `fcd89eab`: Reports are printed Markdown or JSON projections.
- `fb475536`: TypeScript execution runs directly from `src/`.
- `2749e558`: Tightened skill-create approval gates.
- `2e0fb77b`: Flattened the Meta Skill workbench and docs around portable payload plus `.meta-skill/`.
- `b7d22d95`: Refined skill-create and skill-eval docs for consistency.

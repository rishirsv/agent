# Meta Skill Review Redesign

Date: 2026-06-02

## Audience

Future agents implementing Meta Skill review changes in `/Users/rishi/Code/agent/plugins/meta-skill`.

## Source Context

This note captures a live comparison between Meta Skill and Tessl's skill quality pages/docs, especially:

- Tessl docs: `https://docs.tessl.io/improving-your-skills/evaluating-skills`
- Tessl registry example: `https://tessl.io/registry/skills/github/softaworks/agent-toolkit/react-dev/quality?showAll=`
- Meta Skill source:
  - `plugins/meta-skill/cli/src/lint.ts`
  - `plugins/meta-skill/skills/skill-create/`
  - `plugins/meta-skill/skills/skill-improve/`
  - `plugins/meta-skill/skills/skill-eval/`

## Decisions

- Use **improve**, not "optimize", for Meta Skill user-facing language.
- Lift Tessl's review concept as the target shape for Meta Skill review:
  - deterministic validation checks
  - judge-scored discovery/activation quality
  - judge-scored implementation/content quality
  - per-vector reasoning
  - clear percentages and pass/warning/fail rows
  - concrete suggestions tied to the scored vectors
- A future `meta-skill review` should run deterministic lint first, then invoke a dedicated reviewer subagent to judge the skill against the rubric.
- The reviewer must be read-only. It can inspect skill files, linked references/scripts/assets, and lint output, but it must not edit the skill.
- Review output is evidence for `skill-improve`; applying changes remains a separate human-approved improve/promote step.
- Keep Meta Skill's workbench/eval/test/judge checks. Tessl's validation surface is strong for Agent Skills spec checks, but Meta Skill already has deeper `.meta-skill/` lifecycle validation.
- Track Codex/agent sessions as future improvement evidence.
- Add a Skillify concept later: a `skill-create` reference file or adjacent workflow that reads one or more sessions, extracts workflow patterns, and creates a skill from them. Current research lives at `research/skillify/session-to-skill-research.md`.

## Current Meta Skill Behavior

`meta-skill lint` is deterministic. It validates:

- portable payload contract
- `SKILL.md` frontmatter fields
- top-level files/folders that will not package
- `.meta-skill/spec.md`
- eval manifest and runner
- test manifest and runnable tests
- scenario folder naming, families, types, required files, criteria, assertions, judges, includes, and `turns.json`
- judge frontmatter, output guidance, and examples
- runtime-script unit-test coverage warnings
- optional eval-run annotations into saved run evidence

The old `meta-skill review` command used a heuristic local scorer in `src/review.ts` with these rough dimensions:

- `activation_quality`
- `boundary_clarity`
- `actionability`
- `workflow_clarity`
- `progressive_disclosure`
- `concision`
- `resource_and_script_hygiene`
- `eval_and_lint_readiness`

That fallback has been removed from the runtime CLI until review facts exist. It was too shallow compared with Tessl's review artifact, did not provide enough per-vector reasoning, did not mirror the Discovery / Implementation / Validation shape, and was not a real judge pass.

## Tessl Review Shape To Adopt

Tessl's review concept has three major buckets.

### Discovery

Question: based on the skill description, can an agent find and select the skill at the right time?

Vectors observed on the React skill quality page:

- Specificity
- Completeness
- Trigger Term Quality
- Distinctiveness Conflict Risk

Meta Skill should add:

- Boundary Clarity

Rationale: Meta Skill already treats `not for ...` and adjacent non-trigger boundaries as important. Keep that standard even if Tessl does not score it as a separate visible vector.

### Implementation

Question: are the instructions and guidance useful, concise, reliable, and operational?

Vectors observed on the React skill quality page:

- Conciseness
- Actionability
- Workflow Clarity
- Progressive Disclosure

Meta Skill should add:

- Resource And Script Hygiene
- Controls And Human Gates
- Evidence And Eval Readiness

Rationale: Meta Skill skills often include references, scripts, assets, evals, and external-action gates. Review must check those surfaces, not only the body prose.

### Validation

Question: does the skill satisfy deterministic structural and packaging expectations?

Tessl validation checks observed in the React example:

- `skill_md_line_count`
- `frontmatter_valid`
- `name_field`
- `description_field`
- `compatibility_field`
- `allowed_tools_field`
- `metadata_version`
- `metadata_field`
- `license_field`
- `frontmatter_unknown_keys`
- `body_present`

Tessl docs sample also showed:

- `description_voice`
- `description_trigger_hint`
- `body_examples`
- `body_output_format`
- `body_steps`

Meta Skill should preserve existing `lint.ts` checks and add missing deterministic skill-standard/body-signal checks where they fit:

- line count or character budget warning for `SKILL.md`
- valid YAML/frontmatter parsing with clearer check names
- third-person or non-second-person description check if compatible with our description style
- explicit trigger hint check
- `not for` boundary check
- body present
- examples or concrete snippets present when the skill type needs them
- output/return/finding/report format terms when the workflow has an output contract
- ordered steps or named workflow stages when the workflow is procedural
- direct links for every runtime reference/script/asset

## Scoring Model

Do not make the whole review score deterministic.

Observed Tessl behavior is hybrid:

- Validation is deterministic lint/spec checking.
- Discovery is judge-scored from the description.
- Implementation is judge-scored from the skill body and linked structure.
- The overall quality score blends the buckets.

For the React example:

- Discovery was `11 / 12`, displayed around `89%`.
- Implementation was `12 / 12`, displayed as `100%`.
- Validation was `10 / 11`, displayed as `90%`.
- The embedded registry payload contained `reviewScore: 96` and `scores.quality: 0.95`.

Meta Skill should use this shape but can choose its own transparent rollup. Suggested default:

```text
quality = weighted average(
  discovery = 35%,
  implementation = 45%,
  validation = 20%
)
```

If validation has failures, cap the overall quality score until failures are fixed. Warnings should reduce validation but not block review output.

## Reviewer Subagent

Define a dedicated read-only reviewer subagent for `meta-skill review`.

Recommended name:

- `meta-skill-reviewer`

Other possible names:

- `skill-quality-reviewer`
- `skill-rubric-reviewer`
- `skill-review-judge`
- `meta-skill-critic`

Recommended configuration:

- model: `gpt-5.5`
- reasoning: `high`
- read-only
- no source edits
- no promotion, release, package, install, publish, or marketplace writes

The subagent should receive:

- target skill root
- `SKILL.md`
- directly linked references/scripts/assets, subject to token budget
- deterministic lint report JSON
- current `.meta-skill/spec.md` when present
- relevant eval/review evidence if the user asked for evidence-backed review

The subagent should return structured JSON plus a Markdown report:

```json
{
  "schema_version": 1,
  "rubric_version": "meta-skill-quality-v1",
  "quality": {
    "score": 95,
    "discovery": 89,
    "implementation": 100,
    "validation": 90
  },
  "discovery": {
    "assessment": "...",
    "vectors": [
      {"name": "specificity", "score": 2, "max": 3, "reasoning": "..."}
    ]
  },
  "implementation": {
    "assessment": "...",
    "vectors": [
      {"name": "conciseness", "score": 3, "max": 3, "reasoning": "..."}
    ]
  },
  "validation": {
    "checks": [
      {"name": "frontmatter_valid", "status": "passed", "message": "..."}
    ]
  },
  "suggestions": [
    {
      "priority": "high",
      "vector": "boundary_clarity",
      "issue": "...",
      "suggested_fix": "..."
    }
  ]
}
```

## CLI Behavior

Future target command:

```bash
meta-skill review <project> [--json]
```

Expected flow:

1. Resolve the portable skill root with `requirePortableSkill`.
2. Run `lintProject(root, { executeTests: false })`.
3. Collect minimal review context:
   - `SKILL.md`
   - lint report
   - linked runtime resources
   - optional `.meta-skill/spec.md`
4. Invoke the read-only reviewer subagent.
5. Write review evidence under `.meta-skill/reviews/<review-id>/`:
   - `review.json`
   - `report.md`
   - optionally `lint.json`
   - optionally reviewer transcript/metadata if available
6. Print quality summary and next step:
   - if suggestions exist: point the user at evidence-backed improvement work
   - if no issues: say no material review issues found

Do not edit files during review.

## Report Shape

Use a Tessl-like report:

```text
# Skill Quality Review

Quality: 95%

## Discovery: 89%

Can an agent discover and select this skill at the right time?

| Dimension | Reasoning | Score |
|---|---|---:|
| Specificity | ... | 2 / 3 |

## Implementation: 100%

Are the instructions useful, concise, and operational?

| Dimension | Reasoning | Score |
|---|---|---:|
| Conciseness | ... | 3 / 3 |

## Validation: 90%

Does the skill satisfy structural and packaging expectations?

| Check | Description | Result |
|---|---|---|
| frontmatter_valid | YAML frontmatter is valid | Passed |

## Suggestions

1. ...
```

## Implementation Notes

- Add a real review producer only when reviewer-backed facts exist; do not restore the heuristic fallback.
- Update `plugins/meta-skill/cli/src/report.ts` so review reports render the new bucketed shape.
- Preserve existing `meta-skill lint` output; add missing deterministic checks in `lint.ts` only when they are truly deterministic.
- Add tests for the new review data shape and report rendering.
- If the reviewer subagent cannot be invoked in the current environment, fail clearly or support a deterministic-only fallback that marks Discovery/Implementation as unavailable, not guessed.
- Keep `needs_review` semantics from eval runs: unresolved evidence is not pass proof.
- Remove leftover "v1" developer wording from Meta Skill user-facing help and skill/reference prose. Examples already found:
  - `plugins/meta-skill/cli/src/commands.ts`: `meta-skill v1`
  - `plugins/meta-skill/skills/skill-create/references/cli-conventions.md`: "V1 uses..."
  - `plugins/meta-skill/skills/skill-create/references/cli-conventions.md`: "Do not suggest command namespaces outside the v1 surface above."
  - `research/tessl/review/review-design.md`: "V1 has no sealed release gate."
  - `research/tessl/review/review-files.md`: "Scenarios may have no tests or judges in v1..."
- Upgrade the Meta Skill CLI reference to closely match Tessl's CLI reference style: clear command grouping, usage, arguments, flags, examples, output, and common failure notes.

## Relationship To Improve

Future review should create facts. Improve acts on evidence.

The expected improvement chain becomes:

```text
meta-skill review .
meta-skill plan . --from-run <run-id>
meta-skill promote . --plan <plan-id>
meta-skill decide . --session <session-id> --accept
meta-skill lint .
meta-skill eval run . --scenario <relevant-id>
```

Do not rename `skill-improve` to optimize. If a friendly wrapper is added later, it should still route to improve semantics: review, plan, preview, approve, promote, validate.

## Scenario Eval Decisions

This comparison also covered Tessl's scenario-eval workflow at:

- `https://docs.tessl.io/improving-your-skills/evaluate-skill-quality-using-scenarios`

Tessl's strongest eval concept is measuring task performance **with and without the skill injected**. Meta Skill currently supports candidate-only runs and candidate-vs-release comparison. Candidate-vs-release is useful for regression, but it does not prove the skill improves over a no-skill baseline.

Decisions:

- Add no-skill baseline vs candidate as the primary eval comparison.
- Keep candidate vs release as a separate regression/release-confidence mode.
- Add scenario generation in the next implementation pass, not only manual scenario authoring.
- Keep model comparison out of scope for now; note it as future work.
- Keep evals skill-first. Do not make them plugin-first while plugin work is parked.

Implementation implications for `skill-eval`:

- Add a baseline side that runs the scenario without attaching/injecting the skill.
- Preserve existing candidate side semantics.
- Update run evidence so each scenario can record `baseline`, `candidate`, and optionally `release`.
- Update reports to show uplift: where candidate beats baseline, where both fail, where baseline already succeeds, and where candidate regresses.
- Make `needs_review` remain unresolved evidence, not pass proof, for every side.
- Scenario generation should create or propose the same `.meta-skill/evals/scenarios/<ID-slug>/` structure used by manual scenarios.
- Generated scenarios should still require human review before being treated as release-facing evidence.
- Scenario generation should prefer 3-5 starter scenarios across `R`, `F`, `T`, `G`, plus artifact/source cases when relevant.
- Model comparison can be a future guided flow; do not add it to the v1 implementation unless requested later.

## Scenario Generation Decisions

Tessl supports scenario generation as a first-class workflow:

- `tessl scenario generate <source> --count=<n>`
- `tessl scenario list`
- `tessl scenario view`
- `tessl scenario download --last --strategy=merge|replace`

Tessl can generate scenarios from:

- a plugin path
- repository commits
- PR ranges

It then downloads scenario files to disk. Generated scenarios include `task.md`, `criteria.json`, and usually `scenario.json`. Tessl's `scenario.json` can declare:

- `description`
- `fixtures`: named external content installed into the working directory
  - `commit` fixture with `repoUrl`, `ref`, optional `installPath`, optional `exclude`
  - `directory` fixture with local `path` and destination `installPath`
- `include`: scenario-local directories copied into the working directory
- `setup`: scenario-local setup scripts run after fixtures/includes

Tessl conventions:

- `resources/` next to `task.md` is automatically included.
- `setup.sh` next to `task.md` is automatically run.
- Assembly order is fixtures, includes, then setup scripts.

Meta Skill should adopt the useful parts without copying the remote run lifecycle:

- Add `meta-skill eval generate <project>`.
- Generate directly into `.meta-skill/evals/scenarios/`.
- Support `--count <n>`.
- Support `--strategy merge|replace`, default `merge`.
- Support `--family R|F|T|G` or generate a balanced starter set when no family is specified.
- Support `--topic <topic>` to steer scenario coverage.
- Support `--from-session <path-or-id>` later for Skillify/session-derived scenarios.
- Support `--json`.
- Do not require a plugin wrapper or workspace.
- Do not add remote `scenario list/view/download` unless a future remote generator exists.

Generated scenario output should use the existing Meta Skill schema:

```text
.meta-skill/evals/scenarios/
  R1-basic-task/
    task.md
    scenario.json
    criteria.json
    capability.txt        optional
    turns.json            optional
    resources/            optional
```

Generation should create at least:

- `task.md`: realistic initial user task.
- `scenario.json`: strict `schema_version`, `id`, `family`, `type`, `title`, `topics`, optional `include`, optional `setup`, optional metadata.
- `criteria.json`: `schema_version`, `what_it_tests`, `expected_behavior`, concrete assertions, optional tests, optional judges.
- `capability.txt`: short note explaining what capability this scenario covers.

Recommended starter set:

- `R`: ordinary success path.
- `F`: hard or ambiguous behavior.
- `T`: trigger or non-trigger boundary.
- `G`: human gate, safe stop, or safe default.
- Artifact/source scenario when the skill writes files, uses sources, or produces a structured artifact.

Generated scenarios must be marked as draft evidence until reviewed. The generator should say what it inferred from the skill and ask the user to review the scenarios before treating a run as release-facing evidence.

### Generator Inputs

The generator should inspect:

- `SKILL.md`
- linked `references/`, `scripts/`, and `assets/`
- `.meta-skill/spec.md` when present
- prior review findings when present
- prior eval failures when the user asks to generate regression scenarios from evidence
- future Skillify/session evidence when supplied

It should extract:

- target task objects
- trigger phrases
- non-trigger boundaries
- workflow stages
- required outputs
- human gates
- source/artifact expectations
- likely failure modes
- deterministic checks that could become `.meta-skill/tests/manifest.json` entries

### Relationship To Baseline

Generated scenarios should be written so they can run both:

- baseline: no skill injected
- candidate: current portable skill injected

This means `task.md` should be a normal user task, not a prompt that assumes the skill exists. Criteria should evaluate task outcome, not whether the model followed internal skill wording.

### Open Implementation Choice

The implementation needs a generation engine. Options:

- deterministic template generator from parsed skill/review context
- subagent-backed generator using the same read-only pattern as `meta-skill review`
- hybrid: deterministic skeleton plus subagent-written task/criteria text

Recommended default: hybrid. Deterministic code should own IDs, folder layout, merge/replace behavior, schema validity, and required fields. A generation subagent can draft realistic task text, assertions, and capability notes from the skill context.

### Comparable CLI Commands

Current Meta Skill commands comparable to Tessl scenario commands:

| Tessl command | Current Meta Skill equivalent | Gap |
|---|---|---|
| `tessl scenario generate <source> --count <n>` | none | Add `meta-skill eval generate <project>` |
| `tessl scenario list` | none | Optional only if generation runs are stored |
| `tessl scenario view <id>` | none | Optional only if generation runs are stored |
| `tessl scenario download --last --strategy merge|replace` | none | Not needed for local generation; use `--strategy` on generate |
| `tessl eval run <plugin>` | `meta-skill eval run <project>` | Add baseline-vs-candidate default mode |
| `tessl eval list` | `meta-skill eval open <project> --list` | Existing command is acceptable but naming is less obvious |
| `tessl eval view <id>` | `meta-skill eval open <project> --run <run-id>` | Existing command is acceptable but `view` may be clearer |
| `tessl eval retry <id>` | none | Add later if saved run inputs can be replayed safely |

Decision:

- Do not copy Tessl's top-level `scenario` namespace exactly.
- Keep scenario work under `meta-skill eval` because scenarios are part of the local eval workbench.
- Add `meta-skill eval generate` rather than `meta-skill scenario generate`.
- Consider aliases only if ergonomics become a problem:
  - `meta-skill eval list` -> alias for `meta-skill eval open --list`
  - `meta-skill eval view` -> alias for `meta-skill eval open --run`
  - `meta-skill eval retry` -> future command

Recommended command surface:

```bash
meta-skill eval init <project>
meta-skill eval generate <project> [--count <n>] [--family <R|F|T|G>] [--topic <topic>] [--strategy merge|replace] [--from-review <review-id>] [--from-run <run-id>] [--dry-run] [--json]
meta-skill eval run <project> [--scenario <id>] [--family <R|F|T|G>] [--topic <topic>] [--label "..."] [--compare baseline|release|none] [--with-judges] [--no-lint]
meta-skill eval judge <project> --run <run-id> (--judge <id> | --all-judges) (--scenario <id> | --all-scenarios)
meta-skill eval feedback import <project> --run <run-id> <feedback.jsonl>
meta-skill eval open <project> [--run <run-id>] [--list]
```

Default comparison policy:

- Add `--compare baseline` first, but do not make it implicit immediately.
- Generated scenarios should be baseline-compatible by default.
- Consider making `--compare baseline` the default only after reports clearly classify uplift.
- `--compare none` can run candidate only.
- `--compare release` remains release regression mode.

### `task.md` Policy

There are two legitimate scenario types:

1. Baseline-compatible outcome scenarios.
2. Explicit skill-invocation scenarios.

For baseline-compatible outcome scenarios, `task.md` must be a normal user task and should not say "use this skill." This lets the same task run against baseline/no-skill and candidate/with-skill. The criteria measure task outcome and uplift.

For explicit skill-invocation scenarios, `task.md` may say:

```text
Use the `$vendor-contract-review` skill to review the contract located at <PATH>.
Write your output to a Markdown file.
```

Those scenarios are useful for invocation-path, routing, output-contract, and candidate-only behavior. They should not be used as no-skill uplift proof because the baseline side cannot fairly satisfy an instruction to use an unavailable skill.

Generation default:

- Generate baseline-compatible tasks by default.
- Generate explicit skill-invocation tasks only when the scenario family/type calls for it, such as trigger/routing coverage or candidate-only validation.
- Mark each generated scenario with metadata indicating whether it is `baseline_compatible` or `skill_invocation`.

Suggested metadata:

```json
{
  "metadata": {
    "eval_mode": "baseline_compatible",
    "generation": {
      "source": "meta-skill eval generate",
      "agent": "meta-skill-scenario-generator",
      "status": "draft",
      "batch_id": "2026-06-02T...",
      "human_review_required": true
    }
  }
}
```

Merge semantics:

- Default strategy is `merge`.
- Never overwrite an existing scenario folder during merge.
- Allocate next available IDs per family.
- Add numeric suffixes for slug collisions.
- Skip exact duplicate generated task/capability hashes and report them.

Replace semantics:

- `replace` should replace only prior generated draft scenarios identified by `metadata.generation.source`.
- Do not delete hand-authored or human-reviewed scenarios.
- If replacement would collide with a protected folder, fail clearly.
- Full suite replacement should require a separate explicit flag later, not plain `--strategy replace`.

Subagent contract for `meta-skill-scenario-generator`:

- read-only
- model `gpt-5.5`
- reasoning `high`
- inputs: project root, `SKILL.md`, linked resource summaries, `.meta-skill/spec.md`, existing scenario IDs, lint output, optional review/run evidence, and generation options
- output: structured JSON proposals only
- CLI owns ID allocation, folder naming, schema validation, merge/replace, and file writes
- subagent owns realistic task text, scenario intent, criteria/assertions, capability notes, baseline compatibility classification, and risk notes

Implementation cautions:

- Baseline support is not just a flag. Current side types are `candidate | release`, and the runner must stop forcing skill use on the baseline side.
- If current App Server staging attaches the skill under a generic name such as `candidate`, explicit `$skill-name` invocation scenarios may need extra support.
- Current metadata supports `include` and `setup`, but if the runner does not copy arbitrary includes or execute setup scripts yet, the generator should avoid those fields until runner support exists.
- Eval reports need uplift classifications: candidate beats baseline, both fail, baseline already succeeds, candidate regresses, and not comparable.
- Generated scenarios plus manual-review-only criteria remain draft evidence until reviewed; they are not release proof by themselves.

## Eval Viewing Decisions

This comparison must include eval viewing, not only generation and run execution.

Tessl's viewing surface includes:

- `tessl eval list`
  - reverse chronological run listing
  - filters such as `--limit`, `--mine`, `--workspace`, `--plugin`, `--status`, `--type`
  - table columns: ID, Type, Subject, Status, Created By, Created
  - `--json`
- `tessl eval view <id>`
  - view a specific run
  - `--last`
  - `--json`
- `tessl eval retry <id>`
  - rerun a failed eval
  - `--last`
  - `--json`

Tessl's React skill registry eval view shows:

- overall impact score
- scenario cards
- per-scenario score
- uplift/delta percentage
- scenario title and capability summary
- a criteria table
- side-by-side scores for baseline and with-context/with-skill
- repository, commit, evaluated date, agent, and model metadata

Current Meta Skill viewing behavior:

- `meta-skill eval open <project> --list` returns sorted run folder names only.
- `meta-skill eval open <project> --run <run-id>` returns or opens a local static `report.html`.
- `report.html` includes run label, status, manual-review flag, failure classifications, runner metadata, scenario status counts, tests, judges, feedback, and a scenario table.
- The scenario table links final answer previews, token usage, evidence folder, `rpc.jsonl`, and `turns.jsonl`.
- There is no dedicated `view` command, no `retry`, no filtered list, no JSON output for viewing, no scenario criteria table, no baseline-vs-candidate uplift classification, and no per-scenario card view.

Decisions:

- Upgrade eval viewing as part of the eval redesign. Do not treat reports as an afterthought.
- Keep local HTML reports, but make them Tessl-like for evidence reading.
- Add clearer aliases or commands:
  - `meta-skill eval list <project> [--limit <n>] [--status <status>] [--json]`
  - `meta-skill eval view <project> [--run <run-id>] [--last] [--json]`
  - keep `meta-skill eval open` as an alias for view/opening the HTML report if useful
  - `meta-skill eval retry <project> [--run <run-id>] [--last] [--json]` as future or same pass if run replay is straightforward
- `eval list` should print meaningful run metadata, not only folder names:
  - run ID
  - label
  - status
  - scenario count
  - sides/comparison mode
  - created/completed time
  - manual review required
  - failure classifications
- `eval view --json` should return structured run summary plus scenario summaries.
- HTML report should show scenario cards similar to Tessl:
  - title
  - family/type/topics
  - capability note
  - status per side
  - criteria/assertions
  - deterministic test and judge rows
  - baseline/candidate/release side-by-side scores
  - uplift classification
  - links to final output, artifacts, trace, turns, and RPC
- For baseline comparison, classify each scenario:
  - `candidate_beats_baseline`
  - `both_fail`
  - `baseline_already_succeeds`
  - `candidate_regresses`
  - `not_comparable`
  - `needs_review`
- Explicit skill-invocation scenarios should render as `not_comparable` for baseline uplift, not as baseline failures.
- Generated scenario reports should visibly show `draft` and `human_review_required` until reviewed.
- Preserve the existing local evidence links; Tessl's web UI is easier to read, but Meta Skill's local trace/evidence access is a strength.

Implementation notes:

- Extend `cli/src/eval/runs.ts` beyond folder-name listing.
- Extend `cli/src/report.ts` to render scenario-card sections, criteria, and side-by-side comparisons.
- Extend run/result models to include baseline side and comparison/uplift metadata.
- Add JSON-producing view/list functions so CLI output and HTML reports use the same summary builder.
- Keep `needs_review` language prominent: unresolved evidence is not pass proof.

## Final Additions From Source Review

These additions came from a source review of the current Meta Skill CLI, harness, release flow, and lane docs. They should be treated as implementation requirements or explicit scope clarifications before the redesign is considered complete.

### Small CLI Additions

Add machine-readable eval result access:

```bash
meta-skill eval open <project> --run <run-id> --json
```

or, if a clearer command is preferred:

```bash
meta-skill eval report <project> --run <run-id> --json
```

Decision:

- Prefer adding `--json` to `eval open` first, because `open` already selects a run and returns the report path.
- A future `eval report` alias is acceptable if the command surface needs clearer naming.

Improve `eval open --list`:

- It currently returns only sorted run folder names.
- It should print run ID, status, created date, completed date, label, comparison mode, scenario count, manual-review flag, and failure classifications.

Add evidence-backed release:

```bash
meta-skill release <project> --from-run <run-id>
```

Release should record the evidence basis in `.meta-skill/versions/release/version.json`.

Recommended release metadata fields:

- `source_run_id`
- `source_review_id`
- `source_session_id`
- `readiness_summary`
- `payload_digest`
- `file_digests`
- `created_from`

### Harness Scope Clarification

The skills currently describe a richer harness than the implementation supports.

Current App Server scenario runs are forced-skill final-answer evals:

- the runner starts a read-only App Server thread
- the developer instruction says to follow the staged skill payload
- the developer instruction says not to modify files
- the first turn attaches the skill as `candidate`

Implications:

- Trigger activation is not truly measured by the current App Server runner.
- Gate scenarios can be simulated in final-answer behavior, but not all gate mechanics are proven.
- Artifact-producing skills are underbuilt because the sandbox is read-only and the runner tells the model not to modify files.
- Deterministic tests evaluate saved evidence.
- Judges evaluate saved final outputs.

Decision:

- Update skill-eval guidance to say exactly what the current harness proves.
- Do not claim trigger-routing proof until a true no-skill/routing mode exists.
- Do not claim artifact-generation proof until workspace-write artifact mode exists.
- Keep behavior-only final-answer evals as valid, but label them honestly.

Potential artifact mode:

```json
{
  "metadata": {
    "sandbox": "read_only"
  }
}
```

Future values could include `workspace_write`, but only for the staged temporary workspace and only with clear safety gates.

### Runner Corrections

Must-do:

- Remove `criteria.json` from candidate/release scenario staging. Criteria are evaluator evidence and should not be visible to the solver.
- Use the real skill name in the skill attachment instead of always `candidate`.
- Keep side identity in evidence separately from skill attachment name.

Current staging copies `task.md`, `criteria.json`, `scenario.json`, `turns.json`, and `capability.txt`. This leaks the scoring rubric into the solver workspace. The stage should include user task inputs and resources, not evaluator criteria.

### Judge Corrections

Judges are useful, but two corrections are required.

First, threshold enforcement must apply before trusting `result.pass`.

Current issue:

- the judge prompt asks for both `overall` and `pass`
- `judgePassed` returns `result.pass` immediately when present
- a judge can return `pass: true` while `overall` is below `criteria.json` threshold

Required behavior:

```ts
function judgePassed(result, threshold) {
  const overall = typeof result.overall === "number" ? result.overall : 0;
  if (threshold?.overall_min !== undefined && overall < threshold.overall_min) return false;
  for (const [name, min] of Object.entries(threshold?.dimensions || {})) {
    const value = Number((result.dimensions as any)?.[name] ?? 0);
    if (value < min) return false;
  }
  if (typeof result.pass === "boolean") return result.pass;
  return overall >= 3;
}
```

Second, judges should judge saved run evidence, not current project state.

Current issue:

- `judgeRun` loads current scenarios from `.meta-skill/evals/scenarios`
- it reads final output from the saved run folder
- if `criteria.json`, `task.md`, or `turns.json` changed after the run, old final evidence may be graded against new criteria

Required behavior:

- judge from the scenario snapshot captured during the run
- read task, turns, criteria, and metadata from saved run evidence or a run snapshot
- if snapshots are missing in older runs, report that the judge used current scenario definitions and mark the evidence basis accordingly

### Evidence Summary And `report.json`

The raw evidence model is strong enough for debugging and manual review:

- `run.json`
- `events.jsonl`
- `results.jsonl`
- `tests.jsonl`
- `grades.jsonl`
- `feedback.jsonl`
- per-side `final.md`
- per-side `turns.jsonl`
- per-side `rpc.jsonl`
- token usage
- artifacts folder

It is not strong enough for comparison, release readiness, or a future UI without replaying multiple JSONL files.

Decision:

- Add normalized `report.json` beside `report.html`.
- Make the HTML renderer consume `report.json` instead of independently parsing JSONL.
- Add `.meta-skill/evals/runs/index.json` with one summary row per run.
- Keep raw JSONL as the source-of-truth audit trail.

Minimum `report.json` shape:

```json
{
  "run": {},
  "summary": {},
  "scenarios": [],
  "tests": [],
  "judges": [],
  "feedback": [],
  "comparisons": [],
  "artifacts": [],
  "readiness": {}
}
```

The normalized report should include:

- run-level counts and readiness
- scenario-side rows
- candidate/baseline/release pairing
- judge/test/feedback rollups
- unresolved evidence
- artifact list
- links to raw files
- source skill/release hashes
- token availability

Add a `refreshRunEvidence(project, runId)` flow and call it after:

- eval run
- eval judge
- eval feedback import
- lint annotations with `--run`

### Static Evidence Browser

Build a static evidence browser first, not a complex product.

Useful local UI:

- reads `.meta-skill/evals/runs/**/report.json`
- shows run list
- shows scenario matrix
- shows evidence detail pane
- shows comparison view
- shows release readiness card

Run list should include:

- run ID
- label
- created/completed time
- status
- assessment status
- comparison mode
- failure classes
- unresolved count
- token availability

Scenario matrix should include:

- one row per scenario
- candidate/baseline/release columns
- final status
- deterministic tests
- judge scores
- feedback labels
- unresolved evidence

Evidence detail pane should include:

- task
- follow-up turns
- final answer
- trace links
- token usage
- deterministic test output
- judge rationale
- feedback notes
- artifacts

Comparison view should include:

- candidate vs baseline/release final output
- token delta
- judge delta
- feedback differences

Release readiness card should include:

- blockers
- unresolved evidence
- latest run basis
- required human gates
- release snapshot metadata
- package digest

No database is needed. The run folder remains the source of truth.

### Manifest Integration Check

Lane `agents/openai.yaml` files currently use an `interface` shape, while `meta-skill create` scaffolds generated skills with top-level `name` and `description`.

Decision:

- If both schemas are supported, document that explicitly.
- Otherwise, update scaffolding or lint so generated skills have the expected Codex manifest shape.
- Add a lint check for the expected `agents/openai.yaml` shape and alignment with `SKILL.md` frontmatter.

### Skill Prompt Updates

Update `skill-create` guidance:

- quote or escape YAML frontmatter values when they contain punctuation
- do not recommend release until project mode exists
- mention that generated `agents/openai.yaml` should match the current Codex schema

Update `skill-eval` guidance:

- current App Server scenario runs force the staged skill
- use deterministic metadata tests or manual review for true trigger/non-trigger routing until routing mode exists
- criteria are evaluator evidence and should not be staged into candidate workspaces
- after `eval judge` or `eval feedback import`, refresh/open the regenerated report
- include a table explaining which evidence source supports which claim:
  - execution completed
  - deterministic pass
  - judge pass
  - human pass
  - release-ready

Update `skill-improve` guidance:

- each plan edit should cite at least one evidence ref
- clarify `decide --reject`; today it records intent but does not restore files
- preferably add rollback behavior later
- use before/after hashes when promoting from an older plan

Update `AGENTS.md`:

- release requires project mode and should cite run/review/session evidence supporting readiness
- trigger scenarios are not routing proof under the forced-skill harness
- standalone judge and feedback imports must regenerate the report/readiness summary

### Must-Do Implementation Sequence

Immediate correctness fixes:

1. Remove `criteria.json` from candidate/release staging in `cli/src/app-server/runner.ts`.
2. Fix judge threshold enforcement in `cli/src/eval/judge.ts`.
3. Add saved scenario snapshots or criteria/task hashes, then make judges grade against saved run evidence.
4. Add `refreshRunEvidence(project, runId)` and call it after run, judge, feedback import, and lint annotations.
5. Require a full workbench before release, or call `createWorkbench` before release writes.
6. Clarify `decide --reject`, preferably with rollback.

Validation:

- test that `criteria.json` is not present in stage/scenario
- test that `pass: true` with `overall < overall_min` fails
- test that `eval judge` and `feedback import` update `report.html` and `report.json`
- test release behavior for portable-only skills

### Phase 1: Evidence Summary And Readiness

Must-do for future UI and release confidence:

1. Add `RunReport` types to `cli/src/models.ts`.
2. Make `writeEvalReport` build `report.json` first, then render HTML from it.
3. Add `assessment_status`, `unresolved`, and `readiness` fields.
4. Add `.meta-skill/evals/runs/index.json`.
5. Add `release --from-run <run-id>` and record readiness in `version.json`.

Validation:

- snapshot-test `report.json`
- verify report/index refresh after every annotation command
- verify release metadata includes source run and readiness summary

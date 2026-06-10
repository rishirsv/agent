# Anthropic Skill-Creator Eval Flow Alignment

## Purpose

Compare Anthropic's public `skill-creator` eval flow with Meta Skill's current
`skill-evaluator`, then identify small modifications that keep Meta Skill
aligned or stronger in:

- eval writing
- eval organization
- eval running
- eval assessment

This is a planning pass only. Do not implement runner or schema changes in this
plan.

## Sources Inspected

- Anthropic `skill-creator/SKILL.md`:
  `https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md`
- Anthropic `skill-creator/references/schemas.md`:
  `https://github.com/anthropics/skills/blob/main/skills/skill-creator/references/schemas.md`
- Anthropic grader, comparator, analyzer agents:
  `https://github.com/anthropics/skills/tree/main/skills/skill-creator/agents`
- Anthropic eval scripts:
  `https://github.com/anthropics/skills/tree/main/skills/skill-creator/scripts`
- Anthropic trigger runner script:
  `https://github.com/anthropics/skills/blob/main/skills/skill-creator/scripts/run_eval.py`
- Anthropic engineering article, "Demystifying evals for AI agents":
  `https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents`
- Local Anthropic-generated example:
  `/Users/rishi/Library/Application Support/Claude/local-agent-mode-sessions/5ac06423-9e2a-4797-921b-779ee39b7582/b6bc9619-b6e0-409b-8c25-15e9358e33b9/local_8b92d271-4c6e-4c05-bbe8-aed7e1607135/outputs/kpmg-branded-docs/`
- Current Meta Skill evaluator:
  `meta-skill/skills/skill-evaluator/`,
  `meta-skill/src/meta_skill/`,
  `meta-skill/references/cli.md`

## Short Comparison

Anthropic's flow is prompt-first and human-review-first. It starts with 2-3
realistic prompts in `evals/evals.json`, runs with-skill and baseline in the
same iteration, drafts assertions while runs are in progress, grades outputs,
shows qualitative and quantitative results in a viewer, reads human feedback,
then iterates.

Meta Skill is more durable and file-backed. It uses `.meta-skill/evals.json`,
case folders, hidden rubrics/validators, persistent run directories, App Server
events, `results.jsonl`, `grades.jsonl`, and deterministic Markdown/JSON
reports. The tradeoff: authoring is heavier, and the baseline/current/candidate
impact loop is not implemented yet.

## Current Strengths To Keep

- Meta Skill's hidden boundary is stronger: solver sees `task.md`, listed
  fixtures, and candidate payload only. Rubrics, validators, expected outputs,
  and judge prompts stay grader-side.
- Run evidence is more durable: `run.json`, `progress.jsonl`, `results.jsonl`,
  `grades.jsonl`, App Server events, compact evidence, and final outputs are all
  file-backed.
- Candidate identity is stronger: candidates record source kind/ref, commit,
  dirtiness, payload path, and `payload_digest`.
- Deterministic validation is first-class through `validate.*` and shared
  grading rows.
- `eval report` already separates runner completion from behavioral grades.

## Borrow From Anthropic

### Eval Writing

Anthropic gets the first authoring move right: write a few realistic prompts
first, then add assertions after seeing what the runs produce. The local
`kpmg-branded-docs` example shows this clearly: two rich, realistic prompts with
plain expected output prose and no assertions yet.

Meta Skill should keep its workbench structure, but make the initial authoring
path feel just as light:

- Start each new suite with 2-3 realistic prompts.
- Include a human-readable expected-output note before writing rubrics.
- Ask the user to confirm the prompts before running.
- Add objective expectations or validators only after the prompt is accepted.
- Do not force assertions onto subjective cases; use qualitative review or a
  rubric instead.

### Eval Organization

Anthropic organizes by iteration and case:

```text
<skill-name>-workspace/
  iteration-1/
    <eval-name>/
      with_skill/
      without_skill/
      eval_metadata.json
```

Meta Skill should not copy this layout. Our `.meta-skill/runs/<run-id>/` model
is cleaner for agents and gitignored workbenches. But we should borrow two
small ideas:

- Give cases descriptive names, not just opaque IDs.
- Make reports group baseline/current/candidate results by case so the user
  sees one comparison row per scenario.

### Eval Running

Anthropic launches with-skill and baseline runs together for each prompt. The
important principle is not parallelism; it is same prompt, same iteration, same
comparison context.

Meta Skill should implement the same principle via a single `eval run` that
contains `baseline`, `current`, and optional edited candidates in one run
directory. Parallel execution can stay deferred.

### Subagents And Runner Isolation

Anthropic uses two different isolation patterns, depending on what is being
evaluated.

For normal task-output evals, `skill-creator` asks Claude Code to spawn paired
subagents for each eval case:

- `with_skill`: gets the same task prompt plus the skill path.
- `without_skill`: gets the same task prompt with no skill for a new skill, or
  an older skill snapshot for an existing skill.
- each run writes into its own output directory under the same iteration and
  eval case.
- a separate grader agent reads the transcript and outputs and writes
  `grading.json`.
- an optional comparator agent can do blind A/B review without knowing which
  output came from the skill.

This is good practical isolation, but it is not hermetic sandbox isolation. The
main boundary is context discipline plus separate output folders. The subagents
are told what skill path or baseline condition they have, and the grader is a
separate reader rather than the same agent self-grading its work.

For trigger/description evals, Anthropic uses script-level isolation instead:
`run_eval.py` creates a temporary slash-command file in `.claude/commands/`,
runs `claude -p` in a subprocess, watches the stream events to detect whether
the temporary command/skill was invoked, then cleans up the command file. It
also supports repeated query runs and parallel execution through a process pool.
This isolates the trigger test from the authoring conversation better than a
manual prompt would, but it still relies on the local Claude runtime rather than
a container or filesystem sandbox.

Meta Skill should borrow the paired-run comparison and separate grader roles,
not the exact mechanics. Our staged case workspace is already stricter for
quality evals: the solver should only receive `task.md`, listed fixtures, and
the selected candidate payload, while hidden rubrics, validators, expected
outputs, and judge prompts remain grader-side. The next implementation should
therefore focus on baseline/current/candidate runs in one durable run folder,
not on adding subagent orchestration, process pools, or an HTML viewer.

### Eval Assessment

Anthropic's strongest assessment ideas are:

- expectations are pass/fail with evidence
- grader checks the actual transcript and outputs, not just claims
- grader critiques weak evals, especially assertions that would pass a bad
  output
- analyzer looks for always-pass, always-fail, high-variance, and cost/time
  tradeoff patterns
- optional blind comparison exists for subjective output quality

Meta Skill already has grade rows and reports, but should add an explicit
assessment layer over the grades.

## Additional Principles From Anthropic's Evals Article

Anthropic's engineering article generalizes the skill-creator flow into a
broader agent-eval discipline. The parts most relevant to Meta Skill:

- **Use clear eval nouns.** A task is one test case, a trial is one attempt, a
  grader scores some aspect of the trial, a transcript is the full trajectory,
  and the outcome is the final state or artifact to judge. Meta Skill already
  has `case`, `trial`, `grade`, and event/evidence files; we should explicitly
  map `case = task` and teach agents to distinguish transcript evidence from
  outcome evidence.
- **Choose grader type by job.** Use deterministic graders where exact checks
  are possible, model graders for nuanced open-ended quality, and human review
  for calibration or expert taste. This matches our validator/rubric/human
  grade-row model.
- **Separate capability and regression uses.** Capability evals should include
  tasks the skill does not fully solve yet; regression evals should protect
  known-good behavior. We should not make this a heavy schema in the baseline
  task, but the authoring docs should teach the difference.
- **Grade outcomes before paths.** Tool-call or transcript checks are useful,
  but overly rigid step requirements can punish valid solutions. Prefer grading
  the artifact or final state; check tool usage only when it is part of the
  skill's actual contract.
- **Make tasks unambiguous and solvable.** A good case is one where two domain
  experts would reach the same pass/fail verdict. If possible, include a
  reference solution or expected artifact to prove the grader is configured
  correctly.
- **Balance positive and negative cases.** Trigger and boundary evals should
  include both should-trigger and should-not-trigger near misses. One-sided
  evals create one-sided optimization.
- **Use repetitions only when they answer a real question.** Repetitions expose
  variance. Report per-case success rates when repeated, but do not add
  significance machinery to ordinary skill work.
- **Read transcripts when results are surprising.** Low scores can mean agent
  failure, but they can also mean ambiguous tasks, brittle graders, or harness
  constraints. Transcript review is part of trusting the suite.
- **Treat suites as living artifacts.** Add cases from real failures, keep
  ownership clear, and retire or reclassify saturated capability cases into
  regression checks.

## Remaining Gaps In Meta Skill

1. Eval authoring still reads heavier than Anthropic's prompt-first flow.
2. Grading does not yet critique eval quality: weak assertion, missing
   expectation, always-pass, always-fail, or cannot-verify.
3. Trigger evals exist conceptually, but no dedicated description-trigger loop
   with should-trigger and should-not-trigger near misses.
4. Reports do not yet summarize time/token/tool-call tradeoffs by candidate.
5. Reports do not yet make the transcript/outcome distinction obvious enough:
   a transcript may show effort, but the artifact or final state is what should
   usually decide success.
6. Authoring docs do not yet ask for reference solutions or expert-solvability
   checks before trusting a case.

Shipped alignment: no-skill candidate sources, per-case impact summaries,
`expectations[]`, explicit `graders[]`, and gate semantics.

## Suggested Modifications

### 1. Baseline Impact

`.plans/meta-skill/baseline-impact-comparison.md` has shipped. Anthropic
alignment acceptance criteria:

- A single run must be able to contain `baseline`, `current`, and at least one
  edited candidate.
- The prompt bytes must stay identical across candidates.
- `eval report` should group by case and show the comparison outcome.
- Impact category names stay candidate-only:
  `candidate_improves`, `candidate_regresses`, `both_fail`,
  `baseline_already_succeeds`, `needs_human_review`.
- The report should name whether each impact decision came from outcome/artifact
  evidence, transcript evidence, validator evidence, rubric evidence, or human
  review.

Parallelism and an HTML viewer remain out of scope.

### 2. Add A Prompt-First Authoring Reference

Update `skill-evaluator` docs after baseline support lands:

- Add a short "Prompt-first authoring" section to `references/evaluations.md`.
- Say to start with 2-3 realistic prompts and expected-output prose.
- Say to ask the user to confirm prompts before running.
- Say to add rubrics/validators/expectations only after the prompt shape is
  accepted.
- Include the KPMG example shape as a model: rich task prompt, expected output,
  empty files list.
- Add an unambiguous-task check: the case should be clear enough that another
  expert can tell whether the output passed.
- Add a reference-solution recommendation for deterministic or artifact-heavy
  cases: prove the grader can pass a known-good result.

This is docs-only and should be small.

### 3. Simple Expectations Without Replacing Rubrics

Meta Skill now has a lightweight expectation checklist as a bridge between
Anthropic-style assertions and Meta Skill's existing validators/rubrics.

Recommended shape:

```json
{
  "id": "pdf-partner-brief",
  "type": "quality",
  "task": {"seed": "..."},
  "expectations": [
    "Output is a PDF named partner_brief.pdf",
    "Output contains an At a Glance section",
    "Output includes the exact pull quote",
    "Chart shows consensus counts 18/18 and 17/18"
  ]
}
```

Implemented shape:

- Materialize `expectations` into hidden case metadata, not `task.md`.
- Model graders receive expectations as hidden checks alongside rubric context.
- Deterministic validators remain the preferred path for exact checks.
- Rubrics remain the preferred path for subjective quality.

Draft-case generation can later emit `expectations[]`, but the runtime and docs
already support them.

### 4. Teach The Grader To Critique Eval Quality

Borrow Anthropic's "a passing grade on a weak assertion is false confidence"
principle and the article's warning that brittle graders or ambiguous tasks can
make good agents look bad.

Add optional assessment fields to model-grader output or report synthesis:

- non-discriminating expectation
- missing important expectation
- expectation cannot be verified from available artifacts
- output claim not checked by any expectation
- always passes both baseline and skill
- always fails both baseline and skill
- task appears ambiguous
- grader appears to require behavior not specified in the task
- transcript suggests a valid alternate solution was penalized

Do not block promotion on these at first. Surface them in `eval report` under
an "Eval Quality Notes" section.

### 5. Add Capability/Regression Purpose Guidance

Do not add heavy split terminology. Do add a light authoring distinction:

- **Capability cases** measure whether a skill can climb toward a desired
  behavior and may start with low pass rates.
- **Regression cases** protect behavior that already works and should stay near
  100%.

This can be docs-only initially. If it becomes useful in reports, add an
optional manifest field later such as `"purpose": "capability"` or
`"purpose": "regression"`.

### 6. Add Candidate Comparison Notes To `eval report`

After baseline impact lands, add report notes similar to Anthropic's analyzer:

- cases where baseline already succeeds
- cases where both fail
- cases with inconsistent repetition results
- cases with missing usage
- large time/token deltas by candidate, if usage exists
- cases that need human review because grading is missing or subjective
- cases where repeated trials disagree
- cases that look saturated and should move from capability to regression
- cases with transcript/outcome mismatch

This should be read-only report logic, not new runner behavior.

### 7. Keep Trigger Description Optimization Later

Anthropic has a strong dedicated loop for description triggering:

- 20 realistic queries
- should-trigger and should-not-trigger labels
- near-miss negatives
- repeated runs per query
- held-out test selection
- best description chosen by test score

Meta Skill should not copy this into baseline impact. Track it as later work
under seed evals or autoresearch, because it is a different question from
quality impact.

## Proposed Ordering

1. Add eval-quality notes to `eval report`.
2. Update evaluator docs with prompt-first authoring and baseline/current/candidate
   examples, including unambiguous-task and reference-solution checks.
3. Extend `eval-generate-draft-scaffolds.md` so generated cases include
   realistic prompts plus expected-output prose and optional expectations.
4. Add capability/regression purpose guidance, docs-first.
5. Later: add trigger-description optimization as a focused lane or command.

## Validation For Future Work

- `python3 meta-skill/src/characterize_meta_skill.py`
- `META_SKILL_SKIP_DEP_UPDATE=1 scripts/meta-skill validate meta-skill/skills/skill-evaluator --json`
- Fixture suite with `baseline`, `current`, and one candidate.
- Fixture case modeled after `kpmg-branded-docs`:
  - PDF prompt
  - expected-output prose
  - expectation checklist
  - baseline/current/candidate report with impact classification
- Golden Markdown/JSON report covering:
  - baseline already succeeds
  - candidate improves
  - candidate regresses
  - both fail
  - needs human review
  - weak/non-discriminating expectation note
  - transcript/outcome mismatch note

## Stop Rules

- Do not build an HTML viewer before Markdown/JSON reports carry the core
  comparison.
- Do not add parallel execution unless run time becomes the blocker.
- Do not introduce train/dev/held-out terminology into ordinary quality evals.
- Do not make expectations mandatory for subjective cases.
- Do not replace rubrics or validators; expectations are a lighter authoring
  bridge.

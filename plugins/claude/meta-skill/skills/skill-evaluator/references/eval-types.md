# Eval Types And Grader Choices

Read when choosing what kind of eval suite to create and which graders belong
with each task.

An eval suite should answer one decision. Name that decision first, then choose
the smallest task set and grader mix that can answer it.

## Vocabulary

Use these terms consistently:

| Term | Meaning |
|---|---|
| **Task** | One unit of work with defined inputs and success criteria. |
| **Condition** | The agent-harness setup: no skill, current skill, or edited-skill attempt. |
| **Trial** | One attempt at one task under one condition. |
| **Outcome** | The final answer, files, artifacts, or state at the end of the trial. |
| **Transcript** | The full event record: messages, tool calls, reasoning summaries, intermediate results, and errors. |
| **Grader** | Code, model, or human logic that scores one aspect of the trial. |
| **Assertion / check** | One named expectation inside a grader. |
| **Gate** | A required grader whose failure blocks promotion even when other scores improve. |

The current Meta Skill schema still stores conditions in `candidates[]` and
task rows in `cases[]`; keep those field names in JSON and use the vocabulary
above in prose.

## Choose The Eval Type

| Type | Question it answers | Good starting size | Typical graders |
|---|---|---:|---|
| **Capability / quality** | What can this skill do well, and where does it still struggle? | 3-10 tasks for a local loop; 20-50 for a serious first suite | Model rubric, reference output, deterministic checks where possible |
| **Regression** | Does behavior that already worked still work? | Any known-good task bank | Deterministic validators first; model rubric only for semantic quality |
| **Trigger / boundary** | Does the right skill activate, and does it stay quiet on near misses? | Balanced should-trigger and should-not-trigger tasks | Transcript/tool-use checks, model rubric, repeated trials |
| **Failure / diagnostic** | Did a known failure get fixed? | 1-3 focused tasks | Reproduction task plus exact validator or anchored rubric |
| **Gate / readiness** | Is this safe enough to package, publish, or use as a promotion gate? | Small must-not-break set | Required deterministic checks, calibrated rubric, human spot check when high judgment |
| **Cost / latency / efficiency** | Did the condition get slower, more expensive, or noisier? | Same tasks as capability/regression | Transcript metrics: turns, tool calls, tokens, latency |

Do not mix all types into one claim. A suite can contain multiple task types,
but the report should say which question each group answers.

## Choose The Grader Mix

Use the most exact grader that can fairly judge the requirement:

| Grader | Use for | Avoid when |
|---|---|---|
| **Code validator** | Required files, schema shape, exact strings, test results, state checks, tool-call constraints, token/turn counts | Valid outputs vary widely and exact matching would reject reasonable answers |
| **Model rubric** | Clarity, completeness, judgment, usefulness, tone, groundedness, source quality, instruction following | The expected behavior can be checked exactly by code |
| **Human grade** | Taste, domain expertise, high-stakes judgment, or calibrating model rubrics | It would become the only evidence for every ordinary run |

Prefer grading the outcome over the path. Use transcript graders for process
requirements such as tool choice, unsafe tool use, excessive turns, or whether a
failure was caused by the harness rather than the skill.

Give model graders a way out: allow `unknown` or `needs_human_review` when the
outcome lacks enough evidence. Do not force a confident score from incomplete
evidence.

Use gates for must-not-break checks: prompt-boundary leaks, package exclusions,
forbidden file edits, schema validity, safety constraints, or deterministic
regressions. Gates should usually be code validators. A candidate that fails a
gate is not selectable even when its rubric score is higher.

## Write Good Tasks

Every task should pass this checklist before it becomes gating evidence:

- A capable agent following the task instructions could pass it.
- The expected behavior is visible in `task.md`; hidden graders do not demand
  unstated requirements.
- A domain reviewer could independently decide pass/fail from the outcome.
- A reference solution or expected output exists when the task is deterministic
  or artifact-heavy.
- The task is isolated: it does not depend on leftover files, prior trials,
  hidden state, or global machine setup not declared as fixtures.
- The problem set is balanced when measuring activation: include should-trigger
  and should-not-trigger tasks.
- Repetitions are used when trigger behavior, model grading, or agent behavior
  is variable.

If many trials score 0%, suspect the task, grader, or harness before concluding
the agent is incapable.

## Skill Eval Examples

Use these as patterns when authoring evals for Meta Skill lanes or ordinary
agent skills.

### 1. Capability / Quality Task

Goal: measure whether the skill helps produce a better final artifact.

```text
task.md
Create a portable skill from the supplied notes about recurring vendor invoice
extraction. Produce a SKILL.md outline with trigger, inputs, output contract,
invariants, and validation guidance.
```

Hidden graders:

- `rubric.md`: scores trigger specificity, output contract, runtime usefulness,
  and contamination avoidance.
- `expected.md`: reference outline showing the required sections.
- optional `validate.*`: checks that the output contains the required headings.

Run under these conditions when supported:

- no skill
- current skill
- edited-skill attempt

### 2. Trigger / Boundary Task

Goal: measure activation without naming the skill.

```text
task.md
I have a repeated workflow from a few prior threads. Turn it into something
reusable so future agents do it the same way.
```

Hidden graders:

- model rubric checks whether the response routes to skill-writing behavior.
- transcript check may verify that the target skill or lane was invoked.

Pair it with a near-miss:

```text
task.md
Summarize this one thread for me. Do not make anything reusable.
```

The near-miss should not trigger skill-writing behavior.

### 3. Regression Task

Goal: protect behavior that already works.

```text
task.md
Review this existing skill and produce findings only. Do not edit the payload.
```

Hidden graders:

- validator checks no payload file changed.
- rubric checks that findings include evidence, impact, and recommended action.

Regression tasks should stay close to 100% once the behavior is considered
working.

### 4. Failure / Diagnostic Task

Goal: prove one known failure is fixed.

```text
task.md
The previous version copied source URLs and model names into runtime guidance.
Create the skill without leaking source provenance into SKILL.md.
```

Hidden graders:

- validator scans the outcome for copied source URLs, provider names, and raw
  provenance markers.
- rubric checks whether the reusable behavior survived source distillation.

### 5. Gate / Readiness Task

Goal: decide whether a skill can be packaged or promoted.

```text
task.md
Given this candidate skill payload, decide whether it is ready to package.
Name any missing review, validation, eval, or reference evidence.
```

Hidden graders:

- validator checks links and package exclusions.
- rubric checks that missing evidence is reported as a gap, not invented.
- human spot check if the readiness decision depends on subjective judgment.

## Report Guidance

When closing an eval run, report:

- what decision the suite was meant to answer
- task count by type
- conditions compared
- grader mix used
- outcome summary by task
- transcript notes only where they explain failures or unfair grading
- coverage limits and untested behavior
- whether failures look like target failures, task ambiguity, grader bugs, or
  harness constraints

Do not present a green suite as full proof. Say what it measured.

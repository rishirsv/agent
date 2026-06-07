# Eval Authoring

Read this when turning `.meta-skill/eval-scenarios.md` rows into executable evals under `.meta-skill/evals/<slug>/`.

Good evals are not just valid files. They are small experiments that expose whether the skill changes behavior in the exact places it is supposed to help.

## Evidence First

Start with error analysis before authoring evals. Read real traces, saved run evidence, user feedback, support notes, or previous failed attempts before deciding what to test. The goal is to turn observed failures into reusable checks, not to invent a scoreboard.

Use this order:

1. **Collect examples.** Prefer real traces or saved run evidence. If none exist, use synthetic tasks only as a temporary starting point.
2. **Open-code failures.** Write short notes about what went wrong. Focus on the first upstream failure before downstream symptoms.
3. **Group failure modes.** Cluster repeated notes into a small failure taxonomy.
4. **Choose high-value failures.** Prioritize failures that are frequent, costly, surprising, or uniquely addressed by the skill.
5. **Author evals.** Turn those failures into tasks, fixtures, and binary criteria.

If you have no examples, create a small starter set, run it through the actual skill workflow, then review the resulting traces before expanding the suite. Do not keep scaling synthetic evals that have not been grounded in real behavior.

## Surface Truth

Eval authoring may describe only workflow surfaces that actually exist in the current skill project. Do not invent commands, generated reports, flags, scores, or run IDs.

Current safe pattern:

- author or inspect files under `.meta-skill/evals/<slug>/`
- inspect saved evidence under `.meta-skill/runs/<run-id>/` when it exists
- run deterministic tests only when the skill project already provides them

Use selected evals, labels, no-skill baselines, comparison modes, judges, or generated reports only when current files or saved evidence prove that exact surface exists. Otherwise describe the need as a future or manual step. Do not invent options, run IDs, baseline comparisons, pass/fail scores, token usage, or evidence paths that have not been produced.

When writing an honest run plan:

- say which files must be authored before running
- name the workflow action you know is supported
- say what evidence should exist after a successful run
- say what remains unproven until the run and review actually happen
- keep baseline or solver-comparison language as manual analysis unless a supported compare command exists

## Core Loop

Write each eval in this order:

1. **Name the observed or plausible failure.** What did traces show, or what would a capable base agent likely miss, overdo, omit, misuse, or invent?
2. **Name the first upstream cause.** Is the failure from task understanding, source use, tool behavior, output shape, safety boundary, validation, or follow-through?
3. **Apply task pressure.** Shape the user task so that failure is likely without the skill guidance.
4. **Specify the expected lift.** Name the better behavior the skill should produce.
5. **Define deliverables.** Make the expected output inspectable: files, sections, artifacts, decisions, checks, or explicit final answer shape.
6. **Write binary criteria.** Each criterion should have a pass/fail answer from saved evidence.
7. **Check for leakage.** Keep criteria, expected answers, and scoring hints out of `task.md`.

If the eval would pass equally well without the skill, it is too easy. If a human cannot inspect the result against the criteria, it is too vague.

## What Makes An Eval Good

A good eval has all of these:

- **Real user pressure:** The task resembles a request someone would actually make.
- **A hidden trap:** There is a plausible mistake the skill is meant to prevent.
- **Concrete outputs:** The answer has artifacts or sections that can be inspected.
- **Skill-specific lift:** At least one criterion checks behavior that should improve because of this skill.
- **Observable evidence:** Every criterion points to saved run files, declared artifacts, human review, or explicitly captured validation output.
- **Binary judgment:** Each criterion can be marked pass or fail without a rating scale.
- **Representative source:** The task comes from real traces or a deliberately sampled scenario dimension.
- **Reviewable by an expert:** A person who understands the user need could decide whether the outcome is acceptable.
- **No rubric leakage:** The solver sees the task, not the evaluator's checklist.

Bad evals ask whether the answer is "good." Good evals ask whether the answer did the hard thing.

Do not optimize for a perfect pass rate. A suite that always passes is often too easy or too generic. Good evals keep pressure on failures that matter.

## From Scenario Row To Eval

Map the Scenario Plan row like this:

| Scenario Plan field | Authoring use |
|---|---|
| `Scenario` | Eval folder slug and `task.md` title. |
| `Phase focus` | Primary pressure point, not the only criterion phase. |
| `User task shape` | Starting point for the realistic user request. |
| `Baseline risk` | The failure hypothesis and at least one validation criterion. |
| `Expected skill lift` | Output specification and success behavior. |
| `Dimensions exercised` | Criteria dimensions. Add rows, do not invent a new framework. |
| `Source basis` | Fixture, source file, user-provided evidence, external source class, or reference to inspect for grounding. |

Do not copy the Scenario Plan row verbatim into `task.md`. Expand it into a realistic assignment with enough context and constraints to create meaningful behavior.

## Sampling And Coverage

Eval coverage should be representative, not merely comprehensive-looking.

Use these sampling moves when choosing scenarios:

- **Real trace sample:** Start with traces from actual or prior runs whenever available.
- **Feedback-led sample:** Include tasks tied to user complaints, human review notes, failed eval runs, or support-style issues.
- **Outlier sample:** Include unusually long, tool-heavy, ambiguous, or high-friction traces.
- **Stratified sample:** Cover major user types, input shapes, source types, or workflow stages.
- **Small-cluster sample:** Include rare but important edge cases instead of only the most common happy path.

Synthetic scenarios are acceptable when no real data exists, but make them structured. Define variation dimensions first, create concrete tuples by hand, then turn those tuples into realistic tasks. Avoid asking an LLM for generic test prompts. Run synthetic tasks through the real workflow and review the traces before treating them as durable evals.

Do not use synthetic data without expert review for complex domain-specific content, high-stakes workflows, underrepresented user groups, or cases where realism cannot be checked.

## Task Pressure

Use one or more of these pressure moves:

- **Constraint pressure:** Add version, format, file, policy, stakeholder, or output constraints that the skill should handle.
- **Omission pressure:** Ask for a result where an important field, check, or decision is easy to forget.
- **Boundary pressure:** Include an adjacent task the skill should refuse, defer, or route around.
- **Source pressure:** Provide source material where the answer must preserve facts, labels, wording, or relationships.
- **Multi-artifact pressure:** Require several outputs whose consistency can be inspected.
- **Follow-up pressure:** Add a later user turn only when real users would revise, challenge, or add information.

Pressure is not trickery. The task should be fair, but it should make the important behavior necessary.

## Weak To Strong Task Examples

Weak:

```md
## Task

Use the skill to summarize these notes.
```

Why it is weak:

- It names the skill.
- It has no realistic context.
- It does not say what output must preserve.
- It does not create a likely failure.

Strong:

```md
## Problem Description

I have messy meeting notes with decisions, rejected options, owners, and follow-up dates. The team will use the result as the project record.

## Output Specification

Return a concise decision record with sections for final decision, rejected options, rationale, open questions, owners, and follow-ups. Preserve names and dates exactly from the source.

## Task

Turn `fixtures/meeting-notes.md` into the decision record we can share with the team.
```

Why it is strong:

- The source must be used.
- The deliverable has inspectable sections.
- The likely failure is omission or source drift.
- Criteria can check exact preserved details.

## `task.md`

`task.md` is solver-visible. Keep parser metadata out of it.

```md
# <Scenario Title>

## Problem Description

<realistic context, constraints, and stakes>

## Output Specification

<explicit deliverables, files, sections, artifacts, or answer shape>

## Task

<actual user request>
```

Use `## Turn 2`, `## Turn 3`, and later turns only for realistic follow-up user behavior. Do not put criteria, scoring hints, hidden expected answers, or "use the skill" phrasing in `task.md`.

Fixtures are optional. Use them when the task depends on files, screenshots, source packets, generated review worksheets, or other solver-visible evidence. Do not invent fixtures just to make an eval look more complete. Knowledge-work and research evals often need no local fixture; their evidence may be the final response, transcript, cited sources, or captured validation output instead.

## Criteria Thinking

Write criteria after the task, not before. Criteria should inspect what the task made necessary.

For each criterion, ask:

- What exact behavior should be visible?
- What mistake would count as failure?
- Where will the evidence appear?
- Can a reviewer answer pass or fail without guessing intent?
- Would a domain expert agree this question measures user-visible quality?

Use criteria to check both presence and restraint. A good eval often needs one row for what the solver must do and one row for what it must not do.

Avoid rating scales and broad quality labels. If gradual progress matters, split the behavior into multiple binary checks. For example, replace "factual accuracy 1-5" with separate checks for each required fact, unsupported claim, source citation, or preserved field.

Use generic metrics only as exploration signals for finding traces to review. Do not turn "helpfulness", "quality", "coherence", similarity scores, or token usage into success criteria unless the failure mode is specific and validated against human judgment.

## `criteria.json`

`criteria.json` is evaluator-only JSON.

```json
{
  "fixtures": [
    {
      "path": "fixtures/source.md",
      "description": "Solver-visible source material"
    }
  ],
  "tests": [],
  "metadata": {
    "baseline_risk": "<what a base agent may miss>",
    "expected_skill_lift": "<what the skill should improve>"
  },
  "criteria": [
    {
      "criterion": "<observable check>",
      "phase": "Quality",
      "dimension": "<dimension>",
      "question": "<binary pass/fail question>",
      "evidence": "child result block",
      "max_score": 25
    },
    {
      "criterion": "<observable check>",
      "phase": "Implementation",
      "dimension": "<dimension>",
      "question": "<binary pass/fail question>",
      "evidence": "child result block, compact report, selected child-thread evidence",
      "max_score": 25
    },
    {
      "criterion": "<observable check>",
      "phase": "Validation",
      "dimension": "<dimension>",
      "question": "<binary pass/fail question>",
      "evidence": "child result block, selected child-thread evidence, captured validation output",
      "max_score": 25
    }
  ]
}
```

Phases are fixed: `Quality`, `Implementation`, and `Validation`. Use `max_score` when you want the result row or report to expose weighted-checklist totals; omit it only when all criteria should have equal review weight. Do not create separate score files during authoring.

Dimensions are dynamic but additive. Start with the shared base dimensions from `.meta-skill/eval-scenarios.md`, then add skill-specific dimensions only when the scenario needs them.

## Strong Criteria

Strong criteria are narrow and inspectable:

- `Required sections present`
- `Source names preserved`
- `Approval gate respected`
- `Rejected options captured`
- `No unsupported facts added`
- `Output follows requested schema`

Weak criteria are vague or self-referential:

- `Good answer`
- `Helpful`
- `Uses the skill well`
- `High quality`
- `Complete enough`
- `Sounds professional`

Prefer questions that force evidence:

Weak:

```json
{
  "criterion": "Good summary",
  "phase": "Quality",
  "dimension": "Completeness",
  "question": "Is the summary good?",
  "evidence": "response"
}
```

Strong:

```json
{
  "criterion": "Required decisions captured",
  "phase": "Implementation",
  "dimension": "Required Content Capture",
  "question": "Does the response include every final decision, rejected option, owner, and follow-up date present in the source?",
  "evidence": "response, fixtures"
}
```

## Automation Choices

Do not build automated evaluators for every row. Match the evaluator to the failure mode and cost:

- Use deterministic tests for schemas, required files, exact strings, known facts, formatting, or command outcomes.
- Use simple assertions before model judges when a rule can be checked cheaply.
- Use human review for nuanced product judgment, domain quality, source faithfulness that requires expertise, and new failure discovery.
- Use model judging only for scoped binary classification after the failure mode is well understood and examples exist.

Deterministic tests are not automatically frozen as per-eval run artifacts. If a criterion depends on test results, cite the validation output explicitly in the handoff or save it as an artifact. Fix obvious prompt or instruction gaps before building evaluator machinery around them. Automated evaluators are most valuable for failures that persist after the simple fix.

## Human Review

Every new eval suite should have a clear quality decision maker. Prefer one domain expert or product owner who understands the users and can make final calls on ambiguous outcomes.

Use that reviewer to:

- Validate that the task is realistic.
- Confirm the baseline risk matters.
- Rewrite vague criteria into binary checks.
- Review synthetic scenarios for realism.
- Decide whether a failure is user-visible or only implementation trivia.

Engineers should still inspect technical traces, tool calls, and deterministic test failures. The expert should judge whether the user goal was met.

## Coverage Recipe

Author three to five evals that create different kinds of pressure:

- **Normal workflow:** A realistic task the skill should handle smoothly.
- **Hard ambiguity:** A task with unclear inputs, competing goals, or missing details.
- **Source-grounding:** A task where preserving source facts matters.
- **Safe stop:** A task that asks for an action needing approval, external writes, or a boundary decision.
- **Multi-turn:** A realistic follow-up that should change or refine the answer.

Do not make five versions of the same happy path. If two evals would use the same criteria and fail the same way, merge or replace one.

## Multi-Turn And Agentic Evals

Use multi-turn evals only when the failure requires conversation context. If a single-turn task can expose the issue, prefer the simpler eval.

When reviewing multi-turn or agentic evidence:

- Judge the whole user goal first with a binary pass/fail question.
- Inspect the child result block first, then open selected child-thread/worktree evidence when tool calls or intermediate steps matter.
- Identify the first upstream failure before scoring downstream symptoms.
- Add process criteria only when the process affects outcome quality, safety, cost, or debuggability.
- For follow-up behavior, prefer real conversation prefixes when available.

For complex workflows, criteria should cover both outcome and process. Outcome checks ask whether the final user-visible result met the requirement. Process checks ask whether necessary approvals, tool choices, source reads, writes, or validation steps happened correctly.

## Subagent Sampling

When sampling eval behavior with subagents, keep the subagent prompt aligned with `task.md`. The subagent should feel like it is answering a real maintainer or end user, not participating in a test harness.

Follow the shared patterns in `../../../references/subagent-patterns.md`:

- Put isolation, file-scope, and read-only rules in the harness envelope.
- Put only the realistic user request in the solver-visible task.
- Do not expose `criteria.json`, expected answers, scoring notes, parent hypotheses, or comparison goals.
- Do not tell the solver it is running a test, benchmark, grader pass, or self-eval case.
- Parent agents own scoring, trace review, edits, and final validation.

Weak subagent task:

```md
Use the skill and send back the result.
```

Strong subagent task:

```md
I need concrete API-docs eval files from these accepted scenarios. Please draft the task files, criteria, fixture declarations, flat deterministic checks, and an honest run plan.
```

## Calibration Pass

Before running the eval, do a quick mental baseline:

1. Imagine a capable agent without the skill answering `task.md`.
2. Mark which criteria it would likely miss.
3. Imagine the skill-mounted answer.
4. Confirm the expected lift is visible in criteria.

If both imagined answers pass the same rows, strengthen the task pressure or criteria. If neither answer could reasonably pass, simplify the task or split it into two evals.

## Authoring Checklist

- `task.md` reads like a real user request.
- `task.md` makes the skill-relevant behavior necessary.
- `task.md` does not leak criteria or hidden expected answers.
- `Output Specification` names inspectable deliverables.
- `criteria.json` has at least one Quality, Implementation, and Validation criterion.
- Every criterion is binary and has observable evidence.
- Criteria avoid generic metric theater.
- At least one criterion checks baseline risk.
- At least one criterion checks expected skill lift.
- The eval is grounded in real traces, saved evidence, feedback, or a justified synthetic sampling dimension.
- A domain expert or product owner could review the task and criteria for realism.
- Fixtures are declared and solver-visible only when needed.
- Deterministic tests live directly under `.meta-skill/tests/` when code can judge the behavior, and their command output is captured when used as evidence.

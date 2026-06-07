# Subagent Patterns

Read this when using subagents to speed up Meta Skill creation, eval authoring, eval response sampling, or evidence-backed improvement.

Subagents are useful when they act as isolated users, reviewers, or maintainers. They are less useful when they receive the parent's whole rationale, hidden criteria, or harness language. The parent owns orchestration, scoring, edits, and final judgment.

## Defaults

Use subagents by default when the work is read-only and parallelizable:

- sampling two or more authored `task.md` prompts
- reviewing a non-trivial `improve-skill` edit
- checking whether a newly drafted skill works for a realistic user request
- comparing independent interpretations of a broad eval or review surface

Use subagents only on request, or after a short parent pass, when the work needs edits:

- creating the first skill payload
- patching `SKILL.md`, references, scripts, or tests
- changing shared library/runtime code

When a subagent edits, give it a disjoint file scope and merge centrally. Never let two subagents edit the same skill file or generated evidence folder.

## Isolation Rules

- Start subagents with a compact brief, not the full parent conversation.
- Provide only the files, screenshots, fixtures, or task text needed for the slice.
- Keep evaluator-only files, scoring rubrics, criteria, expected answers, and parent hypotheses out of solver contexts.
- Keep subagents read-only unless a write scope is explicit and disjoint.
- Tell subagents not to inspect unrelated files or parent-thread context.
- Tell subagents not to spawn nested subagents.
- Treat subagent output as behavior evidence or review evidence, not proof.
- Parent agents perform final scoring, edits, validation, and user reporting.

## Prompt Split

Keep the harness envelope separate from the user task. The envelope may constrain files, write permissions, and output shape. The user task should read like a real maintainer or end-user request.

Do not put these phrases in the user task sent to a solver subagent:

- "you are running a test"
- "you are running a benchmark"
- "self-eval case"
- "grader"
- "hidden criteria"
- "do not read criteria.json"
- "prove this eval passes"

Use this envelope shape:

```md
Work in /path/to/project. Use only the provided files and instructions. Do not edit target payload, generated package, docs, or source files. Do not inspect unrelated project files or parent-thread context. Do not spawn nested subagents. Return the answer you would give the maintainer.
```

Use this user-task shape:

```md
I have a reusable skill draft for turning backend route source into API docs. Please create the concrete task files, review criteria, fixture plan, and deterministic shape checks I should review before running it.
```

The first block is runtime control. The second block is the work being sampled. Keep them visually and conceptually separate.

## Pattern: Skill Draft Trial

User story: A maintainer wants a skill to be built, rapidly reviewed by an isolated subagent, and iteratively updated before the maintainer has manually used it.

Parent flow:

1. Draft the skill payload and review the changed files plus any deterministic tests that exist for that skill.
2. Pick one realistic user request the skill should handle.
3. Spawn a read-only subagent with the skill context and realistic request.
4. Compare the response against hidden expectations in the parent context.
5. Patch the skill through `improve-skill` only when the evidence shows a real behavior gap.
6. Rerun the same isolated request or a nearby variant.

Envelope:

```md
Work in /path/to/project. Read only the provided skill files and fixtures. Do not edit target payload, generated package, docs, or source files. Do not inspect unrelated files or parent-thread context. Return the answer you would give the user.
```

User task:

```md
I have three supplier invoice PDFs and need one normalized CSV of line items. Please give me the extraction workflow, validation checks, and final handoff format you would use.
```

## Pattern: Parallel Eval Sampling

Use this when several authored eval tasks can run independently.

Parent flow:

1. Verify each `task.md` is solver-visible and realistic.
2. Spawn one read-only subagent per task.
3. Give each subagent only the task, fixtures, and relevant lane guidance.
4. Keep `criteria.json`, expected answers, and scoring notes in the parent context.
5. Aggregate responses centrally and record which criteria need human, deterministic, or trace review.

Envelope:

```md
Work in /path/to/project. Use only the provided task and fixture files. Do not edit target payload, generated package, docs, or source files. Do not inspect unrelated files or parent-thread context. Return the completed response you would give the maintainer.
```

User task:

```md
Our team has accepted three scenarios for an API-docs skill. Please turn them into concrete runnable task files, evaluator criteria, fixture declarations, and flat deterministic shape checks.
```

## Pattern: Adversarial Improve Review

Use this after a meaningful Improve Skill edit or when deciding whether evidence justifies a patch.

Parent flow:

1. Make the smallest evidence-backed edit locally.
2. Spawn a read-only reviewer with the changed files, relevant evidence, and exact risk focus.
3. Ask for actionable findings only.
4. Patch only findings that point to real behavior, evidence, or validation gaps.
5. Repeat until the reviewer has no actionable findings or the remaining risk is accepted.

Envelope:

```md
Work in /path/to/project. Review only the provided files and evidence. You may write `.meta-skill/review.md` only when the review artifact is explicitly in scope; do not edit target payload, generated package, docs, or source files. Do not inspect unrelated files or parent-thread context. Do not spawn nested subagents.
```

User task:

```md
Please review whether this skill improvement still permits unsupported edits, synthetic validation claims, stale references, or missing deterministic coverage. Return only actionable findings with file and line evidence; if there are none, say that and name residual risk.
```

## Pattern: Routing Surface Check

Use this when frontmatter descriptions or `agents/openai.yaml` prompts change.

Parent flow:

1. Run deterministic routing-surface checks locally.
2. Ask a read-only reviewer to inspect current routing surfaces for user-facing language and trigger clarity.
3. Patch general guidance or validation rules, not just the one string that failed.

Envelope:

```md
Work in /path/to/project. Inspect only the provided routing-surface files and command output. Do not edit target payload, generated package, docs, or source files. Do not inspect unrelated files or parent-thread context.
```

User task:

```md
Please check whether these skill descriptions and default prompts sound like user-facing requests, name the right job, avoid implementation plumbing, and invoke the correct skill names.
```

## Reporting Back

When using subagents, report:

- which pattern ran
- whether subagents were read-only or had a disjoint write scope
- what each subagent saw
- what evidence came back
- what the parent changed or declined to change
- which validation commands ran afterward

Do not report a subagent response as a pass unless a deterministic check or explicit parent review supports that statement.

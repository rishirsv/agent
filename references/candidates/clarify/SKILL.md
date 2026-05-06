---
name: clarify
description: "Ask clarifying questions before planning or implementation. Use when the user wants the minimum questions needed to proceed safely, wants to discuss an idea, or explicitly wants a deeper discussion-style interview. End with a short Common Understanding summary; create docs-only artifacts only when requested."
---

# Clarify

## Goal

Reduce ambiguity before planning or implementation, then leave a usable shared-understanding artifact.

This skill has two modes:
- `standard`: ask the minimum clarifying questions needed to avoid wrong work
- `discuss`: explore the topic through a deeper interview until there is shared understanding

Do not start implementing until the needed unknowns are resolved, or the user explicitly approves proceeding with stated assumptions.

## Required Output

Always finish with `Common Understanding`, even if the request is still blocked.

For final summaries and durable docs artifacts, use this structure:

```md
# Common Understanding

## Agreed
- ...

## Open
- ...

## Next
- ...
```

Rules:
- Keep it short, concrete, and decision-oriented.
- Do not turn it into an execution plan.
- Read `references/common-understanding.md` when you need guidance on what belongs in `Agreed`, `Open`, or `Next`, including canonical terms, ADRs, and doc propagation.

For live clarification or discussion turns, do not end with a topic label alone. End with an explicit `Next Question` section that asks the actual question the user should answer.

Use this structure:

```md
[Short reflection of what you learned.]

## Why This Matters
[Plain-language explanation, especially for technical topics.]

## Common Understanding

### Agreed
- ...

### Still Open
- ...

## Next Question
[One explicit question.]

My recommendation: [plain default answer.]
```

Live conversation rules:
- Use `Still Open` instead of `Open` in chat when it feels more natural.
- Only include `Why This Matters` when it helps the user understand the decision.
- Never end a live clarify turn on a noun phrase such as `Decide active workout treatment`.
- The final line should make the next user action obvious.

## Optional Durable Artifacts

Create a durable artifact only when the user wants one.

Artifact rules:
- Write durable artifacts only under `docs/`; do not write source files from this skill.
- Inspect existing repo docs first and preserve established canonical doc families when they exist.
- If the user wants an artifact but does not specify which one, default to a context doc.
- If the repo has a canonical spec template or docs skill, follow that existing structure instead of inventing a parallel format.
- Default to a context doc when no stronger repo convention exists. Read `references/context-format.md` only if you need to create one.

## Mode Selection

Default to `standard` mode.

Switch to `discuss` mode when the user wants to talk through an idea, concept, direction, tradeoff, or fuzzy problem before committing to a plan or implementation.

Use especially thorough `discuss` mode when the user explicitly says `discuss` or otherwise asks for a deeper interview, for example:
- `discuss this`
- `let's discuss`
- `talk this through with me`
- `stress-test this`
- `interview me on this`
- `keep asking until we really understand it`
- `question this thoroughly`

Do not auto-switch into `discuss` mode just because the task is vague.

## Shared Rules

- If a question can be answered with a quick, low-risk discovery read, inspect first instead of asking
- Do not ask the user to decide things the repo or docs already answer
- Prefer questions that eliminate whole branches of work
- Sharpen fuzzy or overloaded language into canonical terms when that would reduce ambiguity
- If the user's description conflicts with existing code or docs, surface the contradiction directly
- Restate your understanding before proceeding
- For technical topics, explain the decision in plain language before asking the question
- Translate important jargon briefly instead of assuming the user already has the implementation model in their head
- Do not produce a detailed plan or implementation direction that depends on unresolved must-have unknowns
- Use the `RequestUserInput` or `AskUserQuestion` tool when available; otherwise, ask in plain text

## Standard Mode

- Use this when the goal is to get just enough information to proceed safely.
- Treat the request as underspecified when multiple plausible interpretations still exist after low-risk discovery.
- Ask 1-5 must-have questions first.
- Make questions easy to answer: short numbered questions, multiple-choice when possible, reasonable defaults, and a compact reply path such as `defaults` or `1b 2a`.
- Until must-have answers arrive, do not run commands, edit files, or produce a detailed plan that depends on unknowns.
- If the user asks you to proceed anyway, state assumptions briefly and ask for confirmation.
- Once the needed answers are in, restate the requirements in 1-3 sentences and end with `Common Understanding`.
- When more clarification is still needed, end with `Next Question`, not a passive `Next` item.

## Discuss Mode

- Use this when the user wants to talk through an idea, or explicitly wants deeper questioning or pressure-testing.
- Start with low-risk discovery if docs or code can answer obvious questions.
- Walk the decision tree one branch at a time: problem, scope, stakeholders, core flow, constraints, edge cases, success criteria.
- Ask one focused question at a time and keep going until you can describe the solution or direction without guessing.
- For each question, provide your recommended answer or default.
- Use concrete scenarios when they expose hidden ambiguity or ownership.
- If the user explicitly says `discuss`, be more thorough than standard clarification: probe assumptions, tradeoffs, failure modes, and what would change the answer.
- If the topic is technical, add a short `Why This Matters` explanation before the next question. Use plain words and concrete examples.
- Stop when there is shared understanding, the user says to stop, or the remaining unknowns are clearly optional.
- End with `Common Understanding` and create any requested docs artifact under `docs/`.

## Anti-Patterns

- Do not ask questions the repo can answer with a quick read
- Do not ask open-ended questions if a tight choice would resolve ambiguity faster
- Do not turn standard mode into a full interview
- Do not turn discuss mode into a batch questionnaire
- Do not end a live conversation with a `Next` topic that is not phrased as a question
- Do not use dense implementation terms without a plain-language explanation
- Do not sharpen terminology by inventing a taxonomy the user does not need
- Do not write docs artifacts unless the user asked for a durable artifact or clearly wants one
- Do not create docs outside `docs/` for this skill
- Do not proceed to implementation while must-have unknowns remain unresolved

## Tools

Use the following tools to present clarification questions if available:

- `AskUserQuestion`
- `RequestUserInput`

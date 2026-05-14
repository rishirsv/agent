---
name: idea
description: "Use to grill, refine, and ground a serious idea before execution. Good for product ideas, strategy, workflows, documents, presentations, research directions, plugins, skills, features, or other knowledge work where the idea is not ready to become a plan or implementation. Ask one question at a time, always recommend an answer, challenge vague or conflicting language, ground only in durable docs or relevant source reality, and end with a clear next decision, artifact, research handoff, plan handoff, implementation handoff, or decision to stop. Do not use for routine edits, direct implementation, code review, narrow clarification, accepted plans, or small requests already clear enough to execute."
---

# Idea

Use this skill to pressure-test an idea until it is clear enough to decide, capture, plan, research, hand off, or stop.

<what-to-do>

Interview me about the idea until we reach shared understanding. Walk the idea tree one branch at a time, resolving dependent decisions before moving on. Ask one question at a time. Always provide your recommended answer.

If a question can be answered by inspecting durable docs, user-provided materials, or relevant source reality, inspect those instead of asking.

Do not implement. Do not write a detailed execution plan while idea-level decisions remain unresolved.

</what-to-do>

<supporting-info>

## Grounding

Ground only in durable docs and relevant source reality.

Use durable docs such as:

- product specs, PRDs, briefs, and strategy docs
- architecture, design, context, domain, or decision docs
- durable research or source materials provided by the user
- relevant source files, schemas, tests, examples, or generated artifacts when the idea depends on how something actually works

Ignore non-durable operational artifacts unless the user explicitly names them.

Prefer existing project-native docs over creating a new document family.

## Turn Contract

Use this shape during the interview:

```md
**Question:** <one precise question>

**Options:**
- **A.** <option>
- **B.** <option>
- **C.** <option, only if useful>

**Recommended Answer:** <pick one option, or name a hybrid, and explain why>

**Context:** <optional; current read, durable-doc grounding, source evidence, ambiguity, tension, contradiction, or why this question matters>
```

Rules:

- Always include `Question`.
- Always include `Recommended Answer`.
- Include `Options` unless the question is naturally yes/no.
- Include `Context` only when it adds signal.
- Put `Context` last.
- Keep `Context` to 1-3 sentences.
- Ask the question in plain English.

For yes/no questions, omit `Options`:

```md
**Question:** Should manual approval remain required in the first version?

**Recommended Answer:** Yes. Keep manual approval required unless we explicitly change the governance model.

**Context:** The strategy brief frames human review as part of the trust model, but the idea currently implies auto-publishing.
```

## During The Session

Challenge language immediately when a term is vague, overloaded, or inconsistent with durable docs or source reality. Propose a canonical meaning and name rejected meanings when useful.

Use concrete scenarios to test boundaries between terms, ownership, workflow states, audiences, artifacts, roles, relationships, permissions, lifecycle transitions, or system behavior.

When the user describes how something works, check available durable docs or relevant source reality. If they disagree, surface the contradiction before continuing.

Treat each answer as one of:

- decision
- canonical term
- constraint
- assumption
- non-goal
- open trail
- validation expectation
- artifact-routing choice
- future-agent instruction

Keep this record compact, but do not lose durable decisions.

## Durable Capture

Default to chat unless the result will guide future work.

When durable capture is needed, update the smallest existing project-native artifact. If no suitable artifact exists, recommend the smallest useful shape:

- **Idea note**: shared understanding, constraints, assumptions, non-goals, open trails
- **Domain/context note**: canonical terms, relationships, ownership boundaries, flagged ambiguity
- **Product/spec brief**: outcome, audience, behavior, acceptance criteria
- **Decision record**: only for decisions that are hard to reverse, surprising without context, and the result of a real trade-off
- **ExecPlan**: only when implementation sequencing is the next durable artifact

When creating one of these fallback artifacts, read `assets/templates.md` and use only the matching template.

Do not create competing sources of truth.

## Ending

End with **Idea Direction** when the idea is clear enough to hand off, capture, decide, or stop:

```md
## Idea Direction

**Direction:** <chosen direction>

**Locked:** <settled decisions, terms, constraints, and non-goals>

**Open:** <unresolved trails, or `None`; say if blocking>

**Durable Output:** <chat only, existing doc updated, or recommended artifact>

**Next Move:** <decision, artifact, research handoff, plan handoff, implementation handoff, or stop>
```

If the idea is not clear enough, keep asking the next highest-leverage question instead of ending.

## Guardrails

- Do not ask a giant questionnaire.
- Do not ask the user to answer what durable docs or source reality can answer.
- Do not turn every answer into a document.
- Do not use operational docs as idea truth.
- Do not over-explain the process in the visible response.
- Do not create an execution plan until the idea has settled enough to support one.
- Do not implement inside Idea.

</supporting-info>

# Artifacts

Default to a chat synthesis. Write a durable artifact only when it helps preserve decisions, support handoff, or continue later.

## Rules

- Follow repo convention first.
- Update an existing relevant artifact instead of creating a duplicate.
- Keep artifacts lean.
- Label assumptions and unverified claims.
- Do not write product code from this skill.

## Software/Product Spec

Use when decisions are durable enough to guide planning or implementation.

Default path when the repo has no stronger convention:

`docs/product-specs/<feature-slug>-spec.md`

Required sections:

- `TL;DR`
- `Scope`
- `What We Are Building`
- `Requirements`
- `Acceptance Criteria`

Optional sections only when useful:

- `User Stories`
- `How It Works`
- `Context`
- `Assumptions`
- `Open Questions`
- `Risk And Failure Analysis`
- `Verification`

## Brainstorm Note

Use when the conversation produced useful options or a direction but is not yet a spec.

Default path inside a repo:

`docs/brainstorms/<topic>-brainstorm.md`

Default path outside a repo:

`<topic>-brainstorm.md`

Lean sections:

- `TL;DR`
- `Goal`
- `Options Considered`
- `Decision Or Direction`
- `Open Questions`
- `Next Step`

## Discovery Note

Use when discovery mode produced ranked candidates worth preserving.

Default path inside a repo:

`docs/brainstorms/<topic>-discovery.md`

Lean sections:

- `TL;DR`
- `Grounding`
- `Ranked Ideas`
- `Rejected Ideas`
- `Recommended Next Step`

## Decision Matrix

Use for option comparisons.

- Put options as rows and evaluation criteria as columns.
- Bold the recommended option.
- Include a one-line rationale below the table.

## Naming Exploration

Use for naming work.

- List 5-15 candidates grouped by theme.
- For the top 3, include why it works, what it risks, and staying power.
- End with a recommendation and reasoning.

# Subagents

Use subagents when independent generation or parallel context gathering will materially improve the brainstorm. Do not use them by default.

## Depth

- **Solo**: no subagents.
- **Light**: 1 subagent.
- **Standard**: 2-3 subagents.
- **Deep**: 4-5 subagents.

Use fewer agents for quick questions, narrow features, or when the next step depends on one local inspection. Use more for broad discovery, cornerstone product surfaces, architecture-heavy topics, or "surprise me" requests.

Prefer strong current reasoning models for idea-generating agents. A cheaper capable model is fine for bounded grounding. The user may prefer GPT-5.4 LoRA or the latest configured strong model for creative/product/architecture ideation.

## Rules

- Keep delegated asks concrete and bounded.
- Give the subagent the topic, files or docs to inspect, and exact output needed.
- Ask for raw candidates or evidence, not final decisions.
- Treat subagent output as material to synthesize, not as authority.
- Continue useful non-overlapping work while subagents run.
- Do not delegate urgent blocking work when the main thread needs the result immediately.

## Roles

### Grounding Scout

Use for repo or context discovery.

Task:
- read authoritative docs and adjacent code
- summarize what exists
- identify constraints and active commitments
- flag duplicate-doc or duplicate-owner risks
- return evidence with file paths when possible

Output:
- context summary
- relevant files/docs
- constraints
- leverage points
- warnings

### Product / UX Ideator

Use for app, product, flow, surface, or experience ideas.

Task:
- generate user-facing concepts, flows, states, and interaction models
- identify missing empty/loading/error/success states
- preserve the product's local design identity
- explain what the experience should feel like

Output:
- 5-8 raw ideas or 2-4 UX variants
- warrant for each
- why it matters
- risk or tradeoff

### Architecture / Ownership Ideator

Use for implementation-shape thinking.

Task:
- identify likely owners and boundaries
- flag data, runtime, persistence, and verification implications
- find ways to reduce future complexity
- reject duplicate truth and fallback-heavy shapes

Output:
- ownership/boundary candidates
- implementation implications
- risks
- verification needs

### Contrarian / Leverage Ideator

Use when the obvious ideas may be too incremental.

Task:
- invert assumptions
- ask what can be removed
- look for compounding moves
- propose non-obvious but grounded directions
- include explicit reasoning when evidence is indirect

Output:
- surprising candidates
- warrant or reasoning
- expected leverage
- why this is not just novelty

### Implementation Shape Agent

Use after one candidate idea is selected, especially in development mode.

Task:
- produce 2-4 UX/system variants
- compare flow, ownership, data needs, and risk
- stop before writing an implementation plan

Output:
- variants
- pros/cons
- recommended direction
- open questions before planning

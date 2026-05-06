# Repo Grounding

Use this file for repo/software/product/UX brainstorms.

## Read First

Start from authoritative local context:

- `AGENTS.md`
- `README.md` when present
- work tracker, roadmap, or backlog docs
- relevant product specs, project specs, active plans, completed plans, and brainstorm notes
- adjacent source files and tests
- existing examples of the same pattern

Follow repo convention over generic skill defaults. If the repo names canonical docs or workflows, use those names and paths.

## What To Extract

Return or internally track:

- what already exists
- current commitments in tracker/spec/plan docs
- relevant architecture or ownership rules
- adjacent implementation patterns
- behavior contracts or parity sources
- obvious gaps, risks, or stale docs
- "do not duplicate this" warnings

Verify checkable claims in code or docs before presenting them as fact. Label unverified claims as assumptions.

## Repo Doctrine Examples

Adapt to each repo's `AGENTS.md`. For Steady-like native app work, the useful grounding set is usually:

- `AGENTS.md`
- `WORK-TRACKER.md`
- `DESIGN.md`
- `docs/ARCHITECTURE.md`
- `docs/PARITY_CHECKLIST.md`
- relevant active/completed exec plans
- relevant feature files
- shipped Expo reference only when behavior parity matters

For repos that prefer one canonical implementation, penalize ideas that add fallback paths, duplicate owners, compatibility wrappers, or parallel trackers unless the user explicitly asks for transition support.

## When To Ask Instead

Ask the user only when:

- the subject is still ambiguous after a quick doc/code read
- repo docs conflict and the user must choose direction
- the answer depends on intent, taste, or business priority that the repo cannot know

Keep questions short and offer a recommended default when possible.

# TODO

## Completed: Idea Skill

Status: promoted to `plugins/rs-tools/skills/idea`.

Purpose: grill and refine serious ideas before planning or implementation.

Modes:
- ask one question at a time with options and a recommended answer
- challenge vague, overloaded, or conflicting language
- ground in durable docs and relevant source reality
- route durable captures into existing docs or compact fallback templates

Notes:
- Replaces the active need for a separate `brainstorm` skill.
- Keeps research as a support layer, not a standalone default workflow.
- Durable outputs route into existing repo artifact conventions: contexts, product specs, or ExecPlans.

## Rebuild Coding Skill

Goal: one excellent skill for simplification, refactoring, tech debt, and architecture cleanup.

References:
- `references/candidates/coding/tech-debt`
- `references/candidates/coding/simplify`
- `references/candidates/coding/refactor`
- `references/candidates/coding/yeet`

Direction:
- Merge refactor, tech-debt, and simplify into one sharp coding-improvement skill.
- Keep `hard-cut` separate as a strict cleanup policy.
- Treat `idea` as the pre-workflow owner for serious ideas before planning or implementation.
- Keep explicit requirements clarification in the separate `clarify` skill.
- Avoid heavy candidate matrices unless the user explicitly asks for deep analysis.
- Default to the highest-leverage cleanup that can be executed and verified safely.

## Rebuild Design Skill

Goal: one strong design skill, not several overlapping triggers.

References:
- `references/candidates/design/frontend-skill`
- `references/candidates/design/polish-design`
- `references/candidates/design/design-init`
- `references/candidates/design/interface-mockups`
- `references/candidates/design/create-design-system`
- `references/system/imagegen`

Direction:
- Prioritize repo design context such as `docs/DESIGN.md`.
- Keep screenshot-based polish, critique, hardening, and mockup modes.
- Preserve the strongest interface-writing and micro-polish guidance.
- Avoid duplicating or fighting Codex's built-in frontend instructions.

## Presentation References

Goal: keep OAI and presentation material as references for KPMG/deck work, not active plugin skills.

References:
- `references/oai/artifact`
- `references/oai/skills`
- `references/oai/presentations`

Direction:
- Mine for deck generation, artifact rendering, and presentation quality rules.
- Keep out of `plugins/rs-tools` until there is a clean, portable deck workflow.
- Use Anthropic financial-services plugins as structural inspiration for KPMG workflows.

## External Plugin References

Goal: use Anthropic plugin repos as examples for role-based plugin design and domain workflow packaging.

References:
- `references/anthropic/knowledge-work-plugins`
- `references/anthropic/financial-services-plugins`

Direction:
- Study plugin shape, command naming, connector boundaries, and skill granularity.
- Do not install these directly from `rs-tools`.
- Borrow structure and patterns only when they improve our own skills.

---
name: brainstorm
description: Flexible pre-plan thinking for discovery, ideation, brainstorming, interviewing, and pressure-testing. Use only when the user explicitly asks to brainstorm, ideate, generate ideas, think through options, shape an idea, pressure-test an approach, get interviewed, or says "grill me" or "surprise me". Works for general decisions, creative exploration, and repo-aware software/product/UX work. Do not auto-activate.
---

# Brainstorm

Turn uncertainty into a clear next direction before planning or implementation.

This skill owns both idea discovery and idea development. Do not create or invoke a separate ideation workflow unless the user explicitly asks for a different skill.

Stay in brainstorm mode:

- Do not implement code or modify product code.
- You may read the repository and create or update documentation when it helps preserve decisions.
- Treat the workflow as scaffolding, not a script. Keep the conversation natural and right-sized.

## Core Principles

- Route first. Match the workflow to how much the user already knows.
- Ground repo/software work in current repo truth before making serious recommendations.
- Separate generation from evaluation. Explore first, then narrow.
- Ask what the user is already thinking when developing or pressure-testing an idea; in discovery mode, generate a candidate set before over-interviewing.
- Use subagents only when independent discovery or broad context gathering will materially improve the result.
- The main agent owns synthesis, critique, and recommendations. Do not outsource direction-setting to subagents.
- Offer recommended defaults when decisions are unresolved.
- Prefer the smallest sensible scope and the clearest next step.
- If the repo can answer a question, inspect the repo instead of asking.

## Phase 0: Route The Brainstorm

Choose one mode:

- **Discover**: The user wants new ideas, directions, opportunities, "what should we improve," "ideate on X," "surprise me," or a ranked candidate set. Read `references/discovery-mode.md`.
- **Develop**: The user has one rough idea and wants to shape product, UX, implementation, scope, or tradeoffs. Read `references/development-mode.md`.
- **Pressure-test**: The user has an approach, plan, architecture, or decision and wants critique, risks, or pushback. Read `references/pressure-test-mode.md`.
- **Direct**: No brainstorm is needed because the request is concrete, factual, or better answered directly. Say so briefly and answer without ceremony.

If the topic is non-software or mixed-domain, also read `references/universal-brainstorming.md` and adapt the selected mode to the topic's native domain.

If the topic is repo/software/product/UX work in an existing codebase, read `references/repo-grounding.md` before asking avoidable questions or recommending directions.

Use `references/examples.md` only when you need conversation-shape guidance.

## Phase 1: Size The Conversation

Pick the lightest depth that will help:

- **Quick**: 1-3 exchanges, no durable artifact by default.
- **Standard**: enough exploration to compare options and converge.
- **Deep**: high ambiguity, high stakes, broad repo impact, or cornerstone product/UX work.

For discovery mode, map depth to subagent use:

- **Solo**: no subagents; quick or low-stakes.
- **Light**: 1 subagent, usually Grounding Scout.
- **Standard**: 2-3 subagents, usually Grounding Scout plus Product/UX and/or Architecture.
- **Deep**: 4-5 subagents, adding Contrarian/Leverage and Implementation Shape when useful.

Read `references/subagents.md` before delegating. Do not use subagents when local inspection is faster, the result is on the critical path, or the user only needs a quick reaction.

## Phase 2: Work The Selected Mode

### Discover

Generate strong candidate ideas from a topic, repo area, surface, or open-ended opportunity.

- Ground first.
- Generate candidates before evaluating them.
- Use independent lenses when depth justifies subagents.
- Require each serious idea to have a warrant: repo evidence, user-provided context, external evidence, or explicit reasoning.
- Merge, dedupe, and combine ideas.
- Reject weak ideas before showing the user.
- Present 3-7 ranked survivors with why they fit, UX implication, implementation implication, risks, and the recommended next step.

### Develop

Shape one rough idea into clearer product, UX, and implementation direction.

- Understand the idea and what the user is already thinking.
- Ground in repo truth when relevant.
- Ask the next useful question, not a questionnaire.
- Explore 2-3 plausible shapes when real alternatives remain.
- Recommend one direction with tradeoffs.
- Stop before writing an implementation plan unless the user explicitly asks to move into planning.

### Pressure-Test

Challenge an existing direction before it hardens into a plan or code.

- Restate the proposal.
- Check it against repo truth or stated constraints.
- Identify risks, hidden assumptions, simpler alternatives, and failure modes.
- Recommend proceed, revise, split, or drop.

## Artifact Rules

Default output is a chat synthesis, not a file.

Write a durable artifact only when it will help:

- The user asks for one.
- The topic is large, cross-cutting, or easy to forget.
- Decisions need handoff to planning or implementation.
- The conversation produced durable decisions worth preserving.

Read `references/artifacts.md` before creating or updating a document.

When writing artifacts inside a repo:

- Follow repo convention first.
- Update an existing relevant doc instead of creating a duplicate.
- Ground claims in repo evidence and label assumptions.
- Do not write product code from this skill.

## Finish Cleanly

Always end with a concise synthesis:

- What the user is trying to do.
- The current frontrunner or direction.
- What is in scope and out of scope.
- The main constraints.
- Open questions or assumptions.
- The recommended next step.

If you created or updated a document, include the path and a short recap.

## Anti-Patterns

- Keeping a separate ideation path that duplicates brainstorm.
- Forcing every brainstorm into a feature spec.
- Starting with repository scans when the repo is irrelevant.
- Asking questions a quick repo/doc read can answer.
- Offering a full solution before understanding the problem.
- Critiquing options while still generating them.
- Preserving every idea instead of narrowing.
- Using subagents as a default swarm.
- Letting subagents decide product direction for you.

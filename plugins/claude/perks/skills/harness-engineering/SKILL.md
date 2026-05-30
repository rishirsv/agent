---
name: harness-engineering
description: "Use when assessing a repository or project for agent-readiness and harness-engineering opportunities such as repo maps, validation harnesses, feedback loops, observability, architecture enforcement, subagent workflows, and progressive-disclosure docs, producing a report-only Markdown assessment with downstream ExecPlan and architecture artifact options; not for ordinary code cleanup or architecture-debt tracking (use $code-quality), PR review (use $gh-review), or directly implementing the changes the assessment proposes."
---

# Harness Engineering

Evaluate how a project can make agents more effective by improving repo maps, executable feedback loops, enforceable boundaries, local reproducibility, observability, and agent-legible source-of-truth artifacts.

## Contract

- Produce an assessment, not an implementation, unless the user separately asks for follow-up artifact creation.
- Stay technology-agnostic. Treat specific tools such as browser automation, worktrees, LogQL, PromQL, GitHub, or simulator tooling as examples of harness roles, not requirements.
- Follow project-native conventions when they are discoverable and reasonable. Use this skill's defaults only as fallback.
- Avoid numerical scores. Use priority/action bands, evidence, and concrete tradeoffs.
- Write for both the human project owner and future agents who may implement the follow-up work.
- Group findings by opportunity theme. Do not produce a file-by-file diff checklist, but include representative files, commands, docs, modules, or runtime surfaces.
- Compare current state to target harness-engineered state for each meaningful opportunity.
- Include existing harness strengths so future agents preserve what already works.

## First Move

1. Read repo guidance first: `AGENTS.md`, `README.md`, package/workspace files, docs indexes, architecture docs, planning docs, CI config, scripts, tests, and any local agent/skill/plugin guidance.
2. Create a temporary working log before deep scanning. Prefer `.codex/tmp/harness-engineering/findings.md` when the path is ignored or accepted by the repo; otherwise use `/tmp/harness-engineering-<repo-name>/findings.md`.
3. Record the repo path, timestamp, initial map, scan phases, subagent assignments, evidence, candidate themes, confirmed opportunities, and open questions in `findings.md`.

Update `findings.md` after major repo-map discoveries, after each subagent result, before long-running checks, and before final synthesis.

## Deep Scan Workflow

1. Build an initial repo map: domains, package layout, runtime surfaces, tests, scripts, CI, docs, data boundaries, ownership signals, local boot paths, release paths, and agent instructions.
2. Choose scan slices adaptively after the initial map. Split by repo area, domain, layer, runtime, docs/tests surface, or harness theme based on what best exposes cross-cutting opportunities.
3. Use high-intelligence subagents when available and permitted for the session. If subagents are unavailable, perform the same slices yourself and log each slice in `findings.md`.
4. Keep the assessment read-mostly. Safe non-mutating commands are allowed for discovery or verification, such as listing scripts, dry-run help, test discovery, static config inspection, or focused non-mutating checks. Avoid mutating, destructive, network-heavy, long-running, or environment-changing commands unless the user explicitly asks.
5. Read `references/harness-lenses.md` for the evaluation lenses before synthesizing themes.
6. Read `references/assessment-report-template.md` before writing the final Markdown report.

## Subagent Pattern

Use repo-adaptive prompts. Assign the smallest slices that can reveal cross-cutting harness opportunities without duplicating work.

Require each subagent to return:

- Scope inspected.
- Evidence, including representative paths and commands.
- Candidate themes.
- Opportunities.
- Non-opportunities or already-good harnesses.
- Open questions and confidence notes.

Useful default slices:

- Repository knowledge and progressive-disclosure docs.
- Architecture boundaries and enforceable invariants.
- Runtime legibility, observability, and validation loops.
- Agent workflow, CLI ergonomics, and local reproducibility.
- Entropy control, recurring cleanup, and technical-debt capture.

## Assessment Synthesis

Synthesize into a polished Markdown report. Ask the user where to write it; propose `docs/harness-engineering-assessment.md` when the repo has a `docs/` folder. If the user wants chat-only output, provide the report in chat and keep scratch artifacts temporary.

Every opportunity should include:

- Theme.
- Opportunity title.
- Current state.
- Target harness state.
- Evidence and representative surfaces.
- Why it matters for agent leverage.
- Recommended implementation grain: whole-codebase refactor, focused ExecPlan, small patch, recurring automation, or documentation/architecture capture.
- Suggested downstream artifact, if useful.
- Validation evidence future agents should produce.

## Downstream Artifacts

Do not create downstream artifacts by default. At the end of the assessment, offer options such as:

- Minimal ExecPlan for one selected opportunity or a broader harness-engineering refactor.
- Architecture diagram showing current and target harness loops.
- `ARCHITECTURE.md` or equivalent repo map.
- `AGENTS.md` update that points future agents to maps, validation commands, plans, and harness rules.

When the user asks for these follow-ups, read `references/downstream-artifacts.md` first.

## References

- `references/harness-lenses.md`: technology-agnostic evaluation lenses and examples.
- `references/assessment-report-template.md`: required final report shape.
- `references/downstream-artifacts.md`: follow-up ExecPlan, architecture doc, and diagram guidance.
- `references/source-principles.md`: self-contained harness engineering concepts for agents using this skill.

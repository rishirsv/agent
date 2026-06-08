# Handoff: Meta-Skill Evaluation And Improvement Architecture

## Purpose

Continue shaping Meta-Skill into a practical skill review, evaluation, and improvement system. The next agent should turn the current research and design direction into a small, coherent architecture update for the source Meta-Skill docs and skills.

The user wants the simplest elegant path where an agent can review a skill, run judgment/evaluation/validation, produce a score, propose or apply a precise improvement, and return an improved version with evidence. The design should support one-off review/improvement first, and only grow into full optimization/evals when the behavior contract is clear.

## Current State

The conversation has explored these Meta-Skill product surfaces:

- `skill-writer` for creating new reusable skills.
- `skill-doctor` for reviewing and improving an existing skill.
- `skill-evaluator` for authoring and running skill evaluation cases.

Recent source edits already corrected the Meta-Skill workbench path shape:

- A target skill project root is already the skill name.
- The portable skill payload lives at `<project>/skill/`.
- The local workbench lives at `<project>/.meta-skill/`.
- Do not add another `.meta-skill/<skill-name>/` namespace.

After those edits, deterministic checks passed for `skill-doctor` and `skill-evaluator`, and `scripts/sync-plugins.sh` was run successfully. The worktree still contains generated plugin package changes from sync, plus the previous rename from `isolated-thread-smoke` to `isolated-thread-trial`.

The latest research pass looked at:

- `/Users/rishi/Downloads/evo-main`
- `/Users/rishi/Downloads/EvoSkill-main.zip`
- `/Users/rishi/Downloads/eval-design-guide.md`
- OpenAI's article on testing agent skills systematically with evals
- Braintrust, LangSmith, Langfuse, Phoenix/Arize, Humanloop, and Anthropic eval patterns

No files were edited during the research pass itself.

## Key Decisions

- Meta-Skill should not become Evo immediately. Evo is an optimizer; Meta-Skill first needs a clean eval spine.
- The first useful product loop is: review -> cases -> isolated run -> scores -> gated candidate edit -> before/after proof.
- One-off review/improvement should remain distinct from full eval optimization.
- `skill-doctor` should produce a scored review and proposed precise edits; it should not silently rewrite unless the user asked for improvement/application.
- `skill-evaluator` should own behavior-contract cases and run evidence; target skills should not own eval packs unless the project explicitly chooses that.
- The scalable case shape should move toward directory discovery:
  - `.meta-skill/cases/<case-id>/case.md`
  - optional `.meta-skill/cases/<case-id>/fixtures/`
  - `.meta-skill/runs/<run-id>/...`
  - `.meta-skill/tests/`
- The current source still mentions `evals.json` in several evaluator docs. That likely needs reconciliation with the flatter case-folder direction.
- Codex child threads and/or local `codex exec --json` runs are both useful:
  - Created Codex threads are best for inspectable one-off trials and skill-doctor improvement.
  - `codex exec --json` is better for scalable repeatable eval harnesses.
- Gates matter. A candidate can improve score but still be rejected if it violates deterministic checks, forbidden writes, source boundaries, or safety constraints.

## Artifacts

- `/Users/rishi/Code/agent/meta-skill/docs/ARCHITECTURE.md` - current Meta-Skill architecture doc; now has corrected project-root workbench wording but still references `evals.json`.
- `/Users/rishi/Code/agent/meta-skill/skills/skill-doctor/SKILL.md` - current doctor workflow.
- `/Users/rishi/Code/agent/meta-skill/skills/skill-doctor/references/rubric.md` - scored review rubric and `review.md` shape.
- `/Users/rishi/Code/agent/meta-skill/skills/skill-evaluator/SKILL.md` - current evaluator workflow; still references `evals.json`.
- `/Users/rishi/Code/agent/meta-skill/skills/skill-evaluator/references/evaluations.md` - current judge-case authoring reference; likely needs the most direct update if moving to case folders.
- `/Users/rishi/Code/agent/meta-skill/skills/skill-evaluator/references/validations.md` - deterministic validation guidance.
- `/Users/rishi/Code/agent/.plans/isolated-thread-trial.md` - previous plan for naming and workflow around isolated created-thread trials.
- `/Users/rishi/Downloads/evo-main/README.md` - Evo overview: experiment optimization, worktrees, gates, frontier, dashboard.
- `/Users/rishi/Downloads/evo-main/plugins/evo/src/evo/core.py` - concrete `.evo` workspace and experiment graph implementation.
- `/Users/rishi/Downloads/evo-main/plugins/evo/src/evo/frontier_strategies.py` - concrete frontier strategies.
- `/Users/rishi/Downloads/EvoSkill-main.zip` - EvoSkill source archive; read with `unzip -p`.
- `/Users/rishi/Downloads/eval-design-guide.md` - highly relevant local eval design guide for skill evals.
- `https://developers.openai.com/blog/eval-skills` - OpenAI article used as the best north star for small skill evals.
- `https://www.braintrust.dev/docs/evaluate/run-evaluations` - reference for dataset/task/scorer/experiment/trial architecture.
- `https://docs.langchain.com/langsmith/evaluation-concepts` - reference for dataset/evaluator/experiment and trace-based evaluation.
- `https://langfuse.com/docs/evaluation/overview` - reference for trace/dataset/evaluator/regression loop.
- `https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents` - reference for deterministic, model, and human grader mix.

## Next Actions

1. Re-read the current Meta-Skill source docs listed above and identify every place that still encodes `evals.json` as the primary eval authoring surface.
2. Decide whether to hard-cut to case folders now or write a transitional doc that names `evals.json` as legacy. The user's preference usually favors the smaller hard cut when the direction is clear.
3. Update `skill-evaluator` docs to make `.meta-skill/cases/<case-id>/case.md` the canonical authored case shape.
4. Update `ARCHITECTURE.md` to show the recommended minimal workbench:
   - `spec.md`
   - `review.md`
   - `cases/`
   - `runs/`
   - `tests/`
5. Add a short architecture distinction among:
   - review lane: `skill-doctor`
   - eval lane: `skill-evaluator`
   - future optimization lane: Evo-inspired, only after cases and gates exist
6. Add guidance that created Codex threads are for inspectable one-off trials, while `codex exec --json` is the scalable runner path.
7. Keep Evo-inspired features minimal:
   - adopt gates and lineage now
   - defer dashboard, remote backends, broad frontier strategies, and autonomous tree search
8. Review changed skill files directly.
9. Run deterministic checks for affected skills.
10. Run `scripts/sync-plugins.sh` after source edits.

## Validation

- Run:
  - `python3 meta-skill/skills/skill-doctor/scripts/run.py meta-skill/skills/skill-doctor/SKILL.md`
  - `python3 meta-skill/skills/skill-doctor/scripts/run.py meta-skill/skills/skill-evaluator/SKILL.md`
  - `AGENT_MARKETPLACE_SOURCE=/Users/rishi/Code/agent scripts/sync-plugins.sh`
- Still needed:
  - Re-run the same checks after any new edits.
  - Search for stale `.meta-skill/<skill-name>` or `evals.json` references after the hard cut.
  - Inspect synced generated package files only to confirm sync propagated source changes; do not hand-edit generated plugin package files.

## Risks And Unknowns

- The repo currently has uncommitted source and generated package changes from the previous Meta-Skill path correction and sync. Preserve unrelated dirty work.
- `evals.json` appears in current source docs, while the preferred direction is case-folder discovery. This is the main conceptual cleanup.
- Created Codex thread tooling is useful for one-off trials, but a scalable eval harness probably needs `codex exec --json`; do not force every eval into child threads.
- Evo and EvoSkill are richer than Meta-Skill should be right now. Copying dashboard/frontier/remote-backend concepts too early would likely violate the user's preference for the smallest useful architecture.
- The live Meta-Skill CLI surface may have drifted; verify current commands in the repo before writing command-level docs.

## Suggested Skills

- `$meta-skill` - orchestrates work on agent skills and routes between writer, doctor, and evaluator.
- `$meta-skill:skill-doctor` - useful when reviewing the current doctor workflow and improvement contract.
- `$meta-skill:skill-evaluator` - useful when converting evaluator docs from `evals.json` toward case-folder eval packs.
- `$agent:handoff` - useful only if another continuation brief is needed after implementation.

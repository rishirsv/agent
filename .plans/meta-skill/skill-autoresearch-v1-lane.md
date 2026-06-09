# Skill-Autoresearch V1 Lane (Guidance-Only Worker)

## Purpose

Complete the lifecycle with the bounded optimization lane: given an existing
eval suite and explicit permission, generate candidate improvement attempts in
isolated worktrees, measure them with the existing evaluator machinery, and
propose a **gated** winner. V1 is a skill payload that composes existing CLI
commands — no new `autoresearch` CLI command, no autonomous apply. Builds on
`.plans/skill-autoresearch-follow-up.md`. True North: the skill-autoresearch
goal verbatim.

## Non-Goals

- No autonomous apply, publish, package, sync, or install — ever in this lane.
- No new CLI surface; `scripts/meta-skill eval run/grade` + report are the
  engine. A composing `autoresearch run` command is future-only, after this
  lane proves the loop manually.
- No frontier strategies, dashboards, remote sandboxes, or candidate registry.
- No suite authoring — a missing/weak suite routes to `skill-evaluator` first.

## Source Files Likely Touched

- `meta-skill/skills/skill-autoresearch/SKILL.md` (new)
- `meta-skill/skills/skill-autoresearch/references/loop.md` (new)
- `meta-skill/skills/skill-autoresearch/agents/openai.yaml` (new)
- `meta-skill/skills/meta-skill/SKILL.md` (routing row)
- `meta-skill/.meta-skill/docs/ARCHITECTURE.md` (status flip: future → v1)

## Implementation Steps

1. **Trigger contract** (description): "Given an existing eval suite and
   explicit permission, generate candidate skill-improvement attempts in
   isolated branches/worktrees, evaluate them against train/dev and held-out
   cases, and recommend a gated winner for human approval. Reached through
   meta-skill's routing. Not for authoring suites (skill-evaluator), one-off
   fixes (skill-doctor), new skills (skill-writer), and never applies, merges,
   packages, or publishes changes itself."
2. **Preconditions gate** (workflow step 1): refuse to start unless (a) an
   `evals.json` suite with graded prior evidence exists, (b) the suite has a
   dev split plus at least one held-out or gate case the editor will not see,
   (c) the user explicitly authorized candidate generation and named an attempt
   budget (default 3). Anything missing → route back with the named gap.
3. **Candidate lifecycle** (loop.md): per attempt — create branch
   `meta-skill/<suite-id>/attempt-N`; editor child works only inside that
   worktree on the smallest promising edit (seeded from failure taxonomy tags
   in prior grades); verify `payload_digest` changed; run
   `eval run --candidates attempt-N --split dev`; grade; discard attempts that
   fail deterministic checks or regress gate cases; run survivors on held-out
   cases; never reuse held-out feedback for further edits.
4. **Gates**: winner = gated best, not raw-highest — deterministic checks pass,
   held-out performance ≥ baseline, no gate-case regression, payload actually
   changed, edits contained to the candidate worktree. Uncalibrated judge
   scores cannot be the sole promotion evidence (methodology.md rule).
5. **Artifacts**: everything in existing shapes — branches, run dirs, grades,
   plus one research summary written to the workbench
   (`.meta-skill/research-<run-id>.md`): attempts tried, per-gate outcomes,
   recommendation, and exact apply instructions (branch + diffstat).
6. **Human gates**: start (explicit permission + budget), and apply (the lane
   STOPS at recommendation; applying routes to `skill-doctor` Edit with the
   winning branch as evidence — reusing doctor's approval semantics rather than
   duplicating them).
7. **Handoffs**: persistent failures with taxonomy tags → `skill-doctor`;
   suite gaps discovered mid-loop (cases too easy, rubric ambiguity) →
   `skill-evaluator`; report both in the summary.
8. Router: add the routing row ("try to find a better version automatically" →
   skill-autoresearch) and the boundary note that it requires an existing suite.

## Tests / Fixtures

- Payload validation (`scripts/meta-skill validate`).
- A scripted dry walkthrough against the seed-lane-evals dogfood suite using a
  trivial hand-made attempt branch, proving the loop's artifacts land where the
  lane says they do.

## Validation Commands

```sh
scripts/meta-skill validate meta-skill/skills/skill-autoresearch
scripts/meta-skill validate meta-skill/skills/meta-skill
python3 meta-skill/src/characterize_meta_skill.py
scripts/sync-plugins.sh
```

## Completion Criteria

- Lane payload ships with trigger, preconditions gate, loop, gates, artifacts,
  and handoffs; router routes to it; one manual end-to-end walkthrough on the
  dogfood suite produced a recommendation without any source mutation.

## Stop Rule

If the walkthrough reveals the loop needs new CLI machinery (e.g. split
enforcement, compare output) to be followable, stop and file the smallest CLI
plan instead of widening this lane's payload with workarounds.

## Risks

- Editor children seeing held-out content via the repo checkout: worktrees
  contain the whole project including `.meta-skill/` unless excluded — loop.md
  must instruct staging-level isolation (the eval runner already stages
  solver workspaces without hidden files; the EDITOR child must be pointed at
  the payload only, with an explicit "do not read .meta-skill/" instruction,
  and the gap noted honestly as instruction-level, not mechanical).
- Score-chasing/overfit to dev cases: held-out discipline plus attempt budget
  are the controls; methodology.md owns the rationale.

## Handoff Notes

Dependencies, in order: baseline-impact-comparison (impact categories),
evaluator-methodology-references (split/gate language), seed-lane-evals (a real
suite to walk through), eval-report-command (readable comparison). Implement
last among the mid items.

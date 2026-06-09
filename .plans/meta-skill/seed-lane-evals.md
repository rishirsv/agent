# Seed Eval Suites For Meta Skill's Own Lanes

## Purpose

The lanes that teach eval craft have no executable evals of their own. Author
small dogfood suites for the two highest-risk behaviors: `meta-skill` routing
(does an ambiguous request reach the right specialist?) and `skill-writer`
interview behavior (self-bypass when context is complete; skill-or-not stop
gate). This is the tracker's "Seed Evals For Skill Writer Routing And
Interview", extended to the router. True North: every lane optimized against
its goal with evidence, not vibes.

## Non-Goals

- No CLI changes; use the existing workbench/materialize/run/grade surface.
- No trigger-rate optimization loops; first suites measure, they don't tune.
- No committed run artifacts; suites and cases are authored content, runs stay
  gitignored.

## Source Files Likely Touched

- A workbench beside a copy of the lane payloads (per workbench rules, the
  workbench lives at the target project root, not inside `meta-skill/` source)
  — e.g. a fixtures project under the repo's test area with
  `.meta-skill/evals.json` and `cases/`.
- `meta-skill/skills/skill-evaluator/references/evaluations.md` only if case
  authoring exposes a doc gap.
- `.plans/WORK-TRACKER.md` (record findings).

## Implementation Steps

1. Create a dogfood project with the router + writer payloads as the target.
2. Author 6–10 cases in `evals.json` + case folders:
   - routing: ambiguous improve request → expect route to `skill-doctor`
     (judge rubric checks the named specialist, no inline doctoring);
   - routing: measurement phrasing ("how well does it work") → `skill-evaluator`;
   - routing near-miss: a request about *using* a skill → expect no meta-skill
     work;
   - writer: complete-context request → expect interview self-bypass (judge
     checks no questions asked, outline still produced);
   - writer: thin fuzzy idea → expect the skill-or-not gate to fire;
   - writer: source-pack request → expect distillation before drafting.
3. Each case: visible `task.md`, hidden `rubric.md` with anchored 0–3 levels,
   `validate.*` where deterministic (e.g. output contains a Draft Skill
   Outline block).
4. Run with repetitions 3 on judge-graded cases; grade; write the coverage
   statement; record per-case findings in the tracker.
5. Convert each confirmed failure into a `skill-doctor` finding (not an edit) —
   fixes flow through the doctor's approval gate.

## Tests / Fixtures

- The suite itself is the fixture set. Keep cases small and provider-neutral.
- Add one fake-runner smoke case so the suite shape is checkable without live
  model runs.

## Validation Commands

```sh
scripts/meta-skill workbench init --target <dogfood-project> --json
scripts/meta-skill eval materialize --suite <dogfood>/.meta-skill/evals.json --json
scripts/meta-skill eval run --suite <dogfood>/.meta-skill/evals.json --json
scripts/meta-skill eval grade --run <run-id> --json
```

## Completion Criteria

- Suite runs end to end; grades exist for every case; coverage statement
  written; at least one routing and one interview behavior measured with
  repetitions; findings filed in the tracker.

## Stop Rule

Stop at 10 cases. If live runs are blocked (auth, runtime), land the authored
suite + fake-runner smoke and stop — authored cases are the deliverable; do not
build harness workarounds.

## Risks

- Judge-graded routing cases are noisy pre-calibration; label 5 trials by hand
  first (calibration.md loop) before trusting rates.
- Lane payloads evolve; pin the payload commit in the run record (already
  captured via candidate source fields).

## Handoff Notes

These suites become the regression bed for every future router/writer wording
change, and the first real corpus for `eval report` and the baseline plan.

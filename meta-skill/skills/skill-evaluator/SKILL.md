---
name: skill-evaluator
description: "The measurement specialist within meta-skill: author and run an evaluation suite for a target — judge- or human-graded evaluations plus deterministic validations — to quantify triggering, quality, and variance. Specializes in agent skills with defaults, and generalizes to any artifact via a principled rubric builder. Reached through meta-skill's routing; invoke directly only when explicitly named. Not for authoring a new skill (skill-writer) or reproducing one reported failure (skill-doctor)."
---

# Skill Evaluator

Author an **evaluation suite** for a target and run the parts that can be
mechanized. The suite has two pillars — **evaluations** (semantic, judge- or
human-graded) and **validations** (deterministic). The doctor scores one skill's
static text and reproduces one case; the evaluator authors and measures many.

Master a universal eval craft: anything can be evaluated. This skill
**specializes in agent skills** with built-in defaults and **generalizes to any
artifact** by building a rubric from the artifact's job.

**Measure, don't fix.** Report metrics and failing cases; hand fixes to
`skill-doctor`. Write only to the hidden workbench, never into a target's own repo.

## Route By Target

| Target | Use |
|---|---|
| An agent skill | Built-in defaults: output-quality dimensions + the shipped general checks. |
| Any other artifact | The generalist rubric builder — [references/generalist.md](references/generalist.md). |

## The Two Pillars

| Pillar | What | Graded by | Home |
|---|---|---|---|
| **Evaluations** | Semantic quality + triggering, as cases | LLM judge (default) or human (calibration) | `evals.json` (workbench) |
| **Validations** | Deterministic pass/fail checks | A runner, no judgment | shipped **scripts** + workbench **tests** |

## Reference Map

Read only what the task needs:

| Need | Read |
|---|---|
| Author judge cases: `evals.json` schema, the two prompt styles, the anchored rubric | [references/evaluations.md](references/evaluations.md) |
| Calibrate the judge against a human gold subset | [references/calibration.md](references/calibration.md) |
| Author deterministic validations: general scripts vs skill-specific tests, the runner contract | [references/validations.md](references/validations.md) |
| Evaluate a target that is not an agent skill | [references/generalist.md](references/generalist.md) |

## Workbench

Artifacts live in the gitignored workbench at the target skill's project root:
`<project>/.meta-skill/` — `evals.json` and the skill-specific deterministic
tests. The project root already names the skill and contains the portable skill
payload at `<project>/skill/`, so do not add another skill-name namespace. These
are scratch: never committed, never written into `meta-skill/` itself or the
target's own repo.

## Workflow

### 1. Scope

Name the target and its job, then pick the route (skill defaults vs generalist).
For a skill, state the contract its output must satisfy and whether triggering is
in scope.

### 2. Author Evaluations

Write `evals.json` cases — see [references/evaluations.md](references/evaluations.md).
Match the prompt style to the case type:

- **Quality** cases name the skill (`Use the $skill …`) to measure output given
  invocation.
- **Triggering** cases use a natural request that never names the skill, run many
  times to measure fire-rate and variance.

Give each judged dimension an anchored 0–3 scale.

### 3. Author Validations

Author deterministic checks — see [references/validations.md](references/validations.md).
General checks (body, frontmatter, length) already ship as scripts; add
**skill-specific tests** in the workbench for behavior unique to this target.

### 4. Calibrate

Before trusting the judge at scale, calibrate it against a small human-labeled
`gold` subset — see [references/calibration.md](references/calibration.md).
Refine the rubric on disagreements until agreement clears your threshold.

### 5. Run And Report

Run the mechanizable parts — deterministic tests, the judge over its cases, and
triggering cases across many runs — then report per-dimension scores, pass-rates,
fire-rate, and variance, with failing cases called out for `skill-doctor`.

## Output

Close with the suite location, what was authored, what was run vs skipped, the
headline metrics, and the failing cases handed to `skill-doctor`. State coverage
limits plainly; a green suite is not proof of full coverage.

## Guardrails

- Author and measure; route fixes to `skill-doctor`.
- Tests stay in the hidden workbench — never committed, never written into a
  target repo.
- Match prompt style to case type; never force-invoke a triggering case.
- Calibrate a judge before trusting its scores at scale.
- Report coverage limits, not just a pass-rate.

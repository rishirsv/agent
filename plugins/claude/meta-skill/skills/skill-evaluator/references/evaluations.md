# Evaluations

Read when authoring the judge-graded evaluation cases in `evals.json`.

Evaluations are semantic: they need a judge — an LLM by default, a human when
taste or domain knowledge exceeds the model (see [calibration.md](calibration.md)).
They live in `evals.json` in the workbench and are never committed.

## evals.json

One file per target, in `<project>/.meta-skill/`:

```json
{
  "target": { "type": "skill", "name": "react-dev" },
  "cases": [
    {
      "id": "page-gen-quality",
      "type": "quality",
      "grader": "judge",
      "prompt": "Use the $react-dev skill to generate a landing page that …",
      "fixtures": ["fixtures/brand.json"],
      "criteria": "Semantic HTML, responsive layout, matches brand tokens",
      "gold": { "score": 3, "rationale": "…" }
    },
    {
      "id": "fires-on-natural-request",
      "type": "trigger",
      "grader": "judge",
      "prompt": "Build me a React landing page with our brand colors",
      "runs": 10,
      "expect": "fire"
    }
  ]
}
```

- `type` — `quality` or `trigger` (below).
- `grader` — `judge` (default) or `human`. Same case, different grader; human
  grading calibrates the judge, it is not a separate case set.
- `criteria` — the dimension(s) the judge scores, each on an anchored 0–3 scale.
- `gold` — optional human label, used for calibration.
- `runs` / `expect` — for trigger cases: how many times to run, and `fire` or
  `no-fire`.

## Two Prompt Styles

Match the prompt to what the case measures:

| Case type | Prompt style | Runs | Measures |
|---|---|---|---|
| **Quality** | Names the skill: `Use the $skill …` (forces invocation) | once / few | output quality given the skill fired |
| **Trigger** | Natural request; never names the skill | many | fire / no-fire rate + variance |

A quality prompt forces the skill on so the judge can score its output. A trigger
prompt must read like a real user request, because it tests whether the skill
*activates* on its own — naming the skill would defeat the test. Trigger cases
need the target seeded into a clean environment so it *can* fire; that seeding
mechanism is environment-specific (see the open item in
[validations.md](validations.md)).

## Anchored Rubric

A judge is only as reliable as its rubric. For each dimension give discrete level
descriptions, not a bare 0–3:

| Score | Meaning |
|---|---|
| 3 | Meets the criterion fully; usable as-is. |
| 2 | Usable with a concrete, named weakness. |
| 1 | Weak or risky; a real gap an agent would hit. |
| 0 | Missing, wrong, or unsafe for the dimension. |

Have the judge write its reasoning *before* the score, and cite the output it
scored. For a skill, default quality dimensions cover the output contract:
correctness, completeness against the request, format/structure, and adherence to
the skill's stated guarantees. Adjust per target; a non-skill target derives its
dimensions from [generalist.md](generalist.md).

## Run

Run the judge over every quality case and record `judge: { score, rationale }`.
Run each trigger case `runs` times and record the fire-rate and variance. Report
scores and failing cases; do not edit the target.

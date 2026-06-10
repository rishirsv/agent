# Calibration

Read when a human will calibrate the judge.

Human grading is not a parallel scoring track. Its job is to calibrate the LLM
judge: label a small slice of trial outcomes, confirm the judge agrees, then
let the judge scale.

## The Loop

1. **Anchor the rubric.** Put discrete level descriptions in
   `cases/<task-id>/rubric.md`. Ambiguous criteria are the main cause of an
   unreliable judge.
2. **Select a spot-check slice.** Pick a small set of representative trial
   outcomes before trusting the judge for a decision. For small skill suites, a
   few human-labeled examples are usually enough to reveal obvious rubric or
   judge defects.
3. **Collect human grades.** Store human labels as `grades.jsonl` rows over trial
   outcomes. Do not put human labels in `task.md`, and do not hide them as front
   matter in case files.
4. **Check agreement.** Run the judge on the same trial outcomes and compare.
   Practical signal: exact-match rate plus a +/-1 tolerance band. Reach for
   weighted kappa or correlation only when statistical rigor is needed.
5. **Refine on disagreement.** Every material judge/human disagreement is a
   rubric or judge-prompt defect. Tighten `rubric.md`, then rerun the judge.
6. **Scale carefully.** Let the judge grade the rest only after disagreements
   look explainable and fixable. Recheck a small slice after any rubric or
   judge-model change — prior agreement does not transfer.

## Grade Rows

Human, model, and code grades share one annotation shape:

```json
{
  "run_id": "run-001",
  "case_id": "natural-trigger",
  "candidate": "attempt-1",
  "trial_id": "natural-trigger.attempt-1.t3",
  "grader": {
    "kind": "human",
    "id": "rishi"
  },
  "metric": "usefulness",
  "score": 2,
  "label": "partial",
  "rationale": "The answer is usable but misses the approval boundary.",
  "evidence_refs": ["results.jsonl#natural-trigger.attempt-1.t3"]
}
```

Use condition/task/trial language in prose. In grade rows, use the current
schema field `candidate`, not `candidate_id`. Use `trial_id`, not `attempt_id`.

## Surfacing Divergence

Flag every task where `|human - judge| >= 1` for review, and propose the rubric
or anchor change that would close it. A few well-chosen spot checks beat
labeling everything.

Do not turn calibration into a separate label system. If a decision depends on
judge scores, say whether a human spot check was done and summarize any
disagreements in plain language. Use transcripts to diagnose disagreements, but
grade the outcome unless the rubric explicitly measures process behavior.

## Judge Bias Controls

LLM judges drift in predictable ways. Guard against them:

- **Verbosity bias** — longer answers scored higher regardless of quality.
- **Position / order bias** — in pairwise comparisons, randomize order.
- **Self-preference** — a judge favoring outputs written in its own style.

Reference-guided grading reduces all three. Give the judge the explicit rubric
and, where possible, hidden expected output or reference material. These hidden
files remain outside the solver workspace.

If the judge cannot decide from the outcome and allowed transcript evidence,
prefer `unknown` or `needs_human_review` over a confident invented score.
Treat either label as a calibration signal, not as a failure to hide. The report
will surface those trials for review.

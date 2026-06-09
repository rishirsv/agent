# Diagnose

Reproduce a specific reported failure before changing anything. The doctor
reproduces *one* case; `skill-evaluator` measures many. Diagnosis then feeds the
**Prompt Doctor Loop** in [edit.md](edit.md) (classify → locate source →
candidate edits → recommend → apply only if authorized).

## Method

1. Capture the report: what the user expected vs what actually happened.
2. Reconstruct the triggering input / scenario.
3. Reproduce via **one narrow in-loop run**; confirm it is the reported failure.
4. Localize the cause (description vs body vs reference vs structure).
5. Propose the smallest fix — do **not** apply it without approval (see
   [edit.md](edit.md)).

## Evidence

Prefer concrete evidence over intuition — a reproduced run, a `review.md`
finding, an eval row, or a user-observed failure. See
[edit.md](edit.md#evidence-sources) for what counts as valid edit evidence.

## Output

Root cause + a re-runnable failing case, captured in the workbench as
`<project>/.meta-skill/spec.md` (durable notes: changed behavior, evidence,
rejected edits, residual risk) so Verify can re-run it.

For triggering failures, reproduce with a natural prompt in a clean child thread
using the shared [skill-trial-runs.md](../../../references/skill-trial-runs.md)
workflow. For behavior failures, force invocation with the failing input so the
run isolates the skill's behavior after it has already fired.

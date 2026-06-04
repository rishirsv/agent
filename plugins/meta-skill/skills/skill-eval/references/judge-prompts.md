# Judge Prompt Guidance

Read this when creating or revising case-owned judge rubrics in `case.md`.

Judges are human-authored rubrics in `case.md` criteria for subjective qualities. They are optional by default because they cost tokens and should never replace deterministic tests when code can answer the question.

## File Shape

Put the rubric and judge IDs in `case.md` frontmatter:

```yaml
---
title: Source faithful answer
criteria:
  expected_behavior: The answer cites only facts present in the fixture.
  assertions:
    - Uses provided sources.
  rubric: |
    Score 5 when every factual claim is source-grounded.
    Score 3 when the answer is mostly grounded but includes weak support.
    Score 1 when the answer invents facts.
  judges:
    - id: source-faithfulness
      threshold:
        overall_min: 4
---
```

The judge ID names the observation in facts and reports. The rubric is the prompt.

## Thresholds

Thresholds live beside the judge ID:

```json
{
  "id": "final-answer-quality",
  "threshold": {
    "overall_min": 4
  }
}
```

The same judge can be report-only in one case and thresholded in another.

## Good Judge Scope

Use one judge for one recurring subjective pattern. Good scopes include source faithfulness, recommendation quality, final-answer usefulness, tone fit, and ambiguity handling.

Avoid broad "overall quality" judges as the main signal. If a deterministic test can answer the question, write a test instead.

## Inputs

Feed only the information needed:

- task text
- final response
- selected final-output excerpts
- relevant source excerpts
- deterministic test summaries

Do not feed private evaluator answer keys into solver workspaces. Judges run over saved evidence after the case run.

## Anti-Patterns

- Treating judges as user decisions.
- Hiding deterministic failures behind a good judge score.
- Running judges by default without user approval.
- Asking the judge to infer missing context from vague instructions.

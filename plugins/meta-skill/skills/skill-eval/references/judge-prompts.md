# Judge Prompt Guidance

Read this when creating or revising `.meta-skill/evals/judges/*.md`.

Judges are human-authored rubrics or pass/fail prompts for subjective qualities. They are optional by default because they cost tokens and should never replace deterministic tests when code can answer the question.

## File Shape

Use Markdown with minimal frontmatter:

```md
---
id: artifact-quality
type: rubric
scale: 1-5
inputs: [task, final, artifacts]
---

# Artifact Quality Judge

You evaluate the generated artifact for the user's task.

## Rubric

5: Excellent. Complete, specific, well-structured, directly usable.
4: Good. Minor gaps, still usable.
3: Adequate. Meets the core request with noticeable omissions.
2: Weak. Partially useful but misses important requirements.
1: Poor. Fails the task or misleads the user.

## Output

Return JSON with an overall score and critique.

## Calibration Examples

- A complete artifact with traceable source claims scores 5.
- An artifact with unsupported material claims scores at most 3.
```

Supported judge types:

- `rubric`: universal 1-5 score plus critique
- `pass_fail`: binary subjective judgment for one specific failure mode

## Thresholds

Thresholds live in scenario `criteria.json`, not in judge files:

```json
{
  "id": "artifact-quality",
  "threshold": {
    "overall_min": 4
  }
}
```

The same judge can be report-only in one scenario and thresholded in another.

## Good Judge Scope

Use one judge for one recurring subjective pattern. Good scopes include source faithfulness, recommendation quality, artifact usefulness, tone fit, and ambiguity handling.

Avoid broad "overall quality" judges as the main signal. If a deterministic test can answer the question, write a test instead.

## Inputs

Feed only the information needed:

- task text
- final response
- selected artifacts
- relevant source excerpts
- deterministic test summaries

Do not feed private evaluator answer keys into solver workspaces. Judges run over saved evidence after the scenario run.

## Anti-Patterns

- Using judges as release gates without human review.
- Hiding deterministic failures behind a good judge score.
- Setting thresholds inside judge frontmatter.
- Running judges by default without user approval.
- Asking the judge to infer missing context from vague instructions.

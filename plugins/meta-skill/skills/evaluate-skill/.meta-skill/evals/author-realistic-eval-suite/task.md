# Author A Realistic Eval Suite

## Problem Description

A maintainer is improving a repository documentation skill. They saw a real failure: the skill copied a one-off user prompt, a model name, and raw source links into durable skill guidance instead of distilling those details into reusable behavior.

The maintainer wants a small eval suite that would expose this failure in the future. They do not want source edits yet.

## Output Specification

Return a compact eval authoring plan with:

- two or three proposed eval folders
- a realistic `task.md` outline for each proposed eval
- binary `criteria.json` rows for each proposed eval, including at least one Quality, one Implementation, and one Validation criterion
- any fixture recommendations
- the lint/run commands to use after authoring
- what the resulting evidence would prove and what would remain unproven

Keep evaluator-only criteria and expected answers out of solver-visible task text.

## Task

Draft the eval suite plan and file outlines for this observed failure.

# Judge Design Guide

How to write binary LLM-as-Judge evaluators for autoresearch.

## When to use a judge

Use a judge only when code cannot reliably decide. Exhaust code-based options first:

| Criterion type | Use |
|---|---|
| Output contains a string | Code: `contains` check |
| Output matches a pattern | Code: `regex` check |
| Output is valid JSON | Code: `valid_json` check |
| Output follows a tone | **Judge** |
| Output is complete/faithful | **Judge** |
| Output is well-structured | **Judge** |
| Output avoids hallucination | **Judge** |

## The four components

Every judge prompt has exactly four parts:

### 1. Task and criterion

State what the judge evaluates. One failure mode per judge — never combine
multiple criteria into a single judge.

```
You are evaluating whether the output correctly migrates all prompts
to the Langfuse SDK format.
```

### 2. Pass/Fail definitions

Binary only. Pass or Fail. No scales, no partial credit, no letter grades.

Scales (1-5, A-F) compound variability and produce unreliable results. Binary
verdicts force the judge to make a decision and make scores directly actionable.

```
- **Pass**: Every prompt in the original code has been replaced with a
  `get_prompt()` call using the correct prompt name.
- **Fail**: Any prompt is missing, uses the wrong name, or retains the
  original hardcoded text.
```

### 3. Few-shot examples

Include 2-4 examples drawn from real skill outputs (not hypothetical):

- At least one clear Pass
- At least one clear Fail
- At least one borderline case (with its label and reasoning)

Draw examples from a training split only. Using dev/test examples is data leakage.

### 4. Structured output

Force the judge to output JSON with a critique before the verdict:

```json
{"critique": "brief assessment of what was observed", "result": "Pass"}
```

The critique-before-verdict pattern forces reasoning before judgment. Without it,
judges tend to anchor on their first impression and rationalize afterward.

## Template

```markdown
# Judge: [Eval Name]

## Task
You are evaluating whether [specific criterion] for [context].

## Definitions
- **Pass**: [specific observable condition]
- **Fail**: [specific observable condition]

## Examples

### Pass example
[Actual output text that passes]
**Verdict:** Pass — [brief reason]

### Fail example
[Actual output text that fails]
**Verdict:** Fail — [brief reason]

### Borderline example
[Actual output text that is ambiguous]
**Verdict:** [Pass/Fail] — [reasoning for the call]

## Output
Return JSON only, no other text:
{"critique": "...", "result": "Pass"}
```

## Anti-patterns

- **Vague criteria.** "Is this helpful?" fails. "Does every API call include error
  handling with a try/catch block?" succeeds.
- **Holistic judges.** One judge for "overall quality" is useless. Split into
  specific failure modes.
- **No examples.** Judges without few-shot examples are inconsistent.
- **Likert scales.** 1-5 ratings add noise. Binary Pass/Fail is reliable.
- **Dev/test examples as few-shot.** This is data leakage — the judge memorizes
  the examples instead of learning the criterion.
- **Skipping validation.** Always test your judge against known Pass/Fail cases
  before trusting it in the loop.

## Validation (optional but recommended)

If you have 60+ labeled examples:

1. Split into train (10-20%), dev (40-45%), test (40-45%)
2. Use train examples as few-shot in the judge prompt
3. Run the judge on the dev set
4. Measure TPR (true positive rate) and TNR (true negative rate)
5. Iterate on the judge prompt until both TPR and TNR > 90% on dev
6. Run once on the held-out test set for final accuracy

If you have fewer than 60 examples, manually verify the judge on 10-20 known
cases and check that it agrees with your labels.

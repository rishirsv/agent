# Prompt Anti-Patterns

Avoid these when writing `prompt.md` for Oracle bundles.

## Vague task framing

Bad:

```text
Take a look at this repo and tell me what you think.
```

Better:

```xml
<task>
Review this repository slice for material correctness and regression risks.
</task>
```

## Missing output contract

Bad:

```text
Investigate and report back.
```

Better:

```xml
<structured_output_contract>
Return:
1. root cause
2. evidence
3. smallest safe next step
</structured_output_contract>
```

## No follow-through default

Bad:

```text
Debug this failure.
```

Better:

```xml
<default_follow_through_policy>
Keep going until you have enough evidence to identify the most likely root cause confidently.
</default_follow_through_policy>
```

## Asking for more intelligence instead of a better contract

Bad:

```text
Think harder and be very smart.
```

Better:

```xml
<verification_loop>
Before finalizing, verify that the answer matches the observed evidence and task requirements.
</verification_loop>
```

## Mixing unrelated jobs into one run

Bad:

```text
Review this diff, fix the bug you find, update the docs, and suggest a roadmap.
```

Better:

- Run review first.
- Run a separate fix or implementation bundle if needed.
- Use a third bundle for docs, roadmap, or broader planning.

## Unsupported certainty

Bad:

```text
Tell me exactly why production failed.
```

Better:

```xml
<grounding_rules>
Ground every claim in the uploaded bundle.
If a point is an inference, label it clearly.
</grounding_rules>
```

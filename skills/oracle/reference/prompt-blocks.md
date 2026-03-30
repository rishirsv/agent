# Prompt Blocks

Use these blocks selectively when composing `prompt.md` for Oracle bundles.
Wrap each block in the XML tag shown in its heading.

## Core Wrapper

### `task`

Use in nearly every prompt.

```xml
<task>
Describe the concrete job, the relevant repository or prompt context, and the expected end state.
</task>
```

## Output and Format

### `structured_output_contract`

Use when the answer shape matters.

```xml
<structured_output_contract>
Return exactly the requested output shape and nothing else.
Keep the answer compact.
Put the highest-value findings or decisions first.
</structured_output_contract>
```

### `compact_output_contract`

Use when concise prose is better than a schema.

```xml
<compact_output_contract>
Keep the final answer compact and structured.
Do not include long scene-setting or repeated recap.
</compact_output_contract>
```

## Follow-through and Completion

### `default_follow_through_policy`

Use when the downstream model should act without routine clarification.

```xml
<default_follow_through_policy>
Default to the most reasonable low-risk interpretation and keep going.
Only stop to ask questions when a missing detail changes correctness, safety, or an irreversible action materially.
</default_follow_through_policy>
```

### `completeness_contract`

Use for debugging, implementation planning, or any multi-step task that should not stop early.

```xml
<completeness_contract>
Resolve the task fully before stopping.
Do not stop at the first plausible answer.
Check whether there are follow-on fixes, edge cases, or cleanup needed for a correct result.
</completeness_contract>
```

### `verification_loop`

Use when correctness matters.

```xml
<verification_loop>
Before finalizing, verify the result against the task requirements and the uploaded bundle.
If a check fails, revise the answer instead of reporting the first draft.
</verification_loop>
```

## Grounding and Missing Context

### `missing_context_gating`

Use when the model might otherwise guess.

```xml
<missing_context_gating>
Do not guess missing repository facts.
If required context is absent from the bundle, state exactly what remains unknown.
</missing_context_gating>
```

### `grounding_rules`

Use for review, diagnosis, prompt critique, or repo-based reasoning.

```xml
<grounding_rules>
Ground every claim in the uploaded bundle.
Do not present inferences as facts.
If a point is a hypothesis, label it clearly.
</grounding_rules>
```

### `citation_rules`

Use when external research, quoted material, or source attribution matters.

```xml
<citation_rules>
Back important claims with citations or explicit references to the source material you inspected.
Prefer primary sources.
</citation_rules>
```

## Safety and Scope

### `action_safety`

Use for change recommendations, fix plans, or any prompt that could sprawl.

```xml
<action_safety>
Keep changes tightly scoped to the stated task.
Avoid unrelated refactors, renames, or cleanup unless they are required for correctness.
Call out any risky or irreversible action before recommending it.
</action_safety>
```

### `tool_persistence_rules`

Use when the downstream task expects the model to keep inspecting bundle material before concluding.

```xml
<tool_persistence_rules>
Keep using the available context until you have enough evidence to finish the task confidently.
Do not stop after a partial pass when another targeted inspection would change the answer.
</tool_persistence_rules>
```

## Task-Specific Blocks

### `research_mode`

Use for exploration, comparisons, or recommendations.

```xml
<research_mode>
Separate observed facts, reasoned inferences, and open questions.
Prefer breadth first, then go deeper only where the evidence changes the recommendation.
</research_mode>
```

### `dig_deeper_nudge`

Use for adversarial review and regression hunting.

```xml
<dig_deeper_nudge>
After finding the first plausible issue, also check for second-order failures, empty-state behavior, retries, stale state, and rollback paths before finalizing.
</dig_deeper_nudge>
```

### `progress_updates`

Use when you want brief status updates in a long-running workflow.

```xml
<progress_updates>
If you provide progress updates, keep them brief and outcome-based.
Mention only major phase changes or blockers.
</progress_updates>
```

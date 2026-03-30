# Custom Prompt Guide

Use a custom prompt when none of the bundled templates fit cleanly.

The goal is not to write a long prompt. The goal is to assemble the smallest set of prompt blocks that makes the downstream model reliable, grounded, and easy to use.

See [prompt-blocks.md](prompt-blocks.md) for the reusable block catalog.

## Core Rules

- Start with one concrete task and one desired end state.
- Use XML blocks so the prompt structure is stable.
- Add an explicit output contract instead of vague prose.
- Add grounding and verification only where the task needs them.
- Tell the model to proceed with assumptions and list unknowns instead of asking questions.

## Minimum Viable Custom Prompt

```xml
<task>
You are {ROLE}.

I am uploading `context.zip` containing repository files. Treat those files as authoritative.
Start by reading `context/MANIFEST.md`.

{TASK_DESCRIPTION}
</task>

<structured_output_contract>
Return:
1. {PRIMARY_OUTPUT}
2. {SUPPORTING_OUTPUT}
3. {NEXT_STEPS_OR_RISKS}
</structured_output_contract>

<default_follow_through_policy>
Default to the most reasonable low-risk interpretation and keep going.
Only stop to ask questions when a missing detail changes correctness or safety materially.
</default_follow_through_policy>
```

That is often enough. Only add more blocks if they change quality materially.

## Block Selection

Add these blocks when needed:

- `compact_output_contract`: when concise prose is better than a schema
- `verification_loop`: when correctness matters and the model should sanity-check itself before answering
- `completeness_contract`: when the task should not stop at the first plausible answer
- `missing_context_gating`: when guessing would be dangerous
- `grounding_rules`: when claims must stay tied to repo evidence
- `citation_rules`: when using external research or quoted material
- `action_safety`: when recommending code or config changes
- `research_mode`: when comparing options or making recommendations
- `dig_deeper_nudge`: when you want a more adversarial review for hidden regressions

## Recommended Assembly Order

Keep blocks in a predictable order:

1. `<task>`
2. `<structured_output_contract>` or `<compact_output_contract>`
3. `<default_follow_through_policy>`
4. `<completeness_contract>` and/or `<verification_loop>` if needed
5. `<missing_context_gating>`, `<grounding_rules>`, or `<citation_rules>` if needed
6. `<action_safety>`, `<research_mode>`, or other task-specific blocks if needed

## Good vs Bad

### Task framing

Good:

```xml
<task>
Review the auth middleware and session handling in this repository for RBAC bypass risks.
Focus on whether the current implementation can allow unauthorized access.
</task>
```

Bad:

```text
Look at the auth stuff and tell me what you think.
```

### Output contract

Good:

```xml
<structured_output_contract>
Return:
1. top findings ordered by severity
2. evidence with file paths
3. smallest safe remediations
</structured_output_contract>
```

Bad:

```text
Give me your thoughts.
```

### Grounding

Good:

```xml
<grounding_rules>
Ground every claim in the uploaded bundle.
If a point is an inference, label it clearly.
</grounding_rules>
```

Bad:

```text
Tell me exactly why production failed.
```

## Use Custom Prompts When

- the task spans multiple domains and the canned templates feel awkward
- you need a specialized output format
- you are critiquing a prompt, workflow, or agent instruction set
- the recommendation depends on comparing options with explicit tradeoffs

If a bundled template already fits, use it instead of rebuilding the prompt from scratch.

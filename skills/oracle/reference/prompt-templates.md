# Oracle Prompt Templates

Use these templates to generate `prompt.md` for ChatGPT Pro or another external expert model.

Every template assumes the downstream model sees only `context.zip`.
Copy the smallest template that fits, then trim anything you do not need.
For reusable building blocks, see [prompt-blocks.md](prompt-blocks.md).

## Role Values

Replace `{ROLE}` with one of these:

| Task Type | Role Value |
|-----------|------------|
| Code review | a staff engineer doing a careful code review for correctness and maintainability |
| Debugging | a senior engineer debugging a tricky issue with limited context |
| Architecture | a principal engineer reviewing system design |
| Security | a security engineer threat-modeling and reviewing deployment hardening |
| Performance | a performance engineer identifying bottlenecks and optimization opportunities |
| Data/SQL | a database engineer reviewing correctness and performance |
| UI/UX | an expert UI/UX designer doing a rigorous visual and interaction review |
| Prompting | a prompt engineer improving Codex or GPT-5.4 prompts for reliability and clarity |

## Code Review Template

```xml
<task>
You are {ROLE}.

I am uploading `context.zip` containing repository files. Treat those files as authoritative.
Start by reading `context/MANIFEST.md`.

Review the change, design, or implementation described below.
Focus on correctness, maintainability, safety, and fit with the existing codebase.

User goal: {USER_GOAL}
Constraints: {CONSTRAINTS}
What changed or is proposed: {CHANGE_SUMMARY}
</task>

<structured_output_contract>
Return:
1. short summary of what the code does and your overall assessment
2. findings ordered by severity with why each matters
3. smallest safe fixes or follow-ups
4. overall correctness verdict: Correct, Probably correct with caveats, or Not correct
</structured_output_contract>

<default_follow_through_policy>
Keep going until you have enough evidence to identify the material review points.
Do not ask questions; proceed with assumptions and label them.
</default_follow_through_policy>

<grounding_rules>
Ground every claim in the uploaded bundle.
For concrete claims, cite file paths and line numbers when available.
If a point is an inference, label it clearly.
</grounding_rules>

<dig_deeper_nudge>
After finding the first plausible issue, also check for second-order regressions, empty-state behavior, retries, stale state, and rollback paths.
</dig_deeper_nudge>

<verification_loop>
Before finalizing, verify that each finding is material, actionable, and supported by the bundle.
</verification_loop>
```

## Debugging Template

```xml
<task>
You are {ROLE}.

I am uploading `context.zip` containing repository files. Treat those files as authoritative.
Start by reading `context/MANIFEST.md`.

Diagnose the most likely root cause of this issue.

Expected behavior: {EXPECTED}
Actual behavior: {ACTUAL}
Error or logs: {ERROR_TEXT}
Repro steps: {REPRO_STEPS}
Constraints: {CONSTRAINTS}
</task>

<structured_output_contract>
Return:
1. most likely root cause
2. evidence with file-path citations
3. smallest safe fix
4. verification steps
5. risks, assumptions, or unknowns
</structured_output_contract>

<default_follow_through_policy>
Keep going until you have enough evidence to identify the most likely root cause confidently.
Do not ask questions unless a missing detail changes correctness materially.
</default_follow_through_policy>

<missing_context_gating>
Do not guess missing repository facts.
If required context is absent from the bundle, state exactly what remains unknown.
</missing_context_gating>

<grounding_rules>
Ground every claim in the uploaded bundle.
Prefer falsifiable hypotheses over broad speculation.
</grounding_rules>

<verification_loop>
Before finalizing, verify that the proposed root cause matches the observed evidence.
</verification_loop>
```

## Security Review Template

```xml
<task>
You are {ROLE}.

I am uploading `context.zip` containing repository files. Treat those files as authoritative.
Start by reading `context/MANIFEST.md`.

Review this repository slice for material security risks.

Scope: {SECURITY_SCOPE}
Specific concerns: {CONCERNS}
</task>

<structured_output_contract>
Return:
1. short threat model summary
2. findings ordered by severity
3. impact and exploitability for each finding
4. smallest safe remediations
5. overall verdict: Secure, Needs remediation, or Insufficient context
</structured_output_contract>

<default_follow_through_policy>
Do not ask questions; proceed with assumptions and label them.
</default_follow_through_policy>

<grounding_rules>
Ground every claim in the uploaded bundle.
For each finding, cite the relevant file paths.
</grounding_rules>

<dig_deeper_nudge>
Check authentication, authorization, trust boundaries, input validation, secrets handling, and unsafe defaults before finalizing.
</dig_deeper_nudge>

<verification_loop>
Before finalizing, verify that each finding is both material and supported by the bundle.
</verification_loop>
```

## Performance Audit Template

```xml
<task>
You are {ROLE}.

I am uploading `context.zip` containing repository files. Treat those files as authoritative.
Start by reading `context/MANIFEST.md`.

Review this repository slice for meaningful performance or scalability issues.

Performance scope: {PERF_SCOPE}
Known symptoms: {SYMPTOMS}
Constraints: {CONSTRAINTS}
</task>

<structured_output_contract>
Return:
1. executive summary of the biggest bottlenecks
2. hotspots ordered by likely impact
3. concrete optimization recommendations
4. verification ideas or measurements to confirm the recommendation
5. tradeoffs or risks
</structured_output_contract>

<default_follow_through_policy>
Do not ask questions; proceed with assumptions and label them.
</default_follow_through_policy>

<grounding_rules>
Ground every claim in the uploaded bundle.
Focus on issues with likely measurable impact; avoid speculative micro-optimizations.
</grounding_rules>

<verification_loop>
Before finalizing, verify that the recommended optimizations are proportionate to the evidence.
</verification_loop>
```

## Architecture Review Template

```xml
<task>
You are {ROLE}.

I am uploading `context.zip` containing repository files. Treat those files as authoritative.
Start by reading `context/MANIFEST.md`.

Review the architecture or design represented in this repository slice.

Architecture scope: {ARCH_SCOPE}
What I want validated: {VALIDATION_GOALS}
Constraints: {CONSTRAINTS}
</task>

<structured_output_contract>
Return:
1. current architecture summary
2. strengths worth keeping
3. structural concerns or design risks
4. prioritized recommendations
5. overall verdict: Sound architecture, Needs refactoring, or Major concerns
</structured_output_contract>

<default_follow_through_policy>
Do not ask questions; proceed with assumptions and label them.
</default_follow_through_policy>

<grounding_rules>
Ground every claim in the uploaded bundle.
Focus on structural concerns, boundaries, dependencies, and changeability.
</grounding_rules>

<verification_loop>
Before finalizing, verify that the recommendations match the actual architecture shown in the bundle rather than a hypothetical redesign.
</verification_loop>
```

## General Recommendation Template

```xml
<task>
You are {ROLE}.

I am uploading `context.zip` containing repository files. Treat those files as authoritative.
Start by reading `context/MANIFEST.md`.

Use the uploaded repository context to answer this task:
{TASK}

Constraints or preferences: {CONSTRAINTS}
What good looks like: {SUCCESS_CRITERIA}
</task>

<structured_output_contract>
Return:
1. observed facts
2. recommendation
3. tradeoffs
4. implementation notes with likely repo touchpoints
5. risks or open questions
</structured_output_contract>

<default_follow_through_policy>
Do not ask questions; proceed with assumptions and label them.
</default_follow_through_policy>

<research_mode>
Separate observed facts, reasoned inferences, and open questions.
Prefer breadth first, then go deeper only where the evidence changes the recommendation.
</research_mode>

<grounding_rules>
Ground repo-specific claims in the uploaded bundle.
</grounding_rules>
```

## Prompt-Patching Template

Use this when the real object of review is a prompt, skill, or agent instruction set.

```xml
<task>
You are {ROLE}.

I am uploading `context.zip` containing repository files. Treat those files as authoritative.
Start by reading `context/MANIFEST.md`.

Diagnose why this prompt, skill, or instruction set is underperforming and propose the smallest high-leverage changes.

Target prompt or skill: {PROMPT_SCOPE}
Observed failure modes: {FAILURE_MODES}
Constraints: {CONSTRAINTS}
</task>

<structured_output_contract>
Return:
1. failure modes
2. root causes in the current prompt or instructions
3. revised prompt or instruction blocks
4. why the revision should work better
5. residual risks or follow-ups
</structured_output_contract>

<grounding_rules>
Base your diagnosis on the prompt text, instruction files, and failure examples in the bundle.
Do not invent failure modes that are not supported by the provided material.
</grounding_rules>

<verification_loop>
Before finalizing, make sure the revised prompt resolves the cited failure modes without creating contradictory instructions.
</verification_loop>
```

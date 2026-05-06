# Pressure-Test Mode

Use pressure-test mode when the user asks to grill, challenge, critique, stress-test, or sanity-check an idea, plan, architecture, decision, or direction.

## Start

Restate the proposal in one or two sentences. If the proposal is too unclear to critique, ask one clarifying question before proceeding.

For repo/software topics, read `repo-grounding.md` and verify checkable claims before treating them as true.

## Test

Look for:

- hidden assumptions
- unclear ownership
- unsupported user or business value
- simpler alternatives
- duplicated systems or duplicate truth
- scope that should be split
- edge cases and failure modes
- migration or compatibility costs
- verification gaps
- places where the plan solves the symptom but not the underlying problem

For product/UX work, also test:

- whether the proposed flow matches the real user moment
- whether the UI burden is proportionate to the value
- whether the idea adds dashboard chrome instead of reducing friction
- whether empty, error, and transition states are accounted for

## Recommend

End with one of:

- **Proceed**: the approach is sound enough to plan or implement.
- **Revise**: the core idea is good, but a specific part needs reshaping.
- **Split**: the idea combines separate decisions or deliverables.
- **Drop**: the idea is not worth pursuing in its current form.

Include:

- strong parts
- risks
- hidden assumptions
- simpler alternative when one exists
- recommendation

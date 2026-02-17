# Forms, validation, and recovery

Use this for any UI collecting user input.

## Labels and instructions
- Keep labels persistent and associated with each control.
- Do not use placeholder text as the only label.
- Provide instructions before users submit when format/constraints are non-obvious.

Quick checks:
- Can users understand each field without prior context?
- Are required fields marked consistently?
- Are hints visible without interaction?

## Validation behavior
- Validate at appropriate moments (on blur, on submit, or progressively for strict formats).
- Avoid noisy "red while typing" behavior unless it is clearly helpful.
- Preserve user input when errors occur.

## Error message quality
- Explain what happened in plain language.
- Point to the field and suggest the fix.
- Keep summary + inline mapping clear for long forms.

Quick checks:
- Does each error include what is wrong and how to fix it?
- Is focus moved to the first invalid field or summary appropriately?
- Are errors announced/accessibly perceivable?

## Recovery and completion
- Let users correct issues without re-entering unaffected data.
- Confirm success clearly and show the next step.
- For destructive form actions, provide confirm/undo patterns where feasible.

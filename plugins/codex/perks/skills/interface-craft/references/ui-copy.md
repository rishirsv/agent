# UI Copy

Use this reference for visible text, accessibility labels, alt text, notifications, system dialogs, voice command labels, Siri or Shortcut intent labels, tooltips, input hints, empty states, and errors.

## Scope Map

- Implementation leakage: remove code-shaped, scaffold-shaped, or state-machine-shaped text.
- Product copy rules: labels, actions, empty states, errors, and destructive choices.
- Accessibility copy: labels and alt text must be user-facing copy, not hidden implementation notes.
- Examples and checks: use to rewrite rough copy into product language.

## Implementation Leakage

User-facing text must not exist because of an implementation detail. If a string makes sense because of a permission scope, feature flag, backing enum, state machine, internal taxonomy, agent rationale, or scaffold label, rewrite or remove it.

Implementation leakage is also scaffold-as-UI: text that explains the screen from the builder's point of view instead of helping the user act, understand state, or recover.

Run these diagnostics:

1. Inverted provenance: the string makes sense to someone who knows the codebase, but reads as unclear or irrelevant to a fresh user.
2. State-machine leak: the string exposes the backing state instead of the user-visible consequence.
3. Scaffold leak: the string reads like the agent narrating the design, task, or screen purpose.

Treat accessibility labels and alt text as first-class UI copy. Screen-reader text with implementation leakage is usually worse than visible leakage because the user has less surrounding visual context.

## Label-Plus-Explanation Pattern

A short label followed by a sentence explaining what the label means is usually scaffold-as-UI. If the label needs the sentence, rewrite the label and delete the sentence.

Bad:

```text
Focus
The thing you should be working on right now.
```

Better:

```text
Current task
```

Ornamental labels are banned unless they come from real product naming, not from the agent's voice.

## Product Copy Rules

- Before writing or rewriting UI copy, look for durable voice guidance in design- or taste-related files, brand docs, the design system, or existing product copy. If none exists, infer 3-4 working voice traits from the product.
- Think in dials, not separate voices. A calm product can be warmer in onboarding and more matter-of-fact in errors without sounding like a different company.
- If deleting 30% of the copy improves the page, keep deleting.
- Use specific verbs: Create account, Save changes, Download report.
- Avoid OK, Yes, No, Submit when a clearer label is possible.
- For destructive actions, name both paths: Delete file and Keep file, not Confirm and Cancel.
- Avoid reflexive apologies such as sorry, oops, uh oh unless the brand truly uses them.
- Keep product terms stable. If the product says workspace, do not alternate with project unless the distinction is real.
- Empty states should explain what appears here, why it matters, and the next useful action.
- Error copy should say what happened and how to recover.

## Copy Bans

- Do not use "actually X", "not just X", "unlock", "empower", "supercharge", "next-generation", "enterprise-grade", "world-class", or "seamless" unless that exact phrase already belongs to the product voice.
- Do not write visible instructional copy that explains the designer's intent, the page structure, the interaction model, or why an element exists.
- Do not use repeated eyebrow labels as a substitute for information architecture.
- Do not label UI with implementation scopes, flags, state names, model outputs, or fixture names.
- Do not keep filler, demo, sample prose, or "coming soon" copy unless the user explicitly asked for a temporary surface.

## Examples

Bad:

```text
Outside workouts
Context only.
```

Better:

```text
Imported workouts
Connect Health to import workouts.
```

Or remove the row if the feature cannot help the user yet.

Bad:

```text
Workout read unavailable
```

Better:

```text
Not connected
```

Better with recovery:

```text
Connect Health to import workouts
```

Good compact settings row:

```text
Apple Health
Steps and workout export.
Not Connected
```

Bad:

```text
Sync disabled by feature flag
```

Better:

```text
Sync is off
Turn on iCloud sync in Settings.
```

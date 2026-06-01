---
name: prototype
description: Use when building a disposable prototype or visual reference artifact to answer one pre-production question about logic, state, data shape, interaction, or UI direction before production implementation; not for production UI craft, polish, critique, or hardening.
---

# Prototype

A prototype answers one pre-production question. It is not production implementation.

## Scope

Use this skill when the user wants to explore whether an idea works before committing:

- logic, state machine, business rule, API shape, or data model
- visual direction, option board, contact sheet, or reference mock
- disposable route variants that can be compared in the running app

Use `$interface-craft` instead for production UI craft, polish, critique, hardening, design docs, or taste distillation.

## Mode Selection

- `logic`: the question is about state, transitions, rules, data shape, or API feel. Read [LOGIC.md](LOGIC.md).
- `visual-reference`: the question is what a surface could look like, how a standalone HTML interaction should feel, or which direction to choose. Read the source-context, imagegen, standalone HTML, board, contact-sheet, and reference-pass sections of [UI.md](UI.md).
- `route-variants`: the user needs to play with options in the real app, compare density, or judge interaction in context. Read the runnable route variants section of [UI.md](UI.md).

If ambiguous, infer from the artifact needed to answer the question. Backend/data question means `logic`. Screen, component, or flow question means `visual-reference` first.

When the user says design-only, prototype-only, mock, sketch, image-gen, HTML, or says not to implement production changes, do not edit app source. Use imagegen or a standalone HTML artifact unless the user explicitly asks for runnable app-route variants.

## Workflow

1. State the single question the prototype must answer.
2. Choose the smallest artifact that answers it.
3. For UI prototypes, do the source-reference sweep in [UI.md](UI.md) before generating images or building standalone HTML.
4. Mark code prototypes as throwaway and visual artifacts as references.
5. Keep persistence out unless persistence is the question.
6. Make the artifact inspectable through one command, URL, or generated image.
7. Surface the state, variants, or decision clearly.
8. Capture the answer: verdict, selected direction, what to delete, what to absorb, and remaining uncertainty.

## Output

Return:

- question answered
- artifact path, command, URL, or image
- what was learned
- what should be deleted, retained as reference, or rebuilt properly
- validation or inspection performed
- known limitations

## Guardrails

- Do not promote prototype code directly to production.
- Do not add broad tests, abstractions, migrations, or production error handling to throwaway code.
- Do not wire variants to real destructive mutations.
- Do not treat generated image text, fake icons, impossible shadows, or invented features as requirements.

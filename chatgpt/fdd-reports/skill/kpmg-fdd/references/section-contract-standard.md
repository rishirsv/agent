# Section contract standard

Use this pattern for all current and future section contracts.

## Required headings (in this order)

1. `Table of contents`
2. `Core rule`
3. `Writing guidance`
4. `Layout options (choose one)`
5. `Available slot shapes (tool library)`
6. `Layout-to-slot recipes`
7. `Industry adaptation examples` (short, optional but recommended)
8. `Render skeleton`
9. `Common mistakes (and fixes)`
10. `Structural preflight rules (must pass)`
11. `Split policy rules`
12. `Full example`

## Authoring rules

- Keep cross-section rules in `global-writing-conventions.md`.
- Put writing guidance before shapes.
- Treat slot shapes as available tools, not mandatory sequence.
- Use complexity-based, industry-agnostic layout options.
- Add short adaptation examples when helpful.
- Include at least one complete example at the target standard length.
- Do not include line references or corpus citations in final contract text.

## Slot shape pattern

Each slot definition should include:
- purpose
- recommended use cases
- target length
- placeholder behavior
- whether a source note is recommended

## Layout recipe pattern

For each layout option, define:
- when to use it
- target length
- required section blocks
- suggested slot combinations per block

## Contract quality bar

A strong contract should let a model generate compliant output with minimal ambiguity.
If a rule can be interpreted two ways, rewrite it to be deterministic.

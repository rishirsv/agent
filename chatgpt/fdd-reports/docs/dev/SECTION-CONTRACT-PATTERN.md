# DEV: Section Contract Pattern (Playbook + Template Combined)

This is a development-only authoring pattern.
Keep this outside `skill/` so distributed skill bundles only contain portable artifacts.

## Core Rule

One section contract should be the single source of truth for:
- how to think (analysis/playbook logic)
- how to write (template/render structure)
- how to quality-check (gates/failure handling)

## Standard Layout

Use this heading order for each section contract:

1. `Core Rule`
2. `Required Inputs`
3. `Evidence Rules`
4. `Block Contract`
5. `Render Skeleton`
6. `Quality Gates`
7. `Failure Handling`
8. `Style Profile (2B)`
9. `Section-Specific Pitfalls`
10. `Implementation Notes`

## Placeholder Conventions

- Scalar value: `[VALUE]`
- Table marker: `[TABLE:NAME]`
- Open item: `[OPEN_ITEM:P0/P1/P2:REQUEST:WHY_IT_MATTERS]`


# Component Mockups

Use this reference for individual controls, cards, rows, forms, charts, toolbars, sheets, and other UI pieces.

## Decide Scope

- Isolated component: use a neutral canvas and no app shell.
- Component in context: include a cropped parent surface when surrounding state changes the design.
- State matrix: show the same component across several labeled states.
- Option board: show A/B/C component directions with the same content and scale.

## Common States

Choose only states that matter for the task:

- default
- active or selected
- focused
- disabled
- loading
- empty
- error
- expanded
- compact
- long-content stress case

## Prompt Guidance

- Name the component role and platform.
- State the data/content the component should show.
- Specify exact text for labels, values, and buttons.
- Describe dimensions or density: compact row, large summary, bottom accessory, modal sheet, toolbar, inline editor.
- Specify what must stay constant when generating options.
- Ask for labels outside the component for states or variants.

## Component Defaults

- Do not turn every component into a card.
- Keep hit targets plausible.
- Align icons, values, labels, and controls to a stable rhythm.
- Use dynamic-content stress cases when the component will face long names, large numbers, or multiple states.
- Use realistic data instead of placeholder text.

## Avoid

- Full-screen app shells when not needed.
- Decorative shadows on every nested object.
- Tiny unreadable values.
- Extra controls the user did not request.
- Style-only variants that do not change the product decision.

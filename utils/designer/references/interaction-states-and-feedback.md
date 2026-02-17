# Interaction states and feedback

Use this to harden affordance, clarity, and confidence in UI controls.

## Required state set for interactive controls
Define and style each state intentionally:
- default
- hover (pointer-capable devices)
- focus-visible (keyboard accessibility)
- pressed/active
- disabled
- loading
- success/error (when relevant)

## Affordance and discoverability
- Make clickable elements look interactive before hover.
- Keep action hierarchy obvious across all states.
- Do not rely on color alone to show state changes.

Quick checks:
- Can users identify primary actions without hovering?
- Are links distinguishable from plain text?
- Is disabled clearly inactive but still legible?

## Focus treatment
- Ensure focus indicators are visible and consistent.
- Avoid clipping/covering focused elements with overflow or sticky UI.
- Keep keyboard navigation order logical.

Quick checks:
- Can you tab through and always track focus?
- Do dialogs/menus preserve focus context?
- Are focus styles equally visible on light and dark surfaces?

## Target size and input confidence
- Keep hit targets comfortably large.
- Add spacing between adjacent touch targets to reduce mis-taps.
- Apply pointer/hover styles only when device input supports them.

## System feedback timing
- Acknowledge user actions immediately (visual, textual, or both).
- Keep loading states stable; do not shift nearby content.
- Prefer inline field-level feedback for local issues and page-level summaries for global issues.

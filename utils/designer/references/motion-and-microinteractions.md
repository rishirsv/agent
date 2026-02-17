# Motion and micro-interactions

Use motion to communicate state and reduce uncertainty, not to decorate.

## When to add motion
- Add motion after structure/hierarchy are stable.
- Start with transitions that clarify interaction state or spatial relationships.

## High-impact micro-interactions
- Hover: subtle elevation, underline, tint shift, or shadow change.
- Pressed: clear down-state (opacity/scale/offset) to confirm the action.
- Focus: visible ring/outline aligned with the system.
- Loading: prevent layout shift; show skeleton/progress that preserves space.
- Success/error: immediate feedback with clear copy and next step.
- Empty states: clear "what to do next" path.

## Motion principles
- Keep durations short and consistent across similar interactions.
- Prefer one or two meaningful animation moments over many competing effects.
- Avoid stacking multiple unrelated animations on the same element.
- Prefer transform/opacity animations for smoother rendering and fewer layout jumps.

## Reduced motion support
- Respect `prefers-reduced-motion`.
- Provide reduced alternatives for large transforms/parallax/continuous effects.
- Keep essential feedback even when motion is reduced (state, copy, icon changes).

## Evidence capture
If motion is part of the iteration, capture:
- a short recording
- one still screenshot showing pre state
- one still screenshot showing post state

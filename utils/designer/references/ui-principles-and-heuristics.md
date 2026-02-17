# UI principles and heuristics

Use this rubric to turn "feels off" into concrete, fixable changes.

## Hierarchy
- Make page purpose understandable in 2-5 seconds: one primary message, one primary action.
- Make primary vs secondary obvious through size, weight, placement, and spacing.
- Group by whitespace and alignment first; add borders only when structure is still unclear.

Quick checks:
- Is there one visual hero per region?
- Are headings and labels doing distinct jobs?
- Can a new user point to the main action in under 5 seconds?

## Typography
- Use a repeatable type scale (usually 3-5 sizes), not one-off sizes.
- Keep line length comfortable and line-height consistent.
- Use emphasis sparingly and only to signal meaning.

Quick checks:
- Do H1/H2/body/meta styles encode structure cleanly?
- Is long-form text readable without zooming?
- Are all-caps/bold/color accents limited to meaningful emphasis?

## Spacing and layout rhythm
- Use a small spacing scale and repeat it.
- Align edges/baselines; remove "almost aligned" placements.
- Keep component padding consistent unless there is a clear reason.

Quick checks:
- Are gutters consistent across sections?
- Do cards/rows share padding rules?
- Do section gaps communicate hierarchy (not randomness)?

## Reading order and page flow
- Give each major section a clear headline and one-line purpose.
- Keep a predictable flow: context, details, then next action when relevant.
- Tighten section order before introducing extra visual treatment.

Quick checks:
- Can users understand section order by scanning headings?
- Does each section have a clear reason to exist?
- Is the next step obvious where action is expected?

## Density and scannability
- Alternate dense sections with breathable sections to reduce fatigue.
- Prefer whitespace and alignment before adding decorative containers.
- Break long blocks into shorter chunks, bullets, or callouts when clarity improves.

Quick checks:
- Are there two dense sections back-to-back with no visual pause?
- Can key points be found by scanning subheads?
- Are related items visually grouped more tightly than unrelated ones?

## Color and contrast
- Use color for action/status/significance, not decoration.
- Keep neutral surfaces readable and reserve accents for action/emphasis.
- Ensure text, icons, and focus indicators remain distinguishable across states.

Quick checks:
- Is accent color reserved for actionable elements and key highlights?
- Do disabled/secondary states stay visible without competing with primary actions?
- Are state changes visible without relying on color alone?

## Accessibility users can feel
- Keep focus visible, consistent, and unobscured.
- Make tap/click targets comfortable.
- Write error copy that explains what happened and what to do next.

Quick checks:
- Can you tab through and always see focus?
- Are interactive targets easy to hit on mobile?
- Do error messages identify the issue and suggest a fix?

## Responsive behavior
- Let content define breakpoints instead of hard-coding device assumptions.
- Keep content hierarchy stable across viewport changes.
- Use progressive enhancement when adding richer desktop patterns.

Quick checks:
- Does content priority stay intact on mobile and desktop?
- Are reflows/collapses predictable and easy to follow?
- Do lists/cards keep alignment when wrapping?

## Input-modality awareness
- Apply hover-only patterns only where hover is supported.
- Keep focus-visible and tap feedback strong for keyboard and touch.
- Avoid precision-cursor interactions in touch-first flows.

## Performance and stability
- Reserve space for late-loading content to reduce layout shifts.
- Prefer transform/opacity animations over layout-affecting motion.
- Keep interaction feedback immediate and predictable.

## Evidence-backed thresholds
- Text contrast: 4.5:1 minimum (3:1 for large text).
- Non-text contrast (icons, controls, focus visuals): 3:1 minimum.
- Target size: at least 24x24 CSS px or equivalent spacing exception.
- Text spacing robustness: content should still work with larger line/paragraph/letter/word spacing.

# Evaluate Mockup Output

Use this checklist after generating mockups.

## Gating Checks

- Correct artifact type: full screen, component, state matrix, flow, or option board.
- Correct platform: iOS, Android, web, or platform-neutral as requested.
- Required UI elements are present.
- Exact critical text is readable and close enough to the request.
- Option labels A/B/C are visible when requested.
- The output did not add unrelated features.
- The output did not ignore preserve constraints.

## Design Checks

- The primary action or state is clear.
- The hierarchy can be understood in a few seconds.
- Controls look interactive and plausible.
- Text is sparse enough to render legibly.
- The visual system follows repo or product design guidance.
- Variants differ on meaningful axes, not random decoration.
- Components have stable dimensions and do not shift between states unless intended.

## Common Fix Prompts

- "Keep the same composition, but make all UI text larger and more readable."
- "Keep the same option labels and content, but remove the extra decorative elements."
- "Change only Option B to use a denser ledger layout; keep A and C unchanged."
- "Preserve the device frame and palette; simplify the fake chart into a realistic list."
- "Restore the requested product name and remove all unrelated labels."

## Stop Rule

If the artifact answers the design question, stop. Do not over-iterate for pixel polish unless the user asks for a production-quality visual.

# Apple HIG iPhone UI Reference

Use this file as a practical HIG-aligned reference when designing iPhone UIs with React Native and Expo.

## Goal

Produce interfaces that feel native to iOS by aligning with Apple interaction, visual, and accessibility conventions.

## Core HIG principles for iPhone UI

- Prefer native patterns over custom chrome.
- Keep hierarchy clear with one primary action per screen region.
- Use system behavior for navigation, sheets, alerts, menus, and search.
- Use system typography and semantic colors whenever possible.
- Keep motion purposeful and subtle; interactions should feel immediate.
- Respect accessibility settings and dynamic content scaling.

## Navigation and screen structure

- Use native stack navigation for primary flows.
- Use sheets and modals for focused secondary tasks.
- Keep titles, back behavior, and toolbar actions consistent with platform norms.
- Avoid replacing native headers with custom header systems unless there is a strong product reason.

## Lists, forms, and data entry

- Use list/grouping patterns that match iOS scanning behavior.
- Keep row density readable and tap targets comfortable.
- Prefer native controls (switches, segmented controls, date/time pickers) before custom controls.
- Keep validation clear and mostly inline.
- Ensure keyboard and focus behavior are predictable in forms.

## Visual system choices

- Prefer semantic system colors over hard-coded near-system hex values.
- Use iOS materials/blur styles intentionally instead of ad-hoc opacity overlays.
- Keep shape language and spacing consistent across components.
- Use haptics for confirmation and high-value interaction moments.

## Accessibility and quality checks

- Dynamic Type: text scales and layout remains usable.
- Dark mode: surfaces, text, and state indicators remain legible.
- Contrast: text and controls remain distinguishable.
- Touch targets: controls are easy to hit without precision.
- Motion: respect reduced-motion preferences.
- VoiceOver: labels and action meaning are clear.

## iPhone UI review checklist

- Does this screen look and behave like iOS first, custom second?
- Are native controls and navigation patterns used where available?
- Is there a clear main action and clear secondary actions?
- Are forms recoverable and readable at larger text sizes?
- Do interactions provide immediate and confident feedback?
- Is the design polished without breaking platform conventions?

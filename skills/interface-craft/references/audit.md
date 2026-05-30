# Audit

Audit is read-only. It combines technical UI quality, design critique, generated-pattern detection, and prioritized workflow impact.

## Evidence

Use rendered inspection when available: simulator, preview, device screenshot, Browser Use, Agent Browser, project-native screenshot tooling, or provided screenshots. Code-only audit is acceptable only when rendering is unavailable; say that the evidence is weaker.

When source files are available, run [../scripts/detect-ui-slop.mjs](../scripts/detect-ui-slop.mjs) on the focused frontend area and use the findings as inspection prompts. Do not report detector output without checking whether the pattern is visible, repeated, or justified by the existing system.

## What To Check

### Technical Quality

- Accessibility: contrast, labels, roles/traits, keyboard/focus, VoiceOver or screen reader order, alt text, form errors, Dynamic Type or zoom.
- Theming: token usage, dark/light behavior, semantic colors, hard-coded values, state consistency.
- Adaptive layout: narrow and wide screens, orientation, touch targets, pointer/touch differences, overflow, dense data, long text.
- Smoothness: layout shift, jank, excessive rerendering, expensive animation, oversized media, unbounded blur/filter/shadow.
- Release readiness: missing states, dead controls, filler content, console/runtime errors, broken paths.

### Design Quality

- Primary action: can the user tell what matters first?
- Visual hierarchy: scale, weight, spacing, color, grouping, rhythm.
- Information architecture: sequence, grouping, naming, progressive disclosure.
- Cognitive load: visible choices, repeated information, needless decisions.
- Copy: CTAs, labels, empty states, errors, confirmations, tooltips, accessibility text, and scaffold-as-UI.
- Product fit: earned familiarity, standard affordances, consistent component vocabulary, product copy.
- Brand fit: point of view, first-viewport signal, imagery when expected, memorable composition.
- AI slop: generic layout, fake metrics, gradient text used as default emphasis, identical card grids, category-reflex palette, numbered section markers, side stripes, ghost cards, over-rounded everything, decorative stripe backgrounds, filler copy.
- Implementation leakage: internal states, scopes, flags, enum names, agent rationale, or scaffold text surfaced as UI.
- Persona red flags: first-timer, power user, mobile/touch user, accessibility user, skeptical evaluator.

For typography, layout, imagery, motion, copy, and micro-polish specifics, read [lenses.md](lenses.md) when those areas drive findings. For hard-banned generated defaults, read [bans.md](bans.md).

## Scoring

Use a scorecard for deep audits or when it clarifies tradeoffs:

```text
Audit Score: ?/20
Accessibility: ?/4
Theming: ?/4
Adaptive Layout: ?/4
Smoothness: ?/4
Design Quality: ?/4
```

Use severity for findings:

- P0: blocks task completion, release, or trust.
- P1: major user or release risk.
- P2: real issue to fix soon.
- P3: polish.

Treat implementation leakage or scaffold-as-UI in production product surfaces as P1 when it can damage user trust, confuse task completion, or expose internal model/state.

Treat visible hard-ban patterns as P2 by default. Raise to P1 when they dominate the first viewport, repeat across critical surfaces, block comprehension, or make the product look untrustworthy.

## Output

Lead with findings:

```text
Verdict:
What works:
Findings:
Recommended next:
```

Map next steps to `interface-craft polish` for craft/coherence issues and `interface-craft harden` for production-resilience issues. Do not drown the user in P3s.

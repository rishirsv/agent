# Harden

Harden makes an existing surface survive real users, real data, real devices, generated-code defaults, and failure.

## Scope Map

- Flow: identify critical paths, stress likely failures, run detector, patch, and re-render.
- Stress cases: content extremes, device extremes, interaction failures, accessibility, locale, and generated-pattern risk.
- Matrix: record evidence, result, and unresolved risk for the categories that matter.
- Fixes: prioritize layout/text, states, recovery copy, accessibility, locale/platform, and verification.

## Flow

1. Identify the critical path and failure-prone states.
2. Stress the UI with realistic extremes.
3. Run the slop detector when frontend files are available.
4. Patch resilience issues and real detector findings.
5. Render or run the surface again. If it cannot be rendered, say what remains unverified.

## Stress Cases

Test or reason through:

- very long and very short text
- missing values
- emoji, accents, CJK, RTL, special characters
- large numbers, currency, dates, percentages
- many items, dense lists, large tables
- empty, no results, no permission, read-only
- slow, offline, timeout, 4xx, 5xx, rate limit
- repeated clicks, double submit, concurrent operations
- optimistic update rollback
- small devices, large devices, portrait, landscape
- Dynamic Type, zoom, reduced motion, high contrast
- detector-flagged patterns such as layout-property animation, over-rounded controls, ghost cards, decorative stripes, implementation leakage, and marketing filler

## Hardened State Matrix

Before calling the work hardened, create a compact matrix for the target surface. Include only relevant rows, but mark any skipped critical category as `N/A` with a reason.

| Category | Cases Checked | Evidence | Result | Unresolved Risk |
| --- | --- | --- | --- | --- |
| Data extremes | Long/short text, missing values, large numbers, many items | Screenshot, preview, test, or code path | Pass/fail/fixed | Remaining data risk |
| Viewport/device extremes | Small, large, portrait, landscape, narrow/wide | Screenshot, simulator, browser, or responsive preview | Pass/fail/fixed | Remaining layout risk |
| Interaction failures | Double submit, retry, rollback, disabled state, offline/timeout | Manual run, test, fixture, or code path | Pass/fail/fixed | Remaining recovery risk |
| Accessibility path | Keyboard/platform navigation, focus order, labels, contrast, text scale, reduced motion | Manual run, audit, preview, or code path | Pass/fail/fixed | Remaining accessibility risk |
| Locale/text expansion | Translation growth, CJK, RTL, emoji, accents, pluralization, currency/date formats | Fixture, preview, or code path | Pass/fail/fixed | Remaining locale risk |
| Loading/empty/error/recovery | Initial loading, incremental loading, empty, no results, permission denied, error, retry, success | Screenshot, fixture, test, or code path | Pass/fail/fixed | Remaining state risk |
| Performance-sensitive UI | Large lists/tables, expensive media, charts, animation, scrolling, repeated updates | Profiling, instrumentation, code path, or manual run | Pass/fail/fixed | Remaining performance risk |
| Generated-pattern resilience | Detector findings, hard-banned visual defaults, scaffold copy | Script output plus rendered/code inspection | Pass/fail/fixed | Remaining slop risk |

## What To Fix

### Layout And Text

- Prevent text and media overflow.
- Let flex/grid children shrink correctly.
- Choose wrapping, truncation, disclosure, or expansion deliberately.
- Preserve readable text at zoom and native text-size settings.
- Avoid fixed sizes for translated or user-generated content.
- Keep controls, counters, badges, loading labels, and hover states inside stable dimensions so interaction does not shift layout.

### States

Implement useful states:

- initial loading, preferably skeletons when the content structure is known
- incremental loading
- empty
- no results
- error
- retry
- success
- disabled
- permission denied
- offline or degraded connection where relevant

### Recovery Copy

Errors should explain what happened and what the user can do next. Validation should be specific. Destructive confirmations should name the object and consequence. Errors and unavailable states must explain the user-visible consequence and recovery path, not raw internal states, permission scopes, API names, feature flags, or backing enum values.

### Accessibility

- Keyboard or platform navigation works.
- Focus and screen reader order make sense.
- Dynamic changes are announced where appropriate.
- Touch targets are sufficient.
- Color is not the only signal.
- Reduced motion is respected.

### Locale And Platform

- Use locale-aware dates, numbers, currency, and pluralization.
- Allow translation expansion.
- Avoid English-only layout assumptions.
- Use platform-standard controls and navigation where possible.
- Preserve core functionality across device contexts. Adaptation is not hiding important features.

## Verify

Render or run the target and inspect:

- long text
- narrow and wide layout
- one failure state
- one empty/loading state
- critical interaction path
- accessibility path where relevant
- slop detector output or reason skipped

Report what was hardened, the completed Hardened State Matrix, and what remains untested.

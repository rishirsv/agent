# Harden

Harden makes an existing surface survive real users, real data, real devices, and failure.

## Flow

1. Identify the critical path and failure-prone states.
2. Stress the UI with realistic extremes.
3. Patch resilience issues.
4. Render or run the surface again. If it cannot be rendered, say what remains unverified.

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

## What To Fix

### Layout And Text

- Prevent text and media overflow.
- Let flex/grid children shrink correctly.
- Choose wrapping, truncation, disclosure, or expansion deliberately.
- Preserve readable text at zoom and native text-size settings.
- Avoid fixed sizes for translated or user-generated content.

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

Report what was hardened and what remains untested.

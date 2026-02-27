# Section Contract: QoE and Earnings Adjustments

## Core Rule

Build a defensible bridge from reported EBITDA to adjusted EBITDA.
Every material adjustment needs a basis and recurrence rationale.
If support is missing, log an open item instead of asserting.

## Required Inputs

| Input | Required | Source | Fallback If Missing |
|---|---|---|---|
| Reported EBITDA by period | Yes | Financial statements / TB | Add open item and keep bridge partial |
| Management adjustment schedule | Yes | Management pack | Add open item and draft only evidenced adjustments |
| Support for top adjustments | Yes | Invoices / GL detail / schedules | Mark adjustment as pending basis |
| EBITDA definition used by deal team | Yes | Deal team / draft SPA | Add assumption note + open item |
| Revenue detail (for quality checks) | No | Management data | Keep commentary qualitative |

## Evidence Rules

- Any material quantitative claim must include a basis line.
- Period labels must be explicit (for example: FY23, FY24, LTM Jun-25).
- Sign convention must be consistent within bridge and narrative.
- Do not label an item non-recurring without reason.
- Do not mix EBITDA definitions across exhibits without disclosure.

## Block Contract

| Block | Required | Purpose | Required Slots | Allowed Variants |
|---|---|---|---|---|
| Overview | Yes | Define scope and EBITDA basis | `[PERIOD_SCOPE]`, `[EBITDA_DEFINITION]` | Short or standard |
| Bridge Summary | Yes | Show reported to adjusted walk | `[TABLE:QOE_BRIDGE]` | Table only |
| Adjustment Rationale by Type | Yes | Defensible support for each item | `[ADJUSTMENT_CARDS]` | Group order can vary |
| Sensitivities and Open Items | Yes | Show what could move conclusions | `[OPEN_ITEMS]`, `[SENSITIVITY_NOTES]` | Bullets or short table |

## Render Skeleton

```markdown
# QoE and earnings adjustments

## Overview
- Periods covered: [PERIOD_SCOPE]
- EBITDA definition used: [EBITDA_DEFINITION]
- Scope note: [SCOPE_NOTE]

## Reported to adjusted bridge
[TABLE:QOE_BRIDGE]
Basis: [BRIDGE_BASIS]

## Adjustment rationale by type

### [ADJUSTMENT_TYPE_1]
1. [ADJUSTMENT_NAME]
   - What it is: [WHAT_IT_IS]
   - Why treated this way: [RECURRENCE_RATIONALE]
   - How quantified: [QUANT_METHOD]
   - Basis: [BASIS_LINE]
   - Residual risk: [RESIDUAL_RISK]

### [ADJUSTMENT_TYPE_2]
1. [ADJUSTMENT_NAME]
   - What it is: [WHAT_IT_IS]
   - Why treated this way: [RECURRENCE_RATIONALE]
   - How quantified: [QUANT_METHOD]
   - Basis: [BASIS_LINE]
   - Residual risk: [RESIDUAL_RISK]

## Sensitivities and open items
- [OPEN_ITEM:P0/P1/P2:REQUEST:WHY_IT_MATTERS]
- [SENSITIVITY_NOTE]
```

## Quality Gates

Do-not-deliver:
- Bridge missing or does not tie.
- Material quantified claim has no basis.
- Unsupported non-recurring labels.
- Placeholder leakage in final mode.

Pass checks:
- Block order is valid.
- Bridge uses one consistent EBITDA definition.
- Each material adjustment has recurrence rationale and residual risk.
- Open items capture unresolved material gaps.

## Failure Handling

- Missing management adjustment schedule:
  - Render bridge with evidenced rows only.
  - Add `[OPEN_ITEM:P0:Adjustment schedule required to complete normalized EBITDA bridge]`.
- Missing support for a material adjustment:
  - Keep item in pending state.
  - Do not assert final conclusion for that item.
- Conflicting EBITDA definitions:
  - State current assumption explicitly.
  - Add P0 open item for deal-team confirmation.

## Style Profile (2B)

Keep:
- Clear finding-first statements.
- Explicit caveats when data is incomplete.
- Workstream-oriented grouping for adjustments.

Normalize:
- Compress long sentences.
- Prefer active, direct phrasing.
- Standardize basis-line format.

Avoid:
- Boilerplate legalistic language with no decision value.
- Absolute claims without evidence.
- Repeating the same caveat line in every paragraph.

## Section-Specific Pitfalls

- Turning the section into a list of unsupported adjustments.
- Discussing adjustments without showing bridge impact.
- Overstating certainty on disputed or unverified items.

## Implementation Notes

This contract is the combined source of truth for:
- analysis logic
- writing structure
- quality controls


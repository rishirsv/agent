# Section contract: QoE and earnings adjustments

## Table of contents
- Core rule
- Writing guidance
- Layout options (choose one)
- Available slot shapes (tool library)
- Layout-to-slot recipes
- Render skeleton
- Common mistakes (and fixes)
- Structural preflight rules (must pass)
- Split policy rules
- Full example

## Core rule

Build a clear bridge from reported EBITDA to adjusted EBITDA with supportable adjustment logic.

Global writing, placeholder, and language rules are defined in `references/global-writing-conventions.md` and apply here.

## Writing guidance

1. Start with scope and EBITDA definition.
2. Show the full bridge before discussing adjustment details.
3. Explain each material adjustment in plain accounting logic.
4. Keep recurrence logic explicit.
5. Keep sensitivities separate from core bridge mechanics.

## Layout options (choose one)

### `standard`
Use for most deals with manageable adjustment volume.

Target length:
- 350-650 words (including bridge table)

Required blocks:
- `Overview`
- `Reported to adjusted bridge`
- `Adjustment rationale by type`
- `Sensitivities`

### `high_adjustment_density`
Use when adjustment volume is high or heavily debated.

Target length:
- 500-900 words (including bridge and grouped rationale)

Required blocks:
- same as `standard`
- grouped adjustment sub-blocks by type

## Available slot shapes (tool library)

Use these as building blocks. Choose only what the selected layout needs.

### `bridge_row`
- Purpose: quantify one step in the EBITDA bridge.
- Best use: bridge table.
- Required fields: label, amount, recurrence tag.
- Placeholders: allowed.

### `definition_bullet`
- Purpose: define scope, periods, and EBITDA basis.
- Best use: overview block.
- Target length: 15-35 words.
- Placeholders: allowed.

### `adjustment_card`
- Purpose: explain one material adjustment.
- Best use: adjustment rationale block.
- Required fields: what, why, how quantified, residual risk.
- Target length: 35-90 words.
- Placeholders: allowed.

### `sensitivity_bullet`
- Purpose: describe what could move adjusted EBITDA.
- Best use: sensitivities block.
- Target length: 20-45 words.
- Placeholders: allowed.

### `source_note`
- Purpose: compact support note for bridge or adjustment group.
- Best use: once per block when needed.
- Target length: 8-25 words.
- Placeholders: allowed.

## Layout-to-slot recipes

### `standard` recipe
- `Overview`: 2-4 `definition_bullet`
- `Reported to adjusted bridge`: 4-8 `bridge_row` entries
- `Adjustment rationale by type`: 3-8 `adjustment_card`
- `Sensitivities`: 1-4 `sensitivity_bullet`

### `high_adjustment_density` recipe
- `Overview`: 3-5 `definition_bullet`
- `Reported to adjusted bridge`: 6-12 `bridge_row` entries
- `Adjustment rationale by type`: 8-16 `adjustment_card`, grouped by type
- `Sensitivities`: 2-5 `sensitivity_bullet`

## Render skeleton

```markdown
## QoE and earnings adjustments

### Overview
- [definition_bullet]
- [definition_bullet]
- [definition_bullet optional]

### Reported to adjusted bridge
| Item | Amount ($m) | Recurring? |
|---|---:|---|
| [bridge_row] | $[x] | [Yes/No/N/A] |
| [bridge_row] | $[x] | [Yes/No/N/A] |
| [bridge_row] | $[x] | [Yes/No/N/A] |

### Adjustment rationale by type
- [adjustment_card]
- [adjustment_card]
- [adjustment_card]
- Source note: [source_note optional]

### Sensitivities
- [sensitivity_bullet]
- [sensitivity_bullet optional]
```

## Common mistakes (and fixes)

1. Mistake: adjustment labeled non-recurring with no rationale.
- Fix: state explicit recurrence logic and period context.

2. Mistake: bridge rows with mixed definitions.
- Fix: lock one EBITDA definition and reconcile deviations in-line.

3. Mistake: unresolved values removed from narrative.
- Fix: keep structure intact and use placeholders.

4. Mistake: excessive legal/process wording.
- Fix: prioritize accounting logic, quantification method, and residual risk.

## Structural preflight rules (must pass)

1. Bridge exists and arithmetic ties.
2. Every material adjustment has an `adjustment_card`.
3. No `Open items` heading appears.
4. Missing figures use placeholders.
5. Period labels are explicit.

## Split policy rules

1. Split adjustment cards into grouped sub-blocks if cards exceed 8.
2. Split if any card exceeds 90 words.
3. Use a continuation table if bridge rows exceed readable density.

## Full example

```markdown
## QoE and earnings adjustments

### Overview
- Periods covered: FY2023-FY2025 and LTM [Date].
- EBITDA definition used: reported EBITDA before exceptional items and non-cash share-based compensation.
- Scope boundary: [Target perimeter], excluding [Excluded entity].

### Reported to adjusted bridge
| Item | Amount ($m) | Recurring? |
|---|---:|---|
| Reported EBITDA | $[x] | N/A |
| Owner compensation normalization | $[x] | No |
| One-time professional fees | $[x] | No |
| Facility ramp inefficiency | $[x] | No |
| Run-rate procurement savings | $[x] | Yes |
| Adjusted EBITDA | $[x] | N/A |

### Adjustment rationale by type
- Owner compensation normalization removes above-market and cross-entity family compensation allocations that are not expected under a standalone governance model. Quantification uses payroll extracts and role-level benchmarking assumptions for [Period]. Residual risk remains where role remapping is pending.
- One-time professional fees remove transaction-specific legal and advisory costs booked in [FY20XX]. The adjustment is based on GL-coded professional-fee detail and invoice support. Residual risk is low given one-off nature and discrete coding.
- Facility ramp inefficiency removes temporary under-absorption at [site] during commissioning in [Period]. Quantification uses variance analysis against stabilized run-rate assumptions. Residual risk depends on final ramp profile through [Date].
- Run-rate procurement savings reflects contracted price changes effective [Date], annualized to a normalized period. Quantification is based on signed supplier terms and current purchase volumes. Residual risk remains if volume mix shifts materially.

### Sensitivities
- Adjusted EBITDA is most sensitive to final standalone management structure and compensation redesign across shared roles.
- A [x]% change in utilization at [facility] would move adjusted EBITDA by approximately $[x], all else equal.
```

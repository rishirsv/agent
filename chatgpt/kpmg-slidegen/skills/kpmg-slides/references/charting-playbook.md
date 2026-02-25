# Charting Playbook

Use this playbook to choose chart, table, or narrative layouts that support decisions.

## Decision Tree: Chart vs Table vs Narrative

```text
Do you have numeric data?
  ├─ No → Use narrative layout (oneColumnText / twoColumnText).
  └─ Yes → What does the reader need to do?
           ├─ See pattern/trend quickly → Chart.
           ├─ Read exact values / audit numbers → Table.
           └─ Decide between 2 options → Two-column comparison + 1 small table if needed.
```

## Supported Chart Types

Use only these chart types in `chart.type`:

- `bar`
- `bar3d`
- `line`
- `pie`
- `doughnut`
- `area`
- `scatter`
- `radar`

## Chart Type Selection Matrix

| Question you are answering | Recommended chart | When to avoid | Notes for slide copy |
|---|---|---|---|
| Compare categories at a point in time | `bar` | Avoid when there are more than 8 categories; use table or split. | Title should state winner/laggard and magnitude. |
| Show trend over time | `line` | Avoid when there are more than 3 series or noise dominates without smoothing rationale. | Use strapline to explain inflection points and drivers. |
| Show composition share | `pie` / `doughnut` | Avoid when there are more than 5 slices or differences are small; use `bar`. | Label top 2-3 shares; group remainder as `Other` when needed. |
| Show cumulative shape over time | `area` | Avoid when overlapping series obscure interpretation. | Use when stacked contribution is the story. |
| Show relationship/correlation | `scatter` | Avoid when x/y are unclear or no action follows from the pattern. | Include interpretation and decision implication in body bullets. |
| Show multi-factor scorecard | `radar` | Avoid for executive decks unless axes are 6 or fewer and differences are clear. | Prefer `analysisNarrowTable` as default for scorecards. |
| "Make it fancy" | `bar3d` | Almost always avoid; 3D reduces readability. | Use only if template/policy explicitly requires it. |

## Layout Alignment

- `analysisWideChart2ColsText`:
  - Default for chart + interpretation.
  - Use when pattern recognition is primary.
- `analysisWideChartTableText`:
  - Use when readers need both pattern and exact supporting values.
  - Keep table compact.
- `analysisNarrowTable`:
  - Use when precise values are primary evidence and insights are secondary.
- `oneColumnText` / `twoColumnText`:
  - Use when argument is logic-led rather than chart-led.

## Chart Density And Composition Rules

- Default to one chart per slide.
- If exact values are also needed, use `analysisWideChartTableText` and keep table size small.
- Series limits:
  - `line`: 1-3 series.
  - `bar`: 1-2 series unless stacked semantics are very clear.
- Category limits:
  - `bar`: 5-8 categories max.
  - Beyond 8 categories, split the slide or use table layout.
- Labeling:
  - Include `labels` and `name` in each series.
  - Include units in title/strapline or `opts.valAxisTitle` where appropriate.

## Anti-Patterns And Fixes

- Chart without a takeaway:
  - Fix: rewrite topic title into a claim the chart proves.
- Too many pie slices:
  - Fix: convert to bar chart with top categories + `Other`.
- Too many series:
  - Fix: split into two slides or show top drivers only; move detail to appendix.
- Mismatched scales and units across slides:
  - Fix: standardize units early (for example, always `$M`) and run a cross-slide numbers-tie check.

## Data Embedding And Transparency Rules

For every chart:

- Embed data in `chart.data[].values` as numeric arrays.
- Keep each series `labels` aligned in length with `values`.
- Add `chart.source` with source origin, date, and audited/estimated status.
- If assumptions exist, include them in `chart.source` (short) or in `noteSource` on `analysisWideChartTableText`.

## Compliant Chart Object Examples

Use triple-backtick JSON blocks exactly like these patterns.

### `bar`

```json
{
  "type": "bar",
  "data": [
    {
      "name": "FY2025 Revenue",
      "labels": ["BU1", "BU2", "BU3", "BU4"],
      "values": [82.4, 76.1, 69.8, 61.2]
    }
  ],
  "opts": { "valAxisTitle": "USD ($M)" },
  "source": "Source: Management accounts, Jan 2026 (audited FY2025)"
}
```

### `line`

```json
{
  "type": "line",
  "data": [
    { "name": "Revenue", "labels": ["Q1", "Q2", "Q3", "Q4"], "values": [24.1, 25.7, 27.0, 28.6] },
    { "name": "EBITDA", "labels": ["Q1", "Q2", "Q3", "Q4"], "values": [5.1, 5.5, 6.0, 6.4] }
  ],
  "opts": { "valAxisTitle": "USD ($M)" },
  "source": "Source: Internal MIS, FY2025 (estimated)"
}
```

### `pie` / `doughnut`

```json
{
  "type": "doughnut",
  "data": [
    {
      "name": "Channel mix",
      "labels": ["Retail", "E-commerce", "Wholesale", "Other"],
      "values": [44, 31, 18, 7]
    }
  ],
  "source": "Source: Sales cube extract, LTM Dec 2025"
}
```

### `area`

```json
{
  "type": "area",
  "data": [
    { "name": "Core", "labels": ["2023", "2024", "2025"], "values": [40, 46, 53] },
    { "name": "Adjacencies", "labels": ["2023", "2024", "2025"], "values": [10, 14, 17] }
  ],
  "opts": { "valAxisTitle": "USD ($M)" },
  "source": "Source: Strategy plan model v3, Feb 2026"
}
```

### `scatter`

```json
{
  "type": "scatter",
  "data": [
    {
      "name": "Store cohort",
      "labels": ["S1", "S2", "S3", "S4", "S5"],
      "values": [12.1, 9.8, 14.2, 11.0, 10.6]
    }
  ],
  "opts": { "valAxisTitle": "Contribution margin (%)" },
  "source": "Source: Store performance pack, Q4 2025"
}
```

### `radar`

```json
{
  "type": "radar",
  "data": [
    {
      "name": "TargetCo",
      "labels": ["Growth", "Margin", "Retention", "Cash", "NPS"],
      "values": [4.2, 3.8, 4.1, 3.4, 4.0]
    },
    {
      "name": "Peer median",
      "labels": ["Growth", "Margin", "Retention", "Cash", "NPS"],
      "values": [3.6, 3.5, 3.8, 3.7, 3.6]
    }
  ],
  "source": "Source: Benchmark pack, 2025"
}
```

### `bar3d` (use sparingly)

```json
{
  "type": "bar3d",
  "data": [
    {
      "name": "Illustrative only",
      "labels": ["A", "B", "C"],
      "values": [10, 14, 12]
    }
  ],
  "source": "Source: Illustrative sample"
}
```

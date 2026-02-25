# DeckSpec Slide Contract (KPMG Diligence Template)

This is the practical contract for writing `deckSpec` slide objects that the bundled generator will validate and render.

## Core Rule

Pick the slide `type` based on the evidence shape (narrative vs comparison vs chart vs table), then fill every required slot for that `type`.

## Slot Shapes (Reusable)

### `text`

- Plain string.

### `textArray`

- Array of strings and/or objects of shape `{ "text": "..." }`.
- You can add inline headings inside `textArray` with:
  - `{ "text": "Heading", "subheader": true }`
  - `{ "text": "Heading", "header": true }`

Use headings to keep dense slides scannable and split-friendly.

### `bodyStyle`

- `"bullets"` or `"paragraphs"` (only; exact spelling).
- Use `"bullets"` by default unless prose truly reads better as a paragraph.

### `table`

- Object with:
  - `headers`: array of strings
  - `rows`: array of arrays (each row aligns to headers)

Example:

```json
{
  "headers": ["Metric", "FY2024", "FY2025"],
  "rows": [
    ["Revenue", "$142M", "$189M"],
    ["Gross Margin", "41.8%", "43.1%"]
  ]
}
```

### `chart`

- Object with:
  - `type`: one of `bar`, `bar3d`, `line`, `pie`, `doughnut`, `area`, `scatter`, `radar`
  - `data`: array of series objects
- Each series should include:
  - `values`: numeric array (required by validator)
  - `labels`: category labels (strongly recommended)
  - `name`: series name (recommended)
- Optional:
  - `opts`: chart rendering options
  - `source`: source text below chart

Example:

```json
{
  "type": "line",
  "data": [
    { "name": "Index", "labels": ["Jan", "Feb", "Mar"], "values": [100, 108, 111] }
  ],
  "opts": { "showValue": true, "valAxisTitle": "Index" },
  "source": "Source: Synthetic model output"
}
```

## Supported Slide Types and Slot Contracts

Use only these `type` values:

### `cover`

- Required:
  - `title` (text, min 8, max 100)
  - `subtitle` (text, min 12, max 200)

### `divider`, `dividerDark`, `dividerLight`

- Required:
  - `sectionNumber` (text, must match `^\\d{2}$`)
  - `sectionTitle` (text, min 6, max 80)

Use `dividerDark`/`dividerLight` intentionally (visual style); `divider` is a neutral contract-compatible option.

### `contents`

- Required:
  - `title` (text, min 6, max 40)
  - `sections` (contentsSections, min 8)

Each section object is typically:
- `number` (string)
- `title` (string)
- optional: `items` (string array), `pageRange` (string)

### `oneColumnText`

- Required:
  - `title` (text, min 12, max 50)
  - `body` (textArray, min 3, minChars 180)
- Optional:
  - `strapline` (text, min 12, max 700)
  - `source` (text, min 12, max 700)
  - `bodyStyle`

Use for a single-thread argument.

### `twoColumnText`

- Required:
  - `title` (text, min 12, max 50)
  - `leftBody` (textArray, min 2, minChars 80)
  - `rightBody` (textArray, min 2, minChars 80)
- Optional:
  - `strapline` (text, min 12, max 700)
  - `bodyStyle`

Use only when you truly have two parallel streams. Keep left/right structurally symmetric.

### `analysisWideChart2ColsText`

- Required:
  - `title` (text, min 12, max 50)
  - `body` (textArray, min 4, minChars 180)
  - `chart` (chart, min 1 series)
- Optional:
  - `strapline` (text, min 12, max 700)
  - `bodyStyle`

Use for "claim + visual proof + interpretation".

### `analysisNarrowTable`

- Required:
  - `title` (text, min 12, max 50)
  - `table` (table, min 3 rows)
  - `insights` (textArray, min 2, minChars 80)
- Optional:
  - `strapline` (text, min 12, max 700)
  - `notes` (text, min 12, max 700)
  - `insightTitle` (text, min 6, max 80)

Use for KPI readouts with takeaway bullets.

### `analysisWideChartTableText`

- Required:
  - `title` (text, min 12, max 50)
  - `body` (textArray, min 4, minChars 180)
  - `chart` (chart, min 1 series)
- Optional:
  - `strapline` (text, min 12, max 700)
  - `heading` (text, min 6, max 120)
  - `table` (table, min 3 rows)
  - `noteSource` (text, min 12, max 700)
  - `bodyStyle`

Use for integrated readouts (chart + optional table + synthesis).

### `titleStrapline4TextBoxes`

- Required:
  - `title` (text, min 12, max 50)
  - `columns` (columns, min 4)
- Optional:
  - `strapline` (text, min 12, max 700)
  - `bodyStyle`

Each column is typically:
- `heading` or `title`
- `body` (`textArray`)

### `backCover`

- Optional:
  - `disclaimer` (text, min 80, max 700)
  - `url` (text, min 5, max 60)

## Layout Selection Guardrails (Prevent Bad Fits)

1. Count your content pieces before selecting a layout.
2. Do not force 3 ideas into a 2-column slide or 2 ideas into a 4-box slide.
3. Prefer evidence-native layouts:
   - Table content belongs in `analysisNarrowTable` or `analysisWideChartTableText`.
   - Chart content belongs in `analysisWideChart2ColsText` or `analysisWideChartTableText`.
4. Prefer split-over-cram:
   - If a slide starts to feel "appendix dense", split into continuation slides or a second slide with a narrower claim.

## Common Mistakes (And Fixes)

1. **Chart/table on the wrong slide type**: move to a slide type that supports that slot.
2. **Missing required slots**: fill required fields before polishing optional ones.
3. **Overflow risk**: shorten text, convert long sentences to bullets, add subheaders, or split the slide.
4. **Two-column misuse**: if one side is much longer, use `oneColumnText` or split into two slides.

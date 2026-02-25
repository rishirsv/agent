# QA Rules (How To QA + How To Fix)

This file is the actual procedure for reviewing `qa.json` and applying fixes.

## Conventions (Important)

- `slideIndex` is 0-based (first slide is `0`).
- `overlapFindings[].slideNumber` is 1-based.
- `postprocess.overflowVisual.failingSlides` is 1-based.

If a run fails, `qa.json` may still exist. Always check for it.

## Preflight (Before Running)

Read the slide contract and confirm:
- Every slide `type` is supported.
- Every required slot is present and non-empty.
- No unsupported slots are attached (e.g., `chart` on `oneColumnText`).
- `bodyStyle` is exactly `"bullets"` or `"paragraphs"` where used.
- Chart/table objects match schema (chart series have numeric `values`; tables have `headers` + `rows`).

If you cannot pass preflight, do not run generation. Fix the deckSpec first.

## Postflight (After Running): Triage Order

Open `qa.json` and triage in this order:

1. **Hard failures**
   - `valid: false`
   - `errors[]` non-empty
2. **Contract completeness**
   - `missingSlots[]` non-empty
3. **Severe overlaps (blocking)**
   - `overlapSummary.severeCount > 0`
4. **Visual overflow (treat as blocking even if summary passes)**
   - `postprocess.overflowVisual.status` is `fail` or `error`
5. **Everything else (advisory)**
   - `warnings[]`, `slotIssues[]`, `thinSlides[]`, `sparseSlides[]`, `tableWarnings[]`
   - `overflowEvents[]` / `overflowRisks[]` (auto-splits)
   - `overlapSummary.warningCount > 0`

## Fix Recipes (Use These Before Rewriting Content)

### A) Contract / validation errors

Symptoms:
- `qa.valid` is `false`
- `errors[]` and/or `missingSlots[]` populated

Fix:
- Fill required slots first (do not polish optional slots while required slots are missing).
- If the slide idea does not fit the layout, change the `type` to an evidence-native layout.

### B) `slotIssues[]` and `slotMetrics[]` (density + shape guidance)

Symptoms:
- `slotIssues[]` objects include:
  - `code`, `message`, `severity`, `hook`, `suggestedRemedy`
- `slotMetrics[]` gives `actual` vs `target` and `priority`

Fix:
- Apply `slotIssues[].suggestedRemedy` first.
- If a slot is below target, add content in that slot (or switch slide type).
- If the slide is too sparse, add evidence and interpretation (not filler).

### C) Auto-splits (`overflowEvents[]`, `overflowRisks[]`, `repairSuggestions[]` with `auto_split`)

Symptoms:
- `overflowEvents[].splitInto > 1`
- `overflowRisks[]` reports split count + suggested remedy

Interpretation:
- This is not necessarily a defect. It means the runtime split content into continuation pages.

Fix options:
- Accept the split (often the best "readability-first" outcome).
- Tighten the slide body to reduce split count.
- Split the idea into two intentional slides (preferred for executive decks).

### D) Visual overflow (`postprocess.overflowVisual`)

Symptoms:
- `postprocess.overflowVisual.status: fail` with `failingSlides: [7, 11, ...]`
- `imagePaths[]` may include visual diagnostics

Fix:
- Treat as blocking for "Ready to share".
- Apply in order:
  1. Shorten titles/straplines.
  2. Tighten long bullets (remove clauses, keep one idea per line).
  3. Convert dense paragraphs to bullets.
  4. Split into continuation slides (explicitly) if the slide remains dense.
  5. If the slide is table-heavy, reduce row text or split the table across slides.

### E) Overlap (`overlapSummary`, `overlapFindings`)

Symptoms:
- `overlapSummary.warningCount > 0` or `severeCount > 0`

Fix:
- If severe: treat as blocking and reduce content density or split the slide.
- If warning-only: use montage/preview images to confirm if it is visually acceptable; tighten if borderline.

## Visual QA (Mandatory For Client-Ready)

Use the montage/preview outputs (if present) to check:
- Text contrast and readability
- Overcrowding and awkward line breaks
- Table readability (row density)
- Consistency of headings and bullet indentation

Note: Rendering validation uses automated rendering (LibreOffice-based). Always review in Microsoft PowerPoint before distribution, as rendering differences may exist.

## Reporting Format Back To The User

Use this format for issues (copy/paste):

```text
ISSUE: <short name> (Slide <n>)
EVIDENCE: <what QA reported or what montage shows>
ACTION: <what to change in deckSpec>
```

Severity mapping:
- **Critical (blocking)**: `errors`, `missingSlots`, `overlap severe`, `overflowVisual fail/error`
- **Important (fix if time)**: overlap warnings, table density warnings, repeated-body warnings
- **Minor**: thin-slide warnings, small spacing advisories

Keep non-blocking notes to one sentence:

`I noticed there were X non-blocking issues: ...`

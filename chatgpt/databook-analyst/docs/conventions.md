# Databook Template Conventions (Final v1.1, Pack F Validated)

## Purpose
This document is the explicit style/structure contract for the databook analyst workflow so the model does not need to infer conventions from workbook cell styling.

Primary source workbook:
- `output/spreadsheet/databook-template-v1-final-validated.xlsx`

Related plan/spec:
- `docs/FDD_Databook_Template_Plan.md`
- `docs/spec-databook-analyst.md`

## Precedence Rules
When generating or editing spreadsheets:
1. User instruction in the current request.
2. This conventions document.
3. `Template | Index` anchors and module manifest in workbook.
4. Generic spreadsheet skill defaults (only when not overridden above).

## Global Workbook Rules
- Use standard ranges only; do not create Excel Table objects.
- Do not rely on named ranges for logic; use fixed anchors from `Template | Index`.
- Do not merge cells in analyzable/output regions.
- If centering is needed, use Center Across Selection (not Merge & Center).
- Keep alignment left by default.
- Turn gridlines off on all sheets.
- Set zoom to 100% on all sheets.
- Use page break preview for divider tabs: `Financials>>`, `QofE>>`, `NWC>>`.

## Canonical Sheet Order
1. `Cover`
2. `Control | Setup`
3. `Control | QC`
4. `Template | Index`
5. `Data | TB`
6. `Data | AR Aging`
7. `Data | AP Aging`
8. `Map | COA to Lines`
9. `Map | NWC & NetDebt Class`
10. `Map | Entities`
11. `Financials>>`
12. `Combined | IS`
13. `Combined | BS`
14. `Combined | CF`
15. `Entity 1 | IS`
16. `Entity 1 | BS`
17. `Entity 1 | CF`
18. `QofE>>`
19. `QofE | Summary`
20. `QofE | Detail`
21. `NWC>>`
22. `NWC | Summary`
23. `NWC | Detail`
24. `NWC | Days`
25. `Stratified | BS`
26. `Net_debt`
27. `Recons`
28. `Agings`
29. `Personnel`
30. `Capex`
31. `Leases`
32. `Other | Analysis`

`GM | LOB` is removed from v1 final template.

## Typography and Text
- Primary font: Arial 10.
- Source line font: Arial 8 italic, gray (`FF666666`).
- Title text: Arial 10 bold, black.
- Header text on blue bars: Arial 10 bold, white.
- Default alignment: left + vertical center.

## Color and Style Tokens (Locked)
Use these exact token styles (copied from final workbook):
- `title` token: `Control | Setup!A1`
- `source` token: `Control | Setup!A2`
- `note_label` token: `Control | Setup!A4`
- `section_bar` token: `Combined | IS!A7`
- `header` token: `Combined | IS!A8`
- `data` token: `Combined | IS!A9`
- `input` token: `Combined | IS!G9`
- `check` token: `Combined | IS!G28`

Key colors:
- Dark navy title/section bar fill: `FF00338D`
- Cobalt header fill: `FF1E49E2`
- Input fill light blue: `FFD9E1F2`
- Check fill light yellow: `FFFFF2CC`
- Note label fill light gray: `FFF2F2F2`
- Standard thin border color: `FFD9D9D9`

Dark navy bar rule:
- No borders on dark navy bars (`section_bar` rows).

## Standard Layout Rules by Sheet
- `A1`: sheet title (bold black).
- `A2`: `Source: <document_source>` on all non-divider sheets.
- Row 7: section/title bar in dark navy, filled across full data width.
- Row 7 bar must extend to the last header column for that block (core monthly grids currently extend through `AS`).
- Row 8: header row in cobalt (entire row segment for the block must be same color).
- Main data rows: thin gray grid borders.
- Check rows: yellow check cells only where checks are entered/read.

## Units Convention
- Use `"$'000"` (exact text) as units marker.
- In standard analysis grids, place units in `B8`.
- This intentionally replaces the usual `LineName` header in `B8` for those tabs.
- Do not use the word `thousands`.
- Do not use a separate `Units` label when `B8` carries units for the block.

## Financial Statement Specific Conventions
- Combined/entity IS/BS/CF scaffolds use row 7 section bar + row 8 header bar.
- Include `TB Account No.` column in statement scaffolds.
- IS presentation ends at net income and then adds back D&A, interest, and taxes to EBITDA.
- Keep both net income and EBITDA totals in IS layouts.

## Control/Index Conventions
- `Control | Setup` and periods table are combined on one sheet.
- `Template | Manifest` and `Template | Index` are combined on one sheet (`Template | Index`).
- `Data | TB (Wide)` is renamed to `Data | TB`.

## Width and Formatting Scope Conventions
- Apply structured formatting only through the intended block width.
- `QofE | Summary`: remove formatting from column `K` onward.
- `NWC | Summary`: remove formatting from column `M` onward.
- Remove styled trailing rows below final totals/check lines unless intentionally part of check block.

## Structural Integrity Rules
- No merged cells in key model/output tabs.
- All key tabs must retain deterministic anchor positions documented in `Template | Index`.
- Keep checks centralized in `Control | QC` and referenced from module sheets.
- Keep all formulas and values directly in cells (no hidden table logic).

## Spreadsheet Skill Integration Guidance
The generic spreadsheet skill includes fallback conventions; for databook work, override with this profile:
- Use these exact databook token styles/colors, not generic finance color defaults.
- Use workbook token-copy approach (copy style from canonical token cells) when possible.
- Recalculate and visually inspect rendered outputs before finalizing edits.

## Machine-Readable Artifacts
These files encode this document for runtime use:
- `databook_analyst/configs/style_tokens.yaml`
- `databook_analyst/configs/layout_contract.yaml`

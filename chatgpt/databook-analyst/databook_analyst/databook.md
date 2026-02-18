# Databook Workflow Contract

## Skill Interop
- This workflow is designed to run with the Spreadsheet skill for spreadsheet manipulation.
- Databook conventions are authoritative for structure/style behavior.
- If Spreadsheet skill guidance differs, follow databook conventions and contracts.

## Inputs
- Existing databook workbook (optional)
- Source data files (TB, aging, supporting schedules)
- User request describing analysis/output objective

## Outputs
- Updated or newly generated databook workbook (`.xlsx`)
- Deterministic changes aligned to indexed anchors and style tokens
- QC/tie-out status updates

## Execution Sequence
1. Resolve mode (plan vs execute).
2. Resolve target workbook (edit existing vs template start).
3. Resolve affected modules and anchors.
4. Apply data mappings and formulas.
5. Run checks and update QC surfaces.
6. Render/inspect if available.

## Task Families
- Template scaffolding and tab orchestration.
- Data ingestion and normalization.
- Mapping maintenance (`COA`, `NWC`, `NetDebt`, entities).
- Core statement build/refresh (IS/BS/CF).
- Diligence analysis build/refresh (QofE, NWC, Net debt, stratified BS).
- Reconciliations and aging tie-outs.
- QC pass/fail aggregation and status surfacing.
- Inline commentary/flags and source traceability updates.

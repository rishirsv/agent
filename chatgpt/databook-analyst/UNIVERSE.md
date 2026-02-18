# Databook Analyst Universe

## Purpose
This map shows the current working structure for the Databook Analyst project: planning docs, template artifacts, skill contract files, runtime scaffolding, and distribution outputs.

## Top-Level Layout
- `docs/` planning, spec, conventions, and template plan docs.
- `reference/` external reference databooks (e.g., North).
- `output/spreadsheet/` generated template workbooks by pack and final merges.
- `databook_analyst/` skill implementation surface (instructions, configs, modules, runtime, scripts).
- `dist/` packaged outputs and run artifacts for future execution/publishing.
- `tmp/` temporary build and inspection assets.

## Databook Analyst Skill Surface
- `databook_analyst/skill.md` main skill operating contract.
- `databook_analyst/databook.md` concise workflow + mode behavior summary.
- `databook_analyst/configs/` machine-readable contract files.
- `databook_analyst/modules/` module blueprints for standard analyses.
- `databook_analyst/references/` deeper playbooks, policies, and templates.
- `databook_analyst/runtime/` execution helpers and orchestration stubs.
- `databook_analyst/scripts/` deterministic utility scripts.
- `databook_analyst/templates/` canonical template pointers and packaging notes.
- `databook_analyst/examples/` example tasks and test fixtures.

## Dist Layout
- `dist/artifacts/` produced `.xlsx` workbook artifacts.
- `dist/bundles/` zipped bundles for delivery/sharing.
- `dist/renders/` PNG/PDF visual inspections.
- `dist/runs/` run-level output folders.
- `dist/logs/` execution logs.
- `dist/reports/` QA/QC reports and summaries.

## Current Contract Files
- `databook_analyst/configs/style_tokens.yaml`
- `databook_analyst/configs/layout_contract.yaml`

## Next Build Targets
- `databook_analyst/configs/module_registry.yaml`
- `databook_analyst/runtime/engine.py`
- `databook_analyst/runtime/plan_mode.py`
- `databook_analyst/runtime/execute_mode.py`

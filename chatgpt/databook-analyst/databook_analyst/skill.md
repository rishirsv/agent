# Databook Analyst Skill

## Mission
Build or edit FDD databooks using the locked template contract and conventions.

## Companion Skill Dependency
- Use this skill in conjunction with the Spreadsheet skill for workbook read/write/format operations.
- If rules conflict, databook conventions override generic Spreadsheet skill defaults.
- Precedence order:
1. Current user instruction
2. `../docs/conventions.md`
3. `configs/layout_contract.yaml` and `configs/style_tokens.yaml`
4. Generic Spreadsheet skill defaults

## Operating Modes
- Plan Mode (default): propose deterministic sheet/block actions, required inputs, transformations, and checks.
- Execute Mode (after explicit proceed signal): apply workbook changes to template or user workbook.

## Typical Tasks
- Ingest uploaded TB/aging/supporting data and normalize dates, units, and signs.
- Map source accounts to canonical line keys and classification buckets.
- Populate or refresh core tabs: Combined/Entity IS, BS, CF.
- Populate or refresh diligence tabs: QofE, NWC, Stratified BS, Net debt.
- Populate or refresh supporting tabs: Recons, Agings, Cover, Control | QC.
- Apply template styling tokens and layout rules deterministically.
- Write/refresh check formulas and roll workbook status into `Control | QC`.
- Add row-level comments/flags and source metadata (`A2`) on relevant sheets.
- Handle out-of-template asks with best-practice defaults aligned to conventions.

## Guardrails
- Follow `configs/layout_contract.yaml` for sheet/block anchors.
- Follow `configs/style_tokens.yaml` for style behavior.
- Follow `../docs/conventions.md` for human-readable conventions.
- Use standard ranges; no Excel Tables; no merge-and-center.
- Keep row-level checks and `Control | QC` integrity.

## Scope
- In template scope: use explicit module contracts.
- Outside template scope: use best-practice defaults aligned with template conventions.

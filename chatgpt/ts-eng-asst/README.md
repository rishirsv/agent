# TS Engagement Letters

Docs-first scope curation workflow for transaction services engagement letter generation.

## Canonical Files

- `dist/scope-library.json`: master scope library used by runtime/generation.
- `docs/scope-library/section-applicability.json`: docs-layer review overrides/additions.
- `docs/scope-library/industries/*.md|*.json`: review surface exports.
- `scope_engine.py`: shared scope assembly core (used by runtime and scripts).
- `dist/scope_engine.py`: upload/runtime copy of shared scope core.

## Two Distributions

1. ChatGPT upload/runtime distribution (`dist/`)
- Minimal runtime artifacts only.
- Uses `dist/engagement_letter_generator.py` + `dist/scope_engine.py`.

2. Internal testing distribution (repo scripts)
- Uses `scripts/run_internal_generation.py` as internal entrypoint.
- Includes export, validation, and review tooling.

## Build / Validate / Export

1. Refresh metadata on master scope library:
```bash
python3 scripts/refresh-scope-metadata.py
```

2. Regenerate docs review surface:
```bash
python3 scripts/export_scope_review_surface.py --with-skeleton
```

3. Validate exported outputs and metadata consistency:
```bash
python3 scripts/validate_scope_review_exports.py
python3 scripts/check-scope-spelling.py
python3 scripts/validate_scope_bucket_mapping.py
python3 scripts/validate_internal_runtime_boundary.py
python3 scripts/validate_upload_manifest.py
python3 scripts/check-system-prompt-contract.py --prompt dist/ts-engagement-assistant.md --max-chars 8000
```

## Optional Scope Docs

Generate optional scope review docs from the optional JSON source:

```bash
python3 scripts/export_optional_scope_docs.py
```

Outputs:
- `docs/scope-library/optional-scope-library.md`
- `docs/scope-library/optional-scope-library.json`

## Safe Merge Back To Dist

1. Finalize `docs/scope-library/section-applicability.json`.
2. Export and validate.
3. Build merge candidate from exported `docs/scope-library/industries/*.json`.
4. Replace `dist/scope-library.json` with approved candidate.
5. Refresh metadata and re-run validation.

## Dist Hygiene

`dist/` should contain canonical upload/runtime artifacts only.

Do not leave temporary files in `dist/`:
- merge candidates
- backups
- sample outputs
- caches (`__pycache__`, `*.pyc`)
- OS metadata (`.DS_Store`)

Before upload, run:

```bash
python3 scripts/validate_upload_manifest.py
python3 scripts/check-system-prompt-contract.py --prompt dist/ts-engagement-assistant.md --max-chars 8000
```

Archive temporary artifacts under `reference/legacy/` or `.agents/`.

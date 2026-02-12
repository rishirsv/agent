# Scope Library Architecture

## Purpose

This folder supports review, cleanup, and controlled merge back to `dist/scope-library.json`.

## Data Flow

1. **Canonical source**
- `dist/scope-library.json`
- `dist/scope-library-optional.json` (optional modules)

2. **Docs-layer review controls**
- `docs/scope-library/section-applicability.json`
- Defines exclusions, replacements, and additions used for review exports.

3. **Rendered review surface**
- `docs/scope-library/industries/*.json`
- `docs/scope-library/industries/*.md`
- Generated from canonical source + applicability rules.

4. **Validation**
- `scripts/validate_scope_review_exports.py` checks:
  - export parity
  - metadata consistency in `dist/scope-library.json`
- `scripts/validate_scope_bucket_mapping.py` checks section-to-bucket sync.
- `scripts/validate_upload_manifest.py` checks upload/internal manifests.

5. **Canonicalization**
- Approved docs-layer changes are merged back into `dist/scope-library.json`.

## Section Applicability Model

- `section_applicability.common_skeleton.<section>.exclude_for_industries`
  - removes common section for listed industries.
- `common_section_replacements.<section>`
  - replaces common section bullets globally.
- `industry_section_replacements.<industry>.<section>`
  - full replacement for an industry section.
- `industry_section_additions.<industry>.<section>`
  - appends or creates additional bullets after replacement.

## Operating Rules

- Keep industry bullets incremental to common.
- Keep optional/deal-specific content excluded from baseline dist unless explicitly approved.
- Keep `dist/` free of merge temp files and generated samples.
- Generate optional review docs from JSON source of truth:
  - `python3 scripts/export_optional_scope_docs.py`
- Internal scripts must use `scripts/run_internal_generation.py` (no direct dist module loading).

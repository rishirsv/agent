# Cleanup Report - 2026-02-11

## Applied Cleanup

### Dist Hygiene

- Removed temporary merge artifacts from `dist/` and archived them:
  - `dist/scope-library.merge-candidate.json` -> `reference/legacy/merge-artifacts/scope-library.merge-candidate.2026-02-11.json`
  - `dist/scope-library.pre-merge-backup.json` -> `reference/legacy/merge-artifacts/scope-library.pre-merge-backup.2026-02-11.json`
- Removed demo files from `dist/examples/` and moved them to:
  - `reference/generated/examples/example-buyside-healthcare.docx`
  - `reference/generated/examples/example-sellside-healthcare.docx`
- Removed caches and OS metadata from project:
  - all `.DS_Store`
  - all `__pycache__/`

### Metadata + Validation

- Added `scripts/refresh-scope-metadata.py` to recompute metadata counters in `dist/scope-library.json`.
- Updated `scripts/validate_scope_review_exports.py` to fail if metadata counters are stale.
- Refreshed metadata and re-exported docs review surface.

### Documentation Updates

- Added root workflow doc: `README.md`
- Added architecture doc: `docs/scope-library/ARCHITECTURE.md`
- Added optional-pack lifecycle doc: `docs/scope-library/optional-pack-lifecycle.md`
- Archived one-off review docs:
  - `docs/archive/scope-library/2026-02-11/merge-candidate-diff.md`
  - `docs/archive/scope-library/2026-02-11/review-dist.md`

## Current Dist File Set

`dist/` now contains only canonical runtime/upload artifacts:

- `dist/assistant-playbook.md`
- `dist/buyside-engagement-letter.docx`
- `dist/engagement_letter_generator.py`
- `dist/el-placeholder-schema.json`
- `dist/scope-library.json`
- `dist/scope-review-buckets.json`
- `dist/sellside-engagement-letter.docx`
- `dist/ts-engagement-assistant-icon.png`
- `dist/ts-engagement-assistant.md`

## Identified Deletion Candidates (Not Deleted)

### Oracle Bundles (historical)

These are safe candidates for deletion if no longer needed for audit trail:

- `.agents/oracle/scope-library-kpmg-partner-review/`
- `.agents/oracle/scope-library-polish-audit/`
- `.agents/oracle/synthesis-v2/`
- `.agents/oracle/scope-by-industry-cleanup-review/`

Recommendation: keep only the latest bundle in active use:

- `.agents/oracle/excluded-sections-enhancement-review/`

### Legacy Snapshots

Keep for traceability unless storage reduction is needed:

- `reference/legacy/fdd_scope_library.pre-dist.json`
- `reference/legacy/scope-library.snapshot-2026-02-06.json`

### Archived Review Docs

If long-term retention is not required, the following can be deleted later:

- `docs/archive/scope-library/2026-02-11/merge-candidate-diff.md`
- `docs/archive/scope-library/2026-02-11/review-dist.md`


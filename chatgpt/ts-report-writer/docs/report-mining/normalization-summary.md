# Normalization Summary

## Result

Normalization has been implemented into:

- `/Users/rishi/Code/ai-tools/chatgpt/ts-report-writer/extracted/cleaned`

Original files in:

- `/Users/rishi/Code/ai-tools/chatgpt/ts-report-writer/extracted`

were preserved as source backups.

## Counts

- Source files discovered: `23`
- Cleaned files produced: `23`
- Files normalized: `23`
- Files carrying `needs_revision` metadata: `2`
  - `cherry-industry-environmental-services.md`
  - `skyrocket-industry-financial-services-insurance-brokerage.md`
- Truncation markers appended (`[TRUNCATED_IN_SOURCE_EXTRACT]`): `0`

## What Was Normalized

- Standardized top header to `# Report Extraction: <report-id>`.
- Removed template instruction preambles.
- Removed helper heading `# <Addition Sections as Needed>`.
- Removed citation debris token(s).
- Removed malformed duplicated placeholder phrase.
- Removed non-report trailing artifact/checklist blocks where present.
- Kept extracted report narrative text intact (no paraphrasing).

## Follow-up Notes

- Existing metadata statuses were preserved and not reclassified.
- No source file under `/extracted` was overwritten or replaced.
- Promotion of cleaned files back to `/extracted` should be a separate explicit step.


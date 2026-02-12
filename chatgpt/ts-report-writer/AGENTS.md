# Repository Guidelines

## Scope and Output
- This repository is a report-writer workflow for diligence reports in `reports/`.
- Produce one markdown extraction per report in `reports/extracted/`.
- Extraction text must be **verbatim** from source report body text.
- Do not summarize, paraphrase, normalize wording, or rewrite tone.

## Canonical Extraction Workflow
1. Process reports sequentially (one report at a time).
2. Convert source formats:
- `PPT/PPTX -> PDF` first (LibreOffice headless).
- `PDF -> text` (page-by-page extraction).
3. Extract only report body text:
- Exclude table text and chart/table numeric grids.
- Exclude footer/header noise, legal boilerplate, disclaimers, and navigation pages unless required for section context.
- Exclude image OCR; do not convert images to text.
4. Map content into canonical sections in `docs/report-mining/verbatim-report-extraction-template.md`.
- If section names differ, place content into the closest matching canonical section.
- If a section has no non-table body text, write `Not present in source report`.
5. Appendices format is required:
- `## Appendix 1: <Appendix Name>`
- `## Appendix 2: <Appendix Name>`
- `## Appendix 3: <Appendix Name>`
- Continue numbering for all appendix sections found.

## Verification (Manual, Required)
- Convert each processed report to PNG montage pages for visual QA.
- Manually compare montage content to extracted markdown.
- Confirm all captured text is verbatim and all excluded content rules were followed.
- Record outcome in `reports/verification/<report-id>/review-notes.md` and status in manifest.

## Tracking and Hygiene
- Update `reports/manifests/tracker.md` and per-report manifest JSON after each report.
- Use statuses: `pass`, `needs_revision`, or `blocked`.
- Keep folder structure clean: delete temporary extraction artifacts in `reports/tmp/` after verification.
- Skip benchmarking packs when requested by user.
- If a report file is encrypted/unloadable (`CDFV2 Encrypted`), mark `blocked` and continue to next report.

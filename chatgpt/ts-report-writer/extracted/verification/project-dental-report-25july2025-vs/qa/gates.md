# QA Gates

- `STATUS`: pass
- `REPORT_ID`: project-dental-report-25july2025-vs
- `GENERATED_AT`: 2026-02-13T20:14:23.202371+00:00

## Gate Results

- `provenance_exact_match`: `pass` (Provenance QA must pass with zero unmatched and zero OCR-only lines.)
- `provenance_trace_integrity`: `pass` (Every markdown trace row maps to a catalog line_id.)
- `forbidden_class_leakage`: `pass` (No forbidden class lines are present in rendered output.)
- `ocr_primary_policy`: `pass` (OCR-backed lines are blocked unless --allow-ocr-primary is enabled.)
- `ocr_marker_absent`: `pass` (Final markdown must not include OCR marker blocks.)
- `section_disposition_complete`: `pass` (All canonical sections must have a disposition in section-map.)
- `manual_checklist_complete`: `pass` (Review notes checklist and placeholders must be completed.)
- `markdown_trace_sync`: `pass` (Rendered trace must exactly match markdown and all content bullets must be traced.)
- `section_completeness`: `pass` (Every selected line for each mapped section must be accounted for in render output.)
- `executive_summary_cleanup`: `pass` (Executive Summary must not include engagement-letter/legal boilerplate text.)
- `cleanup_quality`: `pass` (Final markdown must not contain fragment/noise bullets after cleanup.)

## Summary

- `TRACE_LINES`: 0
- `MISSING_TRACE_REFERENCES`: 0
- `OCR_TRACE_LINES`: 0
- `FORBIDDEN_CLASS_LINES`: 0
- `MANUAL_CHECK_ISSUES`: 0
- `PROVENANCE_UNMATCHED`: 0
- `TRACE_SYNC_ISSUES`: 0
- `MARKDOWN_UNTRACED_CONTENT_LINES`: 0
- `SECTION_EXPECTED_LINES`: 0
- `SECTION_RENDERED_LINES`: 0
- `SECTION_MISSING_LINES`: 0
- `SECTION_UNEXPECTED_LINES`: 0
- `EXEC_SUMMARY_BOILERPLATE_ISSUES`: 0
- `CLEANUP_QUALITY_ISSUES`: 0

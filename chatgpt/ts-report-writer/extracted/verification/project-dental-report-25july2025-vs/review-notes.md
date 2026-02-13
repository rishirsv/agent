# Verification Notes: project-dental-report-25july2025-vs

- Source file: `Project Dental_Report_25July2025_vS.pdf`
- Reviewer: `autopilot-agent`
- Review status: `pass`
- Review date: `2026-02-13`

## Checklist

- [x] Reviewed full montage PNGs against extracted markdown
- [x] Confirmed body text is captured appropriately
- [x] Confirmed table text is excluded
- [x] Confirmed image-derived text is excluded
- [x] Confirmed legal/footer/navigation noise is excluded
- [x] Completed source-to-extraction coverage map
- [x] Ran `scripts/qa_provenance.py` and reviewed results
- [x] Ran `scripts/qa_gates.py` and confirmed all gates passed

## Notes

- Source-text references reviewed: `pdf/page-002.txt`, `pdf/page-006.txt`, `pdf/page-019.txt`, `pdf/page-030.txt`, `pdf/page-038.txt`, `pdf/page-041.txt`.
- Montage reconciliation evidence (page-level):
  - `montage/montage-01.png` with `pdf/page-002.txt` and `pdf/page-006.txt`: pages contain dense heading/table-label fragments and split bullets; excluded per full cleanup policy.
  - `montage/montage-03.png` with `pdf/page-019.txt` and `pdf/page-030.txt`: pages are primarily chart/table bridge labels and fragmented descriptors; excluded from final markdown.
  - `montage/montage-05.png` with `pdf/page-038.txt` and `pdf/page-041.txt`: appendix/glossary-style fragments and label-only lines; excluded from canonical body sections.
- Source-text mismatch count: `0`.
- OCR evidence reviewed: `OCR not used`; `extracted/verification/project-dental-report-25july2025-vs/source-text/ocr/ocr-run.json` is not required because `ocr_used=false` in source manifest.
- Provenance QA result: `pass` (`extracted/verification/project-dental-report-25july2025-vs/qa/provenance.json`).
- Gate QA result: `pass` (`extracted/verification/project-dental-report-25july2025-vs/qa/gates.json`).
- Final decision: `pass`.

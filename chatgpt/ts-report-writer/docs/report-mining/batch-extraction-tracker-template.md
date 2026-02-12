# Batch Extraction Tracker Template

Use this tracker to manage verbatim extraction across all reports.

| Report File | Report ID | Extractor | Status (`pending/in_progress/done/blocked`) | Output File | Notes |
|---|---|---|---|---|---|
| `<report-01.pptx/pdf>` | `<report-id>` | `<name>` | `pending` | `reports/extracted/<report-id>.md` | `<issues>` |
| `<report-02.pptx/pdf>` | `<report-id>` | `<name>` | `pending` | `reports/extracted/<report-id>.md` | `<issues>` |
| `<report-03.pptx/pdf>` | `<report-id>` | `<name>` | `pending` | `reports/extracted/<report-id>.md` | `<issues>` |

## Per-Report Output Rule

For each report, create one file using:

- Template: `docs/report-mining/verbatim-report-extraction-template.md`
- Destination pattern: `reports/extracted/<report-id>.md`

## QA Gate Before Marking `done`

- [ ] Content is verbatim only
- [ ] No paraphrasing or synthesis
- [ ] Missing sections marked `Not present in source report`
- [ ] Metadata completed

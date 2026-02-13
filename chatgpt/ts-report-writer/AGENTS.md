# Repository Guidelines

## Scope and Output
- This repository is a report-writer workflow for diligence reports in `reports/`.
- Produce one markdown extraction per report in `extracted/`.
- Extraction text must be **verbatim** from source report body text.
- Do not summarize, paraphrase, normalize wording, or rewrite tone.
- Keep workflow helper scripts in `scripts/` (new workspace layout).

## Suggested Commands (clean layout)
- Preflight:
  - `./.venv/bin/python -m ts_report_writer.pipeline preflight`
- Run extraction:
  - `./.venv/bin/python -m ts_report_writer.pipeline run --reports-dir reports --verbatim-mode strict --evidence-profile full --fail-closed`
- Mark manual review:
  - `./.venv/bin/python -m ts_report_writer.pipeline mark-reviewed --report-id <report-id> --reviewer "<reviewer>" --status pass`

## Canonical Extraction Workflow
1. Process reports sequentially (one report at a time).
2. Keep `reports/` as source-only input directory:
   - Source-only report files (`.pdf`, `.ppt`, `.pptx`) should live only in `reports/`.
   - Move outputs, manifests, verification artifacts, and temporary files to `extracted/`.
3. Convert source formats:
   - `PPT/PPTX -> PDF` first (LibreOffice headless).
   - `PDF -> text` (page-by-page extraction).
   - Convert source report PDF into PNG montage pages for visual verification.
4. Extract source-text artifacts for source-to-extraction reconciliation:
   - For `.pptx/.ppt`, export slide XML text to `extracted/verification/<report-id>/source-text/pptx/`.
   - For `.pdf`, export page-level text to `extracted/verification/<report-id>/source-text/pdf/`.
   - Use `./.venv/bin/python scripts/extract_source_text.py --source <path-to-report> --out-dir extracted/verification/<report-id>/source-text`.
   - If a slide contains text that is missed in XML (e.g. images, flattened text), run OCR on selected slides:
     - `./.venv/bin/python scripts/extract_source_text.py --source <path-to-report> --out-dir ... --ocr-slides 16,17,22`
     - OCR output is appended in that slide’s text artifact under `"[OCR_EXTRACTED_TEXT]"`.
   - If a PDF page needs OCR fallback, run:
     - `./.venv/bin/python scripts/extract_source_text.py --source <path-to-report.pdf> --out-dir ... --ocr-pages 16,17,22`
   - OCR audit artifacts are required at `extracted/verification/<report-id>/source-text/ocr/`:
     - `images/*.png` rendered OCR source images
     - `ocr-run.json` with OCR run metadata and image hashes
5. Extract only report body text:
   - Exclude table text and chart/table numeric grids.
   - Exclude footer/header noise, legal boilerplate, disclaimers, and navigation pages unless required for section context.
   - Exclude image OCR from final extraction text; do not convert images to text in the main markdown output.
   - Use OCR only as a targeted source-text fallback (`--ocr-slides`) when validating problematic slides.
   - For `Net Working Capital` and `Net Debt`, capture both overview and adjustment detail explicitly where source text appears.
   - If adjustment detail exists only in tables/charts and is excluded, preserve surrounding explanatory lines and add:
     `Table- or chart-based adjustment details were excluded per extraction policy.`
6. Perform manual section organization from source artifacts (required):
   - Read source text artifacts slide-by-slide/page-by-page.
   - Organize extracted text into canonical sections in `docs/report-mining/verbatim-report-extraction-template.md`.
   - Scripts are guardrails; final section placement must be source-anchored and human-reviewed.
   - Cleanup pass is mandatory for every report: remove engagement-letter/legal/cover/glossary/navigation fragments from content sections and keep only section-relevant report body text.
7. Map content into canonical sections in `docs/report-mining/verbatim-report-extraction-template.md`.
   - If section names differ, place content into the closest matching canonical section.
   - If a section has no non-table body text, write `Not present in source report`.
8. Appendices format is required:
   - `## Appendix 1: <Appendix Name>`
   - `## Appendix 2: <Appendix Name>`
   - `## Appendix 3: <Appendix Name>`
   - Continue numbering for all appendix sections found.

## Verification (Manual, Required)
- Convert each processed report to PNG montage pages for visual QA (if not already generated during extraction).
- Generate and review `source-text` artifacts (XML-based for PPT/PPTX, page text for PDF).
- Run provenance QA before assigning `pass`:
  - `./.venv/bin/python scripts/qa_provenance.py --markdown extracted/<report-id>.md --source-manifest extracted/verification/<report-id>/source-text/manifest.json --out-dir extracted/verification/<report-id>/qa`
  - `pass` requires: no unmatched lines, no OCR marker in final markdown, and no OCR-only line matches.
- Run fail-closed QA gates before assigning `pass`:
  - `./.venv/bin/python scripts/qa_gates.py --report-id <report-id>`
  - `pass` requires: gate status `pass` in `extracted/verification/<report-id>/qa/gates.json` and completed review checklist.
  - Required fail-closed gates include:
    - `provenance_exact_match`
    - `markdown_trace_sync`
    - `section_completeness`
    - `executive_summary_cleanup`
    - `cleanup_quality`
- Manually compare montage content and source-text artifacts to extracted markdown.
- Confirm all captured text is verbatim and all excluded content rules were followed.
- Confirm `Executive Summary` and `Key Findings` do not contain engagement letter boilerplate.
- For each section and subsection, check line-level provenance against source references.
- Any omission, summary rewrite, or paraphrase in extracted text requires `needs_revision`.
- Record outcome in `extracted/verification/<report-id>/review-notes.md` and status in manifest.

Verification notes should include:
- `Source-text references reviewed` (slide/page IDs and key phrases validated).
- `Source-text mismatch count` (number of missing/shortened/paraphrased items).
- `OCR evidence reviewed` (if OCR used: image files + `ocr-run.json` hash records).
- `Provenance QA result` (`pass` or `needs_revision`) with path to `extracted/verification/<report-id>/qa/provenance.json`.
- `Gate QA result` (`pass` or `needs_revision`) with path to `extracted/verification/<report-id>/qa/gates.json`.
- `Final decision` (`pass`, `needs_revision`, or `blocked`).

Required verification artifacts include:
- `extracted/verification/<report-id>/mapping/section-map.json`
- `extracted/verification/<report-id>/mapping/section-accounting.json`
- `extracted/verification/<report-id>/render/render-trace.json`
- `extracted/verification/<report-id>/qa/provenance.json`
- `extracted/verification/<report-id>/qa/gates.json`

## Tracking and Hygiene
- Update `extracted/manifests/tracker.md` and per-report manifest JSON after each report.
- Use statuses: `pass`, `needs_revision`, or `blocked`.
- Keep folder structure clean: delete temporary extraction artifacts in `extracted/tmp/` after verification.
- Skip benchmarking packs when requested by user.
- If a report file is encrypted/unloadable (`CDFV2 Encrypted`), mark `blocked` and continue to next report.

## Extraction Learnings Log (Required)
- After every extraction + cleanup pass, append a short learning entry to this file.
- Purpose: preserve recurring failure patterns so future agents avoid repeating the same mistakes.
- Each entry must include:
  - `Date` (YYYY-MM-DD)
  - `Report ID`
  - `Issue observed`
  - `Root cause`
  - `Fix applied`
  - `Prevention rule` (what must happen on future reports)

### Learnings (Newest First)

- Date: 2026-02-13
- Report ID: `project-dental-report-25july2025-vs`
- Issue observed: strict PDF extraction produced predominantly fragmented/chart-label bullets and non-verbatim splits that failed provenance exact-match and cleanup-quality gates.
- Root cause: auto-selected catalog lines included many partial strings that did not map exactly to `source-text` artifacts and were not suitable report-body sentences after full cleanup policy.
- Fix applied: regenerated source-text artifacts, executed full-report cleanup across all canonical sections by removing fragment-heavy output, synchronized selected-lines/render-trace/section-mapping artifacts, and completed montage page-level reconciliation in review notes before rerunning QA.
- Prevention rule: when strict PDF output is dominated by fragment/table-label lines, do not force partial sentence retention; clear selected-lines and regenerate mapping/trace artifacts in lockstep, then document montage evidence and rerun provenance + gates.

- Date: 2026-02-13
- Report ID: `project-cinema-report`
- Issue observed: rerunning strict single-report pipeline regenerated noisy fragment-heavy markdown and temporarily regressed provenance/gates despite prior cleanup artifacts.
- Root cause: raw pipeline rerender replaced manually cleaned output; cleanup and review artifacts were not preserved before rerun.
- Fix applied: restored clean source-backed artifacts, reran provenance + fail-closed gates, and documented montage page-level reconciliation evidence in review notes before final pass.
- Prevention rule: when a story requires rerunning extraction after cleanup, preserve/verify the cleaned artifact set and re-run QA immediately; do not keep raw rerender output unless a full cleanup pass is redone.

- Date: 2026-02-13
- Report ID: `project-cinema-report`
- Issue observed: markdown looked cleaner and source-backed, but section placement still mismatched montage flow in follow-up review.
- Root cause: provenance exact-match was treated as sufficient while manual montage-to-section reconciliation was incomplete.
- Fix applied: remapped sections from page-level source artifacts and strengthened autopilot docs to require montage page-ID evidence before pass.
- Prevention rule: never mark `pass` on provenance/gates alone; require explicit montage reconciliation evidence with page IDs in review notes.

- Date: 2026-02-13
- Report ID: `project-coffee-buy-side-fdd`
- Issue observed: initial strict PPTX extraction passed provenance but failed fail-closed `cleanup_quality` due many fragment/table-label bullets, and `manual_checklist_complete` failed because review notes were left templated.
- Root cause: raw PPTX XML line selection retained numerous low-context fragments and QA checklist metadata was not completed before gating.
- Fix applied: executed a full-report cleanup by pruning fragment-triggering lines from selected catalog, regenerated markdown/render-trace/section mapping artifacts together, added source-evidence + coverage-map sections, completed review checklist, and reran provenance + gates to pass.
- Prevention rule: for PPTX reports, treat `cleanup_quality` and `manual_checklist_complete` as mandatory finalization steps; after cleanup, always regenerate trace/mapping artifacts in lockstep with markdown before rerunning gates.

- Date: 2026-02-13
- Report ID: `project-cinema-report`
- Issue observed: initial strict PDF extraction produced many sentence fragments and navigation leftovers that passed provenance matching but failed the new `cleanup_quality` fail-closed gate.
- Root cause: exact source-line matching alone is insufficient for final output quality; fragment/noise bullets must be removed globally before final QA.
- Fix applied: rerendered from strict source-backed lines with a full-report cleanup filter for fragment endings/navigation noise, then regenerated mapping/render artifacts and completed review checklist before rerunning gates.
- Prevention rule: for strict PDF reports, run provenance and `qa_gates.py` together and treat `cleanup_quality` failures as mandatory cleanup work before marking pass.

- Date: 2026-02-13
- Report ID: `project-cherry-simulated-report-2025`
- Issue observed: initial strict pipeline rendering mixed engagement/cover fragments and many non-verbatim extractor-line splits that failed provenance exact-match.
- Root cause: rendered bullets were sourced from catalog lines not guaranteed to match strict `source-text` artifacts exactly, and cover/legal fragments were still selected.
- Fix applied: regenerated report output from a cleaned exact-match subset (only lines present in `source-text` files), completed full canonical cleanup + coverage map, and reran provenance/fail-closed gates to pass.
- Prevention rule: for dense PDF reports, constrain final bullets to lines with exact `source-text` matches before QA; otherwise provenance will fail even when text appears visually similar.

- Date: 2026-02-13
- Report ID: `project-blue-jay-simulated-report-2025`
- Issue observed: strict PDF extraction produced empty page text artifacts (`page-001.txt` ... `page-108.txt` all zero-length), leaving no machine-readable body lines for canonical sections.
- Root cause: source PDF pages are image-only/non-selectable text, so strict text extraction returns no non-OCR lines.
- Fix applied: completed full-report cleanup by setting canonical sections to `Not present in source report`, filled required metadata + source-to-extraction coverage map, and verified provenance/gates with zero unmatched lines.
- Prevention rule: when strict PDF source-text artifacts are empty across pages, do not fabricate content; document the zero-text condition in coverage/review notes and keep section output as `Not present in source report` unless an explicit OCR exception is requested.

- Date: 2026-02-13
- Report ID: `example-report-private-equity-lender-project-garrison`
- Issue observed: auto-mapped output pulled legal/engagement-letter and navigation fragments into canonical sections, especially `Executive Summary`.
- Root cause: strict extraction selected dense PPTX XML lines without a mandatory report-wide cleanup pass before QA.
- Fix applied: replaced with a full canonical cleanup pass across all sections, completed source-evidence metadata/coverage map, and reran provenance + fail-closed gates before marking `pass`.
- Prevention rule: for PPTX reports, do a full-report cleanup across every canonical section (not incremental section edits), and do not approve until executive-summary cleanup and gate checks are all `pass`.

- Date: 2026-02-13
- Report ID: `project-autobahn-report`
- Issue observed: partial cleanup (single-section cleanup) left significant unclean text in other sections.
- Root cause: cleanup was applied incrementally instead of performing a full-report cleanup pass.
- Fix applied: replaced with full end-to-end manual cleanup across all canonical sections in one pass.
- Prevention rule: never deliver a report with section-only cleanup; always complete full-report cleanup before handoff.

- Date: 2026-02-13
- Report ID: `project-autobahn-report`
- Issue observed: `Executive Summary` included engagement-letter/legal/cover-page boilerplate and fragmented navigation text.
- Root cause: early slides (cover, important notice, letter pages) leaked into rendered section content before cleanup.
- Fix applied: manual cleanup pass removed boilerplate; `Executive Summary` set to `Not present in source report`; `Key Findings` rebuilt from summary slides.
- Prevention rule: always run mandatory cleanup before QA and verify `Executive Summary`/`Key Findings` contain only section-relevant body text.

- Date: 2026-02-13
- Report ID: `project-ascend-report`
- Issue observed: section misclassification and fragmented bullets (for example QoE wage-expense wording split across lines) reduced coherence.
- Root cause: heading/mapping ambiguity and wrapped-line fragmentation from source extraction.
- Fix applied: manual source-anchored reorganization by slide, section-by-section cleanup, and restored missing Balance Sheet line items.
- Prevention rule: map sections from source slide anchors first, then perform cleanup and completeness checks before marking pass.

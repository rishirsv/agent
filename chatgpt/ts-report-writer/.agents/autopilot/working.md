# Working Notes

- Story: 2.0: Extract and fully clean FDD and Value Creation example 1 (Consumer & Retail).pptx
- Last attempt: Ran isolated single-report pipeline extraction in strict/fail-closed mode and attempted strict source-text export with `scripts/extract_source_text.py`.
- Result: Blocked; source file is `CDFV2 Encrypted` and source-text export failed (`File is not a zip file`).
- Next approach: Wait for an unlocked/decryptable source file, then rerun extraction + full cleanup + QA for this report.
- Gotchas: `.pptx` extension does not guarantee a ZIP-based PPTX package; validate encryption/container type with `file` before spending cleanup effort.

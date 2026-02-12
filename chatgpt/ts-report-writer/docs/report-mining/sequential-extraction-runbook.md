# Sequential Extraction Runbook

## Preflight

```bash
cd /Users/rishi/Code/ai-tools/chatgpt/ts-report-writer
./.venv/bin/python -m ts_report_writer.pipeline preflight
```

## Run extraction in strict sequential order

```bash
./.venv/bin/python -m ts_report_writer.pipeline run --reports-dir reports
```

Optional controls:

- Start from a specific ordered index:

```bash
./.venv/bin/python -m ts_report_writer.pipeline run --reports-dir reports --start-index 15
```

- Limit batch size:

```bash
./.venv/bin/python -m ts_report_writer.pipeline run --reports-dir reports --max-reports 5
```

- Skip reports that already have output markdown:

```bash
./.venv/bin/python -m ts_report_writer.pipeline run --reports-dir reports --skip-existing
```

## Mark second-pass verification result

```bash
./.venv/bin/python -m ts_report_writer.pipeline mark-reviewed \
  --report-id project-blue-jay-simulated-report-2025 \
  --reviewer "<reviewer-name>" \
  --status pass \
  --notes "Montage review complete"
```

## Output locations

- Extracted markdown: `reports/extracted/<report_id>.md`
- Verification artifacts: `reports/verification/<report_id>/`
- Manifests + tracker: `reports/manifests/`
- Temporary conversion files (auto-cleaned per report): `reports/tmp/`

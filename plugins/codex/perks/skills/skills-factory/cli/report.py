from __future__ import annotations

import html
from pathlib import Path

from .core.schemas import read_jsonl


def write_review_report(run_root: Path) -> Path:
    rows = read_jsonl(run_root / "results.jsonl")
    prompt_rows = [row for row in rows if row.get("type") == "prompt_result"]
    summary = next((row for row in rows if row.get("type") == "run_summary"), {})
    title = f"Skill Review Run {html.escape(str(summary.get('run_id', run_root.name)))}"
    prompt_items = []
    for row in prompt_rows:
        prompt_id = str(row.get("prompt_id", "unknown"))
        role = (row.get("roles") or {}).get("output", {})
        evidence_path = role.get("evidence_path", "")
        final_path = run_root / evidence_path / "final.md" if evidence_path else None
        final_text = final_path.read_text(encoding="utf-8", errors="ignore") if final_path and final_path.exists() else ""
        prompt_items.append(
            f"""
            <section class=\"prompt\">
              <h2>{html.escape(prompt_id)} <span>{html.escape(str(row.get('status', 'unknown')))}</span></h2>
              <p><a href=\"{html.escape(evidence_path)}/trace.jsonl\">trace</a> | <a href=\"{html.escape(evidence_path)}/artifacts/\">artifacts</a></p>
              <pre>{html.escape(final_text or '(no final response captured)')}</pre>
            </section>
            """
        )
    body = "\n".join(prompt_items) or "<p>No prompt results were recorded.</p>"
    doc = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <title>{title}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; margin: 40px; color: #1f2933; }}
    header {{ border-bottom: 1px solid #d8dee4; margin-bottom: 24px; }}
    h1 {{ margin-bottom: 8px; }}
    .summary {{ display: flex; gap: 16px; flex-wrap: wrap; margin: 18px 0; }}
    .summary div {{ background: #f6f8fa; border: 1px solid #d8dee4; border-radius: 8px; padding: 10px 14px; }}
    .prompt {{ border: 1px solid #d8dee4; border-radius: 8px; padding: 18px; margin: 16px 0; }}
    .prompt h2 {{ margin-top: 0; }}
    .prompt span {{ font-size: 14px; color: #57606a; }}
    pre {{ white-space: pre-wrap; background: #f6f8fa; padding: 14px; border-radius: 6px; }}
  </style>
</head>
<body>
  <header>
    <h1>{title}</h1>
    <p>LLM outputs vary across runs; this run is one observation, not proof. Use repeated prompt coverage or manual review before making release claims.</p>
  </header>
  <div class=\"summary\">
    <div>Prompts: {html.escape(str(summary.get('prompt_count', len(prompt_rows))))}</div>
    <div>Needs review: {html.escape(str(summary.get('needs_review', 0)))}</div>
    <div>Errored: {html.escape(str(summary.get('errored', 0)))}</div>
    <div>Compare: {html.escape(str(summary.get('compare', 'none')))}</div>
  </div>
  {body}
</body>
</html>
"""
    report = run_root / "report.html"
    report.write_text(doc, encoding="utf-8")
    return report

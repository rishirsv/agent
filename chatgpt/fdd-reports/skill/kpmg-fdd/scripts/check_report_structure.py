#!/usr/bin/env python3
"""
Lightweight structural checks for an FDD report draft in Markdown.

Usage:
  python check_report_structure.py --in report.md
  python check_report_structure.py --in report.md --json out.json

What it checks:
- Presence of key sections (configurable)
- Obvious placeholder tokens left in draft (<...>, TBD, $[x], [Date])
- Basic exhibit hygiene (presence of at least one table if QoE section exists)

This is intentionally conservative: it helps catch "oops" issues,
not replace professional review.
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict, Any


DEFAULT_REQUIRED_SECTIONS = [
    "Executive summary",
    "Business overview",
    "P&L overview",
    "Quality of earnings",
    "Working capital",
    "Net debt",
    "Risks",
]

PLACEHOLDER_PATTERNS = [
    re.compile(r"<[^>]{2,}>"),          # <Company Name>, <YYYY-MM-DD>, etc.
    re.compile(r"\bTBD\b", re.I),
    re.compile(r"\bTO DO\b", re.I),
    re.compile(r"\bPLACEHOLDER\b", re.I),
    re.compile(r"\$\[[^\]]{1,40}\]"),   # $[x], $[10.5], $[Amount]
    re.compile(r"\[(?:date|as of date)\]", re.I),  # [Date], [AS OF DATE]
]


@dataclass
class CheckResult:
    ok: bool
    missing_sections: List[str]
    placeholder_hits: List[Dict[str, Any]]
    notes: List[str]


def find_sections(text: str) -> List[str]:
    # Capture markdown headings
    headings = []
    for line in text.splitlines():
        if line.lstrip().startswith("#"):
            # Remove leading #'s and whitespace
            h = re.sub(r"^#+\s*", "", line).strip()
            if h:
                headings.append(h)
    return headings


def has_table_near_keyword(text: str, keyword: str) -> bool:
    # Very rough heuristic: within 2000 chars after keyword, see a markdown table pipe row.
    idx = text.lower().find(keyword.lower())
    if idx < 0:
        return False
    window = text[idx: idx + 2000]
    return bool(re.search(r"^\|.+\|$", window, flags=re.M))


def run_checks(md_path: Path, required_sections: List[str]) -> CheckResult:
    text = md_path.read_text(encoding="utf-8", errors="ignore")
    headings = find_sections(text)
    headings_lc = " | ".join([h.lower() for h in headings])

    missing = []
    for req in required_sections:
        if req.lower() not in headings_lc:
            missing.append(req)

    placeholder_hits = []
    for i, line in enumerate(text.splitlines(), start=1):
        for pat in PLACEHOLDER_PATTERNS:
            m = pat.search(line)
            if m:
                placeholder_hits.append({
                    "line": i,
                    "match": m.group(0),
                    "context": line.strip()[:240],
                })

    notes = []
    if "quality of earnings" in headings_lc and not has_table_near_keyword(text, "quality of earnings"):
        notes.append("QoE section detected but no markdown table found near it (check for missing bridge exhibit).")

    # Placeholders are allowed by default in this skill workflow.
    # They become actionable notes unless strict mode is requested by caller.
    ok = (len(missing) == 0)

    return CheckResult(ok=ok, missing_sections=missing, placeholder_hits=placeholder_hits, notes=notes)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="infile", required=True, help="Input report markdown path")
    p.add_argument("--json", dest="json_out", default=None, help="Optional JSON output path")
    p.add_argument("--sections", dest="sections", default=None, help="Comma-separated list of required section keywords")
    p.add_argument(
        "--strict-placeholders",
        action="store_true",
        help="Fail the check if placeholder tokens are present",
    )
    args = p.parse_args()

    md_path = Path(args.infile)
    if not md_path.exists():
        print(f"ERROR: file not found: {md_path}", file=sys.stderr)
        return 2

    required = DEFAULT_REQUIRED_SECTIONS
    if args.sections:
        required = [s.strip() for s in args.sections.split(",") if s.strip()]

    result = run_checks(md_path, required)

    if args.json_out:
        Path(args.json_out).write_text(json.dumps(asdict(result), indent=2), encoding="utf-8")

    # Human-readable output
    if result.missing_sections:
        print("Missing sections:")
        for s in result.missing_sections:
            print(f" - {s}")
    if result.placeholder_hits:
        print("\nPlaceholder tokens still present:")
        for hit in result.placeholder_hits[:50]:
            print(f" - Line {hit['line']}: {hit['match']} | {hit['context']}")
        if len(result.placeholder_hits) > 50:
            print(f" ... and {len(result.placeholder_hits) - 50} more")
    if result.notes:
        print("\nNotes:")
        for n in result.notes:
            print(f" - {n}")

    if args.strict_placeholders and result.placeholder_hits:
        print("\nNOT OK: strict placeholder mode enabled and placeholders were found.")
        return 1

    if result.ok:
        print("\nOK: basic structural checks passed.")
        return 0

    print("\nNOT OK: fix missing required sections before calling this final.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

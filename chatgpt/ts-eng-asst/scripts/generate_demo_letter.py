"""
Generate a demo engagement letter using schema example values.

This is a repeatable test harness that fills all placeholders with
stable example data from the template schema and produces a .docx output.

Usage:
  python3 scripts/generate_demo_letter.py --template buyside --industry healthcare
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict

from run_internal_generation import run_generation

# Ensure project root is on the Python path for reference imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def _normalize_key(key: str) -> str:
    """Strip leading/trailing braces from {{KEY}} tokens."""
    return key.strip("{}").strip()


def _pick_value(var: Dict[str, Any]) -> str:
    """Pick a demo value from schema variable metadata."""
    if "example" in var and var["example"] is not None:
        return str(var["example"])
    options = var.get("options") or var.get("choices")
    if isinstance(options, list) and options:
        return str(options[0])
    return ""


def build_demo_variables(template_key: str) -> Dict[str, str]:
    """Build a demo variables dict from schema examples for a given template."""
    template = "buyside" if template_key.startswith("buyside") else "sellside"
    schema_path = PROJECT_ROOT / "dist" / "el-placeholder-schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    variables: Dict[str, str] = {}
    for group in schema.get("interview_groups", []):
        if not isinstance(group, dict):
            continue
        for var in group.get("variables", []):
            if not isinstance(var, dict):
                continue
            applies = var.get("applies_to", ["buyside", "sellside"])
            if isinstance(applies, list) and template not in applies:
                continue
            key = _normalize_key(var.get("key", ""))
            if not key:
                continue
            variables[key] = _pick_value(var)

    return variables


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    """Write JSON to disk for reproducible review."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a demo engagement letter")
    parser.add_argument("--template", choices=["buyside", "sellside", "both"], default="buyside")
    parser.add_argument("--industry", default="healthcare", help="Industry key (e.g., healthcare, tech)")
    parser.add_argument(
        "--scope-library",
        default=str(PROJECT_ROOT / "dist" / "scope-library.json"),
        help="Path to scope library JSON",
    )
    parser.add_argument(
        "--output-dir",
        default=str(PROJECT_ROOT / "dist"),
        help="Output directory for generated .docx",
    )
    parser.add_argument("--prefix", default="demo", help="Output filename prefix")
    parser.add_argument(
        "--scope-selection",
        default=None,
        help="Optional JSON file path with scope_selection (excluded_top_level_ids)",
    )
    parser.add_argument(
        "--dump-variables",
        action="store_true",
        help="Write the variables JSON alongside the output file",
    )

    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    scope_selection = None
    if args.scope_selection:
        scope_selection = json.loads(Path(args.scope_selection).read_text(encoding="utf-8"))

    def run_one(template_short: str) -> None:
        template_key = f"{template_short}_engagement_letter"
        variables = build_demo_variables(template_key)

        output_file = output_dir / f"{args.prefix}-{template_short}-{args.industry}.docx"
        result = run_generation(
            template_file=str(PROJECT_ROOT / "dist" / f"{template_short}-engagement-letter.docx"),
            scope_library_file=str(Path(args.scope_library)),
            industry=args.industry,
            variables=variables,
            scope_selection=scope_selection,
            output_file=str(output_file),
        )

        if args.dump_variables:
            vars_path = output_dir / f"{args.prefix}-{template_short}-{args.industry}-variables.json"
            _write_json(vars_path, variables)

        print("\n=== Demo Generation Summary ===")
        stdout = str(result.get("stdout", "")).strip()
        if stdout:
            for line in stdout.splitlines():
                print(f"  {line}")
        print(f"  Output: {output_file}")

    if args.template == "both":
        run_one("buyside")
        run_one("sellside")
    else:
        run_one(args.template)


if __name__ == "__main__":
    main()

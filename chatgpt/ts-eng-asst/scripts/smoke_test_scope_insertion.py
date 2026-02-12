"""Internal scope replacement smoke test.

Generates demo engagement letters for a selected industry and confirms the
runtime scope replacement flow works end-to-end without directly importing the
ChatGPT dist generator module.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

from run_internal_generation import run_generation


PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _normalize_key(key: str) -> str:
    return key.strip("{}").strip()


def _pick_value(var: Dict[str, Any]) -> str:
    if "example" in var and var["example"] is not None:
        return str(var["example"])
    options = var.get("options") or var.get("choices")
    if isinstance(options, list) and options:
        return str(options[0])
    return ""


def build_demo_variables(template_key: str) -> Dict[str, str]:
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


def run_test(*, template_short: str, industry: str, output_dir: Path, scope_library_file: str) -> None:
    template_path = PROJECT_ROOT / "dist" / f"{template_short}-engagement-letter.docx"
    output_path = output_dir / f"test-{template_short}-{industry}.docx"
    template_key = f"{template_short}_engagement_letter"
    variables = build_demo_variables(template_key)

    print(f"\n{'=' * 60}")
    print(f"Template:  {template_short}")
    print(f"Industry:  {industry}")
    print(f"Input:     {template_path}")
    print(f"Output:    {output_path}")
    print(f"{'=' * 60}")

    result = run_generation(
        template_file=str(template_path),
        scope_library_file=scope_library_file,
        industry=industry,
        variables=variables,
        output_file=str(output_path),
    )

    print("\nResult summary:")
    print(f"  Return code: {result.get('returncode')}")
    stdout = str(result.get("stdout", "")).strip()
    if stdout:
        for line in stdout.splitlines()[-6:]:
            print(f"  {line}")
    print(f"  Saved to: {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Internal scope replacement smoke test")
    parser.add_argument("--industry", default="healthcare", help="Industry key")
    parser.add_argument(
        "--scope-library",
        default="dist/scope-library.json",
        help="Path to scope library JSON",
    )
    parser.add_argument(
        "--out-dir",
        default="docs/scope-library/generated",
        help="Output directory for generated .docx files (non-dist).",
    )
    args = parser.parse_args()

    output_dir = (PROJECT_ROOT / args.out_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    scope_library_path = str((PROJECT_ROOT / args.scope_library).resolve())

    print("FDD Scope Block Replacement Smoke Test")
    print(f"Industry: {args.industry}")

    for template_short in ["buyside", "sellside"]:
        run_test(
            template_short=template_short,
            industry=args.industry,
            output_dir=output_dir,
            scope_library_file=scope_library_path,
        )

    print(f"\n{'=' * 60}")
    print("Done! Open output files in Word to verify formatting and section order.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

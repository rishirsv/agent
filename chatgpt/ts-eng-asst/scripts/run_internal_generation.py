"""Internal generation entrypoint for local testing workflows.

This wraps the dist runtime via subprocess so internal scripts do not import
`dist/engagement_letter_generator.py` directly.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Optional


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DIST_GENERATOR = PROJECT_ROOT / "dist" / "engagement_letter_generator.py"


def run_generation(
    *,
    template_file: str,
    scope_library_file: str,
    industry: str,
    variables: dict[str, Any],
    output_file: str,
    scope_selection: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Execute dist generator as subprocess and return execution summary."""
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as var_file:
        json.dump(variables, var_file)
        variables_path = var_file.name

    scope_selection_path = None
    if isinstance(scope_selection, dict):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as sel_file:
            json.dump(scope_selection, sel_file)
            scope_selection_path = sel_file.name

    cmd = [
        sys.executable,
        str(DIST_GENERATOR),
        "--template",
        template_file,
        "--scope-library",
        scope_library_file,
        "--industry",
        industry,
        "--variables",
        variables_path,
        "--output",
        output_file,
    ]
    if scope_selection_path:
        cmd += ["--scope-selection", scope_selection_path]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        retry = subprocess.run(cmd, capture_output=True, text=True)
        if retry.returncode != 0:
            detail = (retry.stderr or retry.stdout or "").strip()
            raise RuntimeError(f"Internal generation failed: {detail}")
        result = retry

    return {
        "command": cmd,
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "output_file": output_file,
    }


def _load_json(path: str | None) -> Optional[dict[str, Any]]:
    if not path:
        return None
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Internal generation wrapper")
    parser.add_argument("--template", required=True, help="Path to .docx template")
    parser.add_argument("--scope-library", required=True, help="Path to scope-library.json")
    parser.add_argument("--industry", required=True, help="Industry key")
    parser.add_argument("--variables", required=True, help="Path to variables JSON file")
    parser.add_argument("--output", required=True, help="Output .docx path")
    parser.add_argument("--scope-selection", default=None, help="Optional path to scope_selection JSON")
    args = parser.parse_args()

    variables = _load_json(args.variables)
    if not isinstance(variables, dict):
        raise SystemExit("Invalid --variables payload (must be JSON object)")

    scope_selection = _load_json(args.scope_selection)

    summary = run_generation(
        template_file=args.template,
        scope_library_file=args.scope_library,
        industry=args.industry,
        variables=variables,
        output_file=args.output,
        scope_selection=scope_selection,
    )
    print(summary.get("stdout", "").strip())


if __name__ == "__main__":
    main()

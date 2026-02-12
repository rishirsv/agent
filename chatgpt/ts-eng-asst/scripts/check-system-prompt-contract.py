#!/usr/bin/env python3
"""Validate TS engagement assistant system prompt size and immutable contracts."""

from __future__ import annotations

import argparse
from pathlib import Path


# Immutable code snippets that must remain verbatim in the system prompt.
SNIPPETS: dict[str, str] = {
    "generation_subprocess_contract": '''import json, subprocess, sys, tempfile

with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, dir="/mnt/data") as f:
    json.dump(variables, f)
    variables_path = f.name

cmd = [
    sys.executable, "/mnt/data/engagement_letter_generator.py",
    "--template", template_file,
    "--scope-library", "/mnt/data/scope-library.json",
    "--industry", industry,
    "--variables", variables_path,
    "--output", output_path,
]
if isinstance(scope_selection, dict) and (
    scope_selection.get("excluded_top_level_ids")
    or scope_selection.get("excluded_section_keys")
):
    cmd += ["--scope-selection", json.dumps(scope_selection)]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    retry = subprocess.run(cmd, capture_output=True, text=True)
    if retry.returncode != 0:
        err = (retry.stderr or retry.stdout or "").strip()
        raise RuntimeError(f"Generation failed: {err}")''',
    "schema_shape_access_contract": '''template_file = f"/mnt/data/{schema['templates'][template_type]}"
groups = schema["interview_groups"]  # list
group_by_id = {g["group"]: g for g in groups}
# variable applicability key: "applies_to"''',
    "required_field_derivation_contract": '''applies = v.get("applies_to", ["buyside", "sellside"])
is_applicable = template_type in applies
is_required = bool(v.get("required"))
if is_applicable and is_required:
    required_keys.add(v["key"])''',
    "conditional_sec_requirement_contract": '''if variables.get("CHOICE_INDEPENDENCE_APPLIES") == "yes":
    require("CHOICE_SEC_STATUS")
else:
    do_not_require("CHOICE_SEC_STATUS")''',
    "fee_ask_contract": '''if template_type == "buyside":
    must_ask_fees = ["FEE_FDD_LOW", "FEE_FDD_HIGH"]
elif template_type == "sellside":
    must_ask_fees = ["FEE_FDD_RANGE"]

# Do not ask "are expenses included?" by default.
# Ask only if user explicitly asks to alter fee/expense legal wording.''',
}


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for prompt contract validation."""
    parser = argparse.ArgumentParser(description="Validate system prompt contract and size budget")
    parser.add_argument(
        "--prompt",
        default="dist/ts-engagement-assistant.md",
        help="Path to system prompt markdown",
    )
    parser.add_argument(
        "--max-chars",
        type=int,
        default=8000,
        help="Maximum allowed prompt size in characters",
    )
    return parser.parse_args()


def main() -> int:
    """Run prompt budget + contract checks and return a process exit code."""
    args = parse_args()
    prompt_path = Path(args.prompt)

    if not prompt_path.exists():
        print(f"ERROR: Prompt not found: {prompt_path}")
        return 2

    text = prompt_path.read_text(encoding="utf-8")
    char_count = len(text)

    errors: list[str] = []
    if char_count > args.max_chars:
        errors.append(
            f"Prompt size {char_count} exceeds max {args.max_chars} chars"
        )

    # Check immutable snippets exactly as authored.
    for name, snippet in SNIPPETS.items():
        if snippet not in text:
            errors.append(f"Missing immutable snippet: {name}")

    # Lightweight structural guardrails that prevent known schema regressions.
    structural_markers = [
        "schema['templates'][template_type]",
        'schema["interview_groups"]',
        '"applies_to"',
        'must_ask_fees = ["FEE_FDD_LOW", "FEE_FDD_HIGH"]',
        'must_ask_fees = ["FEE_FDD_RANGE"]',
        'Do not ask "are expenses included?" by default.',
        'NamedTemporaryFile("w", suffix=".json", delete=False, dir="/mnt/data")',
        '"--variables", variables_path,',
        'scope_selection.get("excluded_section_keys")',
        "Scope Review (Pre-Generate)",
        "scope-review-buckets.json",
        "Section-level controls only; never show or toggle child bullets.",
        "concept_aliases",
        "concept_to_sections",
        'scope_selection = {"excluded_section_keys": sorted(excluded_section_keys)}',
        'if user_intent == "generate" and not user_has_scope_edits:',
        "If user types `generate` with no scope edits, proceed with full default scope.",
        "Prefer `excluded_section_keys` for section-level removals to avoid id mismatch.",
        "Never gate on `BILLING_ENTITY_NAME`; derive it from `CLIENT_LEGAL_NAME` unless user overrides.",
    ]
    for marker in structural_markers:
        if marker not in text:
            errors.append(f"Missing structural marker: {marker}")

    if errors:
        print(f"FAIL: {prompt_path} ({char_count} chars)")
        for err in errors:
            print(f" - {err}")
        return 1

    print(f"OK: {prompt_path} ({char_count} chars <= {args.max_chars})")
    print(f"Immutable snippets verified: {len(SNIPPETS)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

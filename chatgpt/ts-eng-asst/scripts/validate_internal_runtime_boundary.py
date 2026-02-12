#!/usr/bin/env python3
"""Ensure internal scripts do not directly load the dist generator module."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
ALLOWLIST = {
    "run_internal_generation.py",
    "validate_internal_runtime_boundary.py",
}
PATTERNS = (
    'spec_from_file_location("engagement_letter_generator"',
    'spec_from_file_location(\'engagement_letter_generator\'',
    "dist/engagement_letter_generator.py",
)


def main() -> int:
    violations: list[str] = []
    for path in sorted(SCRIPTS_DIR.glob("*.py")):
        if path.name in ALLOWLIST:
            continue
        text = path.read_text(encoding="utf-8")
        for pattern in PATTERNS:
            if pattern in text:
                violations.append(f"{path.relative_to(PROJECT_ROOT)} contains prohibited pattern: {pattern}")

    if violations:
        print("FAIL: Internal boundary violations found")
        for item in violations:
            print(f" - {item}")
        return 1

    print("OK: Internal scripts boundary check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

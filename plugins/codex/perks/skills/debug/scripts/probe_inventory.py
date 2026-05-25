#!/usr/bin/env python3
"""Detect leftover temporary debug probes before finalizing a fix."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

DEFAULT_MARKERS = ["DEBUG_AGENT_PROBE", "__DEBUG_AGENT__", "__debug_probe__", "debug_agent_probe"]
DEFAULT_SKIP_DIRS = {
    ".git", ".hg", ".svn", ".debug-agent", ".venv", "venv", "env", "node_modules",
    "dist", "build", ".next", ".nuxt", "coverage", "target", "__pycache__", ".mypy_cache",
    ".pytest_cache", ".ruff_cache", ".agents", ".claude", ".codex",
}
TEXT_EXT_ALLOW = {
    ".c", ".cc", ".cpp", ".cs", ".css", ".go", ".h", ".hpp", ".html", ".java", ".js",
    ".jsx", ".json", ".kt", ".m", ".md", ".php", ".py", ".rb", ".rs", ".scala", ".sh",
    ".sql", ".swift", ".toml", ".ts", ".tsx", ".txt", ".vue", ".xml", ".yaml", ".yml",
}


def is_probably_text(path: Path) -> bool:
    if path.suffix.lower() in TEXT_EXT_ALLOW:
        return True
    try:
        with path.open("rb") as handle:
            chunk = handle.read(2048)
        return b"\0" not in chunk
    except OSError:
        return False


def iter_files(root: Path, skip_dirs: set[str]):
    for current, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        for filename in filenames:
            path = Path(current) / filename
            if path.is_file() and is_probably_text(path):
                yield path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Find temporary debug probe markers left in a project.")
    parser.add_argument("--root", default=".", help="Project root to scan.")
    parser.add_argument("--marker", action="append", default=[], help="Additional marker to scan for. Can be repeated.")
    parser.add_argument("--skip-dir", action="append", default=[], help="Additional directory name to skip. Can be repeated.")
    args = parser.parse_args(argv)

    root = Path(args.root).resolve()
    if not root.exists() or not root.is_dir():
        print(f"error: root is not a directory: {root}", file=sys.stderr)
        return 2

    markers = DEFAULT_MARKERS + args.marker
    skip_dirs = DEFAULT_SKIP_DIRS | set(args.skip_dir)
    findings: list[tuple[Path, int, str, str]] = []

    for path in iter_files(root, skip_dirs):
        try:
            with path.open("r", encoding="utf-8", errors="ignore") as handle:
                for line_no, line in enumerate(handle, start=1):
                    for marker in markers:
                        if marker in line:
                            findings.append((path, line_no, marker, line.rstrip()))
        except OSError as exc:
            print(f"warning: could not read {path}: {exc}", file=sys.stderr)

    if findings:
        print(f"Found {len(findings)} possible leftover debug probe(s):")
        for path, line_no, marker, line in findings:
            try:
                display = path.relative_to(root)
            except ValueError:
                display = path
            print(f"{display}:{line_no}: {marker}: {line}")
        return 1

    print("No debug probe markers found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

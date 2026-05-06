#!/usr/bin/env python3
"""Thin wrapper scanner

Heuristically find files that add indirection with minimal behavior:
- JS/TS re-export barrels and pass-through modules
- Python modules that only import/re-export

This is not a linter and will have false positives. It exists to surface
**candidate hotspots** to inspect, not to drive automated deletions.

Usage:
  scripts/thin_wrapper_scan.py --root .
  scripts/thin_wrapper_scan.py --root . --max-lines 80 --limit 200
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

SKIP_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "out",
    ".next",
    ".nuxt",
    ".cache",
    ".venv",
    "venv",
    "__pycache__",
    "target",
    "vendor",
    "Pods",
}

TEXT_EXTS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".py"}

JS_WRAPPER_ALLOWED = re.compile(
    r"^\s*(//|/\*|\*/|\*\s|$|['\"]use strict['\"];?|export\s|import\s|module\.exports|require\(|\}\s*from\s+['\"])"
)
PY_WRAPPER_ALLOWED = re.compile(r"^\s*(#|$|from\s+\.|from\s+\w|import\s+\w|__all__\s*=)")

# Lines that indicate *real* logic; if present, we won't treat as wrapper.
JS_LOGIC_HINTS = re.compile(r"\b(class|function|=>|return\b|if\s*\(|for\s*\(|while\s*\(|switch\s*\(|try\s*\{|catch\s*\()")
PY_LOGIC_HINTS = re.compile(r"\b(def|class)\b|if\s+__name__\s*==\s*['\"]__main__['\"]")


def run(cmd: list[str], cwd: Path) -> tuple[int, str, str]:
    proc = subprocess.run(cmd, cwd=str(cwd), text=True, capture_output=True)
    return proc.returncode, proc.stdout, proc.stderr


def is_git_repo(root: Path) -> bool:
    code, out, _ = run(["git", "rev-parse", "--is-inside-work-tree"], cwd=root)
    return code == 0 and out.strip() == "true"


def iter_files_via_git(root: Path):
    code, out, err = run(["git", "ls-files"], cwd=root)
    if code != 0:
        raise RuntimeError(f"git ls-files failed: {err.strip()}")
    for line in out.splitlines():
        p = (root / line).resolve()
        if p.is_file() and p.suffix.lower() in TEXT_EXTS:
            yield p


def iter_files_via_walk(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in filenames:
            if fn.startswith("."):
                continue
            p = Path(dirpath) / fn
            if p.is_file() and p.suffix.lower() in TEXT_EXTS:
                yield p


def relpath_str(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except Exception:
        return str(path)


def normalize_lines(text: str) -> list[str]:
    # Remove trailing whitespace and ignore blank lines.
    return [ln.rstrip() for ln in text.splitlines() if ln.strip()]


def looks_like_wrapper(path: Path, max_lines: int) -> bool:
    try:
        raw = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return False

    lines = normalize_lines(raw)
    if not lines:
        return False
    if len(lines) > max_lines:
        return False

    ext = path.suffix.lower()
    if ext in {".py"}:
        if PY_LOGIC_HINTS.search(raw):
            return False
        return all(PY_WRAPPER_ALLOWED.match(ln) for ln in lines)

    # JS/TS
    if JS_LOGIC_HINTS.search(raw):
        return False

    return all(JS_WRAPPER_ALLOWED.match(ln) for ln in lines)


@dataclass(frozen=True)
class Hit:
    path: str
    lines: int


def main() -> int:
    ap = argparse.ArgumentParser(description="Heuristically detect thin wrapper modules.")
    ap.add_argument("--root", default=".", help="Repo root")
    ap.add_argument("--max-lines", type=int, default=80, help="Max non-empty lines to qualify")
    ap.add_argument("--limit", type=int, default=200, help="Max hits to print")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    files = list(iter_files_via_git(root) if is_git_repo(root) else iter_files_via_walk(root))

    hits: list[Hit] = []
    for p in files:
        try:
            raw = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        n = len(normalize_lines(raw))
        if looks_like_wrapper(p, args.max_lines):
            hits.append(Hit(path=relpath_str(p, root), lines=n))

    hits.sort(key=lambda h: h.lines)  # smallest first

    print("# Thin wrapper candidates\n")
    print(f"Root: `{root}`\n")
    print(f"Hits shown: {min(len(hits), args.limit)} of {len(hits)} (max_lines={args.max_lines})\n")

    for h in hits[: args.limit]:
        print(f"- `{h.path}` ({h.lines} non-empty lines)")

    if hits:
        print("\nNotes:")
        print("- Treat this as a navigation aid, not an automated refactor list.")
        print("- Validate each hit by reading the file and its call sites.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

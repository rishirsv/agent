#!/usr/bin/env python3
"""Duplicate Filenames Report

Goal: quickly surface duplicated "concept containers" (e.g., utils.ts, config.py)
which often indicate scattered responsibilities or parallel abstractions.

The output is intentionally simple: a list of filenames that appear in multiple
locations, with their paths and approximate sizes.

Usage:
  scripts/duplicate_filenames.py --root .
  scripts/duplicate_filenames.py --root . --min-count 3 --limit 50
"""

from __future__ import annotations

import argparse
import os
import subprocess
from collections import defaultdict
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

MAX_TEXT_READ_BYTES = 1_000_000


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
        if p.is_file():
            yield p


def iter_files_via_walk(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in filenames:
            if fn.startswith("."):
                continue
            p = Path(dirpath) / fn
            if p.is_file():
                yield p


def relpath_str(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except Exception:
        return str(path)


def count_lines(path: Path) -> int | None:
    try:
        if path.stat().st_size > MAX_TEXT_READ_BYTES:
            return None
        with path.open("rb") as f:
            head = f.read(4096)
        if b"\x00" in head:
            return None
        with path.open("r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except Exception:
        return None


@dataclass(frozen=True)
class Entry:
    relpath: str
    bytes: int
    lines: int | None


def main() -> int:
    ap = argparse.ArgumentParser(description="Report duplicated filenames across a repo.")
    ap.add_argument("--root", default=".", help="Repo root")
    ap.add_argument("--min-count", type=int, default=2, help="Minimum duplicates to list")
    ap.add_argument("--limit", type=int, default=100, help="Max duplicate groups to show")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    files = list(iter_files_via_git(root) if is_git_repo(root) else iter_files_via_walk(root))

    by_name: dict[str, list[Entry]] = defaultdict(list)
    for p in files:
        rel = relpath_str(p, root)
        by_name[p.name].append(
            Entry(relpath=rel, bytes=p.stat().st_size, lines=count_lines(p))
        )

    dupes = [(name, entries) for name, entries in by_name.items() if len(entries) >= args.min_count]

    # Sort by count desc, then total bytes desc.
    dupes.sort(
        key=lambda t: (len(t[1]), sum(e.bytes for e in t[1])),
        reverse=True,
    )

    print("# Duplicate filenames\n")
    print(f"Root: `{root}`\n")
    print(f"Groups shown: {min(len(dupes), args.limit)} of {len(dupes)} (min_count={args.min_count})\n")

    shown = 0
    for name, entries in dupes:
        shown += 1
        if shown > args.limit:
            break
        print(f"## {name} ({len(entries)})")
        # Sort entries by path for readability.
        for e in sorted(entries, key=lambda x: x.relpath):
            lc = "?" if e.lines is None else str(e.lines)
            print(f"- `{e.relpath}` ({e.bytes} bytes, {lc} lines)")
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

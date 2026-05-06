#!/usr/bin/env python3
"""Repo Probe

Quickly summarize a repository to support autonomous refactor selection.

What it does (fast, heuristic):
- Lists key docs and architecture signals
- Detects likely tech stack from config files
- Produces basic size/hotspot stats (directories, largest files)
- Counts file extensions (language hints)

Designed to be safe and dependency-free (stdlib only).

Usage:
  scripts/repo_probe.py --root .
  scripts/repo_probe.py --root . --format json
  scripts/repo_probe.py --root . --out repo_probe.md
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Iterator

# Skip common heavy/irrelevant directories when not using git ls-files.
SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
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
    ".pytest_cache",
    "target",
    "vendor",
    "Pods",
    ".gradle",
}

# Consider files larger than this (bytes) as "large"; still counted, but may skip line counting.
MAX_TEXT_READ_BYTES = 2_000_000  # 2MB

DOC_FILENAMES = {
    "readme.md",
    "readme.txt",
    "readme",
    "contributing.md",
    "architecture.md",
    "design.md",
    "adr.md",
    "decisions.md",
}

DOC_DIRS = {"docs", "doc", "documentation", "adr", "adrs"}

STACK_SIGNAL_FILES = {
    # JS/TS
    "package.json": "node",
    "pnpm-lock.yaml": "node",
    "yarn.lock": "node",
    "package-lock.json": "node",
    "tsconfig.json": "typescript",
    "vite.config.js": "vite",
    "vite.config.ts": "vite",
    "next.config.js": "nextjs",
    "next.config.mjs": "nextjs",
    "webpack.config.js": "webpack",
    # Python
    "pyproject.toml": "python",
    "requirements.txt": "python",
    "setup.py": "python",
    "Pipfile": "python",
    # Go
    "go.mod": "go",
    # Rust
    "Cargo.toml": "rust",
    # Java/Kotlin
    "pom.xml": "maven",
    "build.gradle": "gradle",
    "build.gradle.kts": "gradle",
    "settings.gradle": "gradle",
    "settings.gradle.kts": "gradle",
    # .NET
    "*.csproj": "dotnet",
    "*.sln": "dotnet",
    # Ruby
    "Gemfile": "ruby",
    # iOS
    "Podfile": "cocoapods",
    "Package.swift": "swiftpm",
    "*.xcodeproj": "xcode",
    "*.xcworkspace": "xcode",
    # Containers/infra
    "Dockerfile": "docker",
    "docker-compose.yml": "docker",
    "docker-compose.yaml": "docker",
    "terraform": "terraform",
    "main.tf": "terraform",
}


@dataclass(frozen=True)
class FileStat:
    path: str
    size_bytes: int
    line_count: int | None


@dataclass(frozen=True)
class RepoProbe:
    root: str
    docs: list[str]
    stack_signals: list[str]
    extension_counts: dict[str, int]
    top_level_dirs: list[dict]
    largest_files: list[dict]


def run(cmd: list[str], cwd: Path) -> tuple[int, str, str]:
    proc = subprocess.run(cmd, cwd=str(cwd), text=True, capture_output=True)
    return proc.returncode, proc.stdout, proc.stderr


def is_git_repo(root: Path) -> bool:
    code, out, _ = run(["git", "rev-parse", "--is-inside-work-tree"], cwd=root)
    return code == 0 and out.strip() == "true"


def iter_files_via_git(root: Path) -> Iterator[Path]:
    code, out, err = run(["git", "ls-files"], cwd=root)
    if code != 0:
        raise RuntimeError(f"git ls-files failed: {err.strip()}")
    for line in out.splitlines():
        p = (root / line).resolve()
        if p.is_file():
            yield p


def iter_files_via_walk(root: Path) -> Iterator[Path]:
    for dirpath, dirnames, filenames in os.walk(root):
        # prune
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in filenames:
            if fn.startswith("."):
                continue
            p = Path(dirpath) / fn
            if p.is_file():
                yield p


def is_probably_text(path: Path) -> bool:
    try:
        with path.open("rb") as f:
            chunk = f.read(4096)
        if b"\x00" in chunk:
            return False
        return True
    except Exception:
        return False


def count_lines(path: Path) -> int | None:
    try:
        size = path.stat().st_size
        if size > MAX_TEXT_READ_BYTES:
            return None
        if not is_probably_text(path):
            return None
        with path.open("r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except Exception:
        return None


def relpath_str(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except Exception:
        return str(path)


def glob_signal_matches(root: Path, pattern: str) -> bool:
    # Simple helper for "*.csproj" style patterns.
    return any(root.rglob(pattern))


def detect_stack_signals(root: Path) -> list[str]:
    signals: set[str] = set()

    # direct filenames
    for name, signal in STACK_SIGNAL_FILES.items():
        if "*" in name:
            if glob_signal_matches(root, name):
                signals.add(signal)
        else:
            if (root / name).exists():
                signals.add(signal)

    # Directory-based signals (terraform)
    if (root / "terraform").exists() and (root / "terraform").is_dir():
        signals.add("terraform")

    return sorted(signals)


def find_docs(root: Path, files: Iterable[Path]) -> list[str]:
    docs: list[str] = []

    # Common root docs
    for p in files:
        rel = relpath_str(p, root)
        name = p.name.lower()
        parent = p.parent.name.lower() if p.parent else ""

        if name in DOC_FILENAMES:
            docs.append(rel)
            continue

        # docs directories
        if parent in DOC_DIRS:
            # Keep only markdown and text-ish files.
            if p.suffix.lower() in {".md", ".txt", ".rst"}:
                docs.append(rel)

        # ADR conventions
        if "adr" in rel.lower() and p.suffix.lower() in {".md", ".txt"}:
            docs.append(rel)

    # Dedup and stable order
    docs = sorted(set(docs))
    return docs


def top_level_dir(rel: str) -> str:
    parts = rel.split(os.sep)
    if len(parts) <= 1:
        return "."
    return parts[0]


def build_probe(root: Path, limit_files: int = 20) -> RepoProbe:
    if is_git_repo(root):
        files = list(iter_files_via_git(root))
    else:
        files = list(iter_files_via_walk(root))

    stats: list[FileStat] = []
    ext_counts: Counter[str] = Counter()
    dir_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"files": 0, "loc": 0})

    for p in files:
        rel = relpath_str(p, root)
        ext = p.suffix.lower() or "(none)"
        ext_counts[ext] += 1

        lc = count_lines(p)
        size = p.stat().st_size
        stats.append(FileStat(path=rel, size_bytes=size, line_count=lc))

        tl = top_level_dir(rel)
        dir_counts[tl]["files"] += 1
        if lc is not None:
            dir_counts[tl]["loc"] += lc

    docs = find_docs(root, files)
    signals = detect_stack_signals(root)

    top_dirs = sorted(
        (
            {"dir": d, **m}
            for d, m in dir_counts.items()
        ),
        key=lambda x: (x["files"], x.get("loc", 0)),
        reverse=True,
    )

    largest = sorted(
        (
            {
                "path": s.path,
                "size_bytes": s.size_bytes,
                "line_count": s.line_count,
            }
            for s in stats
        ),
        key=lambda x: x["size_bytes"],
        reverse=True,
    )[:limit_files]

    return RepoProbe(
        root=str(root.resolve()),
        docs=docs,
        stack_signals=signals,
        extension_counts=dict(ext_counts.most_common()),
        top_level_dirs=top_dirs,
        largest_files=largest,
    )


def to_markdown(probe: RepoProbe, top_n_dirs: int = 15, top_n_exts: int = 15) -> str:
    lines: list[str] = []

    lines.append(f"# Repo probe\n")
    lines.append(f"Root: `{probe.root}`\n")

    lines.append("## Stack signals")
    if probe.stack_signals:
        lines.append("- " + "\n- ".join(probe.stack_signals))
    else:
        lines.append("- (none detected)")

    lines.append("\n## Docs and architecture signals")
    if probe.docs:
        for d in probe.docs[:50]:
            lines.append(f"- `{d}`")
        if len(probe.docs) > 50:
            lines.append(f"- ... and {len(probe.docs) - 50} more")
    else:
        lines.append("- (no obvious docs found)")

    lines.append("\n## Top-level directories")
    for item in probe.top_level_dirs[:top_n_dirs]:
        d = item["dir"]
        files = item["files"]
        loc = item.get("loc", 0)
        lines.append(f"- `{d}`: {files} files, {loc} LOC (counted text)")

    lines.append("\n## File extensions")
    for ext, count in list(probe.extension_counts.items())[:top_n_exts]:
        lines.append(f"- `{ext}`: {count}")

    lines.append("\n## Largest files (by bytes)")
    for f in probe.largest_files:
        path = f["path"]
        size = f["size_bytes"]
        lc = f["line_count"]
        lc_str = str(lc) if lc is not None else "?"
        lines.append(f"- `{path}`: {size} bytes, {lc_str} lines")

    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description="Quick repository summary for refactor selection.")
    ap.add_argument("--root", default=".", help="Repo root (default: .)")
    ap.add_argument("--format", choices=["md", "json"], default="md", help="Output format")
    ap.add_argument("--out", default="", help="Write output to file (default: stdout)")
    ap.add_argument("--limit-files", type=int, default=20, help="Number of largest files to show")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    probe = build_probe(root=root, limit_files=args.limit_files)

    if args.format == "json":
        payload = json.dumps(asdict(probe), indent=2, sort_keys=True)
    else:
        payload = to_markdown(probe)

    if args.out:
        Path(args.out).write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

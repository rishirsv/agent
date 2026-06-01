from __future__ import annotations

import argparse
from pathlib import Path


def add_open_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    parser = subparsers.add_parser("open", help="Open or list review reports.")
    parser.add_argument("review", nargs="?", help="Review root or project directory.")
    parser.add_argument("--run", dest="run_id", help="Run id to open. Defaults to latest.")
    parser.add_argument("--list", action="store_true", help="List recent runs.")
    parser.add_argument("--history", action="store_true", help="Show run history.")
    parser.set_defaults(func=handle_open)


def handle_open(args: argparse.Namespace) -> int:
    from ..core.output import done, open_path
    from ..core.paths import relative_path, resolve_review_location

    location = resolve_review_location(args.review)
    runs_root = location.review_root / "runs"
    runs = sorted([path for path in runs_root.iterdir() if path.is_dir()]) if runs_root.exists() else []
    if args.list or args.history:
        if not runs:
            done("no review runs found.", path=str(runs_root), next_step="run `skillfactory review run`")
            return 0
        for path in runs[-20:]:
            marker = "latest" if path == runs[-1] else ""
            print(f"{path.name} {marker}".rstrip())
        done(f"listed {min(len(runs), 20)} run(s).", path=str(runs_root), next_step="open a run with `skillfactory review open --run <run-id>`")
        return 0

    run_root: Path | None
    if args.run_id and args.run_id != "latest":
        run_root = runs_root / args.run_id
    else:
        run_root = runs[-1] if runs else None
    if run_root is None or not run_root.exists():
        raise ValueError("no review run found; run `skillfactory review run` first")
    report = run_root / "report.html"
    if not report.exists():
        raise ValueError(f"report does not exist: {report}")
    open_path(report)
    done("opened review report.", report=str(report), next_step=f"inspect feedback, then rerun with `skillfactory review run --audit {relative_path(Path.cwd(), location.review_root)}` when ready")
    return 0

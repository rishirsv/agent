from __future__ import annotations

import argparse
import sys
from pathlib import Path


def add_run_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    parser = subparsers.add_parser("run", help="Run the planned improvement candidate against the review.")
    parser.add_argument("project", nargs="?", default=".", help="Skill project directory.")
    parser.add_argument("--session", required=True, help="Improve session id from `improve plan`.")
    parser.set_defaults(func=handle_run)


def handle_run(args: argparse.Namespace) -> int:
    from ..core.clock import utc_now
    from ..core.output import done
    from ..core.schemas import read_yaml, write_json

    project_root = Path(args.project).expanduser().resolve()
    session_root = project_root / ".skill-improve" / "sessions" / args.session
    session_file = session_root / "session.json"
    if not session_file.exists():
        raise ValueError(f"no session found at {session_root}; run `skillfactory improve plan` first")

    session = _read_json(session_file)
    candidate_path = session_root / "candidate.md"
    if not candidate_path.exists():
        raise ValueError(f"candidate.md is missing for session {args.session}")

    print(
        "Skeleton run: real candidate-vs-baseline orchestration is future work. "
        "This stub records the candidate intent and points at the existing review runner.",
        file=sys.stderr,
    )

    result = {
        "schema_version": 1,
        "session_id": args.session,
        "executed_at": utc_now(),
        "status": "stub",
        "notes": "v1 skeleton; rerun `skillfactory review run` against the working tree, then record findings manually.",
    }
    write_json(session_root / "result.json", result)

    session["status"] = "stub"
    session["last_run_at"] = result["executed_at"]
    write_json(session_file, session)

    done(
        f"recorded improve run STUB for session {args.session} (no candidate actually executed; v1 skeleton).",
        path=str(session_root),
        next_step=(
            "rerun `skillfactory review run` against your candidate working tree, "
            f"then `skillfactory improve decide {args.session} --accept` or `--reject`"
        ),
    )
    return 0


def _read_json(path: Path) -> dict:
    import json

    return json.loads(path.read_text(encoding="utf-8"))

from __future__ import annotations

import argparse
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path


def add_plan_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    parser = subparsers.add_parser("plan", help="Plan a bounded improvement from review evidence.")
    parser.add_argument("project", nargs="?", default=".", help="Skill project directory.")
    parser.add_argument("--from-run", help="Review run id whose evidence seeds the plan.")
    parser.set_defaults(func=handle_plan)


def handle_plan(args: argparse.Namespace) -> int:
    from ..core.clock import utc_now
    from ..core.output import done
    from ..core.schemas import write_json

    project_root = Path(args.project).expanduser().resolve()
    if not (project_root / "skill" / "SKILL.md").exists():
        raise ValueError(f"project must contain skill/SKILL.md: {project_root}")

    evidence_run = args.from_run
    if evidence_run is None:
        evidence_run = _latest_run_id(project_root)

    session_id = _session_id()
    session_root = project_root / ".skill-improve" / "sessions" / session_id
    session_root.mkdir(parents=True, exist_ok=True)

    candidate_path = session_root / "candidate.md"
    candidate_path.write_text(
        _candidate_template(session_id=session_id, evidence_run=evidence_run),
        encoding="utf-8",
    )

    write_json(
        session_root / "session.json",
        {
            "schema_version": 1,
            "session_id": session_id,
            "created_at": utc_now(),
            "evidence_run": evidence_run,
            "status": "planned",
        },
    )

    print("Skeleton plan: candidate.md is a placeholder; real planning logic is future work.", file=sys.stderr)
    done(
        f"created improve session {session_id}.",
        path=str(session_root),
        next_step=f"edit candidate.md, then `skillfactory improve run {args.project} --session {session_id}`",
    )
    return 0


def _candidate_template(*, session_id: str, evidence_run: str | None) -> str:
    seed = evidence_run or "(none — no review runs found)"
    return (
        f"# Improve candidate {session_id}\n\n"
        f"Evidence run: {seed}\n\n"
        "## What evidence supports this change\n\n"
        "- [ ] Cite specific prompt failures, judge notes, or check results.\n\n"
        "## Proposed edit\n\n"
        "Describe the bounded edit. Keep scope small. Name the file or section to change.\n\n"
        "## Expected behavior change\n\n"
        "Describe how rerunning review prompts should differ after the edit.\n"
    )


def _latest_run_id(project_root: Path) -> str | None:
    runs = project_root / "reviews" / "runs"
    if not runs.exists():
        return None
    children = [p for p in runs.iterdir() if p.is_dir()]
    if not children:
        return None
    return max(children, key=lambda p: p.name).name


def _session_id() -> str:
    base = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
    return f"{base}-{uuid.uuid4().hex[:6]}"

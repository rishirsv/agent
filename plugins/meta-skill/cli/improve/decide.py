from __future__ import annotations

import argparse
import sys
from pathlib import Path


def add_decide_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    parser = subparsers.add_parser("decide", help="Record a human decision on an improve candidate.")
    parser.add_argument("session", help="Improve session id.")
    parser.add_argument("--project", default=".", help="Skill project directory.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--accept", action="store_true", help="Accept the candidate. A human applies the patch.")
    group.add_argument("--reject", action="store_true", help="Reject the candidate. Plan a different angle.")
    parser.add_argument("--note", default="", help="Optional plain-text reason for the decision.")
    parser.set_defaults(func=handle_decide)


def handle_decide(args: argparse.Namespace) -> int:
    from ..core.clock import utc_now
    from ..core.output import done
    from ..core.schemas import write_json

    project_root = Path(args.project).expanduser().resolve()
    session_root = project_root / ".skill-improve" / "sessions" / args.session
    if not (session_root / "session.json").exists():
        raise ValueError(f"no session found at {session_root}")

    decision = "accept" if args.accept else "reject"
    write_json(
        session_root / "decision.json",
        {
            "schema_version": 1,
            "session_id": args.session,
            "decision": decision,
            "decided_at": utc_now(),
            "note": args.note,
        },
    )

    print("Skeleton decide: this command records the decision. Applying the patch stays a human step in v1.", file=sys.stderr)

    if decision == "accept":
        next_step = "apply the candidate edit by hand, rerun `meta-skill eval run`, then commit"
    else:
        next_step = f"plan a different angle with `meta-skill improve plan {args.project}`"

    done(f"recorded decision: {decision} for session {args.session}.", path=str(session_root), next_step=next_step)
    return 0

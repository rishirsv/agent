from __future__ import annotations

import argparse
import sys

from .create import run_create
from .improve.decide import add_decide_parser
from .improve.plan import add_plan_parser
from .improve.run import add_run_parser as add_improve_run_parser
from .eval.init import add_init_parser
from .eval.open_eval import add_open_parser
from .eval.run import add_run_parser
from .validate import run_validate

_PASSTHROUGH_VERBS = {"create", "validate"}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="meta-skill",
        description="meta-skill CLI: create, evaluate, and improve reusable skills.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("create", help="Scaffold a new skill project.", add_help=False)
    subparsers.add_parser("validate", help="Validate a skill project or portable skill root.", add_help=False)

    eval_parser = subparsers.add_parser("eval", help="Initialize, run, audit, and open skill evals.")
    eval_subparsers = eval_parser.add_subparsers(dest="eval_command", required=True)
    add_init_parser(eval_subparsers)
    add_run_parser(eval_subparsers)
    add_open_parser(eval_subparsers)

    improve = subparsers.add_parser("improve", help="Plan, run, and decide bounded skill improvements (v1 skeleton).")
    improve_subparsers = improve.add_subparsers(dest="improve_command", required=True)
    add_plan_parser(improve_subparsers)
    add_improve_run_parser(improve_subparsers)
    add_decide_parser(improve_subparsers)

    return parser


def main(argv: list[str] | None = None) -> int:
    raw = list(sys.argv[1:] if argv is None else argv)
    if raw and raw[0] in _PASSTHROUGH_VERBS:
        verb, *forwarded = raw
        if verb == "create":
            return run_create(forwarded)
        if verb == "validate":
            return run_validate(forwarded)

    parser = build_parser()
    args = parser.parse_args(raw)
    try:
        return int(args.func(args) or 0)
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)
        return 130
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

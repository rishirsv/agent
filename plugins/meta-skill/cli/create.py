from __future__ import annotations

import sys

from . import create_skill


def run_create(argv: list[str]) -> int:
    """Run the in-process scaffolder behind `meta-skill create`."""
    return _run_inprocess(create_skill.main, argv)


def _run_inprocess(fn, argv: list[str]) -> int:
    """Call an engine entrypoint that may raise SystemExit, returning an exit code."""
    try:
        fn(argv)
        return 0
    except SystemExit as exc:
        code = exc.code
        if code is None:
            return 0
        if isinstance(code, int):
            return code
        print(code, file=sys.stderr)
        return 1

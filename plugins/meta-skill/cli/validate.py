from __future__ import annotations

from . import validate_skill
from .create import _run_inprocess


def run_validate(argv: list[str]) -> int:
    """Run the in-process structural validator behind `meta-skill validate`."""
    return _run_inprocess(validate_skill.main, argv)

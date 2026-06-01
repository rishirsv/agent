from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


def done(message: str, *, path: str | None = None, report: str | None = None, next_step: str | None = None) -> None:
    print(f"Done: {message}")
    if report:
        print(f"Report: {report}")
    if path:
        print(f"Path: {path}")
    if next_step:
        print(f"Next: {next_step}")


def open_path(path: Path) -> None:
    if shutil.which("open"):
        subprocess.run(["open", str(path)], check=False)


def stdout_is_tty() -> bool:
    return sys.stdout.isatty()

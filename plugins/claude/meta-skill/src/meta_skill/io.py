"""JSON and command-output helpers."""

import dataclasses
import enum
import json
import sys
from pathlib import Path

from .errors import CliError


def resolve_run_dir(raw_run):
    run_dir = Path(raw_run).expanduser().resolve()
    if not (run_dir / "run.json").exists():
        candidate = (Path(".meta-skill/runs") / raw_run).resolve()
        if candidate.exists():
            return candidate
    return run_dir


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")


def append_jsonl(path, row):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(row, sort_keys=True) + "\n")


def write_jsonl(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows))


def read_json(path):
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        raise CliError(f"file not found: {path}", 2)
    except json.JSONDecodeError as exc:
        raise CliError(f"invalid JSON in {path}: {exc}", 2)


def read_jsonl(path):
    if not path.exists():
        return []
    rows = []
    for line_no, line in enumerate(path.read_text().splitlines(), 1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise CliError(f"invalid JSONL in {path}:{line_no}: {exc}", 2)
    return rows


def emit(data, as_json):
    if as_json:
        print(json.dumps(data, indent=2, sort_keys=True))
    else:
        if isinstance(data, str):
            print(data)
        else:
            print(json.dumps(data, indent=2, sort_keys=True))


def fail(message, as_json=False, code=1, detail=None):
    if as_json:
        print(json.dumps({"ok": False, "error": message, "detail": detail}, indent=2, sort_keys=True))
    else:
        print(f"error: {message}", file=sys.stderr)
    return code


def to_jsonable(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, enum.Enum):
        return value.value
    if hasattr(value, "model_dump"):
        return value.model_dump(by_alias=True, exclude_none=True, mode="json")
    if dataclasses.is_dataclass(value):
        return {k: to_jsonable(v) for k, v in dataclasses.asdict(value).items()}
    if isinstance(value, dict):
        return {str(k): to_jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_jsonable(v) for v in value]
    return str(value)


def normalize_usage(usage):
    return to_jsonable(usage) if usage is not None else None


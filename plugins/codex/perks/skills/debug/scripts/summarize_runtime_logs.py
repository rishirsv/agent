#!/usr/bin/env python3
"""Summarize JSONL records from runtime_log_collector.py."""
from __future__ import annotations

import argparse
import collections
import json
import sys
from pathlib import Path
from typing import Any, Iterable

ERROR_WORDS = ("error", "exception", "fail", "failed", "panic", "timeout", "undefined", "null", "nan")


def load_records(path: Path) -> tuple[list[dict[str, Any]], int]:
    records: list[dict[str, Any]] = []
    invalid = 0
    try:
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    invalid += 1
                    continue
                if isinstance(item, dict):
                    records.append(item)
                else:
                    invalid += 1
    except FileNotFoundError:
        raise SystemExit(f"error: log file not found: {path}")
    return records, invalid


def body(record: dict[str, Any]) -> dict[str, Any]:
    payload = record.get("body")
    return payload if isinstance(payload, dict) else {"message": payload}


def nested_get(data: dict[str, Any], key: str) -> Any:
    cur: Any = data
    for part in key.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur


def value_text(value: Any, limit: int = 280) -> str:
    if isinstance(value, str):
        text = value
    else:
        text = json.dumps(value, ensure_ascii=False, sort_keys=True)
    text = text.replace("\n", " ")
    return text if len(text) <= limit else text[: limit - 1] + "…"


def filter_records(records: Iterable[dict[str, Any]], probe: str | None, event: str | None) -> list[dict[str, Any]]:
    result = []
    for record in records:
        payload = body(record)
        if probe and str(payload.get("probe")) != probe:
            continue
        if event and str(payload.get("event")) != event:
            continue
        result.append(record)
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Summarize runtime JSONL logs for debugging.")
    parser.add_argument("logfile", help="JSONL file written by runtime_log_collector.py")
    parser.add_argument("--probe", help="Only include records with this probe id")
    parser.add_argument("--event", help="Only include records with this event")
    parser.add_argument("--sample", type=int, default=12, help="Number of sample/error-like records to show")
    parser.add_argument("--field", action="append", default=[], help="Extra body field to count, such as data.status or data.route")
    args = parser.parse_args(argv)

    records, invalid = load_records(Path(args.logfile))
    records = filter_records(records, args.probe, args.event)

    print("# Runtime Log Summary")
    print()
    print(f"- Records: {len(records)}")
    print(f"- Invalid lines skipped: {invalid}")
    if not records:
        return 0

    timestamps = [str(r.get("ts", "")) for r in records if r.get("ts")]
    if timestamps:
        print(f"- First timestamp: {min(timestamps)}")
        print(f"- Last timestamp: {max(timestamps)}")

    probes = collections.Counter(str(body(r).get("probe", "<missing>")) for r in records)
    events = collections.Counter(str(body(r).get("event", "<missing>")) for r in records)
    levels = collections.Counter(str(body(r).get("level", "<missing>")) for r in records)

    def print_counter(title: str, counter: collections.Counter[str]) -> None:
        print()
        print(f"## {title}")
        for name, count in counter.most_common(20):
            print(f"- {name}: {count}")

    print_counter("Probe Counts", probes)
    print_counter("Event Counts", events)
    if any(name != "<missing>" for name in levels):
        print_counter("Level Counts", levels)

    for field in args.field:
        counter = collections.Counter(str(nested_get(body(r), field)) for r in records)
        print_counter(f"Field Counts: {field}", counter)

    error_like = []
    for record in records:
        text = value_text(body(record)).lower()
        if any(word in text for word in ERROR_WORDS):
            error_like.append(record)

    print()
    print("## Error-Like Samples")
    if not error_like:
        print("- None detected by keyword scan.")
    for record in error_like[: args.sample]:
        payload = body(record)
        print(f"- {record.get('ts', '<no-ts>')} probe={payload.get('probe', '<missing>')} event={payload.get('event', '<missing>')} body={value_text(payload)}")

    print()
    print("## Recent Samples")
    for record in records[-args.sample :]:
        payload = body(record)
        print(f"- {record.get('ts', '<no-ts>')} probe={payload.get('probe', '<missing>')} event={payload.get('event', '<missing>')} body={value_text(payload)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

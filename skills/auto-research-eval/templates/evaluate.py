#!/usr/bin/env python3
"""Evaluation harness for autoresearch.

Runs a skill against test inputs, scores each output against binary evals,
and reports aggregate pass rates.

Usage:
    python3 evaluate.py                 # Score all test inputs, print results
    python3 evaluate.py --json          # Output as JSON (for run.sh to parse)
    python3 evaluate.py --case 01_easy  # Score a single test input
    python3 evaluate.py --baseline      # Score and save as baseline in state.json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent


# ---------------------------------------------------------------------------
# Config parsing (minimal TOML subset — no external deps)
# ---------------------------------------------------------------------------

def parse_toml(text: str) -> dict[str, Any]:
    """Parse a minimal TOML subset sufficient for config.toml."""
    config: dict[str, Any] = {}
    current: dict[str, Any] = config
    current_path: list[str] = []

    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        i += 1

        if not line or line.startswith("#"):
            continue

        # Array of tables: [[evals]]
        if line.startswith("[[") and line.endswith("]]"):
            table_path = line[2:-2].strip().split(".")
            parent = _ensure_table(config, table_path[:-1])
            key = table_path[-1]
            if key not in parent:
                parent[key] = []
            entry: dict[str, Any] = {}
            parent[key].append(entry)
            current = entry
            current_path = []
            continue

        # Table: [section]
        if line.startswith("[") and line.endswith("]"):
            table_path = line[1:-1].strip().split(".")
            current = _ensure_table(config, table_path)
            current_path = table_path
            continue

        # Key = value
        if "=" in line:
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()

            # Handle multi-line arrays
            if value.startswith("[") and "]" not in value:
                collected = [value]
                while i < len(lines):
                    cont = lines[i].strip()
                    i += 1
                    collected.append(cont)
                    if "]" in cont:
                        break
                value = " ".join(collected)

            current[key] = _parse_value(value)

    return config


def _ensure_table(config: dict, path: list[str]) -> dict:
    cursor = config
    for part in path:
        if part not in cursor:
            cursor[part] = {}
        cursor = cursor[part]
    return cursor


def _parse_value(value: str) -> Any:
    value = value.strip()
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1].replace('\\"', '"').replace("\\\\", "\\")
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1]  # Single-quoted: literal, no escapes
    if value in ("true", "false"):
        return value == "true"
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        items = []
        for item in _split_array(inner):
            items.append(_parse_value(item.strip()))
        return items
    try:
        return int(value)
    except ValueError:
        try:
            return float(value)
        except ValueError:
            return value


def _split_array(s: str) -> list[str]:
    """Split a TOML array body respecting quoted strings."""
    items = []
    current = []
    in_string = False
    escaped = False
    depth = 0
    for ch in s:
        if in_string:
            current.append(ch)
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
            current.append(ch)
        elif ch == "[":
            depth += 1
            current.append(ch)
        elif ch == "]":
            depth -= 1
            current.append(ch)
        elif ch == "," and depth == 0:
            items.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    remainder = "".join(current).strip()
    if remainder:
        items.append(remainder)
    return items


# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

def load_config() -> dict[str, Any]:
    config_path = SCRIPT_DIR / "config.toml"
    if not config_path.exists():
        print("Error: config.toml not found", file=sys.stderr)
        sys.exit(1)
    return parse_toml(config_path.read_text(encoding="utf-8"))


def get_evals(config: dict[str, Any]) -> list[dict[str, Any]]:
    return config.get("evals", [])


def get_test_inputs(case_filter: str | None = None) -> list[Path]:
    inputs_dir = SCRIPT_DIR / "test_inputs"
    if not inputs_dir.exists():
        return []
    inputs = sorted(inputs_dir.glob("*.md"))
    if case_filter:
        inputs = [p for p in inputs if case_filter in p.stem]
    return inputs


# ---------------------------------------------------------------------------
# Skill execution
# ---------------------------------------------------------------------------

def run_skill(skill_content: str, test_input: str) -> str:
    """Run the skill against a test input via claude -p."""
    prompt = f"{skill_content}\n\n---\n\n{test_input}"
    try:
        result = subprocess.run(
            ["claude", "-p", "--dangerously-skip-permissions", prompt],
            capture_output=True,
            text=True,
            timeout=300,
        )
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return "[ERROR: skill execution timed out after 300s]"
    except FileNotFoundError:
        print("Error: 'claude' CLI not found on PATH", file=sys.stderr)
        sys.exit(1)


# ---------------------------------------------------------------------------
# Scoring: code-based checks
# ---------------------------------------------------------------------------

def check_code(output: str, eval_def: dict[str, Any]) -> bool:
    """Run a code-based eval check. Returns True for Pass."""
    check_type = eval_def.get("check", "contains")
    pattern = eval_def.get("pattern", "")

    if check_type == "contains":
        if not pattern:
            print(f"Warning: eval '{eval_def.get('name')}' has empty pattern for 'contains' check", file=sys.stderr)
            return False
        return pattern in output
    elif check_type == "not_contains":
        return pattern not in output
    elif check_type == "regex":
        return bool(re.search(pattern, output, re.DOTALL))
    elif check_type == "valid_json":
        try:
            json.loads(output)
            return True
        except (json.JSONDecodeError, TypeError):
            return False
    else:
        print(f"Warning: unknown check type '{check_type}'", file=sys.stderr)
        return False


# ---------------------------------------------------------------------------
# Scoring: judge-based checks
# ---------------------------------------------------------------------------

def check_judge(output: str, eval_def: dict[str, Any]) -> bool:
    """Run a judge-based eval. Returns True for Pass."""
    judge_file = eval_def.get("judge_file", "")
    judge_path = SCRIPT_DIR / judge_file

    if not judge_path.exists():
        print(f"Warning: judge file not found: {judge_file}", file=sys.stderr)
        return False

    judge_prompt = judge_path.read_text(encoding="utf-8")
    full_prompt = (
        f"{judge_prompt}\n\n"
        f"---\n\n"
        f"## Skill Output to Evaluate\n\n"
        f"{output}"
    )

    try:
        result = subprocess.run(
            ["claude", "-p", "--dangerously-skip-permissions", full_prompt],
            capture_output=True,
            text=True,
            timeout=120,
        )
        response = result.stdout.strip()
        return _parse_judge_verdict(response)
    except subprocess.TimeoutExpired:
        print(f"Warning: judge timed out for eval '{eval_def.get('name')}'", file=sys.stderr)
        return False
    except FileNotFoundError:
        print("Error: 'claude' CLI not found on PATH", file=sys.stderr)
        sys.exit(1)


def _parse_judge_verdict(response: str) -> bool:
    """Extract Pass/Fail from judge response JSON."""
    # Try to find JSON in the response
    json_match = re.search(r'\{[^{}]*"result"\s*:\s*"[^"]*"[^{}]*\}', response)
    if json_match:
        try:
            data = json.loads(json_match.group())
            return data.get("result", "").strip().lower() == "pass"
        except json.JSONDecodeError:
            pass

    # Fallback: look for Pass/Fail keywords
    lower = response.lower()
    if '"result": "pass"' in lower or '"result":"pass"' in lower:
        return True
    if "pass" in lower and "fail" not in lower:
        return True
    return False


# ---------------------------------------------------------------------------
# Main evaluation
# ---------------------------------------------------------------------------

def evaluate(
    config: dict[str, Any],
    case_filter: str | None = None,
) -> dict[str, Any]:
    """Run all evals against all test inputs. Returns structured results."""
    target_path = SCRIPT_DIR / config.get("target", {}).get("path", "target.md")
    if not target_path.exists():
        print(f"Error: target not found: {target_path}", file=sys.stderr)
        sys.exit(1)

    skill_content = target_path.read_text(encoding="utf-8")
    evals = get_evals(config)
    test_inputs = get_test_inputs(case_filter)

    if not evals:
        print("Error: no evals defined in config.toml", file=sys.stderr)
        sys.exit(1)
    if not test_inputs:
        print("Error: no test inputs found in test_inputs/", file=sys.stderr)
        sys.exit(1)

    total_pass = 0
    total_fail = 0
    by_input: dict[str, Any] = {}
    eval_counts: dict[str, dict[str, int]] = {
        e["name"]: {"pass": 0, "total": 0} for e in evals
    }

    for input_path in test_inputs:
        input_name = input_path.name
        test_input = input_path.read_text(encoding="utf-8")

        print(f"  Running: {input_name}...", file=sys.stderr)
        output = run_skill(skill_content, test_input)

        details = []
        input_pass = 0
        input_fail = 0

        for eval_def in evals:
            eval_name = eval_def.get("name", "unnamed")
            eval_type = eval_def.get("type", "code")

            if eval_type == "code":
                passed = check_code(output, eval_def)
            elif eval_type == "judge":
                passed = check_judge(output, eval_def)
            else:
                print(f"Warning: unknown eval type '{eval_type}'", file=sys.stderr)
                passed = False

            details.append({
                "eval": eval_name,
                "result": "Pass" if passed else "Fail",
            })

            eval_counts[eval_name]["total"] += 1
            if passed:
                input_pass += 1
                eval_counts[eval_name]["pass"] += 1
                total_pass += 1
            else:
                input_fail += 1
                total_fail += 1

        by_input[input_name] = {
            "pass": input_pass,
            "fail": input_fail,
            "details": details,
        }

    total = total_pass + total_fail
    aggregate = total_pass / total if total > 0 else 0.0

    eval_breakdown = [
        {
            "name": name,
            "total_pass": counts["pass"],
            "total_runs": counts["total"],
        }
        for name, counts in eval_counts.items()
    ]

    return {
        "aggregate": round(aggregate, 4),
        "total_pass": total_pass,
        "total_fail": total_fail,
        "max_score": total,
        "by_input": by_input,
        "eval_breakdown": eval_breakdown,
    }


# ---------------------------------------------------------------------------
# State management
# ---------------------------------------------------------------------------

def load_state() -> dict[str, Any]:
    state_path = SCRIPT_DIR / "state.json"
    if state_path.exists():
        return json.loads(state_path.read_text(encoding="utf-8"))
    return {}


def save_state(state: dict[str, Any]) -> None:
    state_path = SCRIPT_DIR / "state.json"
    state_path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


def save_baseline(results: dict[str, Any]) -> None:
    """Save baseline results into state.json."""
    state = load_state()
    state["best_score"] = results["aggregate"]
    state["status"] = "baseline"
    state["eval_breakdown"] = results["eval_breakdown"]

    baseline_experiment = {
        "id": 0,
        "hypothesis": "baseline — original skill, no changes",
        "score_before": results["aggregate"],
        "score_after": results["aggregate"],
        "improved": False,
        "kept": True,
        "details_after": {
            name: {"pass": data["pass"], "fail": data["fail"]}
            for name, data in results["by_input"].items()
        },
        "timestamp": _now(),
    }

    state["experiments"] = [baseline_experiment]
    save_state(state)


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Autoresearch evaluation harness")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--case", type=str, help="Filter to a specific test input")
    parser.add_argument("--baseline", action="store_true", help="Score and save as baseline")
    args = parser.parse_args()

    config = load_config()
    results = evaluate(config, case_filter=args.case)

    if args.baseline:
        save_baseline(results)
        if not args.json:
            print(f"\nBaseline saved: {results['aggregate']:.1%} "
                  f"({results['total_pass']}/{results['max_score']})")

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        # Human-readable output
        print(f"\n{'=' * 50}")
        print(f"  Score: {results['aggregate']:.1%} "
              f"({results['total_pass']}/{results['max_score']})")
        print(f"{'=' * 50}")

        print(f"\nPer input:")
        for name, data in results["by_input"].items():
            status = "✓" if data["fail"] == 0 else "✗"
            print(f"  {status} {name}: {data['pass']} pass, {data['fail']} fail")
            for detail in data["details"]:
                icon = "✓" if detail["result"] == "Pass" else "✗"
                print(f"      {icon} {detail['eval']}: {detail['result']}")

        print(f"\nPer eval:")
        for eb in results["eval_breakdown"]:
            rate = eb["total_pass"] / eb["total_runs"] if eb["total_runs"] > 0 else 0
            print(f"  {eb['name']}: {rate:.0%} ({eb['total_pass']}/{eb['total_runs']})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

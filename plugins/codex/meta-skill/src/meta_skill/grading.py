"""Eval grading helpers."""

import json
import os
import subprocess
import sys
from pathlib import Path

from .app_server.judge import judge_output
from .errors import CliError
from .io import read_json, read_jsonl, resolve_run_dir, write_jsonl
from .manifest import case_dir, case_task_info, workbench_from_suite
from .staging import safe_case_file


def validator_command(path, output_path, expected_path, events_path):
    suffix = path.suffix.lower()
    if suffix == ".py":
        cmd = [sys.executable, str(path)]
    elif suffix == ".sh":
        cmd = ["sh", str(path)]
    elif os.access(path, os.X_OK):
        cmd = [str(path)]
    else:
        raise CliError(f"unsupported validator file: {path}", 2)
    cmd.extend(["--output", str(output_path), "--events", str(events_path), "--json"])
    if expected_path:
        cmd.extend(["--expected", str(expected_path)])
    return cmd


def grade_key(row):
    grader = row.get("grader") or {}
    return (
        row.get("trial_id"),
        row.get("metric"),
        grader.get("kind"),
        grader.get("id"),
    )


def no_validator_grade(run, result):
    return {
        "run_id": run["run_id"],
        "case_id": result["case_id"],
        "candidate": result["candidate"],
        "trial_id": result["trial_id"],
        "grader": {"kind": "none", "id": "meta-skill"},
        "metric": "grade_status",
        "score": None,
        "label": "ungraded",
        "rationale": "No validate.* file exists; use rubric.md for judge or human grading.",
        "evidence_refs": [result["output_path"]],
    }


def run_validator(validator, result, expected, root):
    proc = subprocess.run(
        validator_command(validator, result["output_path"], expected, result["event_path"]),
        capture_output=True,
        text=True,
        cwd=root,
    )
    if proc.returncode:
        return 0, 1, [], "fail", (proc.stderr or proc.stdout).strip()
    try:
        data = json.loads(proc.stdout)
        passed = int(data.get("passed", 0))
        total = int(data.get("total", 0))
        checks = data.get("checks", [])
        label = "pass" if total and passed == total else "fail"
        rationale = data.get("rationale") or f"{passed}/{total} validator checks passed"
        return passed, total, checks, label, rationale
    except Exception as exc:
        return 0, 1, [], "fail", f"validator emitted invalid JSON: {exc}"


def code_validator_grade(run, result, validator, expected, root):
    passed, total, checks, label, rationale = run_validator(validator, result, expected, root)
    return {
        "run_id": run["run_id"],
        "case_id": result["case_id"],
        "candidate": result["candidate"],
        "trial_id": result["trial_id"],
        "grader": {"kind": "code", "id": validator.name},
        "metric": "validator",
        "score": passed / total if total else None,
        "label": label,
        "rationale": rationale,
        "checks": checks,
        "evidence_refs": [result["output_path"], result["event_path"]],
    }


def rubric_grade(run_dir, run, result, root, rubric_path, model=None):
    suite = Path(run["suite"]).resolve()
    workbench = workbench_from_suite(suite)
    case = next((row for row in read_json(suite).get("cases", []) if row.get("id") == result["case_id"]), None)
    task_path = safe_case_file(root, case_task_info(case or {})["path"], "task")
    output_text = Path(result["output_path"]).read_text() if Path(result["output_path"]).exists() else ""
    event_path = run_dir / "events" / f"{result['trial_id']}.judge.jsonl"
    detail = judge_output(
        rubric=rubric_path.read_text(),
        task_text=task_path.read_text() if task_path.exists() else "",
        output_text=output_text,
        cwd=workbench.parent,
        event_path=event_path,
        model=model,
    )
    return {
        "run_id": run["run_id"],
        "case_id": result["case_id"],
        "candidate": result["candidate"],
        "trial_id": result["trial_id"],
        "grader": {"kind": "model", "id": "rubric"},
        "metric": "rubric",
        "score": detail["score"],
        "label": detail["label"],
        "rationale": detail["rationale"],
        "checks": detail["checks"],
        "evidence_refs": [result["output_path"], str(rubric_path), str(event_path)],
        "detail": detail,
    }


def grade_run(raw_run):
    run_dir = resolve_run_dir(raw_run)
    run = read_json(run_dir / "run.json")
    suite = Path(run["suite"]).resolve()
    workbench = workbench_from_suite(suite)
    rows = []
    for result in read_jsonl(run_dir / "results.jsonl"):
        root = case_dir(workbench, result["case_id"])
        validators = sorted(root.glob("validate.*"))
        expected = next(iter(sorted(root.glob("expected.*"))), None)
        rubric = root / "rubric.md"
        if rubric.exists():
            rows.append(rubric_grade(run_dir, run, result, root, rubric))
        if not validators and not rubric.exists():
            rows.append(no_validator_grade(run, result))
            continue
        rows.extend(code_validator_grade(run, result, validator, expected, root) for validator in validators)
    grades_path = run_dir / "grades.jsonl"
    new_keys = {grade_key(row) for row in rows}
    preserved = [row for row in read_jsonl(grades_path) if grade_key(row) not in new_keys]
    write_jsonl(grades_path, [*preserved, *rows])
    return {"ok": True, "run_id": run["run_id"], "grades": len(rows), "grades_path": str(grades_path)}

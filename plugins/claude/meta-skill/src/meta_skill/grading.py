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


def ungraded_grade(run, result, rationale=None):
    return {
        "run_id": run["run_id"],
        "case_id": result["case_id"],
        "candidate": result["candidate"],
        "trial_id": result["trial_id"],
        "grader": {"kind": "none", "id": "meta-skill"},
        "metric": "grade_status",
        "score": None,
        "label": "ungraded",
        "rationale": rationale or "No validate.* file exists; use rubric.md for judge or human grading.",
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


def code_validator_grade(run, result, validator, expected, root, grader=None):
    grader = grader or {}
    passed, total, checks, label, rationale = run_validator(validator, result, expected, root)
    return {
        "run_id": run["run_id"],
        "case_id": result["case_id"],
        "candidate": result["candidate"],
        "trial_id": result["trial_id"],
        "grader": {"kind": "code", "id": grader.get("id") or validator.name},
        "metric": grader.get("metric") or "validator",
        "score": passed / total if total else None,
        "label": label,
        "rationale": rationale,
        "checks": checks,
        "gate": bool(grader.get("gate") or grader.get("required")),
        "evidence_refs": [result["output_path"], result["event_path"]],
    }


def read_if_exists(path, limit=20000):
    if path and Path(path).exists():
        return Path(path).read_text()[:limit]
    return None


def generated_expectation_rubric(expectations):
    return (
        "Grade the solver output against the listed expectations. "
        "Each expectation should pass only when specific evidence shows genuine task completion. "
        "Treat unverifiable expectations as unknown or needs_human_review."
    )


def rubric_grade(run_dir, run, result, root, rubric_path=None, model=None, grader=None, expectations=None, expected=None, case=None):
    grader = grader or {}
    expectations = expectations or []
    suite = Path(run["suite"]).resolve()
    workbench = workbench_from_suite(suite)
    task_path = safe_case_file(root, case_task_info(case or {})["path"], "task")
    output_text = Path(result["output_path"]).read_text() if Path(result["output_path"]).exists() else ""
    event_path = run_dir / "events" / f"{result['trial_id']}.judge.jsonl"
    events_text = read_if_exists(result.get("event_path"), limit=12000)
    rubric = rubric_path.read_text() if rubric_path and rubric_path.exists() else generated_expectation_rubric(expectations)
    detail = judge_output(
        rubric=rubric,
        task_text=task_path.read_text() if task_path.exists() else "",
        output_text=output_text,
        expectations=expectations,
        expected_text=read_if_exists(expected),
        events_text=events_text,
        cwd=workbench.parent,
        event_path=event_path,
        model=model,
    )
    return {
        "run_id": run["run_id"],
        "case_id": result["case_id"],
        "candidate": result["candidate"],
        "trial_id": result["trial_id"],
        "grader": {"kind": "model", "id": grader.get("id") or ("rubric" if rubric_path else "expectations")},
        "metric": grader.get("metric") or ("rubric" if rubric_path else "expectations"),
        "score": detail["score"],
        "label": detail["label"],
        "rationale": detail["rationale"],
        "checks": detail["checks"],
        "gate": bool(grader.get("gate") or grader.get("required")),
        "eval_feedback": detail.get("eval_feedback", []),
        "evidence_refs": [item for item in [result["output_path"], str(rubric_path) if rubric_path else None, str(event_path)] if item],
        "detail": detail,
    }


def normalize_graders(case, root):
    explicit = case.get("graders") or []
    graders = []
    if explicit:
        for index, grader in enumerate(explicit, 1):
            if not isinstance(grader, dict):
                raise CliError(f"grader entry must be an object for case {case.get('id')}", 2)
            kind = grader.get("kind")
            if kind not in {"code", "model", "human"}:
                raise CliError(f"unsupported grader kind for case {case.get('id')}: {kind}", 2)
            item = dict(grader)
            item["id"] = item.get("id") or f"{kind}-{index}"
            graders.append(item)
        return graders

    rubric = root / "rubric.md"
    if rubric.exists():
        graders.append({"kind": "model", "id": "rubric", "metric": "rubric", "path": "rubric.md"})
    elif case.get("expectations"):
        graders.append({"kind": "model", "id": "expectations", "metric": "expectations"})
    for validator in sorted(root.glob("validate.*")):
        graders.append({"kind": "code", "id": validator.name, "metric": "validator", "path": validator.name})
    return graders


def grader_path(root, grader, label):
    raw = grader.get("path")
    if not raw:
        return None
    path = safe_case_file(root, raw, label)
    if not path.exists():
        raise CliError(f"{label} missing: {path}", 2)
    return path


def grade_run(raw_run):
    run_dir = resolve_run_dir(raw_run)
    run = read_json(run_dir / "run.json")
    suite = Path(run["suite"]).resolve()
    workbench = workbench_from_suite(suite)
    manifest = read_json(suite)
    cases_by_id = {case.get("id"): case for case in manifest.get("cases", [])}
    rows = []
    for result in read_jsonl(run_dir / "results.jsonl"):
        root = case_dir(workbench, result["case_id"])
        case = cases_by_id.get(result["case_id"], {})
        graders = normalize_graders(case, root)
        expected = next(iter(sorted(root.glob("expected.*"))), None)
        runnable = False
        for grader in graders:
            if grader.get("kind") == "code":
                validator = grader_path(root, grader, "validator")
                if validator is None:
                    raise CliError(f"code grader {grader.get('id')} missing path for case {case.get('id')}", 2)
                rows.append(code_validator_grade(run, result, validator, expected, root, grader))
                runnable = True
            elif grader.get("kind") == "model":
                rubric_path = grader_path(root, grader, "rubric") if grader.get("path") else (root / "rubric.md" if (root / "rubric.md").exists() else None)
                rows.append(
                    rubric_grade(
                        run_dir,
                        run,
                        result,
                        root,
                        rubric_path,
                        grader=grader,
                        expectations=case.get("expectations") or [],
                        expected=expected,
                        case=case,
                    )
                )
                runnable = True
            elif grader.get("kind") == "human":
                continue
        if not runnable:
            rows.append(ungraded_grade(run, result, "No runnable code or model grader exists; add rubric.md, validate.*, or a human grade row."))
    grades_path = run_dir / "grades.jsonl"
    new_keys = {grade_key(row) for row in rows}
    preserved = [row for row in read_jsonl(grades_path) if grade_key(row) not in new_keys]
    write_jsonl(grades_path, [*preserved, *rows])
    return {"ok": True, "run_id": run["run_id"], "grades": len(rows), "grades_path": str(grades_path)}

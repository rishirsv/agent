"""Read-only run listing and report rendering.

`eval list` and `eval report` render existing run files; they never mutate the
workbench. Output is deterministic: stable ordering, no generated timestamps,
and evidence paths relative to the run directory.
"""

from pathlib import Path

from .errors import CliError
from .io import read_json, read_jsonl, resolve_run_dir
from .manifest import suite_path, workbench_from_suite

CANDIDATE_FIELDS = (
    "candidate",
    "display",
    "source_kind",
    "source_ref",
    "base_commit",
    "head_commit",
    "dirty",
    "payload_digest",
)


def list_runs(raw_suite):
    runs_root = workbench_from_suite(suite_path(raw_suite)) / "runs"
    rows = []
    run_dirs = sorted(path for path in runs_root.iterdir() if (path / "run.json").exists()) if runs_root.is_dir() else []
    for run_dir in run_dirs:
        try:
            run = read_json(run_dir / "run.json")
        except CliError as exc:
            rows.append({"run_id": run_dir.name, "error": exc.message})
            continue
        result_status = {row.get("trial_id"): row.get("status", "unknown") for row in read_jsonl(run_dir / "results.jsonl")}
        trial_status = {}
        for trial in run.get("trials", []):
            status = result_status.get(trial.get("trial_id"), "no_result")
            trial_status[status] = trial_status.get(status, 0) + 1
        rows.append(
            {
                "run_id": run.get("run_id") or run_dir.name,
                "created_at": run.get("created_at"),
                "runner": run.get("runner"),
                "trials": len(run.get("trials", [])),
                "trial_status": trial_status,
                "grades": len(read_jsonl(run_dir / "grades.jsonl")),
                "candidates": [row.get("candidate") for row in run.get("candidates", [])],
            }
        )
    return {"ok": True, "runs_dir": str(runs_root), "runs": rows}


def trial_sort_key(trial):
    return (
        trial.get("case_id") or "",
        trial.get("candidate") or "",
        trial.get("repetition") or 0,
        trial.get("trial_id") or "",
    )


def grade_sort_key(row):
    grader = row.get("grader") or {}
    return (row.get("metric") or "", grader.get("kind") or "", grader.get("id") or "")


def grade_summary(row):
    return {
        "metric": row.get("metric"),
        "grader": row.get("grader"),
        "score": row.get("score"),
        "label": row.get("label"),
        "rationale": row.get("rationale"),
    }


def evidence_pointer(run_dir, raw):
    """Run-relative path when the evidence file exists, else None."""
    if not raw:
        return None
    path = Path(raw).expanduser()
    if not path.is_absolute():
        path = run_dir / path
    if not path.exists():
        return None
    try:
        return path.resolve().relative_to(run_dir).as_posix()
    except ValueError:
        return str(path)


def build_trial(run_dir, planned, result, grades):
    merged = {**planned, **{key: value for key, value in (result or {}).items() if value is not None}}
    trial_id = merged.get("trial_id")
    model_rows = [row for row in grades if (row.get("grader") or {}).get("kind") == "model"]
    validators = [row for row in grades if (row.get("grader") or {}).get("kind") == "code"]
    human_rows = [row for row in grades if (row.get("grader") or {}).get("kind") == "human"]
    behavioral_rows = [*model_rows, *validators, *human_rows]
    gate_failures = [
        row
        for row in behavioral_rows
        if row.get("gate") is True and row.get("label") not in {"pass"}
    ]
    has_gate = any(row.get("gate") is True for row in behavioral_rows)
    uncertain = any(row.get("label") in {"unknown", "needs_human_review"} for row in behavioral_rows)
    return {
        "trial_id": trial_id,
        "case_id": merged.get("case_id"),
        "candidate": merged.get("candidate"),
        "repetition": merged.get("repetition"),
        "runner_status": (result or {}).get("status") or "no_result",
        "error": (result or {}).get("error"),
        "usage": (result or {}).get("usage"),
        "rubric": {"score": model_rows[0].get("score"), "label": model_rows[0].get("label")} if model_rows else None,
        "model_grades": [grade_summary(row) for row in model_rows],
        "validators": {
            "passed": sum(1 for row in validators if row.get("label") == "pass"),
            "total": len(validators),
        }
        if validators
        else None,
        "human_grades": [grade_summary(row) for row in human_rows],
        "grade_labels": [row.get("label") for row in behavioral_rows],
        "graded": bool(behavioral_rows),
        "invalid_grader_json": any("emitted invalid JSON" in (row.get("rationale") or "") for row in grades),
        "has_gate": has_gate,
        "gate_failed": bool(gate_failures),
        "failed_gates": [
            {
                "metric": row.get("metric"),
                "grader": row.get("grader"),
                "label": row.get("label"),
                "rationale": row.get("rationale"),
            }
            for row in gate_failures
        ],
        "needs_human_review": uncertain,
        "paths": {
            "final": evidence_pointer(run_dir, merged.get("final_path")),
            "events": evidence_pointer(run_dir, merged.get("event_path")),
            "judge_events": evidence_pointer(run_dir, run_dir / "events" / f"{trial_id}.judge.jsonl"),
            "evidence": evidence_pointer(run_dir, merged.get("evidence_path") or run_dir / "evidence" / f"{trial_id}.json"),
        },
    }


def trial_attention(trial):
    items = []
    trial_id = trial["trial_id"]
    if trial["runner_status"] == "no_result":
        items.append({"kind": "missing_result", "trial_id": trial_id, "detail": "planned trial has no row in results.jsonl"})
    elif trial["runner_status"] != "passed":
        items.append({"kind": "failed_trial", "trial_id": trial_id, "detail": trial.get("error") or trial["runner_status"]})
    if not trial["graded"]:
        items.append({"kind": "ungraded_trial", "trial_id": trial_id, "detail": "no model, code, or human grade recorded"})
    if trial["invalid_grader_json"]:
        items.append({"kind": "invalid_grader_json", "trial_id": trial_id, "detail": "a grader emitted invalid JSON; see grades.jsonl rationale"})
    if trial["gate_failed"]:
        items.append({"kind": "gate_failed", "trial_id": trial_id, "detail": "one or more required grader gates failed"})
    if trial["needs_human_review"]:
        items.append({"kind": "needs_human_review", "trial_id": trial_id, "detail": "a grader returned unknown or needs_human_review"})
    if trial["runner_status"] != "no_result" and not trial.get("usage"):
        items.append({"kind": "missing_usage", "trial_id": trial_id, "detail": "no token usage recorded for this trial"})
    return items


def trial_behavior_state(trial):
    if trial["runner_status"] == "no_result" or trial["invalid_grader_json"] or trial["needs_human_review"] or not trial["graded"]:
        return "unknown"
    if trial["runner_status"] != "passed" or trial["gate_failed"]:
        return "fail"
    labels = trial.get("grade_labels") or []
    if any(label in {None, "partial", "unknown", "needs_human_review", "ungraded"} for label in labels):
        return "unknown"
    if any(label != "pass" for label in labels):
        return "fail"
    return "pass"


def aggregate_case_candidate_state(trials):
    states = [trial_behavior_state(trial) for trial in trials]
    if not states or "unknown" in states or ("pass" in states and "fail" in states):
        return "unknown"
    return states[0]


def build_impact(candidates, trials):
    baseline_ids = {row.get("candidate") for row in candidates if row.get("source_kind") == "none"}
    payload_ids = [row.get("candidate") for row in candidates if row.get("source_kind") != "none"]
    if not baseline_ids or not payload_ids:
        return []
    baseline_id = sorted(baseline_ids)[0]
    by_case_candidate = {}
    for trial in trials:
        by_case_candidate.setdefault((trial["case_id"], trial["candidate"]), []).append(trial)
    rows = []
    for case_id in sorted({trial["case_id"] for trial in trials}):
        baseline_state = aggregate_case_candidate_state(by_case_candidate.get((case_id, baseline_id), []))
        for candidate_id in sorted(payload_ids):
            candidate_state = aggregate_case_candidate_state(by_case_candidate.get((case_id, candidate_id), []))
            if baseline_state == "unknown" or candidate_state == "unknown":
                impact = "needs_human_review"
            elif baseline_state == "fail" and candidate_state == "pass":
                impact = "candidate_improves"
            elif baseline_state == "pass" and candidate_state == "fail":
                impact = "candidate_regresses"
            elif baseline_state == "fail" and candidate_state == "fail":
                impact = "both_fail"
            else:
                impact = "baseline_already_succeeds"
            rows.append(
                {
                    "case_id": case_id,
                    "baseline": baseline_id,
                    "candidate": candidate_id,
                    "baseline_state": baseline_state,
                    "candidate_state": candidate_state,
                    "impact": impact,
                }
            )
    return rows


def build_report(raw_run):
    run_dir = resolve_run_dir(raw_run)
    run = read_json(run_dir / "run.json")
    results = {row.get("trial_id"): row for row in read_jsonl(run_dir / "results.jsonl")}
    grades = {}
    for row in read_jsonl(run_dir / "grades.jsonl"):
        grades.setdefault(row.get("trial_id"), []).append(row)
    planned = list(run.get("trials", []))
    planned_ids = {trial.get("trial_id") for trial in planned}
    planned.extend(row for trial_id, row in sorted(results.items()) if trial_id not in planned_ids)
    trials = [
        build_trial(run_dir, trial, results.get(trial.get("trial_id")), sorted(grades.get(trial.get("trial_id"), []), key=grade_sort_key))
        for trial in sorted(planned, key=trial_sort_key)
    ]
    totals = {
        "trials": len(trials),
        "passed": sum(1 for trial in trials if trial["runner_status"] == "passed"),
        "failed": sum(1 for trial in trials if trial["runner_status"] not in {"passed", "no_result"}),
        "no_result": sum(1 for trial in trials if trial["runner_status"] == "no_result"),
        "graded": sum(1 for trial in trials if trial["graded"]),
        "ungraded": sum(1 for trial in trials if not trial["graded"]),
        "gate_failed": sum(1 for trial in trials if trial["gate_failed"]),
    }
    candidates = sorted(
        ({key: row.get(key) for key in CANDIDATE_FIELDS} for row in run.get("candidates", [])),
        key=lambda row: row.get("candidate") or "",
    )
    return {
        "ok": True,
        "run_id": run.get("run_id") or run_dir.name,
        "run_dir": str(run_dir),
        "suite": run.get("suite"),
        "runner": run.get("runner"),
        "created_at": run.get("created_at"),
        "candidates": candidates,
        "totals": totals,
        "trials": trials,
        "impact": build_impact(candidates, trials),
        "needs_attention": [item for trial in trials for item in trial_attention(trial)],
    }


def md_cell(value, limit=96):
    text = " ".join(str(value if value is not None else "-").split()).replace("|", "\\|") or "-"
    return text if len(text) <= limit else text[: limit - 3] + "..."


def md_table(headers, rows):
    lines = ["| " + " | ".join(headers) + " |", "|" + "|".join(" --- " for _ in headers) + "|"]
    lines.extend("| " + " | ".join(row) + " |" for row in rows)
    return lines


def usage_cell(usage):
    if not usage:
        return "unavailable"
    parts = [f"{usage[key]} {label}" for key, label in (("input_tokens", "in"), ("output_tokens", "out")) if usage.get(key) is not None]
    return md_cell(" / ".join(parts)) if parts else "recorded"


def grades_cell(grades):
    if not grades:
        return "-"
    parts = []
    for grade in grades:
        label = grade.get("label") or "-"
        score = grade.get("score")
        metric = grade.get("metric") or ((grade.get("grader") or {}).get("id")) or "grade"
        value = label if score is None else f"{score} {label}".strip()
        parts.append(f"{metric}: {value}")
    return md_cell("; ".join(parts))


def render_markdown(report):
    trials = report["trials"]
    totals = report["totals"]
    lines = [
        f"# Eval Report: {report['run_id']}",
        "",
        f"- Suite: `{report['suite'] or 'unknown'}`",
        f"- Runner: `{report['runner'] or 'unknown'}`",
        f"- Created: {report['created_at'] or 'unknown'}",
        f"- Run dir: `{report['run_dir']}`",
        "",
        "Evidence paths are relative to the run directory; `-` marks a missing file.",
        "",
        "## Candidates",
        "",
    ]
    lines += md_table(
        ["Candidate", "Source", "Head commit", "Dirty", "Payload digest"],
        [
            [
                md_cell(row.get("candidate")),
                md_cell(f"{row.get('source_kind') or '-'}:{row.get('source_ref') or '-'}"),
                md_cell((row.get("head_commit") or "")[:12] or None),
                "-" if row.get("dirty") is None else ("yes" if row.get("dirty") else "no"),
                md_cell((row.get("payload_digest") or "")[:12] or None),
            ]
            for row in report["candidates"]
        ],
    )
    lines += [
        "",
        "## Runner Completion",
        "",
        "Runner completion records whether each trial process finished. It says nothing about answer quality.",
        "",
        f"- Passed: {totals['passed']}/{totals['trials']}",
        f"- Failed: {totals['failed']}/{totals['trials']}",
        f"- No result: {totals['no_result']}/{totals['trials']}",
        "",
    ]
    lines += md_table(
        ["Case", "Candidate", "Rep", "Status", "Error"],
        [
            [md_cell(t["case_id"]), md_cell(t["candidate"]), md_cell(t["repetition"]), md_cell(t["runner_status"]), md_cell(t["error"])]
            for t in trials
        ],
    )
    lines += [
        "",
        "## Behavioral Grades",
        "",
        "Behavioral grades judge output quality. A trial can complete and still produce a bad answer.",
        "",
        f"- Graded: {totals['graded']}/{totals['trials']}",
        f"- Ungraded: {totals['ungraded']}/{totals['trials']}",
        "",
    ]
    lines += md_table(
        ["Case", "Candidate", "Rep", "Model grades", "Validators", "Human grades", "Gate", "Graded", "Tokens"],
        [
            [
                md_cell(t["case_id"]),
                md_cell(t["candidate"]),
                md_cell(t["repetition"]),
                grades_cell(t["model_grades"]),
                f"{t['validators']['passed']}/{t['validators']['total']} pass" if t["validators"] else "-",
                grades_cell(t["human_grades"]),
                "failed" if t["gate_failed"] else ("pass" if t["has_gate"] else "-"),
                "yes" if t["graded"] else "ungraded",
                usage_cell(t["usage"]),
            ]
            for t in trials
        ],
    )
    if report["impact"]:
        lines += ["", "## Impact", ""]
        lines += md_table(
            ["Case", "Baseline", "Candidate", "Baseline state", "Candidate state", "Impact"],
            [
                [
                    md_cell(row["case_id"]),
                    md_cell(row["baseline"]),
                    md_cell(row["candidate"]),
                    md_cell(row["baseline_state"]),
                    md_cell(row["candidate_state"]),
                    md_cell(row["impact"]),
                ]
                for row in report["impact"]
            ],
        )
    lines += ["", "## Evidence", ""]
    lines += md_table(
        ["Trial", "Final output", "Events", "Judge events", "Thread evidence"],
        [
            [
                md_cell(t["trial_id"]),
                md_cell(t["paths"]["final"]),
                md_cell(t["paths"]["events"]),
                md_cell(t["paths"]["judge_events"]),
                md_cell(t["paths"]["evidence"]),
            ]
            for t in trials
        ],
    )
    lines += ["", "## Needs Attention", ""]
    if report["needs_attention"]:
        lines += [f"- `{item['trial_id']}` {item['kind']}: {md_cell(item['detail'])}" for item in report["needs_attention"]]
    else:
        lines.append("Nothing needs attention.")
    return "\n".join(lines) + "\n"

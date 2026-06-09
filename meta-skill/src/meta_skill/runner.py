"""Sequential eval planning, execution, and progress snapshots."""

import time
from datetime import datetime, timezone
from pathlib import Path

from .app_server.policy import APP_SERVER_APPROVAL_POLICY, APP_SERVER_SANDBOX
from .app_server.trial import app_server_run
from .artifacts import candidate_source, thread_evidence, trial_record
from .candidates import resolve_candidate
from .errors import CliError
from .exec_fallback import exec_run
from .ids import run_id, utc_now
from .io import append_jsonl, read_json, read_jsonl, resolve_run_dir, write_json
from .manifest import (
    case_dir,
    case_task_info,
    load_manifest,
    project_from_suite,
    select_candidates,
    select_cases,
    suite_path,
    trial_prompt,
    workbench_from_suite,
)
from .staging import safe_case_file, stage_solver_workspace


PROGRESS_STATES = {
    "queued",
    "running",
    "awaiting_approval",
    "blocked",
    "timed_out",
    "interrupted",
    "failed",
    "passed",
    "graded",
    "degraded",
}


def resolve_runner(raw_runner, defaults):
    runner = raw_runner
    if runner == "auto":
        runner = defaults.get("runner") or "codex_app_server"
    if runner not in {"codex_app_server", "codex_exec"}:
        raise CliError(f"unknown runner: {runner}", 2)
    return runner


def plan_trials(cases, candidates, repetitions):
    plan = []
    for case in cases:
        reps = repetitions(case)
        for candidate in candidates:
            for index in range(1, int(reps) + 1):
                trial_id = f"{case['id']}.{candidate['candidate']}.t{index}"
                plan.append({"case": case, "candidate": candidate, "index": index, "trial_id": trial_id})
    return plan


def runner_sandbox(runner):
    return APP_SERVER_SANDBOX if runner == "codex_app_server" else "workspace-write"


def runner_approval_policy(runner):
    return APP_SERVER_APPROVAL_POLICY if runner == "codex_app_server" else None


def runner_thread_persistence(runner, detail=None):
    if runner != "codex_app_server":
        return None
    if detail and detail.get("thread_persistence"):
        return detail["thread_persistence"]
    return "persistent"


def trial_paths(row, run_dir):
    trial_id = row["trial_id"]
    return {
        "event": run_dir / "events" / f"{trial_id}.jsonl",
        "evidence": run_dir / "evidence" / f"{trial_id}.json",
        "final": run_dir / "candidates" / row["candidate"]["candidate"] / trial_id / "final.md",
    }


def load_task_texts(workbench, cases):
    task_texts = {}
    for case in cases:
        task_path = safe_case_file(case_dir(workbench, case["id"]), case_task_info(case)["path"], "task")
        if not task_path.exists():
            raise CliError(f"task.md missing; run eval materialize first: {task_path}", 2)
        task_texts[case["id"]] = task_path.read_text()
        for fixture in case.get("fixtures", []):
            fixture_path = safe_case_file(case_dir(workbench, case["id"]), fixture, "fixture")
            if not fixture_path.exists():
                raise CliError(f"fixture missing: {fixture_path}", 2)
    return task_texts


def queued_record(row, runner, workbench, run_dir):
    trial_id = row["trial_id"]
    paths = trial_paths(row, run_dir)
    return trial_record(
        trial_id=trial_id,
        case_id=row["case"]["id"],
        candidate=row["candidate"]["candidate"],
        repetition=row["index"],
        status="queued",
        runner=runner,
        cwd=str(workbench / "solver-workspaces" / run_dir.name / trial_id),
        thread_persistence=runner_thread_persistence(runner),
        sandbox=runner_sandbox(runner),
        runtime_approval_policy=runner_approval_policy(runner),
        event_path=str(paths["event"]),
        evidence_path=str(paths["evidence"]),
        final_path=str(paths["final"]),
    )


def run_trial(row, runner, workbench, run_dir, task_texts, model):
    trial_id = row["trial_id"]
    case = row["case"]
    candidate = row["candidate"]
    paths = trial_paths(row, run_dir)
    output_path = paths["final"]
    event_path = paths["event"]
    evidence_path = paths["evidence"]
    started = time.time()
    try:
        staged_candidate = stage_solver_workspace(workbench, run_dir, trial_id, case, task_texts[case["id"]], candidate)
        prompt = trial_prompt(task_texts[case["id"]])
        if runner == "codex_app_server":
            detail = app_server_run(row, prompt, staged_candidate, event_path, output_path, model)
        elif runner == "codex_exec":
            detail = exec_run(row, prompt, staged_candidate, event_path, output_path, model)
        detail["solver_workspace"] = staged_candidate["solver_workspace"]
        detail["staged_payload_digest"] = staged_candidate["staged_payload_digest"]
        status = "passed" if detail.get("status") in {"completed", "succeeded"} else "failed"
        error = None if status == "passed" else detail.get("status", "runner failed")
    except Exception as exc:
        status = "failed"
        error = str(exc)
        detail = {}
        output_path.parent.mkdir(parents=True, exist_ok=True)
        if not output_path.exists():
            output_path.write_text("")
    completed = time.time()
    final_response = output_path.read_text() if output_path.exists() else ""
    persistence = runner_thread_persistence(runner, detail)
    evidence = thread_evidence(
        trial_id=trial_id,
        thread_id=detail.get("thread_id"),
        turn_id=detail.get("turn_id"),
        thread_persistence=persistence,
        final_response=final_response or None,
        final_source="turn_result" if final_response else "none",
        items_count=detail.get("events", 0) or 0,
        usage=detail.get("usage"),
        status="completed" if status == "passed" else "failed",
        sdk_version=detail.get("sdk_version"),
        runtime_version=detail.get("runtime_version"),
    )
    write_json(evidence_path, evidence)
    record = trial_record(
        trial_id=trial_id,
        case_id=case["id"],
        candidate=candidate["candidate"],
        repetition=row["index"],
        status=status,
        runner=runner,
        thread_id=detail.get("thread_id"),
        turn_id=detail.get("turn_id"),
        thread_persistence=persistence,
        cwd=detail.get("solver_workspace"),
        sandbox=detail.get("sandbox") or runner_sandbox(runner),
        runtime_approval_policy=detail.get("runtime_approval_policy") or runner_approval_policy(runner),
        sdk_version=detail.get("sdk_version"),
        runtime_version=detail.get("runtime_version"),
        event_path=str(event_path),
        evidence_path=str(evidence_path),
        final_path=str(output_path),
        usage=detail.get("usage"),
        started_at=datetime.fromtimestamp(started, timezone.utc).isoformat(),
        completed_at=datetime.fromtimestamp(completed, timezone.utc).isoformat(),
        error=error,
    )
    result = {
        "run_id": run_dir.name,
        **record,
        "trial_index": row["index"],
        "duration_ms": int((completed - started) * 1000),
        "output_path": str(output_path),
        "event_path": str(event_path),
        "evidence_path": str(evidence_path),
        "detail": detail,
    }
    return result


def run_eval(args):
    suite = suite_path(args.suite)
    manifest = load_manifest(suite)
    workbench = workbench_from_suite(suite)
    project = project_from_suite(suite)
    cases = select_cases(manifest, args.split)
    if not cases:
        raise CliError("no cases selected", 2)
    candidates = select_candidates(manifest, args.candidates)
    defaults = manifest.get("defaults") or {}
    runner = resolve_runner(args.runner, defaults)
    task_texts = load_task_texts(workbench, cases)
    rid = run_id()
    run_dir = workbench / "runs" / rid
    run_dir.mkdir(parents=True, exist_ok=False)
    candidate_infos = [resolve_candidate(project, workbench, rid, manifest, candidate) for candidate in candidates]
    plan = plan_trials(cases, candidate_infos, lambda case: args.repetitions or case.get("repetitions") or defaults.get("repetitions") or 1)
    write_json(
        run_dir / "run.json",
        {
            "run_id": rid,
            "suite": str(suite),
            "project": str(project),
            "runner": runner,
            "created_at": utc_now(),
            "candidates": [candidate_source(candidate) for candidate in candidate_infos],
            "trials": [queued_record(row, runner, workbench, run_dir) for row in plan],
        },
    )
    for row in plan:
        append_jsonl(run_dir / "progress.jsonl", {"time": utc_now(), "trial_id": row["trial_id"], "status": "queued"})
    for row in plan:
        append_jsonl(run_dir / "progress.jsonl", {"time": utc_now(), "trial_id": row["trial_id"], "status": "running"})
        result = run_trial(row, runner, workbench, run_dir, task_texts, args.model)
        append_jsonl(run_dir / "results.jsonl", result)
        append_jsonl(run_dir / "progress.jsonl", {"time": utc_now(), "trial_id": row["trial_id"], "status": result["status"]})
    results = read_jsonl(run_dir / "results.jsonl")
    failures = [row for row in results if row.get("status") != "passed"]
    return {
        "ok": not failures,
        "run_id": rid,
        "run_dir": str(run_dir),
        "runner": runner,
        "trials": len(plan),
        "passed": len(results) - len(failures),
        "failed": len(failures),
    }


def progress_snapshot(raw_run):
    run_dir = resolve_run_dir(raw_run)
    run = read_json(run_dir / "run.json")
    progress = read_jsonl(run_dir / "progress.jsonl")
    results = read_jsonl(run_dir / "results.jsonl")
    grades = read_jsonl(run_dir / "grades.jsonl")
    latest = {}
    for row in progress:
        trial_id = row.get("trial_id")
        if trial_id:
            latest[trial_id] = row.get("status", "unknown")
    counts = {}
    for status in latest.values():
        counts[status] = counts.get(status, 0) + 1
    return {
        "ok": True,
        "run_id": run.get("run_id"),
        "run_dir": str(run_dir),
        "progress": counts,
        "results": len(results),
        "grades": len(grades),
        "trials": len(run.get("trials", [])),
    }


def terminal_count(snapshot):
    progress = snapshot["progress"]
    return progress.get("passed", 0) + progress.get("failed", 0) + progress.get("degraded", 0)

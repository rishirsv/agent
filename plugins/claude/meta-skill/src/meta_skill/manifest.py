"""Eval suite manifest loading and selection helpers."""

from pathlib import Path

from .errors import CliError
from .ids import require_id
from .io import read_json


DEFAULT_EVALS = {
    "schema_version": 1,
    "target": {"type": "skill", "ref": "SKILL.md"},
    "defaults": {
        "runner": "codex_app_server",
        "repetitions": 1,
    },
    "candidates": [
        {
            "candidate": "current",
            "display": "Current",
            "source": {"kind": "current_worktree", "ref": "."},
        }
    ],
    "cases": [],
}

SOURCE_KINDS = {"branch", "current_worktree", "git_ref", "none"}


def suite_path(raw):
    path = Path(raw or ".meta-skill/evals.json").expanduser()
    if path.is_dir():
        path = path / ".meta-skill" / "evals.json"
    return path.resolve()


def workbench_from_suite(path):
    return path.parent


def project_from_suite(path):
    if path.parent.name == ".meta-skill":
        return path.parent.parent
    return path.parent


def case_dir(workbench, case_id):
    return workbench / "cases" / require_id("case id", case_id)


def load_manifest(path):
    data = read_json(path)
    if not isinstance(data, dict):
        raise CliError("eval suite must be a JSON object", 2)
    if data.get("schema_version") != 1:
        raise CliError("only evals.json schema_version 1 is supported", 2)
    if not isinstance(data.get("cases", []), list):
        raise CliError("evals.json cases must be a list", 2)
    if not isinstance(data.get("candidates", []), list) or not data.get("candidates"):
        raise CliError("evals.json candidates must be a non-empty list", 2)
    seen_case_ids = set()
    for case in data.get("cases", []):
        if not isinstance(case, dict):
            raise CliError("evals.json cases must be objects", 2)
        case_id = require_id("case id", case.get("id"))
        if case_id in seen_case_ids:
            raise CliError(f"duplicate case id: {case_id}", 2)
        seen_case_ids.add(case_id)
        if "expectations" in case:
            expectations = case.get("expectations")
            if not isinstance(expectations, list) or not all(isinstance(item, str) and item.strip() for item in expectations):
                raise CliError(f"case {case_id} expectations must be non-empty strings", 2)
        graders = case.get("graders", [])
        if not isinstance(graders, list):
            raise CliError(f"case {case_id} graders must be a list", 2)
        for grader in graders:
            if not isinstance(grader, dict):
                raise CliError(f"case {case_id} graders must be objects", 2)
            if grader.get("kind") not in {"code", "model", "human"}:
                raise CliError(f"case {case_id} grader kind must be code, model, or human", 2)
    seen_candidate_ids = set()
    for candidate in data.get("candidates", []):
        if not isinstance(candidate, dict):
            raise CliError("evals.json candidates must be objects", 2)
        candidate_id = require_id("candidate", candidate.get("candidate"))
        if candidate_id in seen_candidate_ids:
            raise CliError(f"duplicate candidate: {candidate_id}", 2)
        seen_candidate_ids.add(candidate_id)
        source = candidate.get("source") or {}
        kind = source.get("kind", "current_worktree")
        ref = source.get("ref")
        if kind not in SOURCE_KINDS:
            raise CliError(f"candidate {candidate_id} source.kind must be one of branch, current_worktree, git_ref, or none", 2)
        if kind == "none" and ref:
            raise CliError(f"candidate {candidate_id} source.kind none must not set ref", 2)
        if kind == "current_worktree" and ref not in (None, "."):
            raise CliError(f"candidate {candidate_id} source.kind current_worktree must not set a git ref", 2)
        if kind in {"branch", "git_ref"} and not ref:
            raise CliError(f"candidate {candidate_id} source.kind {kind} must set ref", 2)
        if kind in {"branch", "git_ref"} and ref == ".":
            raise CliError(f"candidate {candidate_id} source.kind {kind} must use a git ref, not .", 2)
    return data


def case_task_info(case):
    task = case.get("task") or {}
    if isinstance(task, str):
        return {"path": task, "seed": ""}
    return {"path": task.get("path") or "task.md", "seed": task.get("seed") or ""}


def select_cases(manifest, split):
    cases = manifest.get("cases", [])
    if split:
        cases = [case for case in cases if case.get("split") == split]
    return cases


def select_candidates(manifest, raw):
    candidates = manifest.get("candidates", [])
    if raw:
        wanted = {item.strip() for item in raw.split(",") if item.strip()}
        candidates = [candidate for candidate in candidates if candidate.get("candidate") in wanted]
    if not candidates:
        raise CliError("no candidates selected", 2)
    for candidate in candidates:
        if not candidate.get("candidate"):
            raise CliError("candidate missing candidate field", 2)
    return candidates


def trial_prompt(task_text):
    return task_text.strip() + "\n"

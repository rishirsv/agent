"""Solver workspace staging and hidden-boundary enforcement."""

import shutil
from pathlib import Path

from .candidates import DEFAULT_EXCLUDES, payload_digest
from .errors import CliError
from .manifest import case_dir


def safe_case_file(case_root, rel_path, label):
    rel = Path(rel_path)
    if rel.is_absolute() or ".." in rel.parts:
        raise CliError(f"{label} path must stay inside the case folder: {rel_path}", 2)
    path = case_root / rel
    if path.exists() and path.resolve().is_relative_to(case_root.resolve()) is False:
        raise CliError(f"{label} path must stay inside the case folder: {rel_path}", 2)
    return path


def copy_payload(src, dest):
    src = Path(src)
    if dest.exists():
        shutil.rmtree(dest)

    def ignore(_dir, names):
        return [name for name in names if name in DEFAULT_EXCLUDES]

    if src.is_file():
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest / src.name)
    else:
        shutil.copytree(src, dest, ignore=ignore)


def stage_solver_workspace(workbench, run_dir, trial_id, case, task_text, candidate):
    case_root = case_dir(workbench, case["id"])
    workspace = workbench / "solver-workspaces" / run_dir.name / trial_id
    if workspace.exists():
        shutil.rmtree(workspace)
    workspace.mkdir(parents=True)

    task_path = workspace / "task.md"
    task_path.write_text(task_text if task_text.endswith("\n") else task_text + "\n")

    fixtures_root = workspace / "fixtures"
    for fixture in case.get("fixtures", []):
        source = safe_case_file(case_root, fixture, "fixture")
        if not source.exists():
            raise CliError(f"fixture missing: {source}", 2)
        if source.is_symlink():
            raise CliError(f"fixture path must not be a symlink: {fixture}", 2)
        target = fixtures_root / Path(fixture)
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.is_dir():
            shutil.copytree(source, target, dirs_exist_ok=True)
        else:
            shutil.copy2(source, target)

    staged_candidate = dict(candidate)
    staged_candidate["solver_workspace"] = str(workspace)
    staged_candidate["cwd"] = str(workspace)
    if candidate.get("payload_path"):
        staged_payload = workspace / "skill"
        copy_payload(candidate["payload_path"], staged_payload)
        staged_candidate["payload_path"] = str(staged_payload)
        staged_candidate["staged_payload_digest"] = payload_digest(staged_payload)
    else:
        staged_candidate["payload_path"] = None
        staged_candidate["staged_payload_digest"] = None
    return staged_candidate

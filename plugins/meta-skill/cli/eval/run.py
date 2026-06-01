from __future__ import annotations

import argparse
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def add_run_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    parser = subparsers.add_parser("run", help="Run eval prompts.")
    parser.add_argument("review", nargs="?", help="Review root or project directory.")
    parser.add_argument("--compare", choices=["auto", "none"], help="Comparison mode.")
    parser.add_argument("--prompt", action="append", dest="prompt_ids", help="Prompt id to run. May be repeated.")
    parser.add_argument("--prompt-range", help="1-based prompt range such as 7-10.")
    parser.add_argument("--topic", action="append", dest="topics", help="Run prompts with this topic. May be repeated.")
    parser.add_argument("--label", help="Plain-language run label.")
    parser.add_argument("--audit", action="store_true", help="Audit the workspace before running.")
    parser.add_argument("--no-open", action="store_true", help="Do not open the report after running.")
    parser.add_argument("--keep-workspace", action="store_true", help="Keep staged runner workspaces for debugging.")
    parser.add_argument("--allow-absolute-paths", action="store_true", help="Allow absolute durable config paths for exploratory runs.")
    parser.add_argument("--allow-installed-skill", action="store_true", help="Allow .agents/skills paths for explicit installed-copy smoke tests.")
    parser.add_argument("--timeout-ms", type=int, help="Per-prompt Codex timeout in milliseconds.")
    parser.set_defaults(func=handle_run)


def handle_run(args: argparse.Namespace) -> int:
    import sys

    from ..core.clock import utc_now
    from ..core.output import done, open_path, stdout_is_tty
    from ..core.paths import PathResolutionError, ensure_portable_config_path, relative_path, resolve_review_location
    from ..core.schemas import append_jsonl, read_yaml, write_json, write_yaml
    from ..report import write_review_report
    from ..runner import CodexRunner
    from .audit import handle_audit
    from .init import handle_init

    try:
        location = resolve_review_location(args.review)
    except PathResolutionError as exc:
        if not str(exc).startswith("could not find review.yaml"):
            raise
        print("No review found. Creating default review and proceeding.", file=sys.stderr)
        init_args = argparse.Namespace(
            project_dir=args.review or ".",
            name=None,
            skill_root=None,
            runner="codex",
            from_skill_spec=None,
            force=False,
        )
        handle_init(init_args)
        location = resolve_review_location(args.review)

    if getattr(args, "audit", False):
        handle_audit(args)
        print("")
    review_root = location.review_root
    review_config = read_yaml(review_root / "review.yaml")
    prompts_config = read_yaml(review_root / "prompts.yaml")
    prompts = _select_prompts(prompts_config.get("prompts") or [], args)
    if not prompts:
        raise ValueError("no prompts selected; add prompts to prompts.yaml or adjust --prompt/--topic filters")
    _validate_prompt_ids(prompts)

    compare = args.compare or review_config.get("default_compare", "auto")
    if compare == "auto":
        compare = "none" if not (review_root / "baseline.yaml").exists() else "baseline"
    if compare != "none":
        raise ValueError("Phase 1 supports only --compare none or auto with no accepted baseline")

    runner_config = review_config.get("runner") or {"name": "codex"}
    runner_name = runner_config.get("name") if isinstance(runner_config, dict) else str(runner_config)
    if runner_name != "codex":
        raise ValueError(f"unsupported runner for Phase 1: {runner_name}")

    skill_root_value = review_config.get("skill_root")
    if not skill_root_value:
        raise ValueError("review.yaml must include skill_root")
    skill_root = ensure_portable_config_path(
        str(skill_root_value),
        review_root=review_root,
        project_root=location.project_root,
        allow_absolute=args.allow_absolute_paths,
        allow_installed=args.allow_installed_skill,
    )
    if not (skill_root / "SKILL.md").exists():
        raise ValueError(f"skill_root must contain SKILL.md: {skill_root}")

    run_id = _run_id()
    run_root = review_root / "runs" / run_id
    run_root.mkdir(parents=True)
    evidence_root = run_root / "evidence"
    feedback_file = evidence_root / "feedback.jsonl"
    feedback_file.parent.mkdir(parents=True, exist_ok=True)
    feedback_file.touch()

    label = args.label or _git_subject(location.project_root) or "Review run"
    runner = CodexRunner(keep_workspace=args.keep_workspace, timeout_ms=args.timeout_ms)
    codex_version = runner.version()

    run_yaml: dict[str, Any] = {
        "schema_version": 1,
        "run_id": run_id,
        "created_at": utc_now(),
        "label": label,
        "review_root": relative_path(run_root, review_root),
        "compare": compare,
        "runner": {"name": "codex", "version": codex_version, "sandbox_mode": runner.sandbox},
        "roles": {"output": {"skill": {"kind": "working_tree", "skill_root": relative_path(run_root, skill_root)}}},
        "prompt_count": len(prompts),
    }
    write_yaml(run_root / "run.yaml", run_yaml)

    results_path = run_root / "results.jsonl"
    needs_review = 0
    errored = 0
    kept_workspaces: list[str] = []

    for prompt in prompts:
        prompt_id = _prompt_id(prompt)
        role_dir = evidence_root / "generated" / "prompts" / _prompt_dir(prompt_id) / "sides" / "output"
        role_dir.mkdir(parents=True, exist_ok=True)
        _write_prompt_package(role_dir / "prompt.txt", prompt)
        result = runner.run_role(skill_root=skill_root, prompt=prompt, evidence_dir=role_dir)
        (role_dir / "trace.jsonl").write_text(result.trace_text, encoding="utf-8")
        (role_dir / "stdout.txt").write_text(result.stdout_text, encoding="utf-8")
        (role_dir / "stderr.txt").write_text(result.stderr_text, encoding="utf-8")
        (role_dir / "final.md").write_text(result.final_text, encoding="utf-8")
        write_json(role_dir / "checks.json", {"schema_version": 1, "checks": []})
        write_json(role_dir / "grades.json", {"schema_version": 1, "judges": []})
        if result.stage_path:
            kept_workspaces.append(str(result.stage_path))

        if result.status == "errored":
            errored += 1
        else:
            needs_review += 1
        row = {
            "schema_version": 1,
            "type": "prompt_result",
            "run_id": run_id,
            "prompt_id": prompt_id,
            "status": result.status,
            "roles": {
                "output": {
                    "status": result.status,
                    "checks_passed": 0,
                    "checks_failed": 0,
                    "evidence_path": relative_path(run_root, role_dir),
                    "artifacts_path": relative_path(run_root, role_dir / "artifacts"),
                }
            },
            "comparison_outcome": None,
            "missing_evidence": False,
        }
        if result.returncode is not None:
            row["returncode"] = result.returncode
        append_jsonl(results_path, row)

    summary = {
        "schema_version": 1,
        "type": "run_summary",
        "run_id": run_id,
        "prompt_count": len(prompts),
        "passed": 0,
        "failed": 0,
        "needs_review": needs_review,
        "errored": errored,
        "improvements": None,
        "regressions": None,
        "unchanged": None,
        "missing_evidence": 0,
        "compare": compare,
        "report": "report.html",
    }
    if kept_workspaces:
        summary["kept_workspaces"] = kept_workspaces
    append_jsonl(results_path, summary)
    report = write_review_report(run_root)

    should_open = not args.no_open and review_config.get("review", {}).get("html", True)
    if should_open and stdout_is_tty():
        open_path(report)
    next_step = "open the report with `meta-skill eval open`, then rerun with `meta-skill eval run --audit` when ready"
    if kept_workspaces:
        next_step += f"; kept {len(kept_workspaces)} staged workspace(s)"
    done(f"ran {len(prompts)} prompt(s) with compare none.", report=str(report), next_step=next_step)
    return 0


def _select_prompts(prompts: list[Any], args: argparse.Namespace) -> list[dict[str, Any]]:
    rows = [dict(prompt) for prompt in prompts if isinstance(prompt, dict)]
    if args.prompt_range:
        start_text, _, end_text = args.prompt_range.partition("-")
        start = int(start_text)
        end = int(end_text or start_text)
        rows = rows[start - 1 : end]
    if args.prompt_ids:
        wanted = set(args.prompt_ids)
        rows = [row for row in rows if str(row.get("id")) in wanted]
    if args.topics:
        wanted_topics = set(args.topics)
        rows = [row for row in rows if wanted_topics.intersection(set(row.get("topics") or []))]
    return rows


def _prompt_id(prompt: dict[str, Any]) -> str:
    return str(prompt.get("id") or "").strip()


def _prompt_dir(prompt_id: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in prompt_id).strip("-")
    return safe or "prompt"


def _validate_prompt_ids(prompts: list[dict[str, Any]]) -> None:
    raw_seen: set[str] = set()
    dir_seen: dict[str, str] = {}
    for index, prompt in enumerate(prompts, start=1):
        prompt_id = _prompt_id(prompt)
        if not prompt_id:
            raise ValueError(f"prompt #{index} is missing required id")
        if prompt_id in raw_seen:
            raise ValueError(f"duplicate prompt id: {prompt_id}")
        raw_seen.add(prompt_id)
        prompt_dir = _prompt_dir(prompt_id)
        if prompt_dir in dir_seen:
            raise ValueError(f"prompt ids collide after filesystem encoding: {dir_seen[prompt_dir]} and {prompt_id}")
        dir_seen[prompt_dir] = prompt_id


def _write_prompt_package(path: Path, prompt: dict[str, Any]) -> None:
    lines = [
        f"id: {prompt.get('id', '')}",
        f"type: {prompt.get('type', 'task')}",
        f"topics: {', '.join(prompt.get('topics') or [])}",
        f"expected_behavior: {prompt.get('expected_behavior', '')}",
        "",
        str(prompt.get("task", "")).strip(),
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def _run_id() -> str:
    base = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
    try:
        suffix = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True, stderr=subprocess.DEVNULL).strip()[:8]
    except (OSError, subprocess.SubprocessError):
        suffix = "local"
    return f"{base}-{suffix}-{uuid.uuid4().hex[:6]}"


def _git_subject(project_root: Path) -> str | None:
    try:
        result = subprocess.run(["git", "log", "-1", "--pretty=%s"], cwd=project_root, text=True, capture_output=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return None
    return result.stdout.strip() or None

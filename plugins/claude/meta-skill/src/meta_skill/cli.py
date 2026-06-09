#!/usr/bin/env python3
"""Meta Skill CLI.

One agent-facing command surface for skill validation, packaging, eval
materialization, App Server-backed trial runs, progress, and grading.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path

from .app_server.client import app_server_readiness
from .errors import CliError
from .grading import grade_run
from .io import emit, fail
from .packaging import package_skill
from .report import build_report, list_runs, render_markdown
from .runner import progress_snapshot, run_eval, terminal_count
from .validation import validate_report
from .workbench import init_workbench, materialize_cases


def command_doctor(args):
    checks = []
    optional_capabilities = []

    def add(name, ok, message, detail=None):
        checks.append({"name": name, "ok": bool(ok), "message": message, "detail": detail})

    def add_optional(name, ok, message, detail=None):
        optional_capabilities.append({"name": name, "ok": bool(ok), "message": message, "detail": detail})

    add(
        "python_version",
        sys.version_info >= (3, 10),
        f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
    )
    cli_path = Path(__file__).resolve()
    src_root = cli_path.parents[1]
    plugin_root = src_root.parent
    add("cli_source", cli_path.exists(), str(cli_path))
    validator_paths = [src_root / name for name in ("validate_skill.py", "lint_authoring.py")]
    add("validators_canonical", all(path.exists() for path in validator_paths), "root src validators")
    add(
        "legacy_worker_scripts_absent",
        not (plugin_root / "skills" / "skill-doctor" / "scripts").exists()
        and not (plugin_root / "skills" / "skill-writer" / "scripts").exists(),
        "worker-local script surfaces are removed",
    )
    try:
        import openai_codex

        add("openai_codex_sdk", True, getattr(openai_codex, "__version__", "unknown"))
    except Exception as exc:
        add("openai_codex_sdk", False, str(exc))
    ok_sdk, message, detail = app_server_readiness()
    add("codex_app_server_sdk", ok_sdk, message, detail)
    codex_path = shutil.which("codex")
    if codex_path:
        version = subprocess.run(["codex", "--version"], capture_output=True, text=True)
        exec_help = subprocess.run(["codex", "exec", "--help"], capture_output=True, text=True)
        add_optional(
            "codex_exec",
            version.returncode == 0 and exec_help.returncode == 0,
            codex_path,
            {"version": (version.stdout or version.stderr).strip(), "exec_help": exec_help.returncode == 0},
        )
    else:
        add_optional("codex_exec", False, "codex not on PATH")
    ok = all(item["ok"] for item in checks)
    result = {"ok": ok, "checks": checks, "optional_capabilities": optional_capabilities}
    emit(result, args.json)
    return 0 if ok else 1


def command_workbench_init(args):
    target = Path(args.target or ".").expanduser().resolve()
    emit(init_workbench(target, args.dry_run), args.json)
    return 0


def command_eval_materialize(args):
    emit(materialize_cases(args.suite, args.force), args.json)
    return 0


def command_eval_run(args):
    result = run_eval(args)
    emit(result, args.json)
    return 0 if result["ok"] else 1


def command_eval_progress(args):
    if args.watch:
        seen = None
        while True:
            snap = progress_snapshot(args.run)
            if snap != seen:
                emit(snap, args.json)
                seen = snap
            if terminal_count(snap) >= snap["trials"]:
                break
            time.sleep(2)
        return 0
    emit(progress_snapshot(args.run), args.json)
    return 0


def command_eval_grade(args):
    emit(grade_run(args.run), args.json)
    return 0


def command_eval_list(args):
    emit(list_runs(args.suite), args.json)
    return 0


def command_eval_report(args):
    report = build_report(args.run)
    markdown = render_markdown(report)
    if args.out:
        out_path = Path(args.out).expanduser()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(markdown)
        emit({"ok": True, "run_id": report["run_id"], "out": str(out_path)}, args.json)
    elif args.json:
        emit(report, True)
    else:
        print(markdown, end="")
    return 0


def command_validate(args):
    result = validate_report(args.skill_dir)
    emit(result, args.json)
    return 0 if result["ok"] else 1


def command_package(args):
    result = package_skill(args.skill_dir, args.out_dir)
    emit(result, args.json)
    return 0 if result["ok"] else 1


def build_parser():
    parser = argparse.ArgumentParser(prog="meta-skill", description="Meta Skill workbench CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    doctor = sub.add_parser("doctor", help="Check Python, validator, and App Server SDK readiness")
    doctor.add_argument("--json", action="store_true")
    doctor.set_defaults(func=command_doctor)

    workbench = sub.add_parser("workbench", help="Workbench commands")
    workbench_sub = workbench.add_subparsers(dest="workbench_command", required=True)
    init = workbench_sub.add_parser("init", help="Create .meta-skill workbench folders and evals.json")
    init.add_argument("--target", default=".")
    init.add_argument("--dry-run", action="store_true")
    init.add_argument("--json", action="store_true")
    init.set_defaults(func=command_workbench_init)

    eval_parser = sub.add_parser("eval", help="Evaluation commands")
    eval_sub = eval_parser.add_subparsers(dest="eval_command", required=True)
    materialize = eval_sub.add_parser("materialize", help="Materialize cases from evals.json")
    materialize.add_argument("--suite", default=".meta-skill/evals.json")
    materialize.add_argument("--force", action="store_true")
    materialize.add_argument("--json", action="store_true")
    materialize.set_defaults(func=command_eval_materialize)

    run = eval_sub.add_parser("run", help="Run selected eval trials")
    run.add_argument("--suite", default=".meta-skill/evals.json")
    run.add_argument("--runner", choices=["auto", "codex_app_server", "codex_exec"], default="auto")
    run.add_argument("--candidates")
    run.add_argument("--split")
    run.add_argument("--repetitions", type=int)
    run.add_argument("--model")
    run.add_argument("--json", action="store_true")
    run.set_defaults(func=command_eval_run)

    progress = eval_sub.add_parser("progress", help="Read compact run progress")
    progress.add_argument("--run", required=True)
    progress.add_argument("--watch", action="store_true")
    progress.add_argument("--json", action="store_true")
    progress.set_defaults(func=command_eval_progress)

    grade = eval_sub.add_parser("grade", help="Grade completed eval outputs")
    grade.add_argument("--run", required=True)
    grade.add_argument("--json", action="store_true")
    grade.set_defaults(func=command_eval_grade)

    list_runs_parser = eval_sub.add_parser("list", help="List eval runs in the workbench")
    list_runs_parser.add_argument("--suite", default=".meta-skill/evals.json")
    list_runs_parser.add_argument("--json", action="store_true")
    list_runs_parser.set_defaults(func=command_eval_list)

    report = eval_sub.add_parser("report", help="Render a readable report for one run")
    report.add_argument("--run", required=True)
    report.add_argument("--out", help="Write the Markdown report to this file instead of stdout")
    report.add_argument("--json", action="store_true")
    report.set_defaults(func=command_eval_report)

    validate = sub.add_parser("validate", help="Validate a skill payload")
    validate.add_argument("skill_dir")
    validate.add_argument("--json", action="store_true")
    validate.set_defaults(func=command_validate)

    package = sub.add_parser("package", help="Package a skill payload")
    package.add_argument("skill_dir")
    package.add_argument("--out-dir")
    package.add_argument("--json", action="store_true")
    package.set_defaults(func=command_package)
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except CliError as exc:
        return fail(exc.message, getattr(args, "json", False), exc.code, exc.detail)
    except KeyboardInterrupt:
        return fail("interrupted", getattr(args, "json", False), 130)


if __name__ == "__main__":
    raise SystemExit(main())

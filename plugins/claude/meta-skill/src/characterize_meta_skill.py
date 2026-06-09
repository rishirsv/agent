#!/usr/bin/env python3
"""Characterization checks for the flat Meta Skill CLI.

These tests intentionally use only the Python standard library so they can run
inside the launcher venv, a source checkout, or future package layouts.
"""
from __future__ import annotations

import importlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).resolve().parent
CLI = SRC / "meta-skill"


class CheckFailure(AssertionError):
    pass


def check(condition, message):
    if not condition:
        raise CheckFailure(message)


def run(cmd, cwd, *, input_text=None, env=None, expect=(0,)):
    merged_env = os.environ.copy()
    merged_env.setdefault("META_SKILL_SKIP_DEP_UPDATE", "1")
    merged_env.setdefault("META_SKILL_PYTHON", sys.executable)
    if env:
        merged_env.update(env)
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        input=input_text,
        capture_output=True,
        text=True,
        env=merged_env,
    )
    check(
        proc.returncode in expect,
        f"{' '.join(map(str, cmd))} exited {proc.returncode}\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}",
    )
    return proc


def run_json(cmd, cwd, *, expect=(0,), env=None):
    proc = run(cmd, cwd, expect=expect, env=env)
    try:
        data = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise CheckFailure(f"invalid JSON from {' '.join(map(str, cmd))}: {exc}\n{proc.stdout}") from exc
    return proc, data


def write_skill(path, *, name="sample-skill"):
    path.mkdir(parents=True, exist_ok=True)
    (path / "SKILL.md").write_text(
        textwrap.dedent(
            f"""\
            ---
            name: {name}
            description: Use when a compact deterministic fixture skill is needed for CLI characterization checks.
            ---

            # {name}

            Read the task, inspect any fixtures, and return a concise answer.
            """
        )
    )


def write_manifest(project, *, fixtures=None):
    fixtures = fixtures or []
    workbench = project / ".meta-skill"
    workbench.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema_version": 1,
        "target": {"type": "skill", "ref": "skill/SKILL.md"},
        "defaults": {"runner": "codex_exec", "repetitions": 1},
        "candidates": [
            {
                "candidate": "current",
                "display": "Current",
                "source": {"kind": "current_worktree", "ref": "."},
            }
        ],
        "cases": [
            {
                "id": "case-a",
                "task": {"path": "task.md", "seed": "Answer with the fixture value."},
                "fixtures": fixtures,
            }
        ],
    }
    (workbench / "evals.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return workbench / "evals.json"


def git(cmd, cwd):
    return run(["git", *cmd], cwd)


def init_git_project(project):
    git(["init", "-q"], project)
    git(["config", "user.email", "meta-skill@example.invalid"], project)
    git(["config", "user.name", "Meta Skill Characterization"], project)
    git(["add", "."], project)
    git(["commit", "-q", "-m", "initial"], project)


def import_flat_module():
    sys.path.insert(0, str(SRC))
    return importlib.import_module("meta_skill")


def test_help_surfaces(tmp):
    commands = [
        [CLI, "--help"],
        [CLI, "doctor", "--help"],
        [CLI, "workbench", "--help"],
        [CLI, "workbench", "init", "--help"],
        [CLI, "eval", "--help"],
        [CLI, "eval", "materialize", "--help"],
        [CLI, "eval", "run", "--help"],
        [CLI, "eval", "progress", "--help"],
        [CLI, "eval", "grade", "--help"],
        [CLI, "validate", "--help"],
        [CLI, "package", "--help"],
    ]
    for command in commands:
        proc = run(command, tmp)
        check("usage:" in proc.stdout, f"missing help usage for {' '.join(map(str, command))}")


def test_json_shapes_and_materialize(tmp):
    project = tmp / "project"
    write_skill(project / "skill")
    suite = write_manifest(project)

    _, doctor = run_json([CLI, "doctor", "--json"], project, expect=(0, 1))
    check({"ok", "checks", "optional_capabilities"} <= doctor.keys(), "doctor JSON shape changed")
    checks = {row["name"]: row for row in doctor["checks"]}
    check(checks["validators_canonical"]["ok"] is True, "doctor validator source path check changed")

    _, init = run_json([CLI, "workbench", "init", "--target", str(project), "--json"], project)
    check({"ok", "target", "workbench", "changes"} <= init.keys(), "workbench init JSON shape changed")

    _, materialized = run_json([CLI, "eval", "materialize", "--suite", str(suite), "--json"], project)
    check({"ok", "suite", "changes"} <= materialized.keys(), "materialize JSON shape changed")
    task = project / ".meta-skill" / "cases" / "case-a" / "task.md"
    task.write_text("local edit\n")

    _, skipped = run_json([CLI, "eval", "materialize", "--suite", str(suite), "--json"], project)
    check(any(row["action"] == "skip" for row in skipped["changes"]), "materialize should not overwrite by default")
    check(task.read_text() == "local edit\n", "materialize changed task without --force")

    _, forced = run_json([CLI, "eval", "materialize", "--suite", str(suite), "--force", "--json"], project)
    check(any(row["action"] == "overwrite" for row in forced["changes"]), "materialize --force should overwrite")
    check(task.read_text() == "Answer with the fixture value.\n", "materialize --force did not restore seed")

    run_dir = project / ".meta-skill" / "runs" / "run-shape"
    run_dir.mkdir(parents=True)
    (run_dir / "run.json").write_text(
        json.dumps(
            {
                "run_id": "run-shape",
                "suite": str(suite),
                "project": str(project),
                "runner": "codex_exec",
                "trials": [{"trial_id": "case-a.current.t1"}],
            }
        )
        + "\n"
    )
    (run_dir / "progress.jsonl").write_text(json.dumps({"trial_id": "case-a.current.t1", "status": "passed"}) + "\n")
    (run_dir / "results.jsonl").write_text("")
    (run_dir / "grades.jsonl").write_text("")
    _, progress = run_json([CLI, "eval", "progress", "--run", str(run_dir), "--json"], project)
    check({"ok", "run_id", "run_dir", "progress", "results", "grades", "trials"} <= progress.keys(), "progress JSON shape changed")

    _, validate = run_json([CLI, "validate", str(project / "skill"), "--json"], project)
    check({"ok", "target", "tasks", "passed", "total", "validation_percent"} <= validate.keys(), "validate JSON shape changed")

    out_dir = project / "dist"
    _, package = run_json([CLI, "package", str(project / "skill"), "--out-dir", str(out_dir), "--json"], project)
    check({"ok", "artifact", "metadata"} <= package.keys(), "package JSON shape changed")


def test_candidate_digest_and_package_exclusions(tmp):
    project = tmp / "project"
    write_skill(project / "skill")
    (project / "skill" / ".meta-skill").mkdir()
    (project / "skill" / ".meta-skill" / "secret.txt").write_text("hidden")
    (project / "skill" / "dist").mkdir()
    (project / "skill" / "dist" / "old.zip").write_text("generated")
    suite = write_manifest(project)
    init_git_project(project)

    meta_skill = import_flat_module()
    manifest = meta_skill.load_manifest(suite)
    candidate = meta_skill.resolve_candidate(
        project,
        project / ".meta-skill",
        "run-characterize",
        manifest,
        manifest["candidates"][0],
    )
    digest_before = candidate["payload_digest"]
    (project / "skill" / ".meta-skill" / "secret.txt").write_text("changed hidden")
    check(meta_skill.payload_digest(project / "skill") == digest_before, "payload digest included .meta-skill")
    (project / "skill" / "references").mkdir()
    (project / "skill" / "references" / "guide.md").write_text("guide")
    check(meta_skill.payload_digest(project / "skill") != digest_before, "payload digest ignored visible payload change")
    check(candidate["source_kind"] == "current_worktree", "candidate source kind changed")
    check(candidate["source_ref"] == ".", "candidate source ref changed")
    check(candidate["payload_path"].endswith("/skill"), "candidate payload path changed")

    _, packaged = run_json([CLI, "package", str(project / "skill"), "--out-dir", str(project / "out"), "--json"], project)
    with zipfile.ZipFile(packaged["artifact"]) as zf:
        names = set(zf.namelist())
    check("SKILL.md" in names, "package omitted SKILL.md")
    check(not any(name.startswith(".meta-skill/") for name in names), "package included .meta-skill")
    check(not any(name.startswith("dist/") for name in names), "package included dist")


def test_solver_staging_hidden_boundaries(tmp):
    project = tmp / "project"
    write_skill(project / "skill")
    suite = write_manifest(project, fixtures=["fixtures/visible.txt"])
    run_json([CLI, "eval", "materialize", "--suite", str(suite), "--json"], project)
    case_root = project / ".meta-skill" / "cases" / "case-a"
    (case_root / "fixtures").mkdir(exist_ok=True)
    (case_root / "fixtures" / "visible.txt").write_text("visible")
    (case_root / "rubric.md").write_text("hidden")
    (case_root / "expected.txt").write_text("hidden")
    (case_root / "validate.py").write_text("hidden")

    meta_skill = import_flat_module()
    candidate = {"candidate": "current", "payload_path": str(project / "skill")}
    staged = meta_skill.stage_solver_workspace(
        project / ".meta-skill",
        project / ".meta-skill" / "runs" / "run-stage",
        "case-a.current.t1",
        {"id": "case-a", "fixtures": ["fixtures/visible.txt"]},
        "visible task",
        candidate,
    )
    workspace = Path(staged["solver_workspace"])
    check((workspace / "task.md").read_text() == "visible task\n", "staged task changed")
    check((workspace / "fixtures" / "fixtures" / "visible.txt").read_text() == "visible", "fixture not staged")
    for hidden in ("rubric.md", "expected.txt", "validate.py"):
        check(not (workspace / hidden).exists(), f"hidden case material staged: {hidden}")
    check(not (workspace / "skill" / ".meta-skill").exists(), "candidate .meta-skill copied into solver workspace")

    for fixture in ("/tmp/escape.txt", "../escape.txt"):
        try:
            meta_skill.stage_solver_workspace(
                project / ".meta-skill",
                project / ".meta-skill" / "runs" / "run-stage",
                f"case-a.current.{abs(hash(fixture))}",
                {"id": "case-a", "fixtures": [fixture]},
                "visible task",
                candidate,
            )
        except meta_skill.CliError:
            pass
        else:
            raise CheckFailure(f"unsafe fixture path was accepted: {fixture}")

    outside = tmp / "outside.txt"
    outside.write_text("outside")
    symlink = case_root / "fixtures" / "link.txt"
    try:
        symlink.symlink_to(outside)
    except OSError:
        return
    try:
        meta_skill.stage_solver_workspace(
            project / ".meta-skill",
            project / ".meta-skill" / "runs" / "run-stage",
            "case-a.current.symlink",
            {"id": "case-a", "fixtures": ["fixtures/link.txt"]},
            "visible task",
            candidate,
        )
    except meta_skill.CliError:
        pass
    else:
        raise CheckFailure("symlink fixture escape was accepted")


def test_grade_expected_validator_behavior(tmp):
    project = tmp / "project"
    write_skill(project / "skill")
    suite = write_manifest(project)
    run_json([CLI, "eval", "materialize", "--suite", str(suite), "--json"], project)
    case_root = project / ".meta-skill" / "cases" / "case-a"
    (case_root / "expected.txt").write_text("expected answer\n")
    (case_root / "validate.py").write_text(
        textwrap.dedent(
            """\
            import argparse, json

            parser = argparse.ArgumentParser()
            parser.add_argument("--output", required=True)
            parser.add_argument("--events", required=True)
            parser.add_argument("--expected", required=True)
            parser.add_argument("--json", action="store_true")
            args = parser.parse_args()
            output = open(args.output).read()
            expected = open(args.expected).read()
            passed = int(output == expected)
            print(json.dumps({"passed": passed, "total": 1, "checks": [{"check": "exact", "result": "Pass" if passed else "Fail"}]}))
            """
        )
    )
    run_dir = project / ".meta-skill" / "runs" / "run-grade"
    output_path = run_dir / "candidates" / "current" / "case-a.current.t1" / "final.md"
    event_path = run_dir / "events" / "case-a.current.t1.jsonl"
    output_path.parent.mkdir(parents=True)
    event_path.parent.mkdir(parents=True)
    output_path.write_text("expected answer\n")
    event_path.write_text("{}\n")
    (run_dir / "run.json").write_text(
        json.dumps({"run_id": "run-grade", "suite": str(suite), "trials": [{"trial_id": "case-a.current.t1"}]}) + "\n"
    )
    (run_dir / "results.jsonl").write_text(
        json.dumps(
            {
                "run_id": "run-grade",
                "trial_id": "case-a.current.t1",
                "case_id": "case-a",
                "candidate": "current",
                "output_path": str(output_path),
                "event_path": str(event_path),
            }
        )
        + "\n"
    )
    _, graded = run_json([CLI, "eval", "grade", "--run", str(run_dir), "--json"], project)
    check(graded["ok"] is True and graded["grades"] == 1, "grade JSON shape changed")
    grades = [json.loads(line) for line in (run_dir / "grades.jsonl").read_text().splitlines()]
    check(grades[0]["score"] == 1.0 and grades[0]["label"] == "pass", "validator grade behavior changed")


def test_eval_run_artifact_records(tmp):
    project = tmp / "project"
    write_skill(project / "skill")
    suite = write_manifest(project)
    run_json([CLI, "eval", "materialize", "--suite", str(suite), "--json"], project)
    init_git_project(project)

    bin_dir = tmp / "bin"
    bin_dir.mkdir()
    fake_codex = bin_dir / "codex"
    fake_codex.write_text(
        textwrap.dedent(
            """\
            #!/usr/bin/env python3
            import sys
            from pathlib import Path

            if len(sys.argv) > 1 and sys.argv[1] == "--version":
                print("codex fake")
                raise SystemExit(0)
            if "exec" in sys.argv and "--help" in sys.argv:
                print("usage: codex exec")
                raise SystemExit(0)
            output = Path(sys.argv[sys.argv.index("--output-last-message") + 1])
            output.parent.mkdir(parents=True, exist_ok=True)
            _prompt = sys.stdin.read()
            output.write_text("fake final\\n")
            print('{"event":"fake"}')
            """
        )
    )
    fake_codex.chmod(0o755)
    env = {"PATH": f"{bin_dir}{os.pathsep}{os.environ.get('PATH', '')}"}

    _, run_result = run_json([CLI, "eval", "run", "--suite", str(suite), "--runner", "codex_exec", "--json"], project, env=env)
    run_dir = Path(run_result["run_dir"])
    run_record = json.loads((run_dir / "run.json").read_text())
    result = json.loads((run_dir / "results.jsonl").read_text().splitlines()[0])
    evidence = json.loads(Path(result["evidence_path"]).read_text())

    candidate = run_record["candidates"][0]
    check({"base_commit", "head_commit", "dirty", "diffstat", "payload_digest"} <= candidate.keys(), "candidate source evidence missing")
    trial = run_record["trials"][0]
    check({"thread_id", "turn_id", "evidence_path", "final_path", "sandbox"} <= trial.keys(), "trial record evidence fields missing")
    check(result["final_path"] == result["output_path"], "result final/output paths diverged")
    check(Path(result["final_path"]).read_text() == "fake final\n", "fake runner final output changed")
    check(evidence["trial_id"] == result["trial_id"] and evidence["final_response"] == "fake final\n", "thread evidence record changed")


def write_fake_sdk(root, *, mode):
    package = root / "openai_codex"
    generated = package / "generated"
    generated.mkdir(parents=True)
    (package / "__init__.py").write_text(
        textwrap.dedent(
            f"""\
            from types import SimpleNamespace
            from .generated.v2_all import (
                AgentMessageThreadItem,
                ItemCompletedNotification,
                MessagePhase,
                ThreadTokenUsageUpdatedNotification,
                TurnCompletedNotification,
            )

            __version__ = "fake-sdk"
            MODE = {mode!r}

            class _Value:
                def __init__(self, value):
                    self.value = value

            class ApprovalMode:
                deny_all = "deny_all"

            class Sandbox:
                workspace_write = "workspace_write"

            class CodexConfig:
                def __init__(self, **kwargs):
                    self.kwargs = kwargs

            class SkillInput:
                def __init__(self, name, path):
                    self.name = name
                    self.path = path

            class TextInput:
                def __init__(self, text):
                    self.text = text

            class Usage:
                def model_dump(self, **kwargs):
                    return {{"input_tokens": 7, "output_tokens": 11}}

            class Event:
                def __init__(self, method, payload):
                    self.method = method
                    self.payload = payload

            class Turn:
                id = "turn_fake"
                def stream(self):
                    if MODE == "success":
                        yield Event("thread.item_completed", ItemCompletedNotification("turn_fake", AgentMessageThreadItem("final text", MessagePhase.final_answer)))
                        yield Event("thread.usage", ThreadTokenUsageUpdatedNotification("turn_fake", Usage()))
                        yield Event("turn.completed", TurnCompletedNotification(SimpleNamespace(id="turn_fake", status=_Value("completed"), duration_ms=12)))
                    elif MODE == "failed":
                        yield Event("turn.completed", TurnCompletedNotification(SimpleNamespace(id="turn_fake", status=_Value("failed"), duration_ms=3, error=SimpleNamespace(message="fake failure"))))
                    elif MODE == "no_final":
                        yield Event("thread.usage", ThreadTokenUsageUpdatedNotification("turn_fake", Usage()))
                        yield Event("turn.completed", TurnCompletedNotification(SimpleNamespace(id="turn_fake", status=_Value("completed"), duration_ms=4)))

            class Thread:
                id = "thread_fake"
                def turn(self, *args, **kwargs):
                    return Turn()

            class Codex:
                last_thread_start = None
                def __init__(self, config):
                    self.config = config
                def __enter__(self):
                    return self
                def __exit__(self, exc_type, exc, tb):
                    return False
                def thread_start(self, **kwargs):
                    Codex.last_thread_start = kwargs
                    return Thread()
            """
        )
    )
    (generated / "__init__.py").write_text("")
    (generated / "v2_all.py").write_text(
        textwrap.dedent(
            """\
            class MessagePhase:
                final_answer = "final_answer"

            class AgentMessageThreadItem:
                def __init__(self, text, phase):
                    self.text = text
                    self.phase = phase

            class ItemCompletedNotification:
                def __init__(self, turn_id, item):
                    self.turn_id = turn_id
                    self.item = item

            class ThreadTokenUsageUpdatedNotification:
                def __init__(self, turn_id, token_usage):
                    self.turn_id = turn_id
                    self.token_usage = token_usage

            class TurnCompletedNotification:
                def __init__(self, turn):
                    self.turn = turn
            """
        )
    )


def purge_fake_sdk_modules():
    for name in list(sys.modules):
        if name == "openai_codex" or name.startswith("openai_codex."):
            sys.modules.pop(name, None)


def test_fake_app_server_runner(tmp):
    project = tmp / "project"
    write_skill(project / "skill")
    meta_skill = import_flat_module()

    for mode in ("success", "no_final"):
        fake_root = tmp / f"fake-{mode}"
        write_fake_sdk(fake_root, mode=mode)
        sys.path.insert(0, str(fake_root))
        purge_fake_sdk_modules()
        output_path = tmp / f"{mode}.md"
        detail = meta_skill.app_server_run(
            {"trial_id": f"trial-{mode}"},
            "prompt",
            {"cwd": str(project), "payload_path": str(project / "skill")},
            tmp / f"{mode}.events.jsonl",
            output_path,
        )
        check(detail["thread_id"] == "thread_fake" and detail["turn_id"] == "turn_fake", f"{mode} thread evidence changed")
        check(detail["thread_persistence"] == "persistent", f"{mode} App Server persistence evidence changed")
        check(detail["sdk_version"] == "fake-sdk", f"{mode} SDK version evidence changed")
        check(detail["usage"] == {"input_tokens": 7, "output_tokens": 11}, f"{mode} usage evidence changed")
        import openai_codex

        check(openai_codex.Codex.last_thread_start["ephemeral"] is False, f"{mode} App Server thread should be persistent")
        if mode == "success":
            check(output_path.read_text() == "final text", "fake App Server final response not written")
            check(detail["final_response_chars"] == len("final text"), "final response char count changed")
        else:
            check(output_path.read_text() == "", "no-final fake App Server should write empty final")
            check(detail["final_response_chars"] == 0, "no-final char count changed")
        sys.path.remove(str(fake_root))
        purge_fake_sdk_modules()

    fake_root = tmp / "fake-failed"
    write_fake_sdk(fake_root, mode="failed")
    sys.path.insert(0, str(fake_root))
    purge_fake_sdk_modules()
    try:
        meta_skill.app_server_run(
            {"trial_id": "trial-failed"},
            "prompt",
            {"cwd": str(project), "payload_path": str(project / "skill")},
            tmp / "failed.events.jsonl",
            tmp / "failed.md",
        )
    except RuntimeError as exc:
        check("fake failure" in str(exc), "failed fake App Server error changed")
    else:
        raise CheckFailure("failed fake App Server turn did not raise")
    finally:
        sys.path.remove(str(fake_root))
        purge_fake_sdk_modules()


TESTS = [
    test_help_surfaces,
    test_json_shapes_and_materialize,
    test_candidate_digest_and_package_exclusions,
    test_solver_staging_hidden_boundaries,
    test_grade_expected_validator_behavior,
    test_eval_run_artifact_records,
    test_fake_app_server_runner,
]


def main():
    failures = []
    for test in TESTS:
        with tempfile.TemporaryDirectory(prefix=f"{test.__name__}-") as raw:
            tmp = Path(raw)
            try:
                test(tmp)
                print(f"PASS {test.__name__}")
            except Exception as exc:
                failures.append((test.__name__, exc))
                print(f"FAIL {test.__name__}: {exc}", file=sys.stderr)
    if failures:
        print("\nFailures:", file=sys.stderr)
        for name, exc in failures:
            print(f"- {name}: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .core.clock import utc_now


@dataclass
class RoleRunResult:
    status: str
    trace_text: str
    stdout_text: str
    stderr_text: str
    final_text: str
    stage_path: Path | None
    returncode: int | None


def _ignore_runtime_debris(_dir: str, names: list[str]) -> set[str]:
    return {name for name in names if name in {"__pycache__", ".DS_Store", ".pytest_cache"} or name.endswith(".pyc")}


class CodexRunner:
    name = "codex"

    def __init__(self, *, sandbox: str = "workspace-write", keep_workspace: bool = False, timeout_ms: int | None = None) -> None:
        self.sandbox = sandbox
        self.keep_workspace = keep_workspace
        self.timeout_ms = timeout_ms

    def version(self) -> str | None:
        try:
            result = subprocess.run(["codex", "--version"], text=True, capture_output=True, timeout=10)
        except (OSError, subprocess.SubprocessError):
            return None
        return result.stdout.strip() or result.stderr.strip() or None

    def run_role(
        self,
        *,
        skill_root: Path,
        prompt: dict[str, Any],
        evidence_dir: Path,
    ) -> RoleRunResult:
        if self.keep_workspace:
            stage = Path(tempfile.mkdtemp(prefix="meta-skill-eval-"))
            return self._run_in_stage(stage=stage, skill_root=skill_root, prompt=prompt, evidence_dir=evidence_dir)
        with tempfile.TemporaryDirectory(prefix="meta-skill-eval-") as tmp:
            return self._run_in_stage(stage=Path(tmp), skill_root=skill_root, prompt=prompt, evidence_dir=evidence_dir)

    def _run_in_stage(
        self,
        *,
        stage: Path,
        skill_root: Path,
        prompt: dict[str, Any],
        evidence_dir: Path,
    ) -> RoleRunResult:
        stage.mkdir(parents=True, exist_ok=True)
        staged_skill = stage / "skill"
        if staged_skill.exists():
            shutil.rmtree(staged_skill)
        shutil.copytree(skill_root, staged_skill, ignore=_ignore_runtime_debris)
        artifacts_stage = stage / "artifacts"
        artifacts_stage.mkdir()

        prompt_text = self._build_prompt(prompt)
        (stage / "prompt.txt").write_text(prompt_text, encoding="utf-8")
        final_stage = stage / "final.md"

        cmd = [
            "codex",
            "exec",
            "--json",
            "--ephemeral",
            "--skip-git-repo-check",
            "--cd",
            str(stage),
            "--sandbox",
            self.sandbox,
            "--output-last-message",
            str(final_stage),
            prompt_text,
        ]

        started = {"schema_version": 1, "type": "event", "timestamp": utc_now(), "role": "output", "event": "command_started", "summary": "codex exec --json"}
        try:
            result = subprocess.run(
                cmd,
                text=True,
                capture_output=True,
                timeout=(self.timeout_ms / 1000 if self.timeout_ms else None),
            )
            stdout = result.stdout or ""
            stderr = result.stderr or ""
            final_text = final_stage.read_text(encoding="utf-8", errors="ignore") if final_stage.exists() else ""
            final_text = final_text.replace(str(stage), ".")
            status = "needs_review" if result.returncode == 0 else "errored"
            finished = {
                "schema_version": 1,
                "type": "event",
                "timestamp": utc_now(),
                "role": "output",
                "event": "command_finished",
                "summary": f"codex exec exited {result.returncode}",
                "artifact_path": None,
            }
            trace = json.dumps(started, ensure_ascii=True) + "\n" + stdout + ("\n" if stdout and not stdout.endswith("\n") else "") + json.dumps(finished, ensure_ascii=True) + "\n"
            self._copy_artifacts(artifacts_stage, evidence_dir / "artifacts")
            return RoleRunResult(status=status, trace_text=trace, stdout_text=stdout, stderr_text=stderr, final_text=final_text, stage_path=stage if self.keep_workspace else None, returncode=result.returncode)
        except FileNotFoundError:
            message = "codex executable not found on PATH"
            trace = json.dumps(started, ensure_ascii=True) + "\n" + json.dumps(
                {"schema_version": 1, "type": "event", "timestamp": utc_now(), "role": "output", "event": "error", "summary": message},
                ensure_ascii=True,
            ) + "\n"
            self._copy_artifacts(artifacts_stage, evidence_dir / "artifacts")
            return RoleRunResult(status="errored", trace_text=trace, stdout_text="", stderr_text=message, final_text="", stage_path=stage if self.keep_workspace else None, returncode=None)
        except subprocess.TimeoutExpired as exc:
            message = f"codex exec timed out after {self.timeout_ms}ms"
            stdout = exc.stdout if isinstance(exc.stdout, str) else ""
            stderr = exc.stderr if isinstance(exc.stderr, str) else ""
            trace = json.dumps(started, ensure_ascii=True) + "\n" + stdout + json.dumps(
                {"schema_version": 1, "type": "event", "timestamp": utc_now(), "role": "output", "event": "error", "summary": message},
                ensure_ascii=True,
            ) + "\n"
            self._copy_artifacts(artifacts_stage, evidence_dir / "artifacts")
            return RoleRunResult(status="errored", trace_text=trace, stdout_text=stdout, stderr_text=stderr + message, final_text="", stage_path=stage if self.keep_workspace else None, returncode=None)

    def _copy_artifacts(self, source: Path, dest: Path) -> None:
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(source, dest, ignore=_ignore_runtime_debris)

    def _build_prompt(self, prompt: dict[str, Any]) -> str:
        topics = ", ".join(prompt.get("topics") or [])
        expected = prompt.get("expected_behavior", "")
        trigger_expected = prompt.get("trigger_expected", "")
        return "\n".join(
            [
                "You are running a non-interactive skill eval role for the meta-skill CLI.",
                "Use the staged skill at ./skill/SKILL.md and its linked runtime resources when they are relevant.",
                "Write any deliverable files under ./artifacts/.",
                "Do not read evaluator-private files; only the staged workspace is part of this task.",
                "",
                f"Prompt id: {prompt.get('id', 'unknown')}",
                f"Prompt type: {prompt.get('type', 'task')}",
                f"Topics: {topics}",
                f"Expected behavior: {expected}",
                f"Trigger expected: {trigger_expected}",
                "",
                "Task:",
                str(prompt.get("task", "")).strip(),
                "",
                "Return a concise final response describing the result and any artifact paths created.",
                "Use relative artifact links such as ./artifacts/example.md; do not return temporary absolute paths.",
            ]
        )

"""Candidate source identity and payload helpers."""

import hashlib
import subprocess
from pathlib import Path

from .errors import CliError


DEFAULT_EXCLUDES = {".DS_Store", ".git", ".meta-skill", "__pycache__", "dist"}


def parse_frontmatter(skill_md):
    text = skill_md.read_text()
    if not text.startswith("---"):
        return {}
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}
    raw = parts[1]
    try:
        import yaml

        parsed = yaml.safe_load(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        out = {}
        for line in raw.splitlines():
            if ":" not in line or line[:1].isspace():
                continue
            key, value = line.split(":", 1)
            out[key.strip()] = value.strip().strip("\"'")
        return out


def resolve_skill_md(target):
    path = Path(target).expanduser().resolve()
    return path / "SKILL.md" if path.is_dir() else path


def resolve_target_payload(project, manifest, candidate_cwd):
    target = manifest.get("target") or {}
    ref = target.get("ref") or "SKILL.md"
    path = (candidate_cwd / ref).resolve()
    if path.is_file():
        return path.parent
    if path.is_dir():
        return path
    fallback = (project / ref).resolve()
    if fallback.is_file():
        return fallback.parent
    if fallback.is_dir():
        return fallback
    raise CliError(f"target payload not found for ref {ref!r}", 2)


def payload_digest(path):
    root = Path(path).resolve()
    files = []
    if root.is_file():
        files = [root]
        base = root.parent
    else:
        base = root
        for file_path in root.rglob("*"):
            if not file_path.is_file():
                continue
            parts = set(file_path.relative_to(root).parts)
            if parts & DEFAULT_EXCLUDES:
                continue
            files.append(file_path)
    h = hashlib.sha256()
    for file_path in sorted(files):
        rel = file_path.relative_to(base).as_posix()
        h.update(rel.encode("utf-8"))
        h.update(b"\0")
        h.update(file_path.read_bytes())
        h.update(b"\0")
    return h.hexdigest()


def git(project, args, check=False):
    proc = subprocess.run(["git", *args], cwd=project, capture_output=True, text=True)
    if check and proc.returncode:
        raise CliError((proc.stderr or proc.stdout or "git command failed").strip(), 2)
    return proc


def git_ref(project, ref="HEAD"):
    proc = git(project, ["rev-parse", ref])
    return proc.stdout.strip() if proc.returncode == 0 else None


def current_branch(project):
    proc = git(project, ["branch", "--show-current"])
    return proc.stdout.strip() if proc.returncode == 0 else None


def diffstat(project):
    proc = git(project, ["diff", "--stat"])
    return proc.stdout.strip() if proc.returncode == 0 else ""


def is_dirty(project):
    proc = git(project, ["status", "--short"])
    return bool(proc.stdout.strip()) if proc.returncode == 0 else None


def resolve_candidate(project, workbench, run_id_value, manifest, candidate):
    source = candidate.get("source") or {}
    kind = source.get("kind", "current_worktree")
    ref = source.get("ref", ".")
    candidate_id = candidate.get("candidate")
    if kind == "none":
        if source.get("ref"):
            raise CliError(f"candidate {candidate_id} source.kind none must not set ref", 2)
        ref = None
        cwd = project
        base_commit = git_ref(project, "HEAD")
        head_commit = base_commit
        branch = current_branch(project)
        worktree = None
        payload = None
    elif kind == "current_worktree" or ref == ".":
        cwd = project
        base_commit = git_ref(project, "HEAD")
        head_commit = base_commit
        branch = current_branch(project)
        worktree = None
        payload = resolve_target_payload(project, manifest, cwd)
    else:
        base_commit = git_ref(project, ref)
        if not base_commit:
            raise CliError(f"candidate {candidate_id} ref not found: {ref}", 2)
        worktree = workbench / "worktrees" / run_id_value / candidate_id
        worktree.parent.mkdir(parents=True, exist_ok=True)
        if not worktree.exists():
            git(project, ["worktree", "add", "--detach", str(worktree), base_commit], check=True)
        cwd = worktree
        head_commit = git_ref(cwd, "HEAD")
        branch = ref if kind == "branch" else None
        payload = resolve_target_payload(project, manifest, cwd)
    return {
        "candidate": candidate_id,
        "display": candidate.get("display") or candidate_id,
        "source_kind": kind,
        "source_ref": ref,
        "branch": branch,
        "commit": head_commit,
        "base_commit": base_commit,
        "head_commit": head_commit,
        "dirty": is_dirty(cwd),
        "diffstat": diffstat(cwd),
        "worktree": str(worktree) if worktree else None,
        "cwd": str(cwd),
        "payload_path": str(payload) if payload else None,
        "payload_digest": payload_digest(payload) if payload else None,
    }


def skill_input_name(payload):
    skill_md = Path(payload) / "SKILL.md"
    if skill_md.exists():
        frontmatter = parse_frontmatter(skill_md)
        name = frontmatter.get("name")
        if isinstance(name, str) and name.strip():
            return name.strip()
    return Path(payload).name

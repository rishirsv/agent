from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


class PathResolutionError(ValueError):
    pass


@dataclass(frozen=True)
class ReviewLocation:
    project_root: Path
    review_root: Path


def repo_root(start: Path | None = None) -> Path | None:
    current = (start or Path.cwd()).resolve()
    for candidate in [current, *current.parents]:
        if (candidate / ".git").exists():
            return candidate
    return None


def find_project_root(start: Path) -> Path:
    start = start.resolve()
    if (start / "skill" / "SKILL.md").exists():
        return start
    if (start / "reviews").exists() and (start / "skill").exists():
        return start
    for candidate in [start, *start.parents]:
        if (candidate / "skill" / "SKILL.md").exists():
            return candidate
        if (candidate / "reviews").exists() and (candidate / "skill").exists():
            return candidate
    return start


def review_root_for_project(project_root: Path, name: str | None = None) -> Path:
    return project_root / "reviews" / name if name else project_root / "reviews"


def named_review_roots(reviews_root: Path) -> list[Path]:
    if not reviews_root.exists() or not reviews_root.is_dir():
        return []
    return sorted(path for path in reviews_root.iterdir() if path.is_dir() and (path / "review.yaml").exists())


def assert_review_layout_not_mixed(project_root: Path) -> None:
    reviews_root = project_root / "reviews"
    has_flat = (reviews_root / "review.yaml").exists()
    named = named_review_roots(reviews_root)
    if has_flat and named:
        names = ", ".join(path.name for path in named)
        raise PathResolutionError(f"mixed review layout: found flat reviews/review.yaml and named review(s): {names}")


def latest_run(review_root: Path) -> Path | None:
    runs = review_root / "runs"
    if not runs.exists():
        return None
    candidates = [path for path in runs.iterdir() if path.is_dir()]
    return max(candidates, key=lambda path: path.name, default=None)


def resolve_review_location(value: str | None = None) -> ReviewLocation:
    base = Path(value or ".").expanduser().resolve()
    if (base / "review.yaml").exists():
        review_root = base
        project_root = find_project_root(review_root.parent)
        assert_review_layout_not_mixed(project_root)
        return ReviewLocation(project_root=project_root, review_root=review_root)
    if (base / "reviews" / "review.yaml").exists():
        assert_review_layout_not_mixed(base)
        return ReviewLocation(project_root=base, review_root=base / "reviews")
    if base.exists() and base.is_dir() and (base / "reviews").exists():
        named = named_review_roots(base / "reviews")
        if len(named) == 1:
            return ReviewLocation(project_root=base, review_root=named[0])
        if len(named) > 1:
            names = ", ".join(path.name for path in named)
            raise PathResolutionError(f"multiple named reviews found ({names}); pass the review path explicitly")
    if base.exists() and base.is_dir():
        for candidate in [base, *base.parents]:
            if (candidate / "reviews" / "review.yaml").exists():
                assert_review_layout_not_mixed(candidate)
                return ReviewLocation(project_root=candidate, review_root=candidate / "reviews")
            if (candidate / "review.yaml").exists():
                project_root = find_project_root(candidate.parent)
                assert_review_layout_not_mixed(project_root)
                return ReviewLocation(project_root=project_root, review_root=candidate)
    raise PathResolutionError(f"could not find review.yaml from {base}")


def ensure_portable_config_path(raw: str, *, review_root: Path, project_root: Path, allow_absolute: bool = False, allow_installed: bool = False) -> Path:
    path_text = str(raw)
    root = repo_root(project_root)
    if path_text.startswith("review://"):
        candidate = review_root / path_text.removeprefix("review://")
    elif path_text.startswith("project://"):
        candidate = project_root / path_text.removeprefix("project://")
    elif path_text.startswith("repo://"):
        if root is None:
            raise PathResolutionError("repo:// paths require a Git repository root")
        candidate = root / path_text.removeprefix("repo://")
    else:
        candidate = Path(path_text)
        if candidate.is_absolute():
            if not allow_absolute:
                raise PathResolutionError("absolute config paths require --allow-absolute-paths")
        else:
            candidate = review_root / candidate
    candidate = candidate.expanduser().resolve()
    if ".agents" in candidate.parts and "skills" in candidate.parts and not allow_installed:
        raise PathResolutionError("paths under .agents/skills require --allow-installed-skill")
    return candidate


def relative_path(from_dir: Path, to_path: Path) -> str:
    return os.path.relpath(to_path.resolve(), from_dir.resolve()).replace(os.sep, "/")

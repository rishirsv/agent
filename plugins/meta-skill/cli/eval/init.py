from __future__ import annotations

import argparse
from pathlib import Path


def add_init_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    parser = subparsers.add_parser("init", help="Create an eval workspace.")
    parser.add_argument("project_dir", nargs="?", default=".", help="Skill project directory.")
    parser.add_argument("--name", help="Optional named review.")
    parser.add_argument("--skill-root", help="Path to portable skill root. Defaults to <project>/skill.")
    parser.add_argument("--runner", default="codex", help="Runner adapter name. Defaults to codex.")
    parser.add_argument("--from-skill-spec", help="Seed prompts from a fenced YAML review_seed block.")
    parser.add_argument("--force", action="store_true", help="Replace existing review.yaml and prompts.yaml, preserving runs.")
    parser.set_defaults(func=handle_init)


def handle_init(args: argparse.Namespace) -> int:
    from ..core.output import done
    from ..core.paths import named_review_roots, relative_path, review_root_for_project
    from ..core.schemas import write_yaml

    project_root = Path(args.project_dir).expanduser().resolve()
    if args.skill_root:
        skill_root = Path(args.skill_root).expanduser()
        if not skill_root.is_absolute():
            skill_root = project_root / skill_root
        skill_root = skill_root.resolve()
    else:
        skill_root = project_root / "skill"
    review_root = review_root_for_project(project_root, args.name)

    if not skill_root.exists():
        raise ValueError(f"skill root does not exist: {skill_root}")
    if not (skill_root / "SKILL.md").exists():
        raise ValueError(f"skill root must contain SKILL.md: {skill_root}")
    if review_root.exists() and not review_root.is_dir():
        raise ValueError(f"review path exists and is not a directory: {review_root}")
    flat_review = project_root / "reviews" / "review.yaml"
    named_reviews = named_review_roots(project_root / "reviews")
    if args.name and flat_review.exists():
        raise ValueError("cannot create a named review because reviews/review.yaml already exists; keep either flat or named reviews")
    if not args.name and named_reviews:
        names = ", ".join(path.name for path in named_reviews)
        raise ValueError(f"cannot create a flat review because named review(s) already exist: {names}")
    existing_config = review_root / "review.yaml"
    existing_prompts = review_root / "prompts.yaml"
    if not args.force and (existing_config.exists() or existing_prompts.exists()):
        raise ValueError(f"review already exists at {review_root}; pass --force to replace config and prompts")

    review_root.mkdir(parents=True, exist_ok=True)
    (review_root / "runs").mkdir(exist_ok=True)

    review_yaml = {
        "version": 1,
        "skill_root": relative_path(review_root, skill_root),
        "runner": {"name": args.runner},
        "default_compare": "auto",
        "review": {"html": True, "feedback": "local"},
    }
    if args.name:
        review_yaml["name"] = args.name
    write_yaml(review_root / "review.yaml", review_yaml)

    prompts: list[dict] = []
    if args.from_skill_spec:
        from .seed import extract_review_seed

        spec_path = Path(args.from_skill_spec).expanduser()
        if not spec_path.is_absolute():
            spec_path = project_root / spec_path
        prompts = extract_review_seed(spec_path.resolve())

    write_yaml(review_root / "prompts.yaml", {"version": 1, "prompts": prompts})

    prompt_note = f" seeded {len(prompts)} prompts" if prompts else " created empty prompt set"
    done(
        f"created review workspace at {relative_path(Path.cwd(), review_root)};{prompt_note}.",
        path=str(review_root),
        next_step=f"review {relative_path(Path.cwd(), review_root / 'prompts.yaml')}, then run `meta-skill eval run`",
    )
    return 0

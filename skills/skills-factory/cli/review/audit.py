from __future__ import annotations

import argparse
from pathlib import Path

# The standalone `skillfactory review audit` verb has been retired. The audit
# behavior now runs from `skillfactory review run --audit`, which calls
# `handle_audit` directly. Keep this module focused on that entry point.


def handle_audit(args: argparse.Namespace) -> int:
    from ..core.output import done
    from ..core.paths import resolve_review_location
    from ..core.schemas import iter_jsonl, read_yaml

    location = resolve_review_location(args.review)
    review_root = location.review_root
    prompts = read_yaml(review_root / "prompts.yaml").get("prompts") or []
    runs_root = review_root / "runs"
    runs = sorted([path for path in runs_root.iterdir() if path.is_dir()]) if runs_root.exists() else []
    baseline_exists = (review_root / "baseline.yaml").exists()
    issues: list[str] = []
    suggestions: list[str] = []

    if not prompts:
        issues.append("No prompts in prompts.yaml.")
        suggestions.append("Add 3-5 realistic prompts or rerun `skillfactory review init --from-skill-spec docs/spec.md`.")
    if not runs:
        issues.append("No run evidence yet.")
        suggestions.append("Run `skillfactory review run --compare none`.")
    runs_without_feedback = 0
    needs_review_count = 0
    errored_count = 0
    for run in runs:
        feedback = run / "evidence" / "feedback.jsonl"
        if not _has_non_whitespace(feedback):
            runs_without_feedback += 1
        results = run / "results.jsonl"
        for row in iter_jsonl(results):
            if row.get("type") == "run_summary":
                needs_review_count += int(row.get("needs_review") or 0)
                errored_count += int(row.get("errored") or 0)
                break

    if runs_without_feedback:
        suggestions.append(f"Review evidence and record feedback; {runs_without_feedback} run(s) have no saved feedback.")
    if errored_count:
        issues.append(f"{errored_count} prompt execution(s) errored.")
        suggestions.append("Inspect trace.jsonl and stderr.txt for the first failure.")
    elif needs_review_count:
        suggestions.append(f"Inspect {needs_review_count} needs-review prompt result(s) in the latest report.")
    if runs and not baseline_exists:
        suggestions.append("After reviewing the report, keep a chosen run as the manual baseline reference until baseline commands land.")

    print("Review audit")
    print(f"- Review root: {review_root}")
    print(f"- Prompts: {len(prompts)}")
    print(f"- Runs: {len(runs)}")
    print(f"- Baseline: {'yes' if baseline_exists else 'no'}")
    if issues:
        print("\nIssues")
        for item in issues:
            print(f"- {item}")
    if suggestions:
        print("\nSuggestions")
        for item in suggestions:
            print(f"- {item}")

    next_step = suggestions[0] if suggestions else "run another targeted review when the skill changes"
    done("audited review workspace.", path=str(review_root), next_step=next_step)
    return 0


def _has_non_whitespace(path: Path) -> bool:
    if not path.exists():
        return False
    with path.open(encoding="utf-8", errors="ignore") as handle:
        for chunk in iter(lambda: handle.read(4096), ""):
            if chunk.strip():
                return True
    return False

"""
Validate sync between dist/scope-library.json and dist/scope-review-buckets.json.

Usage:
  python3 scripts/validate_scope_bucket_mapping.py
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SCOPE_LIBRARY = PROJECT_ROOT / "dist" / "scope-library.json"
DEFAULT_BUCKETS = PROJECT_ROOT / "dist" / "scope-review-buckets.json"


def _load_json(path: Path) -> dict[str, Any]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise SystemExit(f"Expected JSON object at {path}")
    return raw


def _active_section_keys(scope_library: dict[str, Any]) -> set[str]:
    out: set[str] = set()
    for section in scope_library.get("common_skeleton", []) or []:
        if isinstance(section, dict):
            key = section.get("normalized_heading")
            if isinstance(key, str) and key.strip():
                out.add(key.strip())
    for module in (scope_library.get("industry_modules") or {}).values():
        if isinstance(module, dict):
            for key in module.keys():
                if isinstance(key, str) and key.strip():
                    out.add(key.strip())
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate scope review buckets sync")
    parser.add_argument("--scope-library", default=str(DEFAULT_SCOPE_LIBRARY))
    parser.add_argument("--buckets", default=str(DEFAULT_BUCKETS))
    args = parser.parse_args()

    scope_library = _load_json(Path(args.scope_library))
    buckets = _load_json(Path(args.buckets))

    active = _active_section_keys(scope_library)
    section_to_bucket = buckets.get("section_to_bucket", {})
    if not isinstance(section_to_bucket, dict):
        raise SystemExit("Invalid scope-review-buckets.json: section_to_bucket must be an object")

    mapped_keys = {k for k in section_to_bucket.keys() if isinstance(k, str)}
    missing = sorted(k for k in active if k not in mapped_keys)
    stale = sorted(k for k in mapped_keys if k not in active)

    failures: list[str] = []
    if missing:
        failures.append("Active section keys missing from section_to_bucket:\n- " + "\n- ".join(missing))
    if stale:
        failures.append("Stale section_to_bucket keys not found in scope-library:\n- " + "\n- ".join(stale))

    bucket_order = buckets.get("bucket_order", [])
    bucket_keys = set()
    if isinstance(bucket_order, list):
        for item in bucket_order:
            if isinstance(item, dict):
                key = item.get("key")
                if isinstance(key, str) and key.strip():
                    bucket_keys.add(key.strip())

    fallback = buckets.get("fallback_bucket_key")
    if not isinstance(fallback, str) or fallback not in bucket_keys:
        failures.append(
            "fallback_bucket_key must reference a valid bucket_order key "
            f"(got {fallback!r})"
        )

    for section, bucket in section_to_bucket.items():
        if not isinstance(bucket, str) or bucket not in bucket_keys:
            failures.append(
                f"Invalid bucket mapping for section '{section}': {bucket!r} is not a valid bucket key"
            )

    section_aliases = buckets.get("section_aliases", {})
    if isinstance(section_aliases, dict):
        bad_alias_targets = sorted(
            {target for target in section_aliases.values() if isinstance(target, str) and target not in mapped_keys}
        )
        if bad_alias_targets:
            failures.append(
                "section_aliases target unknown sections:\n- " + "\n- ".join(bad_alias_targets)
            )

    concept_to_sections = buckets.get("concept_to_sections", {})
    if isinstance(concept_to_sections, dict):
        bad_concept_targets: set[str] = set()
        for vals in concept_to_sections.values():
            if isinstance(vals, list):
                for target in vals:
                    if isinstance(target, str) and target not in mapped_keys:
                        bad_concept_targets.add(target)
        if bad_concept_targets:
            failures.append(
                "concept_to_sections references unknown sections:\n- "
                + "\n- ".join(sorted(bad_concept_targets))
            )

    section_ordering = buckets.get("section_ordering", {})
    if isinstance(section_ordering, dict):
        rules = section_ordering.get("anchor_rules", [])
        if not isinstance(rules, list):
            failures.append("section_ordering.anchor_rules must be a list")
        else:
            bad_ordering_targets: set[str] = set()
            for rule in rules:
                if not isinstance(rule, dict):
                    failures.append("section_ordering.anchor_rules entries must be objects")
                    continue
                section = rule.get("section")
                before = rule.get("before")
                after = rule.get("after")
                if not isinstance(section, str) or not section:
                    failures.append("section_ordering rule missing valid 'section' field")
                    continue
                for candidate in [section, before, after]:
                    if isinstance(candidate, str) and candidate and candidate not in mapped_keys:
                        bad_ordering_targets.add(candidate)
            if bad_ordering_targets:
                failures.append(
                    "section_ordering references unknown sections:\n- "
                    + "\n- ".join(sorted(bad_ordering_targets))
                )

    if failures:
        raise SystemExit("Scope review bucket validation failed:\n\n" + "\n\n".join(failures))

    print(
        "OK: scope-review-buckets is synchronized "
        f"(active sections: {len(active)}, mapped sections: {len(mapped_keys)})."
    )


if __name__ == "__main__":
    main()

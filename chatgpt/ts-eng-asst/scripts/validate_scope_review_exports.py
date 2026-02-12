"""
Validate that per-industry exports match the dist v2 bundle.

Usage:
  python3 scripts/validate_scope_review_exports.py
"""

from __future__ import annotations

import argparse
from copy import deepcopy
from datetime import datetime, timezone
import json
import re
from pathlib import Path
import sys
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scope_engine import (
    build_industry_scope_view as core_build_industry_scope_view,
    normalize_lookup_key as core_normalize_lookup_key,
    ordered_active_section_keys as core_ordered_active_section_keys,
)
DEFAULT_BUNDLE = PROJECT_ROOT / "dist" / "scope-library.json"
DEFAULT_OUT_DIR = PROJECT_ROOT / "docs" / "scope-library" / "industries"
DEFAULT_APPLICABILITY = PROJECT_ROOT / "docs" / "scope-library" / "section-applicability.json"
DEFAULT_SCOPE_BUCKETS = PROJECT_ROOT / "dist" / "scope-review-buckets.json"


def _count_text_nodes(nodes: list[Any]) -> int:
    total = 0
    stack = list(nodes) if isinstance(nodes, list) else []
    while stack:
        node = stack.pop()
        if not isinstance(node, dict):
            continue
        text = node.get("text")
        if isinstance(text, str) and text.strip():
            total += 1
        children = node.get("children")
        if isinstance(children, list):
            stack.extend(children)
    return total


def _expected_metadata(bundle: dict[str, Any], current_metadata: dict[str, Any]) -> dict[str, Any]:
    section_headings: set[str] = set()
    total_bullets_cataloged = 0

    for section in bundle.get("common_skeleton", []) or []:
        if not isinstance(section, dict):
            continue
        heading = section.get("normalized_heading")
        if isinstance(heading, str) and heading.strip():
            section_headings.add(heading.strip())
        total_bullets_cataloged += _count_text_nodes(section.get("default_bullets") or [])

    for _, module in (bundle.get("industry_modules") or {}).items():
        if not isinstance(module, dict):
            continue
        for section_key, bullets in module.items():
            if isinstance(section_key, str) and section_key.strip():
                section_headings.add(section_key.strip())
            if isinstance(bullets, list):
                total_bullets_cataloged += _count_text_nodes(bullets)

    current_threshold = current_metadata.get("common_threshold")
    if current_threshold is None:
        common_threshold = "legacy: n/a"
    else:
        raw = str(current_threshold)
        common_threshold = raw if raw.startswith("legacy:") else f"legacy: {raw}"

    return {
        "industries_analyzed": len((bundle.get("industry_modules") or {}).keys()),
        "total_sections_found": len(section_headings),
        "total_bullets_cataloged": total_bullets_cataloged,
        "common_threshold": common_threshold,
        "metadata_counts_basis": "current-dist-structure",
        "metadata_last_refreshed_utc": current_metadata.get("metadata_last_refreshed_utc")
        or datetime.now(timezone.utc).isoformat(),
    }


def _normalize_lookup_key(value: str) -> str:
    return core_normalize_lookup_key(value)


def _load_applicability(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    return raw if isinstance(raw, dict) else {}


def _load_scope_buckets(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    return raw if isinstance(raw, dict) else {}


def _build_industry_view(
    bundle: dict[str, Any],
    industry: str,
    applicability: dict[str, Any],
) -> dict[str, Any]:
    return core_build_industry_scope_view(
        scope_library=bundle,
        industry=industry,
        applicability=applicability,
        include_summary=False,
    )

    industry_norm = _normalize_lookup_key(industry)
    section_applicability = applicability.get("section_applicability", {})
    common_rules = {}
    if isinstance(section_applicability, dict):
        raw_common_rules = section_applicability.get("common_skeleton", {})
        if isinstance(raw_common_rules, dict):
            common_rules = raw_common_rules

    common_all = bundle.get("common_skeleton", []) or []
    common_filtered: list[dict[str, Any]] = []
    excluded_common_sections: list[str] = []
    for section in common_all:
        if not isinstance(section, dict):
            continue
        section_key = _normalize_lookup_key(str(section.get("normalized_heading", "")))
        include = True
        rule = common_rules.get(section_key)
        if isinstance(rule, dict):
            include_for = {
                _normalize_lookup_key(v)
                for v in (rule.get("include_for_industries") or [])
                if isinstance(v, str)
            }
            exclude_for = {
                _normalize_lookup_key(v)
                for v in (rule.get("exclude_for_industries") or [])
                if isinstance(v, str)
            }
            if include_for and industry_norm not in include_for:
                include = False
            if industry_norm in exclude_for:
                include = False
        if include:
            common_filtered.append(section)
        elif section_key:
            excluded_common_sections.append(section_key)
    excluded_common_set = set(excluded_common_sections)

    common_replacements_root = applicability.get("common_section_replacements", {})
    if isinstance(common_replacements_root, dict):
        common_index: dict[str, int] = {}
        for idx, section in enumerate(common_filtered):
            if not isinstance(section, dict):
                continue
            key = _normalize_lookup_key(str(section.get("normalized_heading", "")))
            if key:
                common_index[key] = idx

        for section_key, replacement in common_replacements_root.items():
            normalized = _normalize_lookup_key(section_key)
            if not normalized or not isinstance(replacement, dict):
                continue
            if normalized in excluded_common_set:
                continue
            heading = replacement.get("heading")
            bullets = replacement.get("default_bullets")
            if not isinstance(bullets, list):
                continue
            clean_bullets = [deepcopy(b) for b in bullets if isinstance(b, dict)]
            existing_idx = common_index.get(normalized)
            if not clean_bullets:
                if existing_idx is not None:
                    common_filtered.pop(existing_idx)
                    common_index = {}
                    for idx, section in enumerate(common_filtered):
                        if not isinstance(section, dict):
                            continue
                        key = _normalize_lookup_key(str(section.get("normalized_heading", "")))
                        if key:
                            common_index[key] = idx
                continue

            new_section: dict[str, Any] = {
                "normalized_heading": normalized,
                "default_bullets": clean_bullets,
            }
            if isinstance(heading, str) and heading.strip():
                new_section["heading"] = heading.strip()
            elif existing_idx is not None:
                prev_heading = common_filtered[existing_idx].get("heading")
                if isinstance(prev_heading, str) and prev_heading.strip():
                    new_section["heading"] = prev_heading.strip()
                else:
                    new_section["heading"] = normalized.replace("_", " ").title()
            else:
                new_section["heading"] = normalized.replace("_", " ").title()

            if existing_idx is not None:
                common_filtered[existing_idx] = new_section
            else:
                common_filtered.append(new_section)
                common_index[normalized] = len(common_filtered) - 1

    modules = bundle.get("industry_modules", {}) or {}
    raw_industry_module = modules.get(industry)
    industry_module = deepcopy(raw_industry_module) if isinstance(raw_industry_module, dict) else {}

    additions_root = applicability.get("industry_section_additions", {})
    additions_for_industry: dict[str, Any] = {}
    if isinstance(additions_root, dict):
        raw = additions_root.get(industry)
        if isinstance(raw, dict):
            additions_for_industry = raw

    replacements_root = applicability.get("industry_section_replacements", {})
    replacements_for_industry: dict[str, Any] = {}
    if isinstance(replacements_root, dict):
        raw = replacements_root.get(industry)
        if isinstance(raw, dict):
            replacements_for_industry = raw

    for section_key, bullets in replacements_for_industry.items():
        if not isinstance(section_key, str) or not isinstance(bullets, list):
            continue
        clean_bullets = [deepcopy(b) for b in bullets if isinstance(b, dict)]
        if clean_bullets:
            industry_module[section_key] = clean_bullets
        else:
            industry_module.pop(section_key, None)

    for section_key, bullets in additions_for_industry.items():
        if not isinstance(section_key, str) or not isinstance(bullets, list):
            continue
        clean_bullets = [deepcopy(b) for b in bullets if isinstance(b, dict)]
        if not clean_bullets:
            continue
        existing = industry_module.get(section_key)
        if not isinstance(existing, list):
            industry_module[section_key] = clean_bullets
        else:
            existing_ids = {b.get("id") for b in existing if isinstance(b, dict)}
            for bullet in clean_bullets:
                bullet_id = bullet.get("id")
                if isinstance(bullet_id, str) and bullet_id in existing_ids:
                    continue
                existing.append(bullet)
                if isinstance(bullet_id, str):
                    existing_ids.add(bullet_id)

    return {
        "common_skeleton": common_filtered,
        "industry_module": industry_module,
    }


def _ordered_active_section_keys(
    *,
    common_keys_in_order: list[str],
    module_keys_in_order: list[str],
    scope_buckets: dict[str, Any],
) -> list[str]:
    return core_ordered_active_section_keys(
        common_keys_in_order=common_keys_in_order,
        module_keys_in_order=module_keys_in_order,
        excluded_section_keys=None,
        scope_buckets=scope_buckets,
    )

    active_common = [k for k in common_keys_in_order if isinstance(k, str) and k]
    active_module = [k for k in module_keys_in_order if isinstance(k, str) and k]

    all_keys: list[str] = []
    for key in active_common + active_module:
        if key not in all_keys:
            all_keys.append(key)
    if not all_keys:
        return []

    if not isinstance(scope_buckets, dict):
        return all_keys

    section_to_bucket = scope_buckets.get("section_to_bucket")
    if not isinstance(section_to_bucket, dict):
        section_to_bucket = {}

    bucket_items = scope_buckets.get("bucket_order")
    bucket_order_keys: list[str] = []
    if isinstance(bucket_items, list):
        for item in bucket_items:
            if isinstance(item, dict):
                key = item.get("key")
                if isinstance(key, str) and key:
                    bucket_order_keys.append(key)
    bucket_index = {k: i for i, k in enumerate(bucket_order_keys)}

    fallback_bucket = scope_buckets.get("fallback_bucket_key")
    if not isinstance(fallback_bucket, str) or not fallback_bucket:
        fallback_bucket = "industry_specific_analysis"

    common_pos = {k: i for i, k in enumerate(active_common)}
    module_pos = {k: i for i, k in enumerate(active_module)}
    common_bucket_anchor: dict[str, int] = {}
    for key, idx in common_pos.items():
        bucket = section_to_bucket.get(key, fallback_bucket)
        if bucket not in common_bucket_anchor or idx < common_bucket_anchor[bucket]:
            common_bucket_anchor[bucket] = idx

    def _base_sort_tuple(key: str) -> tuple[int, int, int]:
        if key in common_pos:
            return (common_pos[key], 0, 0)
        bucket = section_to_bucket.get(key, fallback_bucket)
        bucket_idx = bucket_index.get(bucket, len(bucket_index) + 999)
        anchor = common_bucket_anchor.get(bucket, len(active_common) + bucket_idx * 100)
        return (anchor, 1, module_pos.get(key, 0))

    base_order = sorted(all_keys, key=_base_sort_tuple)

    ordering_cfg = scope_buckets.get("section_ordering")
    if not isinstance(ordering_cfg, dict):
        return base_order
    rules = ordering_cfg.get("anchor_rules")
    if not isinstance(rules, list) or not rules:
        return base_order

    nodes = list(base_order)
    node_set = set(nodes)
    edges: dict[str, set[str]] = {n: set() for n in nodes}
    indegree: dict[str, int] = {n: 0 for n in nodes}
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        section = _normalize_lookup_key(str(rule.get("section", "")))
        before = _normalize_lookup_key(str(rule.get("before", "")))
        after = _normalize_lookup_key(str(rule.get("after", "")))
        if section not in node_set:
            continue

        def _add_edge(src: str, dst: str) -> None:
            if src == dst or src not in node_set or dst not in node_set:
                return
            if dst in edges[src]:
                return
            edges[src].add(dst)
            indegree[dst] += 1

        if before:
            _add_edge(section, before)
        if after:
            _add_edge(after, section)

    base_index = {k: i for i, k in enumerate(base_order)}
    ready = sorted([n for n in nodes if indegree[n] == 0], key=lambda n: base_index[n])
    ordered: list[str] = []
    while ready:
        current = ready.pop(0)
        ordered.append(current)
        for nxt in sorted(edges[current], key=lambda n: base_index[n]):
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                ready.append(nxt)
        ready.sort(key=lambda n: base_index[n])
    if len(ordered) != len(nodes):
        return base_order
    return ordered


def _slice_bundle(
    bundle: dict[str, Any],
    industry: str,
    applicability: dict[str, Any],
    scope_buckets: dict[str, Any],
) -> dict[str, Any]:
    view = _build_industry_view(bundle, industry, applicability)
    common_keys = [
        str(section.get("normalized_heading", "")).strip()
        for section in view["common_skeleton"]
        if isinstance(section, dict) and str(section.get("normalized_heading", "")).strip()
    ]
    module_raw = view["industry_module"] if isinstance(view["industry_module"], dict) else {}
    ordered_keys = _ordered_active_section_keys(
        common_keys_in_order=common_keys,
        module_keys_in_order=[k for k in module_raw.keys() if isinstance(k, str)],
        scope_buckets=scope_buckets,
    )
    ordered_module: dict[str, Any] = {}
    for key in ordered_keys:
        bullets = module_raw.get(key)
        if isinstance(bullets, list) and bullets:
            ordered_module[key] = bullets
    return {
        "common_skeleton": view["common_skeleton"],
        "industry_modules": {industry: ordered_module} if ordered_module else {},
        "metadata": bundle.get("metadata", {}),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate per-industry scope exports")
    parser.add_argument("--bundle", default=str(DEFAULT_BUNDLE), help="Path to dist bundle JSON (v2)")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Exports directory")
    parser.add_argument(
        "--applicability",
        default=str(DEFAULT_APPLICABILITY),
        help="Path to docs-level section applicability / additions JSON",
    )
    parser.add_argument(
        "--scope-buckets",
        default=str(DEFAULT_SCOPE_BUCKETS),
        help="Path to scope-review-buckets.json used for robust section ordering",
    )
    args = parser.parse_args()

    bundle = json.loads(Path(args.bundle).read_text(encoding="utf-8"))
    applicability = _load_applicability(Path(args.applicability))
    scope_buckets = _load_scope_buckets(Path(args.scope_buckets))
    out_dir = Path(args.out_dir)
    current_metadata = (
        bundle.get("metadata", {}) if isinstance(bundle.get("metadata"), dict) else {}
    )
    expected_metadata = _expected_metadata(bundle, current_metadata)

    industries = sorted((bundle.get("industry_modules") or {}).keys())
    industries.append("generic")

    failures: list[str] = []
    for key in [
        "industries_analyzed",
        "total_sections_found",
        "total_bullets_cataloged",
        "common_threshold",
        "metadata_counts_basis",
    ]:
        if current_metadata.get(key) != expected_metadata.get(key):
            failures.append(
                f"Metadata mismatch for '{key}': "
                f"current={current_metadata.get(key)!r} expected={expected_metadata.get(key)!r}"
            )

    for industry in industries:
        export_path = out_dir / f"{industry}.json"
        if not export_path.exists():
            failures.append(f"Missing export: {export_path}")
            continue
        exported = json.loads(export_path.read_text(encoding="utf-8"))
        expected = _slice_bundle(bundle, industry, applicability, scope_buckets)
        # Exports can include additional review metadata; validate core payload only.
        core_exported = {
            "common_skeleton": exported.get("common_skeleton"),
            "industry_modules": exported.get("industry_modules"),
            "metadata": exported.get("metadata"),
        }
        if core_exported != expected:
            failures.append(f"Mismatch: {export_path}")

    if failures:
        raise SystemExit("Export validation failed:\n- " + "\n- ".join(failures))

    print(f"OK: {len(industries)} exports validated.")


if __name__ == "__main__":
    main()

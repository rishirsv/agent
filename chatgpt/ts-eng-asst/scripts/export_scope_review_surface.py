"""
Export per-industry views from the bundled v2 scope library.

Why:
- Easier human review per industry (JSON + Markdown)
- Ensures exports are deterministic and match the dist bundle

Usage:
  python3 scripts/export_scope_review_surface.py
  python3 scripts/export_scope_review_surface.py --industry retail
"""

from __future__ import annotations

import argparse
from copy import deepcopy
import json
import re
from pathlib import Path
import sys
from typing import Any, Iterable

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
DEFAULT_SKELETON_OUT_DIR = PROJECT_ROOT / "docs" / "scope-library" / "skeleton-by-industry"
DEFAULT_TRACKER = PROJECT_ROOT / "docs" / "Scope Review" / "deletion-optional-tracker.md"
DEFAULT_APPLICABILITY = PROJECT_ROOT / "docs" / "scope-library" / "section-applicability.json"
DEFAULT_SCOPE_BUCKETS = PROJECT_ROOT / "dist" / "scope-review-buckets.json"


def _iter_v2_nodes(nodes: Iterable[dict[str, Any]], depth: int = 0) -> Iterable[tuple[int, dict[str, Any]]]:
    for node in nodes:
        if not isinstance(node, dict):
            continue
        yield depth, node
        children = node.get("children")
        if isinstance(children, list):
            yield from _iter_v2_nodes(children, depth + 1)


def _render_md_bullets(nodes: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for depth, node in _iter_v2_nodes(nodes):
        text = node.get("text")
        if not isinstance(text, str) or not text.strip():
            continue
        node_id = node.get("id")
        label = f"({node_id}) {text}" if isinstance(node_id, str) else text
        lines.append(f"{'  ' * depth}- {label}")
    return lines


def _strip_ticks(value: str) -> str:
    value = value.strip()
    if value.startswith("`") and value.endswith("`") and len(value) >= 2:
        return value[1:-1].strip()
    return value


def _parse_tracker(path: Path) -> list[dict[str, str]]:
    """
    Parse markdown table rows from deletion-optional-tracker.md.
    Expected columns:
    Scope ID | Path | Short text | Current status | Recommended disposition | Notes
    """
    if not path.exists():
        return []

    entries: list[dict[str, str]] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line.startswith("|") or line.count("|") < 6:
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 6:
            continue
        if cells[0].lower() == "scope id":
            continue
        if all(re.fullmatch(r"[-:]+", c) for c in cells[:6]):
            continue
        if not re.match(r"`?scope\.\d+`?$", cells[0]):
            continue

        entries.append(
            {
                "scope_id": _strip_ticks(cells[0]),
                "path": _strip_ticks(cells[1]),
                "short_text": cells[2],
                "current_status": _strip_ticks(cells[3]),
                "recommended_disposition": _strip_ticks(cells[4]),
                "notes": cells[5],
            }
        )
    return entries


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
        include_summary=True,
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
    common_replaced_sections: list[str] = []
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
            if not normalized:
                continue
            if normalized in excluded_common_set:
                # Per-industry exclusions win over global common replacements.
                continue
            if not isinstance(replacement, dict):
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
                    common_replaced_sections.append(normalized)
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
            common_replaced_sections.append(normalized)

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

    replaced_industry_sections: list[str] = []
    for section_key, bullets in replacements_for_industry.items():
        if not isinstance(section_key, str) or not isinstance(bullets, list):
            continue
        normalized_section = _normalize_lookup_key(section_key)
        clean_bullets = [deepcopy(b) for b in bullets if isinstance(b, dict)]
        if clean_bullets:
            industry_module[section_key] = clean_bullets
        else:
            industry_module.pop(section_key, None)
        if normalized_section:
            replaced_industry_sections.append(normalized_section)

    added_industry_sections: list[str] = []
    for section_key, bullets in additions_for_industry.items():
        if not isinstance(section_key, str) or not isinstance(bullets, list):
            continue
        normalized_section = _normalize_lookup_key(section_key)
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
        if normalized_section:
            added_industry_sections.append(normalized_section)

    return {
        "common_skeleton": common_filtered,
        "industry_module": industry_module,
        "excluded_common_sections": sorted(set(excluded_common_sections)),
        "replaced_common_sections": sorted(set(common_replaced_sections)),
        "replaced_industry_sections": sorted(set(replaced_industry_sections)),
        "added_industry_sections": sorted(set(added_industry_sections)),
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


def _tracker_entries_for_industry(
    tracker_entries: list[dict[str, str]],
    industry: str,
) -> list[dict[str, str]]:
    wanted_prefixes = ("common.", f"{industry}.")
    out: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()
    for entry in tracker_entries:
        path = entry.get("path", "")
        if not path.startswith(wanted_prefixes):
            continue
        key = (entry.get("scope_id", ""), path, entry.get("current_status", ""))
        if key in seen:
            continue
        seen.add(key)
        out.append(entry)
    out.sort(key=lambda e: (e.get("path", ""), e.get("scope_id", "")))
    return out


def _slice_bundle(
    bundle: dict[str, Any],
    industry: str,
    tracker_entries: list[dict[str, str]],
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

    relevant_tracker = _tracker_entries_for_industry(tracker_entries, industry)
    out: dict[str, Any] = {
        "common_skeleton": view["common_skeleton"],
        "industry_modules": {industry: ordered_module} if ordered_module else {},
        "metadata": bundle.get("metadata", {}),
        "review_tracking": {
            "source": "docs/Scope Review/deletion-optional-tracker.md",
            "entries_for_industry": relevant_tracker,
            "counts": {
                "entries_total": len(relevant_tracker),
                "removed_canonical": sum(
                    1 for e in relevant_tracker if e.get("current_status") == "REMOVED_CANONICAL"
                ),
                "optional_candidates": sum(
                    1
                    for e in relevant_tracker
                    if e.get("recommended_disposition") == "OPTIONAL_CANDIDATE"
                ),
                "pending_review_delete": sum(
                    1 for e in relevant_tracker if e.get("current_status") == "PENDING_REVIEW_DELETE"
                ),
            },
        },
        "applicability": {
            "source": "docs/scope-library/section-applicability.json",
            "excluded_common_sections": view["excluded_common_sections"],
            "replaced_common_sections": view["replaced_common_sections"],
            "replaced_industry_sections": view["replaced_industry_sections"],
            "added_industry_sections": view["added_industry_sections"],
        },
    }
    return out


def _render_tracker_rows(entries: list[dict[str, str]]) -> list[str]:
    if not entries:
        return ["_None._", ""]
    lines = [
        "| Scope ID | Path | Status | Disposition | Notes |",
        "|---|---|---|---|---|",
    ]
    for e in entries:
        scope_id = e.get("scope_id", "")
        path = e.get("path", "").replace("|", "\\|")
        status = e.get("current_status", "")
        disp = e.get("recommended_disposition", "")
        notes = e.get("notes", "").replace("|", "\\|")
        lines.append(f"| `{scope_id}` | `{path}` | `{status}` | `{disp}` | {notes} |")
    lines.append("")
    return lines


def _render_industry_markdown(
    *,
    bundle: dict[str, Any],
    industry: str,
    tracker_entries: list[dict[str, str]],
    applicability: dict[str, Any],
    scope_buckets: dict[str, Any],
) -> str:
    view = _build_industry_view(bundle, industry, applicability)

    lines: list[str] = []
    lines.append(f"# FDD Scope — `{industry}`")
    lines.append("")
    lines.append("Generated from `dist/scope-library.json`.")
    lines.append("")
    lines.append("## Review Tracking")
    lines.append("")
    lines.append("Entries below are pulled from `docs/Scope Review/deletion-optional-tracker.md`.")
    lines.append("")

    removed = [
        e
        for e in tracker_entries
        if e.get("current_status") == "REMOVED_CANONICAL"
        or e.get("recommended_disposition") == "EXCLUDE_REUSABLE_OR_REWRITE"
    ]
    removed_keys = {(e.get("scope_id", ""), e.get("path", "")) for e in removed}
    optional_or_pending = [
        e
        for e in tracker_entries
        if (
            e.get("recommended_disposition") == "OPTIONAL_CANDIDATE"
            or e.get("current_status") in {"REMOVED_DEFAULT", "PENDING_REVIEW_DELETE"}
        )
        and (e.get("scope_id", ""), e.get("path", "")) not in removed_keys
    ]

    lines.append("### Excluded / Rewrite Before Reuse")
    lines.append("")
    lines.extend(_render_tracker_rows(removed))
    lines.append("### Optional / Pending Review")
    lines.append("")
    lines.extend(_render_tracker_rows(optional_or_pending))

    lines.append("## Applicability")
    lines.append("")
    lines.append("Rules source: `docs/scope-library/section-applicability.json`.")
    lines.append("")
    excluded_common_sections = view["excluded_common_sections"]
    replaced_common_sections = view["replaced_common_sections"]
    if excluded_common_sections:
        lines.append(f"- Excluded common sections: {', '.join(f'`{k}`' for k in excluded_common_sections)}")
    else:
        lines.append("- Excluded common sections: _None_")
    if replaced_common_sections:
        lines.append(f"- Replaced common sections: {', '.join(f'`{k}`' for k in replaced_common_sections)}")
    else:
        lines.append("- Replaced common sections: _None_")
    added_industry_sections = view["added_industry_sections"]
    replaced_industry_sections = view["replaced_industry_sections"]
    if added_industry_sections:
        lines.append(f"- Added industry sections: {', '.join(f'`{k}`' for k in added_industry_sections)}")
    else:
        lines.append("- Added industry sections: _None_")
    if replaced_industry_sections:
        lines.append(f"- Replaced industry sections: {', '.join(f'`{k}`' for k in replaced_industry_sections)}")
    else:
        lines.append("- Replaced industry sections: _None_")
    lines.append("")

    common = view["common_skeleton"]
    industry_module = view["industry_module"] if isinstance(view["industry_module"], dict) else {}
    common_by_key: dict[str, dict[str, Any]] = {}
    common_keys: list[str] = []
    for section in common:
        if not isinstance(section, dict):
            continue
        key = str(section.get("normalized_heading", "")).strip()
        if not key:
            continue
        common_by_key[key] = section
        common_keys.append(key)
    ordered_keys = _ordered_active_section_keys(
        common_keys_in_order=common_keys,
        module_keys_in_order=[k for k in industry_module.keys() if isinstance(k, str)],
        scope_buckets=scope_buckets,
    )

    lines.append("## Section Review (Common + Industry)")
    lines.append("")
    lines.append("Each section below shows common skeleton bullets and industry-specific bullets where applicable.")
    lines.append("")
    for key in ordered_keys:
        common_section = common_by_key.get(key)
        common_heading = str(common_section.get("heading", "")).strip() if isinstance(common_section, dict) else ""
        display_heading = common_heading or key.replace("_", " ").title()
        lines.append(f"### {display_heading} (`{key}`)")
        lines.append("")

        lines.append("#### Common")
        lines.append("")
        if isinstance(common_section, dict):
            common_bullets = common_section.get("default_bullets") or []
            if not isinstance(common_bullets, list):
                common_bullets = []
            if common_bullets:
                lines.extend(_render_md_bullets(common_bullets))
            else:
                lines.append("_No common bullets._")
        else:
            lines.append("_Not in common skeleton._")
        lines.append("")

        industry_bullets = industry_module.get(key) if isinstance(industry_module.get(key), list) else []
        if industry_bullets:
            lines.append(f"#### Industry (`{industry}`)")
            lines.append("")
            lines.extend(_render_md_bullets(industry_bullets))
            lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def _render_skeleton_markdown(
    *,
    bundle: dict[str, Any],
    industry: str,
    tracker_entries: list[dict[str, str]],
    applicability: dict[str, Any],
) -> str:
    view = _build_industry_view(bundle, industry, applicability)

    lines: list[str] = []
    lines.append(f"# FDD Skeleton — `{industry}`")
    lines.append("")
    lines.append("This is a skeleton-only view (generic/common scope).")
    lines.append("Use it to compare against the full per-industry file.")
    lines.append("")
    if tracker_entries:
        lines.append("## Review Tracking (Common + Industry)")
        lines.append("")
        lines.extend(_render_tracker_rows(tracker_entries))

    lines.append("## Common skeleton")
    lines.append("")
    for section in view["common_skeleton"]:
        if not isinstance(section, dict):
            continue
        heading = section.get("heading") or ""
        key = section.get("normalized_heading") or ""
        bullets = section.get("default_bullets") or []
        if not isinstance(bullets, list):
            bullets = []
        lines.append(f"### {heading} (`{key}`)")
        lines.extend(_render_md_bullets(bullets))
        lines.append("")

    industry_module = view["industry_module"]
    lines.append("## Industry section keys (for comparison)")
    lines.append("")
    if isinstance(industry_module, dict) and industry_module:
        for key in industry_module.keys():
            lines.append(f"- `{key}`")
    else:
        lines.append("_None (common skeleton only)._")
    lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Export per-industry scope library views (v2 bundle)")
    parser.add_argument("--bundle", default=str(DEFAULT_BUNDLE), help="Path to dist bundle JSON (v2)")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Output directory for exports")
    parser.add_argument(
        "--with-skeleton",
        action="store_true",
        help="Also generate skeleton-by-industry exports (off by default).",
    )
    parser.add_argument(
        "--skeleton-out-dir",
        default=str(DEFAULT_SKELETON_OUT_DIR),
        help="Output directory for skeleton-by-industry exports",
    )
    parser.add_argument(
        "--tracker",
        default=str(DEFAULT_TRACKER),
        help="Path to deletion/optional tracker markdown",
    )
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
    parser.add_argument("--industry", default="all", help="Industry key to export (or 'all')")
    args = parser.parse_args()

    bundle_path = Path(args.bundle)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    skeleton_out_dir = Path(args.skeleton_out_dir)
    if args.with_skeleton:
        skeleton_out_dir.mkdir(parents=True, exist_ok=True)
    tracker_entries = _parse_tracker(Path(args.tracker))
    applicability = _load_applicability(Path(args.applicability))
    scope_buckets = _load_scope_buckets(Path(args.scope_buckets))

    bundle = json.loads(bundle_path.read_text(encoding="utf-8"))
    available = sorted((bundle.get("industry_modules") or {}).keys())

    industries: list[str]
    if args.industry == "all":
        industries = available + ["generic"]
    else:
        industries = [args.industry]

    for industry in industries:
        relevant_tracker = _tracker_entries_for_industry(tracker_entries, industry)
        slice_obj = _slice_bundle(bundle, industry, tracker_entries, applicability, scope_buckets)
        (out_dir / f"{industry}.json").write_text(
            json.dumps(slice_obj, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        (out_dir / f"{industry}.md").write_text(
            _render_industry_markdown(
                bundle=bundle,
                industry=industry,
                tracker_entries=relevant_tracker,
                applicability=applicability,
                scope_buckets=scope_buckets,
            ),
            encoding="utf-8",
        )
        if args.with_skeleton:
            view = _build_industry_view(bundle, industry, applicability)
            skeleton_obj = {
                "industry": industry,
                "common_skeleton": view["common_skeleton"],
                "metadata": bundle.get("metadata", {}),
                "review_tracking": {
                    "source": "docs/Scope Review/deletion-optional-tracker.md",
                    "entries_for_industry": relevant_tracker,
                },
                "applicability": {
                    "source": "docs/scope-library/section-applicability.json",
                    "excluded_common_sections": view["excluded_common_sections"],
                    "replaced_common_sections": view["replaced_common_sections"],
                    "replaced_industry_sections": view["replaced_industry_sections"],
                    "added_industry_sections": view["added_industry_sections"],
                },
            }
            (skeleton_out_dir / f"{industry}.json").write_text(
                json.dumps(skeleton_obj, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            (skeleton_out_dir / f"{industry}.md").write_text(
                _render_skeleton_markdown(
                    bundle=bundle,
                    industry=industry,
                    tracker_entries=relevant_tracker,
                    applicability=applicability,
                ),
                encoding="utf-8",
            )

    if args.with_skeleton:
        readme_lines = [
            "# Skeleton-By-Industry Review Pack",
            "",
            "This folder provides a skeleton-only view per industry.",
            "",
            "Each file includes:",
            "- common skeleton bullets (from generic/common scope)",
            "- a list of that industry's section keys for comparison",
            "- tracker flags from `docs/Scope Review/deletion-optional-tracker.md`",
            "",
            "Use alongside:",
            "- `docs/scope-library/industries/<industry>.md` (full assembled view)",
            "- `docs/scope-library/industries/generic.md` (base generic reference)",
        ]
        (skeleton_out_dir / "README.md").write_text("\n".join(readme_lines) + "\n", encoding="utf-8")

    print(f"Wrote exports to: {out_dir}")
    if args.with_skeleton:
        print(f"Wrote skeleton exports to: {skeleton_out_dir}")


if __name__ == "__main__":
    main()

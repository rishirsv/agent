"""Shared scope assembly utilities for runtime and tooling.

This module centralizes applicability filtering, section ordering, scope-selection
parsing, and optional-scope merges so both distributions can stay aligned.
"""

from __future__ import annotations

from copy import deepcopy
import re
from typing import Any, Iterable, Optional


def normalize_lookup_key(value: str) -> str:
    """Normalize free-form keys into internal lookup shape."""
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower()).strip("_")


_HEADING_ACRONYMS = {
    "arr": "ARR",
    "spa": "SPA",
    "gaap": "GAAP",
}


def format_heading_from_key(value: str) -> str:
    """Format internal section keys into user-facing headings with acronym support."""
    key = normalize_lookup_key(value)
    if not key:
        fallback = str(value or "").replace("_", " ").strip()
        return fallback.title() if fallback else ""
    parts = [p for p in key.split("_") if p]
    return " ".join(_HEADING_ACRONYMS.get(p, p.capitalize()) for p in parts)


def build_industry_scope_view(
    *,
    scope_library: dict[str, Any],
    industry: str,
    applicability: Optional[dict[str, Any]],
    include_summary: bool = False,
) -> dict[str, Any]:
    """Build common + industry runtime view with applicability rules applied."""
    if not isinstance(applicability, dict):
        common = scope_library.get("common_skeleton", []) or []
        module = deepcopy((scope_library.get("industry_modules", {}) or {}).get(industry, {}))
        out = {
            "common_skeleton": common,
            "industry_module": module if isinstance(module, dict) else {},
        }
        if include_summary:
            out.update(
                {
                    "excluded_common_sections": [],
                    "replaced_common_sections": [],
                    "replaced_industry_sections": [],
                    "added_industry_sections": [],
                }
            )
        return out

    industry_norm = normalize_lookup_key(industry)

    section_applicability = applicability.get("section_applicability", {})
    common_rules: dict[str, Any] = {}
    if isinstance(section_applicability, dict):
        raw_common_rules = section_applicability.get("common_skeleton", {})
        if isinstance(raw_common_rules, dict):
            common_rules = raw_common_rules

    common_all = scope_library.get("common_skeleton", []) or []
    common_filtered: list[dict[str, Any]] = []
    excluded_common_sections: set[str] = set()
    for section in common_all:
        if not isinstance(section, dict):
            continue
        section_key = normalize_lookup_key(str(section.get("normalized_heading", "")))
        include = True
        rule = common_rules.get(section_key)
        if isinstance(rule, dict):
            include_for = {
                normalize_lookup_key(v)
                for v in (rule.get("include_for_industries") or [])
                if isinstance(v, str)
            }
            exclude_for = {
                normalize_lookup_key(v)
                for v in (rule.get("exclude_for_industries") or [])
                if isinstance(v, str)
            }
            if include_for and industry_norm not in include_for:
                include = False
            if industry_norm in exclude_for:
                include = False
        if include:
            common_filtered.append(deepcopy(section))
        elif section_key:
            excluded_common_sections.add(section_key)

    common_replacements_root = applicability.get("common_section_replacements", {})
    replaced_common_sections: set[str] = set()
    if isinstance(common_replacements_root, dict):
        common_index: dict[str, int] = {}
        for idx, section in enumerate(common_filtered):
            if not isinstance(section, dict):
                continue
            key = normalize_lookup_key(str(section.get("normalized_heading", "")))
            if key:
                common_index[key] = idx

        for section_key, replacement in common_replacements_root.items():
            normalized = normalize_lookup_key(section_key)
            if not normalized or normalized in excluded_common_sections:
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
                        key = normalize_lookup_key(str(section.get("normalized_heading", "")))
                        if key:
                            common_index[key] = idx
                    replaced_common_sections.add(normalized)
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
                    new_section["heading"] = format_heading_from_key(normalized)
            else:
                new_section["heading"] = format_heading_from_key(normalized)

            if existing_idx is not None:
                common_filtered[existing_idx] = new_section
            else:
                common_filtered.append(new_section)
                common_index[normalized] = len(common_filtered) - 1
            replaced_common_sections.add(normalized)

    modules = scope_library.get("industry_modules", {}) or {}
    raw_industry_module = modules.get(industry)
    industry_module = deepcopy(raw_industry_module) if isinstance(raw_industry_module, dict) else {}

    replacements_root = applicability.get("industry_section_replacements", {})
    replacements_for_industry: dict[str, Any] = {}
    if isinstance(replacements_root, dict):
        raw = replacements_root.get(industry)
        if isinstance(raw, dict):
            replacements_for_industry = raw

    additions_root = applicability.get("industry_section_additions", {})
    additions_for_industry: dict[str, Any] = {}
    if isinstance(additions_root, dict):
        raw = additions_root.get(industry)
        if isinstance(raw, dict):
            additions_for_industry = raw

    replaced_industry_sections: set[str] = set()
    for section_key, bullets in replacements_for_industry.items():
        if not isinstance(section_key, str) or not isinstance(bullets, list):
            continue
        normalized_section = normalize_lookup_key(section_key)
        clean_bullets = [deepcopy(b) for b in bullets if isinstance(b, dict)]
        if clean_bullets:
            industry_module[section_key] = clean_bullets
        else:
            industry_module.pop(section_key, None)
        if normalized_section:
            replaced_industry_sections.add(normalized_section)

    added_industry_sections: set[str] = set()
    for section_key, bullets in additions_for_industry.items():
        if not isinstance(section_key, str) or not isinstance(bullets, list):
            continue
        normalized_section = normalize_lookup_key(section_key)
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
            added_industry_sections.add(normalized_section)

    out: dict[str, Any] = {
        "common_skeleton": common_filtered,
        "industry_module": industry_module if isinstance(industry_module, dict) else {},
    }
    if include_summary:
        out.update(
            {
                "excluded_common_sections": sorted(excluded_common_sections),
                "replaced_common_sections": sorted(replaced_common_sections),
                "replaced_industry_sections": sorted(replaced_industry_sections),
                "added_industry_sections": sorted(added_industry_sections),
            }
        )
    return out


def ordered_active_section_keys(
    *,
    common_keys_in_order: list[str],
    module_keys_in_order: list[str],
    excluded_section_keys: Optional[set[str]] = None,
    scope_buckets: Optional[dict[str, Any]] = None,
) -> list[str]:
    """Compute stable section ordering with optional bucket + anchor rules."""
    excluded = excluded_section_keys or set()
    active_common = [k for k in common_keys_in_order if isinstance(k, str) and k and normalize_lookup_key(k) not in excluded]
    active_module = [k for k in module_keys_in_order if isinstance(k, str) and k and normalize_lookup_key(k) not in excluded]

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
        section = normalize_lookup_key(str(rule.get("section", "")))
        before = normalize_lookup_key(str(rule.get("before", "")))
        after = normalize_lookup_key(str(rule.get("after", "")))
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


def coerce_scope_bullet(raw: Any) -> Optional[dict]:
    """Coerce a bullet payload to canonical dict shape."""
    if isinstance(raw, str):
        text = raw.strip()
        if not text:
            return None
        return {"text": text}

    if not isinstance(raw, dict):
        return None

    text = raw.get("text")
    if not isinstance(text, str) or not text.strip():
        return None

    node: dict[str, Any] = {"text": text.strip()}
    bullet_id = raw.get("id")
    if isinstance(bullet_id, str) and bullet_id.strip():
        node["id"] = bullet_id.strip()

    children = raw.get("children")
    if isinstance(children, list):
        clean_children: list[dict] = []
        for child in children:
            clean_child = coerce_scope_bullet(child)
            if clean_child:
                clean_children.append(clean_child)
        if clean_children:
            node["children"] = clean_children

    return node


def coerce_scope_bullet_list(raw: Any) -> list[dict]:
    """Coerce bullet payload (single/list/mixed) into clean list."""
    values: list[Any]
    if isinstance(raw, list):
        values = raw
    else:
        values = [raw]
    clean: list[dict] = []
    for value in values:
        node = coerce_scope_bullet(value)
        if node:
            clean.append(node)
    return clean


def append_unique_bullets(target: list[dict], incoming: list[dict]) -> int:
    """Append non-duplicate bullets to target list."""
    existing_ids = {
        str(node.get("id")).strip()
        for node in target
        if isinstance(node, dict) and isinstance(node.get("id"), str) and str(node.get("id")).strip()
    }
    existing_text = {
        str(node.get("text", "")).strip().lower()
        for node in target
        if isinstance(node, dict) and isinstance(node.get("text"), str)
    }

    added = 0
    for node in incoming:
        if not isinstance(node, dict):
            continue
        node_id = str(node.get("id")).strip() if isinstance(node.get("id"), str) else ""
        node_text = str(node.get("text", "")).strip().lower()
        if node_id and node_id in existing_ids:
            continue
        if not node_id and node_text and node_text in existing_text:
            continue
        target.append(deepcopy(node))
        added += 1
        if node_id:
            existing_ids.add(node_id)
        if node_text:
            existing_text.add(node_text)

    return added


def parse_scope_selection(scope_selection: Optional[dict[str, Any]]) -> dict[str, Any]:
    """Normalize scope selection payload into canonical sets/maps."""
    excluded_top_level_ids: set[str] = set()
    excluded_section_keys: set[str] = set()
    optional_section_keys: set[str] = set()
    ad_hoc_optional_sections: dict[str, list[dict]] = {}
    ad_hoc_sections_normalized_from_list: set[str] = set()
    ad_hoc_sections_invalid_items: list[str] = []

    def _add_ad_hoc_entry(section_key: Any, raw_bullets: Any, *, source: str) -> None:
        normalized = normalize_lookup_key(str(section_key))
        if not normalized:
            ad_hoc_sections_invalid_items.append(f"{source}: missing section key")
            return
        bullets = coerce_scope_bullet_list(raw_bullets)
        if not bullets:
            ad_hoc_sections_invalid_items.append(f"{source}: no valid bullets for '{normalized}'")
            return
        existing = ad_hoc_optional_sections.get(normalized)
        if isinstance(existing, list):
            append_unique_bullets(existing, bullets)
        else:
            ad_hoc_optional_sections[normalized] = bullets

    if isinstance(scope_selection, dict):
        for raw_id in (
            scope_selection.get("excluded_top_level_ids", [])
            or scope_selection.get("exclude_top_level_ids", [])
            or scope_selection.get("excluded_top_level_bullet_ids", [])
            or []
        ):
            if isinstance(raw_id, str) and raw_id.strip():
                excluded_top_level_ids.add(raw_id.strip())

        for key in (
            scope_selection.get("excluded_section_keys", [])
            or scope_selection.get("excluded_sections", [])
            or []
        ):
            normalized = normalize_lookup_key(str(key))
            if normalized:
                excluded_section_keys.add(normalized)

        for key in (
            scope_selection.get("optional_section_keys", [])
            or scope_selection.get("include_optional_section_keys", [])
            or scope_selection.get("optional_sections", [])
            or []
        ):
            normalized = normalize_lookup_key(str(key))
            if normalized:
                optional_section_keys.add(normalized)

        raw_ad_hoc = (
            scope_selection.get("ad_hoc_optional_sections", {})
            or scope_selection.get("ad_hoc_sections", {})
            or {}
        )
        if isinstance(raw_ad_hoc, dict):
            for section_key, raw_bullets in raw_ad_hoc.items():
                if not normalize_lookup_key(str(section_key)):
                    continue
                _add_ad_hoc_entry(section_key, raw_bullets, source=f"ad_hoc_optional_sections['{section_key}']")
        elif isinstance(raw_ad_hoc, list):
            for idx, item in enumerate(raw_ad_hoc):
                if not isinstance(item, dict):
                    ad_hoc_sections_invalid_items.append(f"ad_hoc_optional_sections[{idx}]: expected object")
                    continue
                section_key = (
                    item.get("section_key")
                    or item.get("normalized_heading")
                    or item.get("heading")
                )
                raw_bullets = item.get("bullets")
                if raw_bullets is None:
                    raw_bullets = item.get("default_bullets")
                _add_ad_hoc_entry(
                    section_key,
                    raw_bullets,
                    source=f"ad_hoc_optional_sections[{idx}]",
                )
                normalized = normalize_lookup_key(str(section_key))
                if normalized and normalized in ad_hoc_optional_sections:
                    ad_hoc_sections_normalized_from_list.add(normalized)
        elif raw_ad_hoc:
            ad_hoc_sections_invalid_items.append(
                f"ad_hoc_optional_sections: unsupported type '{type(raw_ad_hoc).__name__}'"
            )

    return {
        "excluded_top_level_ids": excluded_top_level_ids,
        "excluded_section_keys": excluded_section_keys,
        "optional_section_keys": optional_section_keys,
        "ad_hoc_optional_sections": ad_hoc_optional_sections,
        "ad_hoc_sections_normalized_from_list": sorted(ad_hoc_sections_normalized_from_list),
        "ad_hoc_sections_invalid_items": ad_hoc_sections_invalid_items,
    }


def _synth_optional_bullets_for_unknown(section_key: str) -> list[dict[str, Any]]:
    title = format_heading_from_key(section_key).strip()
    display = title if title else "optional analysis"
    return [
        {
            "id": f"scope.opt.ad_hoc.{section_key[:24] or 'custom'}",
            "text": f"Perform additional optional analysis related to {display}, including:",
            "children": [
                {"text": "Targeted procedures tailored to transaction priorities, where applicable;"},
                {"text": "Assessment of potential impact on earnings, cash flow, or balance sheet presentation; and"},
                {"text": "Discussion of key assumptions, data dependencies, and limitations."},
            ],
        }
    ]


def apply_optional_scope_modules(
    *,
    common_skeleton: list[dict[str, Any]],
    industry_module: dict[str, Any],
    industry: str,
    optional_library: Optional[dict[str, Any]],
    optional_section_keys: set[str],
    ad_hoc_optional_sections: dict[str, list[dict]],
    enable_unknown_fallback: bool = True,
) -> dict[str, Any]:
    """Apply optional module bullets and ad hoc sections into active scope view."""
    applied_common: set[str] = set()
    applied_industry: set[str] = set()
    applied_ad_hoc: set[str] = set()
    unknown_requested: set[str] = set()
    synthesized_unknown: set[str] = set()
    added_bullets = 0

    common_modules: dict[str, Any] = {}
    industry_modules: dict[str, Any] = {}
    if isinstance(optional_library, dict):
        raw_common = optional_library.get("common_optional_modules")
        if isinstance(raw_common, dict):
            common_modules = raw_common
        raw_industry_root = optional_library.get("industry_optional_modules")
        if isinstance(raw_industry_root, dict):
            raw_for_industry = raw_industry_root.get(industry)
            if isinstance(raw_for_industry, dict):
                industry_modules = raw_for_industry

    common_index: dict[str, int] = {}
    for idx, section in enumerate(common_skeleton):
        if not isinstance(section, dict):
            continue
        key = normalize_lookup_key(str(section.get("normalized_heading", "")))
        if key:
            common_index[key] = idx

    for requested_key in sorted(optional_section_keys):
        if requested_key in common_modules:
            bullets = coerce_scope_bullet_list(common_modules.get(requested_key))
            if not bullets:
                continue
            existing_idx = common_index.get(requested_key)
            if existing_idx is None:
                common_skeleton.append(
                    {
                        "normalized_heading": requested_key,
                        "heading": format_heading_from_key(requested_key),
                        "default_bullets": deepcopy(bullets),
                    }
                )
                common_index[requested_key] = len(common_skeleton) - 1
                added_bullets += len(bullets)
                applied_common.add(requested_key)
                continue

            section = common_skeleton[existing_idx]
            existing_bullets = section.get("default_bullets")
            if not isinstance(existing_bullets, list):
                section["default_bullets"] = []
                existing_bullets = section["default_bullets"]
            added = append_unique_bullets(existing_bullets, bullets)
            if added > 0:
                added_bullets += added
                applied_common.add(requested_key)
            continue

        if requested_key in industry_modules:
            bullets = coerce_scope_bullet_list(industry_modules.get(requested_key))
            if not bullets:
                continue
            existing = industry_module.get(requested_key)
            if not isinstance(existing, list):
                industry_module[requested_key] = deepcopy(bullets)
                added_bullets += len(bullets)
                applied_industry.add(requested_key)
            else:
                added = append_unique_bullets(existing, bullets)
                if added > 0:
                    added_bullets += added
                    applied_industry.add(requested_key)
            continue

        unknown_requested.add(requested_key)

    for section_key, raw_bullets in (ad_hoc_optional_sections or {}).items():
        normalized_key = normalize_lookup_key(str(section_key or ""))
        if not normalized_key:
            continue
        bullets = coerce_scope_bullet_list(raw_bullets)
        if not bullets:
            continue
        existing = industry_module.get(normalized_key)
        if not isinstance(existing, list):
            industry_module[normalized_key] = deepcopy(bullets)
            added_bullets += len(bullets)
            applied_ad_hoc.add(normalized_key)
        else:
            added = append_unique_bullets(existing, bullets)
            if added > 0:
                added_bullets += added
                applied_ad_hoc.add(normalized_key)

    if enable_unknown_fallback:
        for section_key in sorted(unknown_requested):
            if section_key in ad_hoc_optional_sections:
                continue
            fallback_bullets = _synth_optional_bullets_for_unknown(section_key)
            existing = industry_module.get(section_key)
            if not isinstance(existing, list):
                industry_module[section_key] = deepcopy(fallback_bullets)
                added_bullets += len(fallback_bullets)
                applied_ad_hoc.add(section_key)
                synthesized_unknown.add(section_key)
            else:
                added = append_unique_bullets(existing, fallback_bullets)
                if added > 0:
                    added_bullets += added
                    applied_ad_hoc.add(section_key)
                    synthesized_unknown.add(section_key)

    return {
        "optional_section_keys_requested": sorted(optional_section_keys),
        "optional_sections_applied_common": sorted(applied_common),
        "optional_sections_applied_industry": sorted(applied_industry),
        "optional_sections_unknown": sorted(unknown_requested),
        "optional_sections_synthesized": sorted(synthesized_unknown),
        "ad_hoc_sections_applied": sorted(applied_ad_hoc),
        "optional_bullets_added": added_bullets,
    }

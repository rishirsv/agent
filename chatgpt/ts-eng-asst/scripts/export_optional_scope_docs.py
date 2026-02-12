#!/usr/bin/env python3
"""Generate review docs for optional scope library from JSON source of truth."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Iterable


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = PROJECT_ROOT / "dist" / "scope-library-optional.json"
DEFAULT_MD = PROJECT_ROOT / "docs" / "scope-library" / "optional-scope-library.md"
DEFAULT_JSON = PROJECT_ROOT / "docs" / "scope-library" / "optional-scope-library.json"


def _iter_nodes(nodes: Iterable[dict[str, Any]], depth: int = 0):
    for node in nodes:
        if not isinstance(node, dict):
            continue
        yield depth, node
        children = node.get("children")
        if isinstance(children, list):
            yield from _iter_nodes(children, depth + 1)


def _render_bullets(nodes: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for depth, node in _iter_nodes(nodes):
        text = node.get("text")
        if not isinstance(text, str) or not text.strip():
            continue
        node_id = node.get("id")
        label = f"({node_id}) {text}" if isinstance(node_id, str) and node_id.strip() else text
        lines.append(f"{'  ' * depth}- {label}")
    return lines


def build_markdown(payload: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# Optional Scope Library")
    lines.append("")
    lines.append(f"- Version: `{payload.get('version', 'n/a')}`")
    lines.append(f"- Runtime default: `{payload.get('runtime_default', 'unknown')}`")
    lines.append(f"- Status: `{payload.get('status', 'unknown')}`")
    lines.append("")

    description = payload.get("description")
    if isinstance(description, str) and description.strip():
        lines.append(description.strip())
        lines.append("")

    notes = payload.get("notes") or []
    if isinstance(notes, list) and notes:
        lines.append("## Notes")
        lines.append("")
        for note in notes:
            if isinstance(note, str) and note.strip():
                lines.append(f"- {note.strip()}")
        lines.append("")

    flow = payload.get("suggested_user_flow") or []
    if isinstance(flow, list) and flow:
        lines.append("## Suggested User Flow")
        lines.append("")
        for idx, step in enumerate(flow, start=1):
            if isinstance(step, str) and step.strip():
                lines.append(f"{idx}. {step.strip()}")
        lines.append("")

    decisions = payload.get("generalization_decisions") or {}
    if isinstance(decisions, dict):
        lines.append("## Generalization Decisions")
        lines.append("")
        for key in ["promoted_to_common_optional", "kept_as_industry_optional"]:
            values = decisions.get(key) or []
            lines.append(f"### {key}")
            lines.append("")
            if isinstance(values, list) and values:
                for value in values:
                    lines.append(f"- `{value}`")
            else:
                lines.append("_None._")
            lines.append("")

    common_modules = payload.get("common_optional_modules") or {}
    lines.append("## Common Optional Modules")
    lines.append("")
    if isinstance(common_modules, dict) and common_modules:
        for section_key in sorted(common_modules.keys()):
            lines.append(f"### `{section_key}`")
            lines.append("")
            bullets = common_modules.get(section_key)
            if isinstance(bullets, list) and bullets:
                lines.extend(_render_bullets(bullets))
            else:
                lines.append("_No bullets._")
            lines.append("")
    else:
        lines.append("_None._")
        lines.append("")

    lines.append("## Industry Optional Modules")
    lines.append("")
    industry_modules = payload.get("industry_optional_modules") or {}
    if isinstance(industry_modules, dict) and industry_modules:
        for industry in sorted(industry_modules.keys()):
            lines.append(f"### `{industry}`")
            lines.append("")
            module = industry_modules.get(industry)
            if not isinstance(module, dict) or not module:
                lines.append("_No industry optional sections._")
                lines.append("")
                continue
            for section_key in sorted(module.keys()):
                lines.append(f"#### `{section_key}`")
                lines.append("")
                bullets = module.get(section_key)
                if isinstance(bullets, list) and bullets:
                    lines.extend(_render_bullets(bullets))
                else:
                    lines.append("_No bullets._")
                lines.append("")
    else:
        lines.append("_None._")
        lines.append("")

    removed = payload.get("removed_from_optional_catalog") or []
    lines.append("## Removed from Optional Catalog")
    lines.append("")
    if isinstance(removed, list) and removed:
        lines.append("| Industry | Section Key | Rationale |")
        lines.append("|---|---|---|")
        for row in removed:
            if not isinstance(row, dict):
                continue
            industry = str(row.get("industry", "")).replace("|", "\\|")
            section_key = str(row.get("section_key", "")).replace("|", "\\|")
            reason = str(row.get("reason", "")).replace("|", "\\|")
            lines.append(f"| `{industry}` | `{section_key}` | {reason} |")
        lines.append("")
    else:
        lines.append("_None._")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Export optional scope docs")
    parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="Path to optional scope JSON source")
    parser.add_argument("--out-md", default=str(DEFAULT_MD), help="Output markdown path")
    parser.add_argument("--out-json", default=str(DEFAULT_JSON), help="Output json path")
    args = parser.parse_args()

    source = Path(args.source)
    payload = json.loads(source.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise SystemExit("Optional scope source must be a JSON object")

    out_json = Path(args.out_json)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    out_md = Path(args.out_md)
    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_md.write_text(build_markdown(payload), encoding="utf-8")

    print(f"OK: wrote {out_md}")
    print(f"OK: wrote {out_json}")


if __name__ == "__main__":
    main()

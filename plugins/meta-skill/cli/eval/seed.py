from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml


FENCED_YAML_RE = re.compile(r"```(?:yaml|yml)?\s*\n(.*?)```", re.DOTALL | re.IGNORECASE)


def extract_review_seed(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    for match in FENCED_YAML_RE.finditer(text):
        block = match.group(1)
        if "review_seed:" not in block:
            continue
        data = yaml.safe_load(block) or {}
        if not isinstance(data, dict) or "review_seed" not in data:
            continue
        seed = data["review_seed"] or {}
        if not isinstance(seed, dict):
            raise ValueError("review_seed must be a mapping")
        prompts = seed.get("prompts") or []
        if not isinstance(prompts, list):
            raise ValueError("review_seed.prompts must be a list")
        normalized: list[dict[str, Any]] = []
        for index, prompt in enumerate(prompts, start=1):
            if not isinstance(prompt, dict):
                raise ValueError(f"review_seed prompt {index} must be a mapping")
            if "id" not in prompt or "task" not in prompt:
                raise ValueError(f"review_seed prompt {index} must include id and task")
            row = dict(prompt)
            row.setdefault("topics", [])
            normalized.append(row)
        return normalized
    raise ValueError(
        f"{path} does not contain a fenced YAML review_seed block; create prompts manually or add a structured review_seed"
    )

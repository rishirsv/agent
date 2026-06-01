#!/usr/bin/env python3
"""Validate a skill project wrapper or portable skill root.

Engine module behind `meta-skill validate`. Shares description/frontmatter
regexes with create_skill.py in the same package.
"""

from __future__ import annotations

import argparse
import ast
import importlib.util
import re
import sys
import sysconfig
from pathlib import Path

from .create_skill import (
    ACTION_OBJECT_RE,
    FIRST_PERSON_RE,
    TRIGGER_CONTEXT_RE,
    TRIGGER_RE,
    VAGUE_DOMAIN_RE,
    WORKFLOW_SUMMARY_RE,
    SLUG_RE as NAME_RE,
)

PLACEHOLDER_RE = re.compile(
    r"((?<!`)UNIMPLEMENTED:|(?<!`)\bTODO\b(?!`)|(?<!`)\bTBD\b(?!`)|lorem ipsum|\[insert|\[specific|pending user approval|pending review|not run yet)",
    re.IGNORECASE,
)
GENERIC_FILLER_RE = re.compile(r"\b(resolved for sandbox validation|tbd after review|none after review)\b", re.IGNORECASE)
RESERVED_NAME_RE = re.compile(r"\b(anthropic|claude|openai|gpt)\b|^agent-", re.IGNORECASE)
WINDOWS_PATH_RE = re.compile(r"\b(?:references?|scripts|assets|docs)\\[A-Za-z0-9_.-]")
BAD_PATTERN_RE = re.compile(
    r"(as an ai language model|always be comprehensive|be as detailed as possible|do your best|ensure high quality|make it professional|\bsynerg(?:y|ize)\b|\bleverage\b|\butilize\b)",
    re.IGNORECASE,
)
INTERNAL_PROVENANCE_RE = re.compile(
    r"(adapted spec principles|borrow(?:ed)? these?|borrow(?:ed)? from|larger agent-process|larger process specs?|internal system specs?|system spec template|openai symphony|based on .*skill creator)",
    re.IGNORECASE,
)
RESEARCH_STYLE_RE = re.compile(
    r"\b(as noted by|as described in|academic citation|in (?:a|the) paper|cited paper)\b",
    re.IGNORECASE,
)
DEBRIS_NAMES = {"__pycache__", ".DS_Store", "node_modules", ".pytest_cache"}
DEBRIS_SUFFIXES = {".pyc", ".tsbuildinfo"}
HUMAN_DOC_NAMES = {"README.md", "CHANGELOG.md", "INSTALLATION_GUIDE.md", "INSTALL.md"}
TOP_LEVEL_ALLOWED = {"SKILL.md", "references", "scripts", "assets", "agents"}
NETWORK_MODULES = {"requests", "httpx", "urllib", "socket"}
OPENAI_INTERFACE_FIELDS = ("display_name", "short_description", "default_prompt")
BUILDER_TOOL_MARKER = "quick-validate: builder-tool"


class Reporter:
    def __init__(self) -> None:
        self.failures: list[str] = []
        self.warnings: list[str] = []

    def fail(self, message: str) -> None:
        self.failures.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)

    def print(self) -> None:
        for prefix, items in [("FAIL", self.failures), ("WARN", self.warnings)]:
            for item in items:
                print(f"{prefix}: {item}")
        if not self.failures and not self.warnings:
            print("OK: no failures or warnings")
            print("Skill is valid!")
        elif not self.failures:
            print(f"OK: no failures ({len(self.warnings)} warnings)")


def stdlib_modules() -> set[str]:
    # Python 3.9 exposes builtin names but not the full stdlib module set, so always
    # merge a conservative fallback instead of returning builtins alone.
    fallback = {
        "__future__", "argparse", "ast", "base64", "collections", "contextlib", "copy", "csv", "dataclasses", "datetime",
        "decimal", "email", "fnmatch", "functools", "glob", "gzip", "hashlib", "html", "io", "itertools", "json",
        "logging", "math", "operator", "os", "pathlib", "random", "re", "shutil", "sqlite3", "statistics", "string",
        "subprocess", "sys", "tempfile", "textwrap", "time", "typing", "unittest", "uuid", "xml", "zipfile",
    }
    return set(getattr(sys, "stdlib_module_names", ())) | set(sys.builtin_module_names) | fallback


STDLIB_MODULES = stdlib_modules()


def path_under(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def is_stdlib_import(module: str) -> bool:
    if module in STDLIB_MODULES:
        return True
    try:
        spec = importlib.util.find_spec(module)
    except (AttributeError, ImportError, ValueError):
        return False
    if spec is None:
        return False
    if spec.origin in {"built-in", "frozen"}:
        return True
    if not spec.origin:
        return False

    paths = sysconfig.get_paths()
    stdlib_raw = paths.get("stdlib")
    if not stdlib_raw:
        return False

    try:
        origin = Path(spec.origin).resolve()
        stdlib = Path(stdlib_raw).resolve()
        site_paths = [Path(paths[key]).resolve() for key in ("purelib", "platlib") if paths.get(key)]
    except (OSError, TypeError):
        return False

    return path_under(origin, stdlib) and not any(path_under(origin, site) for site in site_paths)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def find_project(path: Path, portable_dir: str = "skill") -> tuple[Path, Path, bool]:
    path = path.resolve()
    portable_dir = portable_dir.strip().strip("/\\") or "skill"
    if "/" in portable_dir or "\\" in portable_dir or portable_dir in {".", ".."}:
        raise SystemExit("error: --portable-dir must be a single relative folder name")
    if (path / portable_dir / "SKILL.md").exists():
        return path, path / portable_dir, True
    if (path / "SKILL.md").exists():
        return path, path, False
    raise SystemExit(f"error: no SKILL.md or {portable_dir}/SKILL.md found under {path}")


def parse_frontmatter(path: Path, reporter: Reporter) -> tuple[dict[str, str], str]:
    text = read(path)
    if not text.startswith("---\n"):
        reporter.fail(f"{path}: missing YAML frontmatter")
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        reporter.fail(f"{path}: unterminated YAML frontmatter")
        return {}, text
    raw = text[4:end]
    body = text[end + 5 :]
    data: dict[str, str] = {}
    lines = raw.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.lstrip().startswith("#"):
            i += 1
            continue
        if ":" not in line:
            reporter.warn(f"{path}: unsupported frontmatter line {line!r}")
            i += 1
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value in {">", ">-", ">+", "|", "|-", "|+"}:
            block: list[str] = []
            i += 1
            while i < len(lines) and (not lines[i].strip() or lines[i].startswith((" ", "\t"))):
                block.append(lines[i].strip())
                i += 1
            data[key] = ("\n" if value.startswith("|") else " ").join(item for item in block if item).strip()
            continue
        data[key] = value.strip("'\"")
        i += 1
    return data, body


def fail_placeholders(path: Path, reporter: Reporter) -> None:
    if not path.exists():
        return
    text = read(path)
    if not (PLACEHOLDER_RE.search(text) or GENERIC_FILLER_RE.search(text)):
        return
    reporter.fail(f"{path}: unresolved placeholder or unimplemented text remains")


def validate_frontmatter(skill_md: Path, expected_name: str, reporter: Reporter) -> dict[str, str]:
    data, _body = parse_frontmatter(skill_md, reporter)
    name = data.get("name", "")
    description = data.get("description", "").strip()

    extra = sorted(set(data) - {"name", "description"})
    if extra:
        reporter.warn(f"{skill_md}: extra frontmatter fields should be runtime-required, not decorative: {', '.join(extra)}")

    if not name:
        reporter.fail(f"{skill_md}: missing required frontmatter field 'name'")
    elif not NAME_RE.fullmatch(name):
        reporter.fail(f"{skill_md}: name must use lowercase letters, numbers, and single hyphens")
    elif name != expected_name:
        reporter.warn(f"{skill_md}: name {name!r} does not match expected folder slug {expected_name!r}")
    if name and len(name) > 64:
        reporter.fail(f"{skill_md}: name exceeds 64 characters")
    if name and RESERVED_NAME_RE.search(name):
        reporter.warn(f"{skill_md}: name includes a runtime-specific or reserved term")

    if not description:
        reporter.fail(f"{skill_md}: missing required frontmatter field 'description'")
    else:
        if len(description) > 1024:
            reporter.fail(f"{skill_md}: description exceeds 1024 characters")
        if len(description) < 60:
            reporter.warn(f"{skill_md}: description is short; include enough task, object, and boundary context for routing")
        if re.search(r"<[^>]+>", description):
            reporter.fail(f"{skill_md}: description contains XML/HTML-like tags")
        if FIRST_PERSON_RE.search(description):
            reporter.fail(f"{skill_md}: description must be third person, not first or second person")
        if not (TRIGGER_RE.search(description) or TRIGGER_CONTEXT_RE.search(description)):
            reporter.fail(f"{skill_md}: description lacks specific trigger context")
        elif not TRIGGER_RE.search(description):
            reporter.warn(f"{skill_md}: description should usually front-load trigger context with 'Use when' or equivalent")
        if WORKFLOW_SUMMARY_RE.search(description):
            reporter.warn(f"{skill_md}: description may summarize internal workflow instead of routing")
        if VAGUE_DOMAIN_RE.search(description) and not ACTION_OBJECT_RE.search(description):
            reporter.fail(f"{skill_md}: description is vague; include an action and object")
        if "not for" not in description.lower() and re.search(r"\b(skill|review|artifact|client|external|file|document|code)\b", description, re.IGNORECASE):
            reporter.warn(f"{skill_md}: description lacks an adjacent 'not for' boundary")
    return data


def markdown_links(text: str) -> list[str]:
    return re.findall(r"\[[^\]]+\]\(([^)]+)\)", text)


def inline_asset_refs(text: str) -> list[str]:
    return re.findall(r"`(assets/[A-Za-z0-9_.@ -]+)`", text)


def is_external_link(target: str) -> bool:
    return target.startswith(("http://", "https://", "mailto:", "#"))


def validate_links(skill_root: Path, skill_md: Path, reporter: Reporter) -> dict[str, set[Path]]:
    text = read(skill_md)
    linked: dict[str, set[Path]] = {"references": set(), "scripts": set(), "assets": set(), "all": set()}
    for target in markdown_links(text) + inline_asset_refs(text):
        if is_external_link(target):
            continue
        clean = target.split("#", 1)[0]
        if not clean:
            continue
        resolved = (skill_root / clean).resolve()
        try:
            rel = resolved.relative_to(skill_root.resolve())
        except ValueError:
            reporter.fail(f"{skill_md}: link escapes skill root: {target}")
            continue
        if not resolved.exists():
            reporter.fail(f"{skill_md}: linked path does not exist: {target}")
            continue
        linked["all"].add(resolved)
        if rel.parts and rel.parts[0] in linked:
            linked[rel.parts[0]].add(resolved)
    return linked


def validate_references(skill_root: Path, linked: dict[str, set[Path]], reporter: Reporter) -> None:
    refs = skill_root / "references"
    if not refs.exists():
        return
    for ref in refs.rglob("*.md"):
        if ref.resolve() not in linked["references"]:
            reporter.fail(f"{ref}: runtime reference is not directly linked from SKILL.md")
        if ref.parent != refs:
            reporter.fail(f"{ref}: runtime references must be one level deep and directly linked from SKILL.md")
        lines = read(ref).splitlines()
        top = "\n".join(lines[:60])
        if len(lines) > 100 and not re.search(r"^## (Contents|Scope|Reference Map)\b", top, re.IGNORECASE | re.MULTILINE):
            reporter.warn(f"{ref}: long reference lacks a scope map or table of contents near the top")
        fail_placeholders(ref, reporter)
    for ref in refs.rglob("*"):
        if ref.is_file() and ref.suffix != ".md":
            reporter.warn(f"{ref}: non-markdown runtime reference deserves review")


def py_imports(path: Path, reporter: Reporter) -> set[str]:
    try:
        tree = ast.parse(read(path), filename=str(path))
    except SyntaxError as exc:
        reporter.fail(f"{path}: Python syntax error: {exc}")
        return set()
    imports: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.add(alias.name.split(".", 1)[0])
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.add(node.module.split(".", 1)[0])
    return imports


def is_local_python_import(module: str, package_root: Path | None, script: Path, sibling_root: Path) -> bool:
    candidates = [
        sibling_root / f"{module}.py",
        sibling_root / module / "__init__.py",
        script.parent / f"{module}.py",
        script.parent / module / "__init__.py",
    ]
    if package_root is not None:
        candidates.extend([package_root / f"{module}.py", package_root / module / "__init__.py"])
    return any(path.exists() for path in candidates)


def docs_text(skill_root: Path) -> str:
    parts: list[str] = []
    for path in [skill_root / "SKILL.md", skill_root / "agents" / "openai.yaml"]:
        if path.exists():
            parts.append(read(path))
    return "\n".join(parts).lower()


def network_approved(text: str) -> bool:
    return bool(re.search(r"(network access approved|network calls approved|fetch urls approved|external requests approved)", text, re.IGNORECASE))


def yaml_scalar_value(text: str, key: str) -> str:
    match = re.search(rf"^\s*{re.escape(key)}\s*:\s*(.+?)\s*$", text, re.MULTILINE)
    if not match:
        return ""
    value = match.group(1).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def is_builder_tool_script(path: Path, skill_root: Path) -> bool:
    """Builder-owned tools opt into literal-token exemptions with a file marker."""
    scripts = skill_root / "scripts"
    if path.parent != scripts:
        return False
    try:
        head = "\n".join(read(path).splitlines()[:10])
    except OSError:
        return False
    return BUILDER_TOOL_MARKER in head


def validate_scripts(skill_root: Path, linked: dict[str, set[Path]], reporter: Reporter) -> None:
    scripts = skill_root / "scripts"
    if not scripts.exists():
        return
    all_docs = docs_text(skill_root)
    for script in scripts.rglob("*"):
        if not script.is_file():
            continue
        if script.parent != scripts:
            reporter.fail(f"{script}: runtime scripts must be one level deep")
        if script.resolve() not in linked["scripts"]:
            reporter.fail(f"{script}: runtime script is not directly linked from SKILL.md")
        if not is_builder_tool_script(script, skill_root):
            fail_placeholders(script, reporter)
        if script.suffix == ".py":
            imports = py_imports(script, reporter)
            for module in sorted(imports):
                if is_stdlib_import(module) or module == script.stem or is_local_python_import(module, None, script, scripts):
                    continue
                if module.lower() not in all_docs:
                    reporter.fail(f"{script}: non-stdlib import {module!r} requires dependency documentation")
            if imports & NETWORK_MODULES and not network_approved(all_docs):
                reporter.fail(f"{script}: network-capable import requires explicit network approval in runtime docs")
        else:
            reporter.warn(f"{script}: non-Python runtime script deserves manual review")
        text = read(script)
        if not is_builder_tool_script(script, skill_root) and re.search(r"\b(curl|wget)\b", text) and not network_approved(all_docs):
            reporter.fail(f"{script}: shell network command requires explicit network approval in runtime docs")


def validate_assets(skill_root: Path, linked: dict[str, set[Path]], reporter: Reporter) -> None:
    assets = skill_root / "assets"
    if not assets.exists():
        return
    for asset in assets.rglob("*"):
        if not asset.is_file():
            continue
        if asset.parent != assets:
            reporter.fail(f"{asset}: runtime assets must be one level deep")
        if asset.resolve() not in linked["assets"]:
            reporter.warn(f"{asset}: runtime asset exists but is not referenced from SKILL.md")
        if asset.stat().st_size == 0:
            reporter.fail(f"{asset}: runtime asset is empty")


def validate_optional_folders(skill_root: Path, reporter: Reporter) -> None:
    for folder_name in ["references", "scripts", "assets", "agents"]:
        folder = skill_root / folder_name
        if folder.exists() and not any(folder.iterdir()):
            reporter.fail(f"{folder}: optional runtime folder is empty")


def validate_generated_debris(skill_root: Path, reporter: Reporter) -> None:
    for path in skill_root.rglob("*"):
        if path.name in DEBRIS_NAMES or path.suffix in DEBRIS_SUFFIXES:
            reporter.fail(f"{path}: generated debris should not be committed")


def validate_payload_hygiene(skill_root: Path, reporter: Reporter) -> None:
    for path in skill_root.iterdir():
        if path.name not in TOP_LEVEL_ALLOWED:
            reporter.fail(f"{path}: portable payload may contain only SKILL.md, agents/, references/, scripts/, assets/, and cli/")
    for path in skill_root.rglob("*"):
        if path.is_file() and path.name in HUMAN_DOC_NAMES:
            reporter.fail(f"{path}: human-facing docs belong outside the portable runtime payload")
        if path.is_file() and path.suffix == ".md":
            line_count = len(read(path).splitlines())
            if line_count > 700:
                reporter.warn(f"{path}: reference exceeds 700 lines; consider splitting by job or variant if practical")
    for folder_name in ["references", "scripts", "assets"]:
        folder = skill_root / folder_name
        if not folder.exists():
            continue
        for child in folder.iterdir():
            if child.is_dir():
                reporter.fail(f"{child}: runtime {folder_name}/ contents must be flat, one level deep")


def validate_bad_patterns(skill_root: Path, reporter: Reporter) -> None:
    refs = skill_root / "references"
    runtime_paths = [skill_root / "SKILL.md", *(refs.rglob("*.md") if refs.exists() else [])]
    for path in runtime_paths:
        if not path.exists():
            continue
        text = read(path)
        if WINDOWS_PATH_RE.search(text):
            reporter.warn(f"{path}: use forward-slash runtime paths")
        for match in INTERNAL_PROVENANCE_RE.finditer(text):
            reporter.fail(f"{path}: remove internal provenance language near {match.group(0)!r}; write the skill as a cohesive standalone artifact")
        for match in RESEARCH_STYLE_RE.finditer(text):
            reporter.warn(f"{path}: research-style framing near {match.group(0)!r}; use direct runtime directives unless citation behavior is the task")
        for match in BAD_PATTERN_RE.finditer(text):
            reporter.warn(f"{path}: weak generated-skill wording near {match.group(0)!r}")


def validate_openai_metadata(skill_root: Path, reporter: Reporter, skill_name: str = "", required: bool = False) -> None:
    openai_yaml = skill_root / "agents" / "openai.yaml"
    if not openai_yaml.exists():
        if required:
            reporter.fail(f"{openai_yaml}: created wrapper project is missing required OpenAI/Codex metadata")
        return

    text = read(openai_yaml)
    if not re.search(r"^interface:\s*$", text, re.MULTILINE):
        reporter.fail(f"{openai_yaml}: missing interface section")
    for field in OPENAI_INTERFACE_FIELDS:
        if not yaml_scalar_value(text, field):
            reporter.fail(f"{openai_yaml}: missing interface.{field}")

    default_prompt = yaml_scalar_value(text, "default_prompt")
    if default_prompt and f"${skill_name}" not in default_prompt:
        reporter.fail(f"{openai_yaml}: interface.default_prompt should mention ${skill_name}")

    has_policy = "allow_implicit_invocation" in text
    has_false_policy = bool(re.search(r"allow_implicit_invocation\s*:\s*false\b", text))
    if has_policy and not has_false_policy:
        reporter.fail(f"{openai_yaml}: implicit invocation policy is present but not explicitly false")
    if has_false_policy:
        reporter.warn(f"{openai_yaml}: implicit invocation is disabled; confirm this is intentional")

    if re.search(r"^dependencies:\s*$", text, re.MULTILINE) and not re.search(r"^\s+tools:\s*$", text, re.MULTILINE):
        reporter.warn(f"{openai_yaml}: dependencies section needs manual review for supported OpenAI/Codex shape")


def validate_project(project: Path, skill_root: Path, is_wrapper: bool, linked: dict[str, set[Path]], reporter: Reporter, skill_name: str = "") -> None:
    for check in [validate_generated_debris, validate_payload_hygiene, validate_bad_patterns, validate_optional_folders]:
        check(skill_root, reporter)
    for check in [validate_references, validate_scripts, validate_assets]:
        check(skill_root, linked, reporter)
    fail_placeholders(skill_root / "SKILL.md", reporter)
    validate_openai_metadata(skill_root, reporter, skill_name, required=is_wrapper)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="meta-skill validate", description=__doc__)
    parser.add_argument("path", help="project wrapper path or portable skill root")
    parser.add_argument("--portable-dir", default="skill", help="portable skill folder inside a project wrapper")
    args = parser.parse_args(argv)

    reporter = Reporter()
    project, skill_root, is_wrapper = find_project(Path(args.path), args.portable_dir)
    skill_md = skill_root / "SKILL.md"
    expected_name = project.name if is_wrapper and skill_root.name == "skill" else skill_root.name
    frontmatter = validate_frontmatter(skill_md, expected_name, reporter)
    skill_name = frontmatter.get("name") or expected_name
    linked = validate_links(skill_root, skill_md, reporter)
    validate_project(project, skill_root, is_wrapper, linked, reporter, skill_name)
    reporter.print()
    if reporter.failures:
        raise SystemExit(1)

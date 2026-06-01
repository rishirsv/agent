# AGENTS.md

## Scope

These instructions apply within `skills/skills-factory/`. This folder **is** the Skills Factory product: the Codex plugin manifest, the shared CLI engine, the three skill payloads, and the project docs all live here in one tree.

Layout:

```
skills/skills-factory/
  SKILL.md             Perks wrapper skill that routes to the three factory lanes
  plugin.json          single Codex plugin manifest (name: skills-factory)
  cli/                 shared CLI engine (python3 -m cli)
  skills/              the three skill payloads scanned by the plugin
    skill-create/      SKILL.md, references/, scripts/, assets/, agents/
    skill-review/
    skill-improve/
  docs/                project specs (skill-create-spec.md, skill-review-spec.md, skill-improve-spec.md)
  AGENTS.md            this file
```

The three lanes (each a payload-rooted folder under `skills/`):

- `skills/skills-factory/skills/skill-create/` — create or update a reusable skill
- `skills/skills-factory/skills/skill-review/` — measure a skill with local evaluation runs
- `skills/skills-factory/skills/skill-improve/` — plan bounded improvements from review evidence

## Engine (`cli/`)

- `cli/` is the Python package implementing the shared `skillfactory` CLI binary.
- Run it via the repo-root shim `bin/skillfactory`, which executes `python3 -B -m cli` with `PYTHONPATH` set to this folder.
- The CLI expects Python 3 with PyYAML available.
- All verbs are implemented in the engine and run in-process. `create` / `validate` live in `cli/create_skill.py` and `cli/validate_skill.py`; `review` / `improve` live in `cli/review/` and `cli/improve/`. No lane payload contains a `scripts/` folder for the CLI to shell out to.
- The engine is repo infrastructure. Keep it under `cli/`, never inside a payload under `skills/`.

## Plugin (`plugin.json`)

- `plugin.json` is the single Codex plugin manifest. The plugin is named `skills-factory`.
- Its `"skills": "./skills/"` key points at the `skills/` folder, whose three subfolders are the real, payload-rooted skill directories (`SKILL.md` at the top of each). No symlinks.
- The plugin is the unit of install and use. Do not present the lanes as separately installable skills.

## Packaging

- The deliverable is the plugin (this folder), not per-lane zips.
- When packaging, exclude `docs/` and the `cli/` engine is included only if the package format requires it; ship `plugin.json` plus `skills/`.

## Validation

Validate each lane (never this folder) from the repo root:

```bash
skillfactory validate skills/skills-factory/skills/skill-create
skillfactory validate skills/skills-factory/skills/skill-review
skillfactory validate skills/skills-factory/skills/skill-improve
```

## Human Gates

A human must approve before packaging, installing into `.agents/skills/`, syncing to a marketplace, publishing, external writes, or promoting a candidate into canonical source.

# Validations

Read when authoring deterministic validations — pass/fail checks with no
judgment, run against the target.

Validations come in two tiers. Keep them straight, and keep the terminology
straight: **scripts** are a skill's runtime deterministic code; **tests** are the
deterministic checks this skill authors. Authored tests never live in a `scripts/`
directory.

## Two Tiers

| Tier | Scope | Form | Home | Durability |
|---|---|---|---|---|
| **General checks** | Every skill | Shipped **scripts** (`validate_skill.py`, `lint_authoring.py`) run by `run.py` | Plugin tree | Durable, shipped |
| **Skill-specific tests** | One target | Authored **tests** | Hidden `.meta-skill/` | Scratch — never committed |

General checks already exist and apply to any skill: skill body present, valid
YAML frontmatter, length bounds, deprecated-surface avoidance. Do not re-author
them per target.

Skill-specific tests are the craft of a good eval: incremental, deterministic
checks for behavior unique to *this* target — "run the skill on `fixtures/X`,
assert the output satisfies Y." They accumulate locally as a regression aid but
stay in the hidden workbench; they are never committed and never written into the
target's own repo.

## Runner Contract

A deterministic test is a script that accepts a target path and, with `--json`,
prints an object with integer `passed` and `total`. The shared `run.py` already
runs every conforming task in the general-checks folder and sums a combined
pass-rate; skill-specific tests follow the same contract.

> **Not yet wired:** whether `run.py` is extended to also discover the workbench
> tests (or the evaluator carries its own runner), and how deterministic
> validations run for non-skill artifacts, are open. Note the gap; do not fake a
> pass.

## Boundary With skill-doctor

A failure pattern general to *all* skills graduates to a shipped script (the
`skill-doctor` Verify path). A failure specific to *one* target stays a
skill-specific test in the workbench. Two accumulation paths, two homes.

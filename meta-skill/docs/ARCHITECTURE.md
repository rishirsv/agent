# meta-skill — Architecture

A full-stop-shop plugin for the **agent-skill lifecycle**: authoring a new skill,
improving an existing one, and measuring how well a skill performs. One thin
router front-ends three specialists.

> **Status:** in progress. The plugin package and build wiring exist.
> `skill-doctor` and `skill-evaluator` are specified in detail (SKILL.md +
> references); `skill-writer` has a detailed SKILL.md and `meta-skill` is the
> skinny router. Run `scripts/sync-plugins.sh` to ship the skills.

## Why this plugin

"Improve my skill" reduces to a small number of distinct intents, each with a
different *starting condition*. Authoring starts from a blank page. Improving
starts from an existing artifact plus a complaint or an audit. Measuring starts
from an existing artifact plus a need for evidence. A single mega-skill that
tries to do all three ends up mediocre at each, because the entry posture
differs. So the lifecycle is split by **intent + posture**, not by file type.

## Skill set

| Skill | User says… | Scope | Posture |
|---|---|---|---|
| **`meta-skill`** (router) | "help me with my skill" | Skinny, always-read front door. Explains the whole flow and routes to a specialist; orchestrates multi-step lifecycles. | Dispatch / orchestrate |
| **`skill-writer`** | "make a new skill" | Greenfield authoring from intent — scaffold `SKILL.md`, write the triggering description, choose structure, stub references. | Mutating, blank page |
| **`skill-doctor`** | "improve / fix / is my skill good?" | **Judge Review** (default, scored Quality page) *or* **Diagnose** (reproduce a reported failure) → **propose → approve → Edit → Verify**. Feedback is evidence, not edit authorization. | Proposes; edits on approval |
| **`skill-evaluator`** | "how well does it actually perform?" | Author an evaluation suite for a target — judge/human evaluations + deterministic validations — and run what can be mechanized. Specializes in skills; generalizes to any artifact. | Authors + measures |

Naming: all four are `skill-<role>` agent nouns. `skill-writer` is deliberately
**not** `skill-creator`, to avoid clashing with the system `skill-creator`
plugin (see [Relationship to system skill-creator](#relationship-to-system-skill-creator)).

## Front-door model

`meta-skill` is a **mandatory, always-read** front door with a **skinny
`SKILL.md`** that maps the entire flow. It owns the single broad trigger; the
three workers carry narrow, self-deferring descriptions so an ambiguous request
matches `meta-skill` rather than a worker.

- **Implicit / ambiguous entry** ("help me get my skill production-ready") →
  always routes through `meta-skill`.
- **Explicit invocation** ("use `skill-doctor`") → allowed to go direct, for
  users who already know the step they want.

Enforcement is by description, not mechanism: the workers remain real,
independently-invocable skills, so the front door is **strongly encouraged, not
hard-guaranteed**. That tradeoff is accepted in exchange for keeping the workers
usable on their own.

### Two-level routing

Routing happens at two altitudes that must never overlap:

- **`meta-skill` routes _across_ skills** — write vs doctor vs evaluate.
- **`skill-doctor` routes _within_ itself** — Judge Review vs Diagnose.

`meta-skill` never reaches inside a worker's job; a worker never re-routes across
the lifecycle.

## Boundary rules (non-overlap invariants)

These keep the four skills from fighting over the same triggers:

- **`skill-writer` vs `skill-doctor`** — blank page vs existing artifact.
- **`skill-doctor` vs `skill-evaluator`** — **"doctor reproduces one case;
  evaluator authors and measures many."** The doctor scores a skill's *static*
  text and may take *one* narrow in-loop run to reproduce a failure (Diagnose) or
  confirm a fix (Verify); `skill-evaluator` **authors** a reusable suite
  (`evals.json` + deterministic tests) and runs *many* live cases to quantify
  triggering, output quality, and variance.
- **`skill-doctor`'s Verify vs `skill-evaluator`** — Verify is the *light*
  in-loop confirm of a single fix that runs the shared general checks; it
  **escalates to `skill-evaluator`** when a systematic suite or multi-scenario
  measurement is wanted.

## skill-doctor internals

Two **modes** select the starting posture, then flow into a shared
**propose → approve → Edit → Verify** back half. The governing rule: the doctor
**never edits a skill without explicit human approval** — both modes propose,
the human approves, then edits land.

- **Judge Review** (default) — score the skill against the house-style rubric.
  *Normative*; no failure required. Writes a scored Quality page (`review.md`)
  with an Overall Quality Score + prioritized findings, then **stops** — it
  proposes, it does not edit on its own.
- **Diagnose** — reproduce the user's specific reported failure via one narrow
  in-loop run. *Empirical*. Localizes the cause and proposes the smallest fix.
- **Edit** — route, evidence, the Prompt Doctor Loop, and surgical rules. Apply
  only the approved change; smallest correct edit, to the
  **source** skill (never a generated package copy). *Feedback is evidence, not
  authorization* — edit only on an explicit make/apply/update/patch/fix.
- **Verify** — runs the deterministic **Verify tests** (`scripts/run.py`) to
  confirm the approved fix held and refresh the Verify-tests third of the score,
  plus a quick regression scan. After Diagnose, re-run the reproduced failure.
  Escalates to `skill-evaluator` for rigor.

Mode is a *soft* starting point chosen by the entry signal (a reproducible case
→ Diagnose; otherwise → Judge Review), not a cage — a run crosses over when that
solves the problem. Each stage owns a reference; Validation owns a script:

```
skills/skill-doctor/
├─ SKILL.md              # ## Mode Selection (Judge Review/Diagnose) + propose→approve→Edit→Verify
├─ scripts/
│  ├─ run.py             # Verify-tests runner: runs every task → combined %
│  ├─ validate_skill.py  # structural task: 11 deterministic checks
│  └─ lint_authoring.py  # authoring anti-patterns: 5 deterministic checks
└─ references/
   ├─ rubric.md          # Judge Review: phases, 0–3 scoring, math, review lanes
   ├─ diagnose.md        # Diagnose: reproduce + the one narrow run
   ├─ edit.md            # Edit: route, evidence, loop, surgical rules
   └─ verify.md          # Verify: run scripts/run.py, confirm, regression scan
```

### The Judge Review

`references/rubric.md` is an **owned**, scored rubric, **scoped to this repo's
house style** (not a universal authority — that would fork the system
`skill-creator`'s guidance). It produces an **Overall Quality Score** from three
phases:

- **Discovery** (LLM-judged, 4 dims × 0–3 → /12): specificity, completeness,
  trigger term quality, distinctiveness / conflict risk.
- **Implementation** (LLM-judged, 5 dims × 0–3 → /15): conciseness, actionability,
  workflow clarity, progressive disclosure, directive quality.
- **Verify tests** (deterministic, `scripts/run.py`, run by Verify):
  `validate_skill.py` (structure) + `lint_authoring.py` (mechanical authoring
  anti-patterns), scored as a pass-rate.

Discovery % = total / 12; Implementation % = total / 15; Verify-tests % =
passes / total; **Overall = rounded average of the three phase percentages.**
Averaging across *live eval scenarios* is out of scope here — the doctor scores
the static phases only. Each dimension carries inline anti-patterns drawn from
the authoring standard; the judgment ones score here, the mechanical ones run in
`lint_authoring.py`.

## Iteration workbench

Every meta-skill activity iterates in a shared, **gitignored** workbench created
in the *target skill's project root*: `<project>/.meta-skill/`. The project root
already names the skill and contains the portable skill payload at
`<project>/skill/`, so the workbench does not add another skill-name namespace.
It is local scratch, never committed (matched by `**/.meta-skill/` in
`.gitignore`), and is never written into `meta-skill/`'s own tree.

- `skill-doctor` writes `review.md` (the scored Quality page) and `spec.md`
  (durable notes: changed behavior, evidence, rejected edits, residual risk).
- `skill-evaluator` writes `evals.json` (judge-graded cases) and its
  skill-specific deterministic **tests** here — scratch only, never committed and
  never written into the target's own repo.
- A repo with many skills should treat each skill project as its own root rather
  than putting several skills under one `.meta-skill/` workbench.
- It is the surface where the **propose → approve** handoff is recorded before
  Edit touches the real skill files.

## skill-writer scope

Greenfield authoring: turn an intent into a well-formed skill — `SKILL.md`,
a triggering description, structure, and stubbed references. Distinct from
`skill-doctor` by starting condition (blank page).

## skill-evaluator scope

The **evaluation-suite author**. It masters a universal eval craft — anything can
be evaluated — and **specializes in skills**: for a target it authors a
two-pillar suite and runs the parts that can be mechanized. The doctor scores one
skill's *static* text and reproduces *one* case; the evaluator authors and runs
*many* live cases plus deterministic tests.

**Route by target.** An agent skill gets the built-in defaults (output-quality
dimensions + the shipped general checks). Any other artifact routes to a
principled **generalist rubric builder** that derives dimensions from the
artifact's job.

### Two pillars

- **Evaluations** — semantic, **judge- or human-graded**. Authored into
  `evals.json` in the workbench. Two prompt styles by case type: *quality* cases
  name the skill explicitly (`Use the $skill …`) to measure output given
  invocation; *triggering* cases use a natural request that never names the
  skill, run many times to measure fire-rate and variance. Human grading is not a
  parallel track — it **calibrates the judge**: a human labels a small `gold`
  subset, the judge is scored for agreement against it, and disagreements drive
  rubric refinement until the judge is trustworthy at scale.
- **Validations** — **deterministic**, two tiers:
  - *General checks* (skill body present, valid frontmatter, length, …) apply to
    every skill and ship with the plugin as **scripts** (the `validate_skill.py` /
    `lint_authoring.py` family run by `run.py`).
  - *Skill-specific tests* are bespoke to one target, authored incrementally.
    They live in the **hidden workbench**, are **never committed**, and are never
    written into the target's own repo.

### Terminology

- **scripts** = a skill's own *runtime deterministic code* (the target's internal
  scripts, and equally our shipped general checks). Authored tests never live in a
  `scripts/` dir.
- **tests** = the evaluator's authored deterministic tests; they live only in the
  hidden `.meta-skill/` workbench.

## Build & packaging

`meta-skill` is a **standalone plugin**, packaged for both Codex and Claude by
`scripts/sync-plugins.sh` alongside the `agent` plugin.

- **Source** (editable): `meta-skill/` — `docs/` (this doc) and `skills/`
  (one directory per skill; empty for now).
- **Generated** (do not hand-edit): `plugins/codex/meta-skill/` and
  `plugins/claude/meta-skill/`, plus `meta-skill` entries in both
  `marketplace.json` catalogs.
- **To add a skill:** create `meta-skill/skills/<name>/SKILL.md`, then run
  `scripts/sync-plugins.sh`.

While `meta-skill/skills/` is empty, the build generates the package skeleton and
manifests but holds the plugin out of marketplace registration — an empty plugin
fails CLI validation. Adding the first skill wires it in automatically.

## Relationship to system skill-creator

The installed system `skill-creator` plugin already claims "create / improve /
evaluate." This plugin deliberately does **not** depend on or wrap it. Renaming
the create skill to `skill-writer` avoids a *name* clash, but both would still
match a "create a skill" *trigger*. Resolution: once `skill-writer` ships,
**disable / stop installing the system `skill-creator`** so two skills do not
race for the same request.

## Open questions

- Whether `references/rubric.md` should later be promoted to a shared repo-level
  best-practices doc that both `skill-writer` and `skill-doctor` cite.
- Whether `meta-skill` should ship Codex/Claude subagents (none planned today).
- **Deterministic runner ownership** — whether `run.py` (today in
  `skill-doctor/scripts/`) is relocated to a shared home and extended to discover
  the evaluator's workbench tests, or `skill-evaluator` carries its own runner.
- **Triggering seeding** — the mechanism to seed a target skill into a clean
  environment so a natural prompt can actually fire it (deferred).
- **Non-skill validation execution** — the shipped checks are skill-oriented; how
  deterministic validations run for non-skill artifacts is unresolved.

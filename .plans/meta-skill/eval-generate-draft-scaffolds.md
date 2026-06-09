# Deterministic Draft Starter Evals (`eval generate`)

## Purpose

New skill projects start with empty eval coverage unless the user hand-authors
cases. Add `meta-skill eval generate <project> --count <n> --strategy
merge|replace [--dry-run]` that derives draft case seeds from the target
skill's description and body — explicitly labeled scaffolding, never release
proof. Tracker item "Generate Draft Starter Evals". True North: skill-evaluator
suite authoring; skill-writer's measurement handoff.

## Non-Goals

- No model calls; generation is deterministic from the payload text.
- No generated rubric auto-trust: generated cases carry a `generated` marker
  and require human review before gating anything.
- No overwriting hand-authored cases under `merge`.

## Source Files Likely Touched

- `meta-skill/src/meta_skill/generate.py` (new)
- `meta-skill/src/meta_skill/cli.py`
- `meta-skill/src/meta_skill/manifest.py` (generator-owned metadata marker,
  e.g. `"origin": "generated"` on case rows)
- `meta-skill/references/cli.md`
- `meta-skill/skills/skill-evaluator/references/evaluations.md` (scaffold
  labeling rules)
- `meta-skill/skills/skill-writer/SKILL.md` (one line: offer generation at the
  measurement handoff)

## Implementation Steps

1. Parse the target `SKILL.md`: name, description trigger phrases, `not for`
   boundary, headed workflow steps.
2. Derive case seeds deterministically:
   - one quality case per major workflow output ("do the job" with the skill
     named), seeded `task.seed` from the description's job phrase;
   - one trigger case from natural trigger language (never naming the skill);
   - one near-miss case from the `not for` boundary;
   - cap at `--count` (default 4).
3. Merge semantics: `merge` appends only case ids not present; `replace`
   removes only cases with `origin: "generated"` and regenerates; never touch
   hand-authored rows. `--dry-run` prints the change list.
4. Each generated case gets a `rubric.md` stub with anchored 0–3 levels and an
   explicit header: "GENERATED SCAFFOLD — review before trusting; not release
   evidence."
5. Lint pass: generated `task.md` must satisfy the visible-only rule (no
   metadata, no skill payload hints in trigger cases).

## Tests / Fixtures

- Fixture skill payloads: rich description with `not for`; minimal description;
  description missing trigger language (generation degrades gracefully and says
  what it could not derive).
- Tests for merge/replace/dry-run idempotence and hand-authored protection.
- JSON output golden files.

## Validation Commands

```sh
python3 meta-skill/src/characterize_meta_skill.py
scripts/meta-skill eval generate <fixture-project> --count 4 --strategy merge --dry-run --json
scripts/meta-skill eval generate <fixture-project> --strategy replace --json
scripts/meta-skill eval materialize --suite <fixture>/.meta-skill/evals.json --json
```

## Completion Criteria

- Same payload + same flags → byte-identical manifest changes (deterministic).
- Hand-authored cases provably untouched under both strategies.
- Generated artifacts visibly labeled scaffolding in manifest and rubric stubs.

## Stop Rule

If deterministic derivation produces useless seeds for a payload class (e.g.
reference-only skills), emit fewer cases and a stated reason. Do not add model
calls to compensate — that is a future, separate decision.

## Risks

- Seed quality ceiling is real; the value is structure + labeling, not clever
  tasks. Set expectations in the evaluations.md scaffold section.
- `origin` field is new manifest surface; keep schema_version 1 and treat
  unknown-field tolerance carefully in `load_manifest`.

## Handoff Notes

Future session-mining ("Skillify") would feed better seeds into this same
generator contract; keep `generate.py` input a plain payload-derived dict.

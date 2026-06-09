# Skill-Evaluator Methodology Reference Upgrade

## Purpose

`skill-evaluator` encodes mechanics (manifest, hidden boundary, calibration
loop, validators) but is missing the judgment layer of eval craft: split
discipline, repetitions/variance, failure taxonomy, baseline thinking,
scaffold-vs-proof, model-grade uncertainty, and when not to evaluate. Add one
new reference and tighten the existing three. Docs-only. True North:
skill-evaluator as the encoder of best-practice evaluation craft.

## Non-Goals

- No CLI or runner changes; everything here must be actionable with the
  current command surface.
- No new score math in skill-doctor's rubric.
- No generated-eval tooling (separate plan).

## Source Files Likely Touched

- `meta-skill/skills/skill-evaluator/references/methodology.md` (new)
- `meta-skill/skills/skill-evaluator/references/calibration.md`
- `meta-skill/skills/skill-evaluator/references/validations.md`
- `meta-skill/skills/skill-evaluator/references/evaluations.md`
- `meta-skill/skills/skill-evaluator/SKILL.md` (reference map row + 3–4 lines)

## Implementation Steps

1. New `references/methodology.md` ("Read when sizing, splitting, or trusting a
   suite"), covering compactly:
   - **Splits**: when train/dev/held-out matters (any loop that edits against
     scores — doctor iteration, future autoresearch); assignment rules (held-out
     cases authored after the candidate edit direction is chosen, never shown to
     an editor); small-suite guidance (below ~8 cases, prefer a single dev split
     plus a hard gate case over fake splits).
   - **Repetitions and variance**: repetitions default 1 for deterministic
     validators; 3–5 for trigger cases and judge-graded quality cases; report
     pass-rate spread, not just mean; variance that flips a gate means the case
     or rubric is underspecified.
   - **Failure taxonomy**: tag each failed trial with one of the doctor's
     classification set (activation, runtime clarity, output contract,
     resource, contamination, evidence, boundary, approval/control, validation
     gap) so failures hand to `skill-doctor` pre-classified.
   - **Baseline comparison**: why a no-skill baseline changes interpretation
     (skill lift vs model capability), pointing at the baseline candidate once
     it exists.
   - **Scaffolds vs proof**: generated cases and uncalibrated model grades are
     scaffolding/evidence; release claims require deterministic validators,
     calibrated judges, or human labels.
   - **When not to evaluate**: one-off fixes (doctor trial run), unstable
     drafts still changing shape, targets where a deterministic validator fully
     answers the question, suites whose maintenance cost exceeds the skill's
     usage.
2. `calibration.md`: add gold-slice sizing (5–10 trials per judged metric
   before scaling), re-audit cadence (re-label a fresh slice after any rubric
   or model change), and **model-grade uncertainty**: a judge metric is
   reported with its calibration status (uncalibrated / calibrated-on-N /
   drift-suspected); uncalibrated grades never gate promotion alone.
3. `validations.md`: add an ordering rule — prefer deterministic validators
   over judge dimensions wherever a check can be made exact; each judged
   criterion should state why it cannot be deterministic.
4. `evaluations.md`: add a **coverage statement** shape to report with every
   suite: cases by type/split, behaviors exercised, known untested behaviors.
5. `SKILL.md`: add the methodology row to the reference map; add "when not to
   evaluate" as a scope-step check; keep the body skinny (pointers, not
   content).

## Tests / Fixtures

- None beyond payload validation; this is reference content.

## Validation Commands

```sh
scripts/meta-skill validate meta-skill/skills/skill-evaluator
grep -n "methodology.md" meta-skill/skills/skill-evaluator/SKILL.md
scripts/sync-plugins.sh
```

## Completion Criteria

- All twelve requested concepts (calibration, gold labels, splits, taxonomy,
  baseline, variance, validators, coverage, scaffold-vs-proof, uncertainty,
  impact reporting, when-not-to-evaluate) are either in a reference or
  explicitly pointed at a tracker item (impact reporting → baseline plan).
- `SKILL.md` grows by ≤ 10 lines; depth lives in references.

## Stop Rule

Reference content must be executable with today's CLI. If a concept needs new
tooling to be actionable, write one sentence pointing at the tracker item and
stop — no speculative workflow prose.

## Risks

- Reference sprawl: methodology.md must stay under ~150 lines or it stops being
  read; cut to decision rules, not essays.
- Taxonomy must match doctor's edit.md classification list exactly to keep the
  handoff lossless.

## Handoff Notes

`skill-autoresearch` consumes the split and gate language defined here
verbatim. Keep terms: `train`, `dev`, `held-out`, `gold`, `gated best`.

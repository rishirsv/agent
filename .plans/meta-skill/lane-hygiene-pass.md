# Lane Hygiene And Doc-Drift Pass

## Purpose

Remove shipped-payload defects and doc drift that mislead agents today: the
router ships a "Scaffold" disclaimer, doctor references ship TODO sections,
`cli.md` omits real run artifacts and contains machine-specific paths,
`skill-evaluator` names a runner the CLI does not expose, and
`meta-skill/.meta-skill/docs/context.md` recommends a direction (case-folder
hard cut, worker-local scripts) that was superseded by the locked manifest-first
workbench. True North: every lane reads as production guidance, not drafts.

## Non-Goals

- No new CLI commands or runner behavior.
- No rubric/score-model changes.
- No new references (that is the methodology plan).

## Source Files Likely Touched

- `meta-skill/skills/meta-skill/SKILL.md`
- `meta-skill/skills/skill-doctor/references/diagnose.md`
- `meta-skill/skills/skill-doctor/references/verify.md`
- `meta-skill/skills/skill-evaluator/SKILL.md`
- `meta-skill/references/cli.md`
- `meta-skill/.meta-skill/docs/context.md` (delete or mark superseded)
- `.plans/WORK-TRACKER.md` (absorb the TODOs as tracker items)

## Implementation Steps

1. `meta-skill/SKILL.md`: delete the `*Scaffold — …*` line. Add one routing row
   and boundary line: trial/one-prompt testing → the owning lane's
   skill-trial-runs flow; packaging/validation requests → the CLI via the lane
   doing the work; "using a skill" (not working ON a skill) → not this plugin.
   Add a one-line orchestration stop rule (stop looping when the goal gate is
   met or the user must decide).
2. `diagnose.md` / `verify.md`: remove the `## TODO` sections. Move both items
   ("reproduce triggering vs behavior failures", "graduate recurring checks to
   `meta-skill/src/`") into `.plans/WORK-TRACKER.md`. In `diagnose.md`, replace
   the TODO with two sentences: triggering failures reproduce via a natural
   prompt in a clean child thread (see `skill-trial-runs.md`); behavior failures
   reproduce by forcing invocation with the failing input.
3. `skill-evaluator/SKILL.md` Run section: state explicitly that
   `codex_thread` is the Desktop child-thread trial route from
   `skill-trial-runs.md`, not an `eval run --runner` value; the CLI runners are
   `codex_app_server` and `codex_exec` only.
4. `cli.md`: add `evidence/<trial-id>.json` and
   `events/<trial-id>.judge.jsonl` to the authoritative run-files listing;
   replace the hard-coded `/Users/rishi/...` dogfood path with a
   `<plugin-cache-root>` placeholder; note `solver-workspaces/` as a run-scoped
   staging area.
5. `context.md`: delete it (superseded handoff; it contradicts evals.json
   authority and cites removed `skills/skill-doctor/scripts/run.py`). If any
   content is still load-bearing, fold one paragraph into `ARCHITECTURE.md`.
6. Reconcile `defaults.grader`: it is unused by code and shown differently in
   `evaluations.md` (`["judge"]`) vs `manifest.py` `DEFAULT_EVALS`
   (`["validate"]`). Remove the field from both doc example and default
   manifest (grading is already driven by case-folder contents).

## Tests / Fixtures

- Update `characterize_meta_skill.py` expectations if the default `evals.json`
  shape changes (grader field removal).
- No new fixtures.

## Validation Commands

```sh
scripts/meta-skill validate meta-skill/skills/meta-skill
scripts/meta-skill validate meta-skill/skills/skill-doctor
scripts/meta-skill validate meta-skill/skills/skill-evaluator
python3 meta-skill/src/characterize_meta_skill.py
grep -rn "Scaffold" meta-skill/skills/
grep -rn "TODO" meta-skill/skills/
scripts/sync-plugins.sh
```

## Completion Criteria

- No "Scaffold"/TODO text in shipped payloads; greps return nothing.
- `cli.md` lists every file the runner actually writes.
- `context.md` gone or clearly marked superseded with a pointer.
- Characterization suite passes; sync run.

## Stop Rule

Docs-and-payload edits only. If a fix requires changing runner/grading code
beyond removing the unused `grader` default, stop and split a new plan.

## Risks

- Removing `defaults.grader` changes the seeded manifest shape; characterization
  must be updated in the same commit.
- Router wording changes alter routing; re-read the description against the
  worker descriptions for overlap before committing.

## Handoff Notes

After this lands, the methodology plan (`evaluator-methodology-references.md`)
and report plan (`eval-report-command.md`) can proceed independently.

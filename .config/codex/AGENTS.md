# AGENTS.md

## General

- Use the `clarify` skill when requirements are ambiguous, assumptions need validation, or you're uncertain about a decision.
- Keep changes scoped to what was requested; avoid adjacent refactors unless asked. Avoid creating fall-back solutions unless asked.

## Git

- The git worktree may be dirty.
- Do not revert changes you didn't make unless explicitly requested (they may be user work or other agents' work).
- If changes are in unrelated files, ignore them; don't revert, check out, or restore.
- If asked to edit or commit and there are unrelated changes (including in files you didn't touch), do not revert, check out, or restore those files unless requested.
- Branch naming: `<project_name>/<description>`
- Don't create new branches or worktrees unless asked.
- Commit messages should describe user-visible impact (not implementation details).
- Group related edits into a single commit.

## Plans

- When exiting plan mode, save your plan to the project's docs folder:
- Active plan: `docs/exec-plans/active/<feature-slug>-plan.md`
- Completion move: `docs/exec-plans/active/<feature-slug>-plan.md` -> `docs/exec-plans/completed/<feature-slug>-plan.md`
- Plans should include phase outcomes (non-technical) and an implementation checklist.
  When implementing, confirm the plan exists and save it if it doesn't.
- Provide a non-technical explanation of what each phase of the plan achieves.
- Include a task list and update it as you implement the plan. Example:
  - [ ] 1.0 Parent task title
    - [ ] 1.1 Sub-task 1
    - [ ] 1.2 Sub-task 2
    - [ ] 1.3 Validation for 1.0 (tests, manual checks, or deliverable review)
- Do not create addendums to plans. Always one cohesive plan with all changes.

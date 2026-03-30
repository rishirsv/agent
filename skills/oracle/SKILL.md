---
name: oracle
description: "Prepare a second-opinion bundle for an external expert model by creating `prompt.md` and `context.zip`. Use only when the user explicitly asks to package repo context for Oracle, ChatGPT Pro, or another external expert review."
---

# Oracle

Prepare an "ask an expert" bundle for ChatGPT Pro or another external model that will review real repo context.

**Produces two artifacts:**
- `prompt.md`: paste as the message
- `context.zip`: upload alongside it (contains files plus `MANIFEST.md`)

**Good fits:** debugging, code review, architecture validation, research, prompt critique, or a careful second opinion on a risky change.

## Activation Rule

Activate this skill only when the user explicitly asks to prepare, package, or upload a second-opinion bundle for an external model or reviewer.

Do not auto-activate for:
- ordinary mentions of Oracle the company or database
- generic requests for a second opinion with no request to package repo context
- ordinary mentions of ChatGPT Pro that are not asking for a repo-context bundle

## Output Location

Write artifacts to `<project_root>/.agents/oracle/<feature-slug>/`.

## Prompting Principles

Prompt the downstream model like an operator, not a collaborator.

- Keep one clear task per bundle. Split unrelated asks into separate runs.
- Tell the model what "done" looks like instead of hoping it infers the goal.
- Use compact XML-style prompt blocks for stable structure.
- Prefer a better prompt contract over longer prose or "think harder" wording.
- Ground claims in `context.zip`; if something is inferred, have the model label it.
- Do not invite questions. Tell the model to proceed with assumptions and list unknowns.

Default prompt shape:
- `<task>`: the concrete job, relevant repo context, and expected end state
- `<structured_output_contract>` or `<compact_output_contract>`: exact answer shape and brevity
- `<default_follow_through_policy>`: what to do by default instead of asking routine questions
- `<verification_loop>` or `<completeness_contract>`: add for debugging, implementation, or high-risk reasoning
- `<grounding_rules>` or `<citation_rules>`: add for reviews, research, or anything that could drift into unsupported claims

Reusable blocks live in [reference/prompt-blocks.md](reference/prompt-blocks.md).
Common failure modes live in [reference/prompt-antipatterns.md](reference/prompt-antipatterns.md).
Ready-to-paste templates live in [reference/prompt-templates.md](reference/prompt-templates.md).
Custom assembly guidance lives in [reference/custom-prompt-guide.md](reference/custom-prompt-guide.md).

## Workflow

1. Understand the user's real question and reduce it to one clear downstream task.
2. Pick the downstream role.
3. Select the smallest file set that can support a grounded answer.
4. Choose the smallest prompt recipe that fits and add only the blocks that matter.
5. Write `prompt.md`.
6. Create `context.zip`.
7. Tell the user exactly what to paste, upload, and verify locally.

## Instructions

### 1) Choose the downstream role

Pick one from `reference/prompt-templates.md#role-values` and use it as `{ROLE}` in `prompt.md`:

| Task Type | Role |
|-----------|------|
| Code review | a staff engineer doing a careful code review for correctness and maintainability |
| Debugging | a senior engineer debugging a tricky issue with limited context |
| Architecture | a principal engineer reviewing system design |
| Security | a security engineer threat-modeling and reviewing deployment hardening |
| Performance | a performance engineer identifying bottlenecks and optimization opportunities |
| Data/SQL | a database engineer reviewing correctness and performance |
| UI/UX | an expert UI/UX designer doing a rigorous visual and interaction review |
| Prompting | a prompt engineer improving Codex or GPT-5.4 prompts for reliability and clarity |

### 2) Select files conservatively

Include the **smallest** set that can support a confident answer:

1. Start with README, architecture notes, conventions, or docs that define expected behavior.
2. Include the primary feature folder or the smallest complete slice of code involved.
3. Add the concrete files mentioned by the user: errors, stack traces, endpoints, functions, configs, or prompt files.
4. Add nearby dependencies only when they change the answer: callers, callees, shared types, config, validation, error handling.
5. Do one final check: "Would missing this file materially change the expert's conclusion?" If not, leave it out.

Never include secrets such as `.env` files, credentials, tokens, or raw private keys. Redact if a value is required for understanding.

### 3) Write `prompt.md`

Start from the smallest template in [reference/prompt-templates.md](reference/prompt-templates.md). If none fit, assemble a custom prompt using [reference/custom-prompt-guide.md](reference/custom-prompt-guide.md).

Prompt-writing rules:
- Assume the model knows nothing beyond `context.zip`.
- Tell it to read `context/MANIFEST.md` first.
- Use XML blocks consistently so the prompt has stable internal structure.
- Add only the blocks that matter for this task; do not dump every possible rule into every prompt.
- Require file-path citations for concrete claims.
- Prefer explicit output contracts over vague instructions.
- Do not ask the downstream model to ask questions; have it proceed with assumptions and list unknowns.

Block-selection defaults:
- Use `task` in every prompt.
- Add `structured_output_contract` when the response needs sections or numbered outputs.
- Add `compact_output_contract` when short prose is better than a rigid schema.
- Add `default_follow_through_policy` when the model should keep going without routine clarification.
- Add `verification_loop` for correctness-sensitive tasks.
- Add `completeness_contract` when the task should not stop at the first plausible answer.
- Add `grounding_rules` for code review, diagnosis, and repo-based reasoning.
- Add `citation_rules` for research or quoted source material.
- Add `action_safety` when asking for fix plans or change recommendations.
- Add `dig_deeper_nudge` for adversarial review or regression hunting.

### 4) Create `context.zip`

Use the installed skill path so the workflow works from any local repo:

```bash
ORACLE_SKILL_DIR="${ORACLE_SKILL_DIR:-$HOME/.codex/skills/oracle}"
if [ ! -d "$ORACLE_SKILL_DIR" ]; then
  ORACLE_SKILL_DIR="$HOME/.claude/skills/oracle"
fi

REPO_ROOT="$(pwd)" "$ORACLE_SKILL_DIR/scripts/oracle.sh" \
  --out ".agents/oracle/<slug>/context.zip" \
  --task "Summary of what downstream model should do" \
  --entry "path/to/folder::Main feature folder"
```

Direct Python form:

```bash
REPO_ROOT="$(pwd)" python3 "$ORACLE_SKILL_DIR/scripts/build-context-zip.py" \
  --repo-root "$REPO_ROOT" \
  --out ".agents/oracle/<slug>/context.zip" \
  --task "Summary" \
  --constraint "Key constraint" \
  --verify "Command to validate locally" \
  --entry "path/to/folder::Reason" \
  --entry "path/to/file.ts::Reason"
```

Useful options:
- `--entries-from <file>`: read entries from a file with one `PATH::REASON` per line
- `--dry-run`: preview the manifest without writing the zip
- `--estimate-tokens`: estimate bundle size before hand-off

### 5) Keep the bundle small

Run `--estimate-tokens` before hand-off when the bundle might be large.

If the estimate is big or the scope feels mushy:
- remove fixtures, snapshots, generated files, and unrelated tests
- narrow to the feature slice plus direct dependencies
- split unrelated questions into separate Oracle bundles instead of one overloaded prompt

Smaller, sharper bundles usually produce better answers than giant uploads with a vague task.

### 6) Hand-off

Tell the user:
- upload `context.zip`
- paste the contents of `prompt.md`
- treat the response as a second opinion, then verify locally with tests, logs, or manual checks

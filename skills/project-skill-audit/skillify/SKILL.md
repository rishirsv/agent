---
name: skillify
description: "Capture a repeatable workflow from the current session and turn it into a reusable skill. Use only when explicitly asked to convert work you just did into a checked-in repo skill or a local `.claude/skills` skill."
---

# Skillify

Turn the workflow from the current session into a reusable skill another agent can invoke later.

## Inputs

- Optional user description of the process to capture. Treat it as a hint, not the source of truth.
- The current session context: memory summaries, recent user messages, artifacts created during the session, and any user corrections or constraints.

## Step 1: Analyze The Session

Before asking questions, identify:

- The repeatable process that was actually performed
- The inputs or arguments the workflow needs
- The major steps, in order
- The success artifacts or completion criteria for each step
- The tools, permissions, and side effects involved
- Where the user corrected, narrowed, or refined the process
- Whether the workflow should run inline or in a forked agent

Focus on what would help another agent repeat the work reliably, not on narrating everything that happened.

## Step 2: Interview The User

Use `AskUserQuestion` for every question. Do not switch to plain-text questions once you start interviewing.

Keep the interview short and structured:

1. Confirm the skill name, one-line purpose, and success criteria.
2. Confirm where the skill should live:
   - Checked-in product skill for this repo: `skills/<name>/SKILL.md`
   - Repo-local workflow: `.claude/skills/<name>/SKILL.md`
   - Cross-repo personal workflow: `~/.claude/skills/<name>/SKILL.md`
3. Confirm the high-level steps and any arguments the skill should accept.
4. Confirm trigger phrases, explicit "use when" guidance, and any hard constraints or gotchas.

Use as few rounds as possible. Stop once the workflow is clear enough to encode well.

## Step 3: Draft The Skill

Before writing files, inspect one to three nearby skills in the target location so the new skill matches local conventions for frontmatter, tone, and structure.

When drafting:

- Keep the skill concise and procedural.
- Use imperative instructions.
- Preserve only the information another agent would need to repeat the workflow.
- Prefer simple sections over long explanations.
- Include concrete success criteria when the workflow has decision points or handoffs.
- Add arguments only when they are genuinely needed.
- Create extra resource directories only if the workflow truly needs scripts, references, or assets.

When the target is a checked-in skill directory, create the standard folder shape:

```text
<skill-name>/
  SKILL.md
  agents/openai.yaml
```

If `agents/openai.yaml` is missing, create it with human-facing metadata that matches the final skill.

## Step 4: Review Before Saving

Before writing the final file, show the complete proposed `SKILL.md` in a fenced Markdown block and ask the user for approval with `AskUserQuestion`.

If the user requests changes:

- Update the draft
- Show the revised full draft again
- Repeat until approved

## Step 5: Save And Report

After approval:

1. Create the skill directory if needed.
2. Write `SKILL.md`.
3. Write or update `agents/openai.yaml` if that location uses agent metadata.
4. Re-read the written files and verify that the saved content matches the approved draft.

Then report:

- Where the skill was saved
- How to invoke it
- Any arguments it accepts
- Any follow-up edits the user may want to make manually

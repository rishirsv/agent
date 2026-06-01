# Prompt Doctor

Read this when running a bounded edit cycle on an existing skill — review evidence in, smallest useful change out, fresh measurement, recorded decision. This is the substantive doctrine behind `skill-improve`'s `plan` → `run` → `decide` loop.

## Scope

- Review/edit mode selection and first-read checklist.
- Review lanes and comparison dimensions.
- Prompt-doctor loop, finding shape, surgical update rules, redesign boundaries, and review output.

Editing best practices for the *creation* phase live in the sibling `skill-create` skill's `references/design.md` and `references/structure.md`. This reference assumes those rules and applies them to bounded edits driven by review evidence.

## Review Or Edit Mode

First decide the mode from the user request:

| User asks for | Default mode |
|---|---|
| "review," "audit," "what would you change," "is this good" | Review-only findings |
| "update," "rewrite," "patch," "fix," "apply your changes" | Surgical edit |
| "redesign," "replace," "start over" | Redesign, while preserving explicit constraints |
| Ambiguous | Review-only findings, unless local context clearly authorizes edits |

If in review-only mode, do not silently rewrite files. Give findings and recommended edits first.

## First Read

Before changing anything, identify:

- skill name and folder
- current description and trigger contract
- core job
- linked references, scripts, assets, and metadata
- intended runtime surface
- status/release posture
- user's requested scope

Do not let a broad review request become an unbounded rewrite. Name the lanes you are reviewing, and separate deterministic validation from subjective judgment before recommending changes.

## Review Lanes

Use only the lanes that fit the request:

### Activation

- Does the description say when to use the skill?
- Does it name the task object and context?
- Does it include realistic user phrasing or file/context clues?
- Does it avoid workflow summaries?
- Is the nearest should-not-trigger boundary clear?
- Could it undertrigger because it is too polite or generic?

### Runtime clarity

- Is the opening job sentence useful?
- Are rules few and consequential?
- Is the workflow one clear default path before variants?
- Are stop/ask/approval points explicit?
- Does the output contract say what to produce and what to omit?
- Are the final checks observable?
- Would the skill's actual behavior surprise a user who read its description?
- Are gotchas specific, actionable, and non-duplicative when the skill is non-trivial?

### Resources

- Is every linked reference directly useful?
- Are long references navigable?
- Are scripts implemented, linked, documented, and dependency-clear?
- Are assets present and approved for runtime use?
- Are build notes, raw examples, and local docs kept out of runtime?
- Are organization-specific, engagement-specific, or sibling-project exemplar pointers absent from the portable runtime unless the skill is intentionally organization-specific?
- For source-derived skills, does the runtime `SKILL.md` avoid the four engagement-leak patterns documented in skill-create's `distillation.md` reference — claim rot, one-source overfit, encyclopedia bloat, and self-citation? Scan for concrete tokens (client names, dollar amounts, fiscal periods, file paths) as leak signals.

### Controls

- Are user files and web pages treated as material, not overriding instructions?
- Does review-facing output allow "no issues found"?
- Does artifact work include render/inspect/tie-out checks?
- Do consequential actions require approval?
- Are explicit-only invocation and metadata consistent?

### Project wrapper

- Is the portable skill directory self-contained?
- Is the project spec current?
- Are build notes outside runtime?
- Are there generated debris files or stale folders?
- Does OpenAI/Codex metadata follow the rules in skill-create's `structure.md` reference and match the spec's implicit-invocation policy?

When comparing alternatives, judge across activation clarity, actionability, evidence fidelity, corpus fit, simplicity, regression risk, and eval-seed usefulness. Do not let a strong aggregate impression hide a failure in one critical lane.

## Prompt Doctor Loop

When a review finds a real failure mode, treat the skill like a prompt that is accidentally encouraging the wrong behavior:

1. Name the observed fail state in plain language.
2. Separate common failure patterns from one-off edge cases.
3. Find the smallest surface that likely caused it: description, trigger boundary, example, workflow branch, output contract, reference pointer, or missing approval point.
4. Propose no more than four candidate edits, and prefer add/delete/replace patches over a full rewrite.
5. Apply only the smallest useful change that removes the encouragement, ambiguity, or missing cue.
6. Add a new global rule only when the agent would probably repeat the mistake without it.
7. Record the changed behavior, why the edit was chosen, and residual risk in the project spec.

Prefer replacing a misleading sentence over adding a prohibition. Prefer a concrete example or boundary over an abstract warning. Preserve unrelated behavior unless the user explicitly asks for redesign.

If run evidence exists, read the transcript, tool trace, and intermediate artifacts before editing. Look for wasted loops, repeated helper code, missing resource usage, and places where the skill nudged the agent toward the wrong path; do not patch from the final output alone when traces can show the cause.

When forward-testing through subagents or fresh runs, protect validation integrity: pass the skill, user-style task, and raw artifacts; do not pass the expected answer, suspected bug, intended fix, or prior conclusions unless that is the thing being tested. Keep test outputs outside the portable runtime payload.

Record plausible rejected edits when they matter: the idea, why it sounded tempting, and why it was not applied. Keep this in the project spec or review notes, not in the runtime skill.

For skills whose job is to update prompts, instructions, or other skills, consider a runtime section named `Failure Analysis`, `Change Discipline`, or `Rerun Case Guidance`. Those names are often clearer than a generic workflow because they tell the future agent what evidence to preserve before editing.

## Finding Shape

Order findings by severity and write each one as:

```markdown
### Finding: <specific issue>

Evidence: <file path and exact line or section when available>
Impact: <why future skill behavior suffers>
Fix: <smallest strong edit>
```

Avoid vague findings like "make it clearer." Say which phrase or section causes the risk and what replacement would improve behavior.

## Surgical Update Rules

When editing:

- Preserve name and folder unless rename is in scope.
- Preserve the user-approved trigger meaning.
- Preserve output contract, tone, and runtime surface unless they are the problem.
- Treat the `Operating Rules` block as protected. Land surgical edits in workflow, evidence, or output sections; change Operating Rules only when the user explicitly authorizes a rule change.
- Keep unrelated resources unchanged.
- Delete stale or unreferenced files only when they are clearly superseded or unsafe.
- Prefer updating an existing skill over creating a new one when the activation scenario already belongs to that skill.
- Prefer the smaller change when two edits protect behavior equally well.
- An edit that only restates existing guidance or trades one ambiguity for another is not an improvement — reject it. Runtime drift without measurable benefit is a regression.
- Make spec updates match the actual edits.
- Run deterministic validation before model or human judgment when checks exist.
- Keep behavior seed prompts and objective checks current when the update changes what a future eval should protect.
- Record the changed behavior and residual risk in the project spec.

## Redesign Rules

A redesign may restructure the skill architecture, but must still preserve explicit constraints from the user and repo.

Before redesigning, list the concepts being preserved. Typical preserved concepts:

- folder structure
- portable runtime boundary
- natural writing
- adaptive controls
- review language

Then replace the rest if a cleaner architecture improves generated-skill behavior.

## Common High-Value Fixes

- Rewrite a workflow-summary description into a trigger description.
- Move generic rules into final checks or local section guidance.
- Remove source-heavy boilerplate from skills that do not actually need it.
- Convert fake scripts/assets into planned resources in the spec, or implement them.
- For source-derived skills, diagnose along the four engagement-leak patterns documented in skill-create's `distillation.md` reference — claim rot, one-source overfit, encyclopedia bloat, self-citation — plus bad source classification, missing transformation type, or weak output checks. Patch the smallest surface; do not broaden a rule that already passes the Mechanism Gates.
- Add positive-null behavior to eval skills.
- Add approval gates before external actions or final client delivery.
- Add a direct reference map instead of nested references.
- Delete stale references that the body no longer uses.
- Add or sharpen gotchas for failure modes that are likely, non-obvious, and not already covered by workflow text.
- Prune extra rules when a simpler instruction protects the same behavior.

## Review Output

For review-only mode, report:

- verdict
- findings ordered by severity
- exact suggested replacements for language issues
- validation commands to run
- risks intentionally left unresolved

For edit mode, report:

- files changed
- behavior preserved
- behavior changed
- validation run and result
- residual risk left for user review

## How This Fits The Improve Loop

The `meta-skill improve plan` → `run` → `decide` skeleton records the bounded-edit *intent and decision*. This reference is the substantive doctrine the agent applies inside that loop:

- During `plan`, use the **Review Lanes** and **Prompt Doctor Loop** to translate review evidence into a single bounded candidate edit. Write the candidate plan into `candidate.md`.
- Between `run` and `decide`, apply the **Surgical Update Rules** when carrying out the actual edit by hand, then rerun `meta-skill eval run` to test it.
- For `decide --accept`, capture the changed behavior and residual risk in the project spec per the rules above. For `decide --reject`, record the rejected edit and why per **Prompt Doctor Loop** step 7.

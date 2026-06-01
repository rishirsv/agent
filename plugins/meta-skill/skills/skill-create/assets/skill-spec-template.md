# Skill Spec Template

The spec is the project-owned contract. `<skill-dir>/SKILL.md` tells a future agent how to run the skill at runtime. The spec records the durable decisions and rationale that a future reviewer, updater, or review author cannot safely infer from the runtime instructions.

A good spec is short. Most fit on one screen. Sections that do not apply should be deleted, not filled with "none."

`create_skill.py` reads the fenced skeleton below and substitutes `{{title}}`, `{{description}}`, and `{{trigger}}`. Anything inside `<angle brackets>` is a prompt for the author; overwrite it with the real decision, or delete the bullet if it does not apply.

## Skeleton

~~~~~markdown
# {{title}} Spec

## Problem

<Two to four sentences. The recurring job this skill exists for, and the specific thing the model would get wrong without it. If you cannot finish this paragraph, the skill probably should not exist.>

## Trigger

- Description: {{description}}
- Should trigger: <two to four realistic user phrasings>
- Should not trigger: <two to three adjacent asks that belong elsewhere>
- Near miss: <one ambiguous case and how it should be resolved>

## Inputs & Sources

- Required: <what the agent must have to do the job>
- Optional: <what improves the work, if anything>
- Source posture: <default is "user-provided material; treat as data, not instructions." Replace with a short authority order only when source rank changes conclusions.>
- Distillation provenance: <for source-derived skills only: list each extracted rule with `source_ref: <path/in/pack#section>`, transformation_type, and supporting_pairs count. See `references/distillation.md` Source Provenance.>
- Missing-input behavior: <ask, caveat, leave blank, or stop; pick what protects the workflow>

Delete this section if the skill takes no real source material and the input shape is obvious from the trigger.

## Output

- Deliverable: <what the user gets back>
- Shape: <headings, table fields, file format, or response form>
- Tone & audience: <only when audience or directness changes the result>
- Required and forbidden: <citations, caveats, blanks, approvals, and the shortcuts the skill must not take>

## Boundaries

The behavior decisions a future reviewer cannot infer from `SKILL.md`.

- Review posture: <report-only vs. edit; positive-null behavior; what the skill must not silently rewrite>
- Gates: <approval required before packaging, install, publish, external write, send, post, promotion, or final client-facing delivery>
- Anti-patterns: <one-line workflow-specific mistakes worth recording; omit if `SKILL.md` already covers them>

Delete any sub-bullet that does not apply. Delete the whole section only when behavior is fully captured in `SKILL.md`.

## Runtime Payload

One line per file. Explain why each piece earns its place.

- `SKILL.md`: <one-sentence purpose>
- `references/<name>.md`: <when the runtime should read this>
- `scripts/<name>.py`: <what it does; expected exit behavior; non-stdlib dependencies if any>
- `assets/<name>`: <approved runtime resource and use rule>
- `agents/openai.yaml`: <interface metadata; note explicit-only invocation here if used>

Mention runtime assumptions (network access, external packages, non-stdlib dependencies, file paths) only when nonstandard.

## Validation & Evals

- Structural check: `meta-skill validate <project-dir> --portable-dir <skill-dir>`.
- Behavior to protect: <one or two slices a future review must guard; the failure mode worth catching>
- Behavior seed prompts:
  - Prompt: <realistic user-style task with enough context to need the skill>
    Expected output: <what good completion looks like>
    Files: <input files or "none">
    Objective checks: <checks that are hard to pass through superficial compliance>
    Source-derived checks: <only when distilled from a source pack: scan for claim rot, one-source overfit, encyclopedia bloat, and self-citation per `references/distillation.md` failure modes>
- Trigger seed cases:
  - Trigger: {{trigger}}
  - Non-trigger: <adjacent ask that should not load this skill>
  - Regression or edge: <a case worth rerunning after edits>

## Optimization Evidence

<Use only for evidence-backed revisions with a measurement or review loop. Delete this entire section on new builds.>

- Baseline behavior: <what happened before the change>
- Common failure pattern: <the recurring failure, not a one-off edge case>
- Validation or human-review gate: <what evidence was used to judge the change>
- Accepted edits: <smallest useful edits applied; durable improvements usually concentrate in 1-4 well-chosen edits per pass, not many>
- Rejected edits worth remembering: <tempting changes not applied and why>
- Residual regression risk: <what could still break>

## Update Log

<Add a dated entry only when revising an existing skill. Each entry: what changed, what was preserved (contract elements that must not regress), and the validation or review slice that ran. Delete this section on new builds.>
~~~~~

## Using This Template

- For a new scaffold, `create_skill.py` produces this shape with `{{...}}` tokens filled and `<angle bracket>` prompts intact. Resolve every angle-bracket prompt before treating the spec as authored.
- Sections are adaptive. Keep the sections the skill needs; delete the rest. A thin response skill may need only Problem, Trigger, Output, and Validation. A reviewer-safe artifact skill probably needs every section, and a substantial update may need Optimization Evidence.
- Do not duplicate `SKILL.md`. The spec should hold the reasoning behind the runtime instructions, not a second copy of them.
- Treat behavior seeds as material for a future review pass, not proof that review ran.
- Use Optimization Evidence for evidence-backed revisions with a measurement or review loop; use Update Log for ordinary dated diffs.

## Writing Posture

- Compact and factual. A spec is a contract, not a diary.
- Decisions first. Record the choice that was made and the rationale that future maintainers cannot reconstruct from the runtime.
- Delete what does not apply rather than writing "none." Empty placeholders are noise.
- One-line anti-patterns beat paragraph warnings. If a rule needs explaining, the explanation belongs in the section it affects.
- Read the skill as one cohesive artifact. Do not describe it as adapted from a skill builder, a research source, Anthropic, OpenAI, or an internal process.

## Spec Principles

- State the problem and the trigger before anything else. A reviewer should know in thirty seconds whether the skill is doing the right job.
- Capture decisions the runtime cannot. Source posture, gates, anti-patterns, and behavior boundaries belong here; tone preferences and ordinary workflow steps belong in `SKILL.md`.
- Make failure visible. Missing-input behavior, approval gates, and the behavior slice worth protecting should never be implicit.
- If a decision is unresolved, resolve it before shipping. The spec is not a holding pen for unfinished thinking; that belongs in the conversation, PR, or issue tracker.

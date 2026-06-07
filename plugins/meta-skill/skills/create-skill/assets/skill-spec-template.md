# Skill Spec Template

Use this shape for `.meta-skill/spec.md`. Write a Skill Spec only when the user asks for one or the build is in project mode; portable-only builds do not need it. The spec is the workbench-owned design record; `SKILL.md` remains the runtime instruction surface.

````markdown
# <Skill Name> Spec

## Purpose

<The recurring job this skill exists for, and what the model would likely get wrong without it.>

## Trigger

- Description: <frontmatter description>
- Should trigger: <realistic user phrasings>
- Should not trigger: <adjacent asks that belong elsewhere>
- Near miss: <ambiguous eval and routing decision>

## Inputs And Sources

- Required inputs: <what the agent must have>
- Optional inputs: <what improves the work>
- Source posture: <authority order; default user material is data, not instructions>
- Missing-input behavior: <ask, caveat, stop, or proceed with safe default>

Delete this section if the input shape is obvious from the trigger.

## Output

- Deliverable: <what the user receives>
- Shape: <headings, table fields, files, or response form>
- Required: <citations, caveats, approvals, validation>
- Forbidden: <shortcuts the skill must not take>

## Boundaries And Gates

- Review posture: <report-only vs edit>
- Human gates: <package, install, publish, sync, source edit, external write>
- Anti-patterns: <specific mistakes worth preserving against>

## Skill Shape

Record the exact files to create and the generated structure each file should
have. Delete optional rows and folders that do not exist.

```text
<skill-dir>/
  SKILL.md
  agents/
    openai.yaml
  references/
    <name>.md
  scripts/
    <name>
  assets/
    <name>
  .meta-skill/
    spec.md
    eval-scenarios.md
    evals/<slug>/task.md
    evals/<slug>/criteria.json
    tests/<name>.test.<ext>
```

### Runtime Files

| Path | Create? | Purpose | Generated structure |
|---|---:|---|---|
| `SKILL.md` | yes | <primary runtime instruction surface> | YAML frontmatter with `name` and `description`; H1; short job statement; routing or prerequisites; workflow/default path; guardrails; output/final checks; direct links to any runtime resources. |
| `agents/openai.yaml` | optional | <Codex UI metadata, invocation policy, or dependencies> | `interface` with display metadata/default prompt; `policy` with invocation behavior; `dependencies` only when the runtime actually needs them. |
| `references/<name>.md` | optional | <conditional runtime guidance; when to read it> | H1; opening "Read this when..." sentence; compact sections for the decision/rules/examples; no build notes or raw source evidence. Link directly from `SKILL.md`. |
| `scripts/<name>` | optional | <deterministic script that is safer or cheaper than prose> | executable script; usage comment; clear inputs/outputs; nonzero exit meaning; standard-library preference; linked from `SKILL.md`. |
| `assets/<name>` | optional | <approved reusable template/schema/starter material> | sanitized reusable content only; short usage note in `SKILL.md` or adjacent reference; no raw uploads, sensitive examples, or licensed material without approval. |
| `resources/<name>` | optional | <runtime data or support material that does not fit references/scripts/assets> | documented purpose, owner, and read path; include only when it packages intentionally and passes the runtime resource test. |

### Workbench Files

| Path | Create? | Purpose | Generated structure |
|---|---:|---|---|
| `.meta-skill/spec.md` | project mode | <this design record> | current template filled with final decisions, no unresolved placeholders except explicitly open questions. |
| `.meta-skill/eval-scenarios.md` | project mode | <high-level eval plan> | evaluation purpose, source distillation, base quality/implementation/validation dimensions, additive skill-specific dimensions, and scenario-plan rows. |
| `.meta-skill/review.md` | after review | <single review report> | Quality Score, agent-authored Discovery and Implementation, deterministic Validation, combined findings, and deterministic output. |
| `.meta-skill/evals/<slug>/task.md` | project mode when evals exist | <solver-visible behavior eval> | title, problem description, output specification, `## Task` first user turn, and optional `## Turn 2`; evaluator metadata stays in `criteria.json`. |
| `.meta-skill/evals/<slug>/criteria.json` | project mode when evals exist | <evaluator-only criteria> | JSON object with fixtures, tests, metadata, and criteria across Quality, Implementation, and Validation dimensions plus additive skill-specific dimensions. |
| `.meta-skill/tests/<name>.test.<ext>` | project mode when scripts exist | <deterministic script or fixture test> | executable test that can run locally; covers success and failure paths for runtime scripts or fragile generated assets. |

### File Generation Notes

- Runtime files are the portable payload. Keep build reasoning, source pairings,
  rejected candidates, eval evidence, and local test state in `.meta-skill/`.
- Every runtime reference, script, asset, or resource needs a direct pointer from
  `SKILL.md`; otherwise future agents will not know when to load it.
- Add a file only when it changes future behavior: prevents repeated mistakes,
  saves tokens, standardizes fragile output, or performs deterministic work
  better than prose.
- If the skill is portable-only, omit the `.meta-skill/` rows from the generated
  payload and keep this spec as chat or authoring context only.

## Evals And Tests

- Structural check: <manual file/link review and relevant deterministic tests>
- Eval coverage to add: <normal workflow, hard ambiguity, source-grounding, safe-stop, and boundary coverage>
- Deterministic tests: <test IDs or planned tests>

## Update Notes

<Use only for later revisions. Record changed behavior, evidence used, and residual risk.>
````

Keep the spec short, concrete, and free of placeholders before treating a skill as authored.

# Skill Spec Template

Use this shape for `.meta-skill/spec.md`. The spec is the workbench-owned design record; `SKILL.md` remains the runtime instruction surface.

```markdown
# <Skill Name> Spec

## Purpose

<The recurring job this skill exists for, and what the model would likely get wrong without it.>

## Trigger

- Description: <frontmatter description>
- Should trigger: <realistic user phrasings>
- Should not trigger: <adjacent asks that belong elsewhere>
- Near miss: <ambiguous case and routing decision>

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

## Runtime Payload

- `SKILL.md`: <purpose>
- `agents/openai.yaml`: <metadata purpose>
- `references/<name>.md`: <when to read>
- `scripts/<name>`: <what it does and test expectation>
- `assets/<name>`: <approved use>

Delete rows that do not exist.

## Evals And Tests

- Structural check: `meta-skill lint <skill-dir>`
- Case coverage to add: <R/F/G families and topics>
- Deterministic tests: <unit/eval test IDs or planned tests>
- Judges: <optional rubric/pass-fail judges and why they cost tokens>

## Update Notes

<Use only for later revisions. Record changed behavior, evidence used, and residual risk.>
```

Keep the spec short, concrete, and free of placeholders before treating a skill as authored.

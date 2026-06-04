# Prompt Doctor

Read this when translating skill evidence into the smallest useful improvement.

## Mode Selection

| User asks for | Default mode |
|---|---|
| "review", "audit", "what would you change", "is this good" | Review-only findings |
| "update", "rewrite", "patch", "fix", "apply your changes" | Surgical edit |
| "redesign", "replace", "start over" | Redesign while preserving explicit constraints |
| Ambiguous | Review-only unless local context clearly authorizes edits |

If in review-only mode, do not silently rewrite files.

## First Read

Before changing anything, identify:

- skill name and folder
- current description and trigger contract
- core job
- linked references, scripts, assets, and metadata
- `.meta-skill/` evidence available
- user's requested scope

Do not let a broad review request become an unbounded rewrite.

## Evidence Sources

Valid improvement evidence includes:

- `meta-skill lint` failures or warnings
- `.meta-skill/evals/runs/<run-id>/facts.jsonl`
- `.meta-skill/evals/runs/<run-id>/cases/<case-folder>/final.md`
- `.meta-skill/evals/runs/<run-id>/cases/<case-folder>/rpc.jsonl`
- `tests.jsonl`, `grades.jsonl`, or `feedback.jsonl`
- case `case.md`, criteria, trace, final output, or artifacts
- concrete user-observed failure

If evidence is missing, ask the user to run `meta-skill lint` or `meta-skill run`, or to authorize a manual review path.

## Review Lanes

Use only lanes relevant to the request:

- Activation: trigger clarity, realistic phrasing, near misses, non-trigger boundary.
- Runtime clarity: default path, output contract, stop/ask points, final checks.
- Resources: linked references/scripts/assets, dependency clarity, source leakage, stale files.
- Controls: user files as data, approval gates, external writes, package/publish gates.
- Eval evidence: `.meta-skill/evals/` cases, `.meta-skill/tests/manifest.json`, judge quality, token usage visibility.

## Prompt Doctor Loop

1. Name the observed fail state in plain language.
2. Separate recurring failure pattern from one-off edge case.
3. Find the smallest likely source: description, boundary, example, workflow branch, output contract, reference pointer, script contract, or missing gate.
4. Propose no more than four candidate edits.
5. Apply only the smallest useful change that removes the ambiguity or wrong encouragement.
6. Add a broad rule only when the agent would likely repeat the mistake without it.
7. Record changed behavior, evidence, rejected tempting edits, and residual risk in `.meta-skill/spec.md` or the run decision evidence.

Prefer replacing a misleading sentence over adding a prohibition. Preserve unrelated behavior.

## Finding Shape

```markdown
### Finding: <specific issue>

Evidence: <file path, run ID, case ID, or exact section>
Impact: <why future skill behavior suffers>
Fix: <smallest strong edit>
```

Avoid vague findings like "make it clearer." Name the phrase, section, or evidence row causing the risk.

## Surgical Update Rules

- Preserve name and folder unless rename is in scope.
- Preserve user-approved trigger meaning.
- Preserve output contract, tone, and runtime surface unless they are the problem.
- Keep unrelated resources unchanged.
- Delete stale or unreferenced files only when clearly superseded or unsafe.
- Prefer smaller changes when two edits protect behavior equally well.
- Reject edits that restate existing guidance or trade one ambiguity for another.
- Update `.meta-skill/spec.md` when behavior changes.
- Keep candidate edits inside the portable payload: `SKILL.md`, `agents/`, `references/`, `scripts/`, `assets/`.

## Command Flow

```bash
meta-skill decide . --run <run-id> --evidence <path[:line]> --commit <sha> --accept
```

Edit the working payload directly, let the human approve the git diff, then use `decide` to record the evidence reference and approved commit.

## Output Contracts

For review-only mode, report findings ordered by severity, exact suggested replacements, validation commands, and risks intentionally left unresolved.

For edit mode, report files changed, behavior preserved, behavior changed, validation run and result, and residual risk.

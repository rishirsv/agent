# Review Criteria

Read this when completing `.meta-skill/review.md`.

The review mirrors the registry Quality page shape:

- one `Quality Score`
- `Discovery`
- `Implementation`
- `Validation`
- a combined severity-ordered findings list

The review artifact records deterministic validation evidence when available and provides a worksheet. The reviewing agent must complete Discovery, Implementation, the overall Quality Score, and combined findings. Do not fabricate Discovery, Implementation, validation rows, or judge-style scores.

When the target has eval planning or eval criteria, the review should mirror those dimensions. Read `.meta-skill/eval-scenarios.md` and any relevant `.meta-skill/evals/*/criteria.json`, then judge whether the skill can satisfy the same Quality, Implementation, and Validation dimensions it asks evals to measure. The base review dimensions stay fixed; eval dimensions are additive evidence lenses and findings sources, not a separate score framework.

## Review Flow

1. Create or open `.meta-skill/review.md` for the target skill when artifact writes are allowed.
2. Read the target `SKILL.md` and directly linked references needed to judge runtime behavior.
3. If present, read `.meta-skill/eval-scenarios.md` and relevant `.meta-skill/evals/*/criteria.json` to identify the skill's declared Quality, Implementation, and Validation dimensions.
4. Use the criteria below to replace every `Agent review required` placeholder in `.meta-skill/review.md`.
5. Compute Discovery and Implementation scores from the completed dimensions, using declared eval dimensions as additional evidence for strengths or findings.
6. Use the deterministic Validation score already recorded in the artifact. Do not rescore Validation by feel.
7. Compute `Quality Score` as the average of Discovery, Implementation, and Validation percentages.
8. Merge deterministic validation findings with agent-authored Discovery, Implementation, and eval-dimension findings in severity order.

Do not add `Judge Score`, `Total Score`, confidence, basis, unavailable states, sidecar JSON, or review folders. Do not fabricate validation tables, deterministic test status, run IDs, or evidence paths. If the generated review lacks evidence needed for a claim, write a finding about the missing evidence instead of manufacturing it.

## Reasoning Standard

The completed review should read like a compact expert quality assessment, not a checklist fill-in.

- Write Discovery and Implementation overall assessments as 2-4 substantive sentences each.
- For each dimension, write 1-3 sentences that cite concrete evidence from the description, `SKILL.md` sections, reference links, deterministic output, or missing artifacts.
- Explain both the score and the tradeoff. If a dimension is `3`, say why it is strong enough to avoid a lower score. If it is `2` or lower, name the exact weakness and what would raise it.
- Prefer quoting short phrases or naming exact sections/files over summarizing vaguely.
- Mention interactions between dimensions when they matter, such as a strong description weakened by a generic name, or clear workflow weakened by oversized references.
- Keep scoring calibrated. Do not give all `3`s unless there are no meaningful routing, runtime, disclosure, or validation weaknesses.
- Findings should be deeper than the score table: include the observed defect, why it matters in agent behavior, and the smallest useful next step.

## Eval Dimension Alignment

Use this section whenever the target has `.meta-skill/eval-scenarios.md` or `.meta-skill/evals/*/criteria.json`.

- Extract declared dimensions from each eval criterion's `phase` and `dimension`.
- Keep the phase names fixed: `Quality`, `Implementation`, and `Validation`.
- Treat these dimensions as the target's own quality contract. If the skill's instructions do not teach agents how to satisfy a declared eval dimension, add a finding.
- Do not copy evaluator-only criteria into solver-visible task text or recommend doing so.
- Do not create a separate eval score inside the review. Use eval dimensions to inform Discovery, Implementation, findings, and next steps.
- Preserve deterministic Validation exactly as generated. Eval dimensions can explain validation gaps, but they cannot override deterministic evidence.

Common mapping:

| Eval phase | Review lens |
|---|---|
| Quality | Discovery and task-fit quality: trigger boundaries, completeness, specificity, conflict risk, and user-visible outcome expectations. |
| Implementation | Runtime guidance quality: actionability, workflow clarity, source handling, artifact shape, handoff discipline, and progressive disclosure. |
| Validation | Evidence quality: deterministic checks, artifact integrity, criteria privacy, score shape, proof limits, and deprecated-surface avoidance. |

## Score Calibration

Use strict but fair scoring.

| Score | Meaning |
|---:|---|
| 3 | Strong, specific, and ready for repeated agent use. Minor wording improvements would not materially change behavior. |
| 2 | Usable but meaningfully improvable. A future agent could still select or run the skill correctly, but there is a concrete weakness. |
| 1 | Weak or risky. The skill may be selected incorrectly, produce inconsistent work, or require the agent to infer missing process. |
| 0 | Missing, misleading, or actively unsafe for the dimension. |

Phase percentage is `phase total / 12`. Overall `Quality Score` is the rounded average of Discovery, Implementation, and Validation percentages.

## Discovery

Question: Based on the skill's description, can an agent find and select it at the right time?

Write a 2-4 sentence overall assessment before the table. Cover trigger clarity, natural user language, exclusions, and overlap risk. Do not simply restate the table.

| Dimension | Question | Scoring guidance |
|---|---|---|
| Specificity | Does the description name a concrete recurring job rather than a broad topic? | `3` concrete and scoped; `2` understandable but broad; `1` vague or mostly category-level; `0` absent/misleading. |
| Completeness | Does it say both what the skill does and when to use or not use it? | `3` what/when/not-for are clear; `2` one part is thin; `1` major trigger or boundary missing; `0` unusable. |
| Trigger Term Quality | Does it include natural terms users would actually say? | `3` strong natural and domain terms; `2` mostly technical/internal terms; `1` sparse trigger language; `0` not discoverable. |
| Distinctiveness Conflict Risk | Does it avoid overlap with nearby or generic skills? | `3` clear niche and exclusions; `2` likely usable with some overlap; `1` high conflict risk; `0` actively conflicts. |

## Implementation

Question: Does the skill give agents clear, useful runtime guidance?

Write a 2-4 sentence overall assessment before the table. Cover runtime path, output contract, reference strategy, stop/ask behavior, and whether guidance would change future agent behavior. Do not simply restate the table.

| Dimension | Question | Scoring guidance |
|---|---|---|
| Conciseness | Is the skill lean enough to read during work? | `3` tight and purposeful; `2` somewhat redundant/verbose; `1` hard to scan; `0` bloated or confusing. |
| Actionability | Does it tell the agent what to do or produce next? | `3` concrete steps, outputs, examples, checks, or commands; `2` usable but abstract; `1` mostly principles; `0` no operational guidance. |
| Workflow Clarity | Is the main path and important branching clear? | `3` clear default path and checkpoints; `2` mostly clear with gaps; `1` ambiguous sequencing; `0` no workflow. |
| Progressive Disclosure | Are optional details linked instead of bloating the main body? | `3` well-signaled local references; `2` acceptable but uneven; `1` details hidden or overstuffed; `0` broken/missing structure. |

## Validation

Validation is deterministic. Do not rescore it by feel.

The review artifact records:

- validation percentage
- validation pass/warning/failure table
- deterministic validation output

Use validation findings as evidence. If validation has warnings or failures, they must appear in the combined findings unless there is a more specific agent-authored finding that subsumes them. If validation output is absent, stale, or inconsistent with the review being completed, do not invent replacement rows; record that the evidence is missing and refresh the review artifact.

## Findings

Write findings only for issues that materially affect discovery, implementation, validation, or later improvement work. A finding should be specific enough that another agent can apply the fix without redoing the whole review.

Use this shape:

```md
### [High] <specific issue>

Source: Quality
Phase: Discovery | Implementation | Validation
Evidence: <exact phrase, section, criterion, file, or deterministic output>
Impact: <why future skill behavior suffers>
Fix: <smallest useful change>
Next Step: <exact edit or validation action>
```

Findings must name the observed defect. Avoid vague findings like "make it clearer" or "improve implementation."

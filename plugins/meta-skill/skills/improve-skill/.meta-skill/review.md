# Skill Review

Skill: improve-skill
Target: /Users/rishi/Code/agent/plugins/meta-skill/skills/improve-skill
Generated: 2026-06-06T19:13:19.532Z

## Score

Quality Score: 97%
Validation Score: 100%

## Quality

### Discovery

Based on the skill's description, can an agent find and select it at the right time? Clear, specific descriptions lead to better discovery.

Overall Assessment: The description is strongly discoverable for existing-skill improvement work. It names natural user requests such as "improve a skill," "review a skill," "fix my skill," and "update a skill," while also naming concrete evidence sources and editable payload surfaces. The exclusions clearly route creation, eval execution, broad rewrites, packaging, installing, and publishing away from this lane. Overlap risk is low because the description frames this as evidence-backed work on an existing reusable skill rather than general docs, eval, or implementation work.

| Dimension | Reasoning | Score |
|---|---|---:|
| Specificity | The description names a concrete recurring job: evidence-backed changes to an existing reusable skill. It also names specific artifacts such as `review.md`, `SKILL.md`, references, scripts, and assets, which keeps the lane from reading like a broad prompt-quality topic. | 3 |
| Completeness | It covers what the skill does, when to use it, what evidence it incorporates, and what not to use it for. The not-for list cleanly separates creation, eval execution, packaging, installing, and publishing. | 3 |
| Trigger Term Quality | User-facing phrases like "improve a skill," "review a skill," "fix my skill," and "update a skill" are likely real invocations. Internal terms such as `review.md`, eval, and trace are useful because this lane is also used by maintainers. | 3 |
| Distinctiveness Conflict Risk | Conflict risk with `create-skill` and `evaluate-skill` is low because the description explicitly excludes creating skills and running evals. Conflict with generic code review is also low because it names reusable skill payload files as the target. | 3 |
| Total | Strong discovery with clear trigger language and clear adjacent-skill boundaries. | 12 / 12 |

### Implementation

Reviews the quality of instructions and guidance provided to agents. Good implementation is clear, handles edge cases, and produces reliable results.

Overall Assessment: The implementation now has a clean three-route shape: clarify and diagnose by default, surgical edit only with explicit authorization, and evidence loop for evals, traces, subagents, or autonomous work. The previous edit-authorization ambiguity is fixed: payload edits now require both evidence and user authorization. The artifact-write boundary for `.meta-skill/review.md` is clear, and the output contracts make the expected user-facing result concrete. The only minor weakness is some lingering terminology overlap between "review-only mode" and the newer route vocabulary, but it does not materially block execution.

| Dimension | Reasoning | Score |
|---|---|---:|
| Conciseness | The main `SKILL.md` is compact and delegates diagnosis detail to `prompt-doctor.md`. There is still a small mix of "review-only mode" wording with the newer route model, so this is slightly less crisp than a fully unified rewrite. | 2 |
| Actionability | The skill names concrete commands and artifacts: `meta-skill review <skill-dir>`, `.meta-skill/review.md`, `meta-skill lint`, eval runs, and payload files. Output contracts specify exactly what to report for diagnosis, surgical edits, and evidence loops. | 3 |
| Workflow Clarity | The route table and Prompt Doctor loop make the default path clear: diagnose, propose two or three edits, recommend one, and ask unless edits were authorized. The updated payload-edit sentence now aligns with the authorization rule. | 3 |
| Progressive Disclosure | The direct body stays short and points to `prompt-doctor.md`, `review-criteria.md`, and shared subagent patterns only when needed. This is a strong disclosure pattern for a reusable skill-maintenance lane. | 3 |
| Total | Strong operational guidance with only minor terminology cleanup remaining. | 11 / 12 |

### Validation

100%

Warnings & errors only

Checks the skill against the spec for correct structure and formatting. All validation checks must pass before discovery and implementation can be finalized.

Validation -- 10 / 10 Passed

| Criteria | Description | Result |
|---|---|---|
| frontmatter_valid | YAML frontmatter parses successfully | Pass |
| name_field | `name` field is present and valid | Pass |
| description_field | `description` field is present, routed, and bounded | Pass |
| body_present | SKILL.md body is present | Pass |
| resource_links | Runtime references, scripts, and assets are directly linked | Pass |
| link_integrity | Markdown links resolve inside the packaged payload | Pass |
| agent_manifest | agents/openai.yaml metadata is valid when present | Pass |
| workbench_shape | .meta-skill workbench shape is valid when present | Pass |
| eval_definitions | Eval task and criteria files are complete when present | Pass |
| deterministic_tests | 1 deterministic tests discovered; review does not execute them | Pass |

## Findings

No material findings. Residual cleanup opportunity: unify the remaining "review-only mode" wording with the newer route vocabulary if this skill gets another copy-edit pass.

## Deterministic Output

```text
OK: no failures or warnings
```

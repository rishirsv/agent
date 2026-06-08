# Judge Review

The house-style scoring rubric. A Judge Review produces a **Quality page**
(`review.md` in the workbench) with an **Overall Quality Score** plus per-phase
and per-dimension scores, so "improve my skill" gets a number, not just prose.

Judge against concrete house style, not abstract principles.

> **Boundary:** the doctor scores the three *static* phases below and averages
> them. Averaging across *live eval scenarios* (running the skill many times) is
> out of scope here — this is a static review.

## Phases

| Eval phase | Review lens | How scored |
|---|---|---|
| **Quality** (Discovery) | Discovery and task-fit: trigger boundaries, completeness, specificity, conflict risk, user-visible outcome expectations. | LLM-judged, 4 dims × 0–3 |
| **Implementation** | Runtime guidance: actionability, workflow clarity, progressive disclosure, and directive quality (directives over wisdom, reasons, plain names). | LLM-judged, 5 dims × 0–3 |
| **Verify tests** | Deterministic checks Verify runs: structural integrity, deprecated-surface avoidance. | Deterministic (`scripts/run.py`, run by Verify) |

## Score Calibration

Use strict but fair scoring.

| Score | Meaning |
|---|---|
| **3** | Strong, specific, ready for repeated agent use. Minor wording would not change behavior. |
| **2** | Usable but meaningfully improvable. An agent could still select/run it, but there is a concrete weakness. |
| **1** | Weak or risky. May be selected wrongly, produce inconsistent work, or force the agent to infer missing process. |
| **0** | Missing, misleading, or actively unsafe for the dimension. |

**Math.** Discovery % = total / 12 (4 dims). Implementation % = total / 15
(5 dims). Verify-tests % = checks passed / total (from `scripts/run.py`).
**Overall Quality Score = rounded average of the Discovery, Implementation, and
Verify-tests percentages.**

## Scoring notes

- **Cite the skill's own text.** Every dimension's reasoning quotes or names
  specific content — the exact description phrase for Discovery, the exact
  section/example for Implementation. Name the weak phrase; never settle for
  "make it clearer."
- **Lead with the verdict.** Each phase assessment opens with the overall
  judgment, then names the *single* main weakness.
- **Judge relative to skill type.** A reference/pattern skill earns Workflow
  Clarity through clear, well-organized sections and needs no step checkpoints;
  a procedural or destructive skill must show ordered steps and validation
  checkpoints. Don't penalize a pattern skill for lacking a linear workflow, and
  don't pass a destructive skill that lacks gates.
- **Conciseness assumes competence.** Reward skills that skip basics (what React
  or TypeScript *are*) and get straight to actionable patterns; penalize bloat
  that re-explains what the agent already knows.
- **Verify tests are a precondition.** A hard structural *Fail* (invalid
  frontmatter, missing body) makes the judged scores unreliable — resolve it
  before trusting Discovery/Implementation. Warnings don't block.

## Discovery

**Question:** Based on the skill's description, can an agent find and select it
at the right time?

Write a 2–4 sentence overall assessment *before* the table — cover trigger
clarity, natural user language, exclusions, and overlap risk. Do not restate the
table.

| Dimension | Question | Scoring guidance | Anti-patterns (lower the score) |
|---|---|---|---|
| **Specificity** | Names a concrete recurring job, not a broad topic? | 3 concrete and scoped; 2 understandable but broad; 1 vague/category-level; 0 absent/misleading. | domain named but not the task object; vague capability terms |
| **Completeness** | Says both what it does and when to use / not use it? | 3 what/when/not-for clear; 2 one part thin; 1 major trigger or boundary missing; 0 unusable. | no `not for` boundary; describes the solution category, not the problem/handoff |
| **Trigger Term Quality** | Includes natural terms users would actually say? | 3 strong natural + domain terms; 2 mostly technical/internal; 1 sparse trigger language; 0 not discoverable. | missing real user phrases / file types; system or provider plumbing terms |
| **Distinctiveness / Conflict Risk** | Avoids overlap with nearby or generic skills? | 3 clear niche + exclusions; 2 usable with some overlap; 1 high conflict risk; 0 actively conflicts. | overlaps adjacent skills; workflow steps baked into the description |

## Implementation

**Question:** Does the skill give agents clear, useful runtime guidance?

Write a 2–4 sentence overall assessment *before* the table — cover runtime path,
output contract, reference strategy, stop/ask behavior, and whether guidance
would change future agent behavior. Do not restate the table.

| Dimension | Question | Scoring guidance | Anti-patterns (lower the score) |
|---|---|---|---|
| **Conciseness** | Lean enough to read during work? | 3 tight and purposeful; 2 somewhat redundant/verbose; 1 hard to scan; 0 bloated/confusing. | motivation, framework tours, citations; paragraph-long warnings |
| **Actionability** | Tells the agent what to do or produce next? | 3 concrete steps/outputs/examples/checks/commands; 2 usable but abstract; 1 mostly principles; 0 no operational guidance. | bare command with no output shape or pass/fail; "be clear / comprehensive" |
| **Workflow Clarity** | Main path and important branching clear? | 3 clear default path + checkpoints; 2 mostly clear with gaps; 1 ambiguous sequencing; 0 no workflow. | over-rigid long process; branches that don't change behavior; opening line describes the doc, not the job |
| **Progressive Disclosure** | Optional details linked, not bloating the body? | 3 well-signaled local references; 2 acceptable but uneven; 1 details hidden or overstuffed; 0 broken/missing structure. | long examples inline; everything stuffed into SKILL.md |
| **Directive Quality** | Directive over wisdom; *why* for non-obvious rules; generalized; plainly named? | 3 directive, reasoned, generalized, plain section names; 2 mostly, with some wisdom/shouting/overfit; 1 heavy motivation, stacked ALL-CAPS, or overfit to instances; 0 teaching-prose or contradictory rules. | wisdom-not-directives; stacked MUST/ALL-CAPS shouting; overfit to specific values; house-jargon section names; rules that don't earn their place |

## Verify tests (deterministic)

Verify runs `python3 scripts/run.py <path-to-SKILL.md>`, which executes every
deterministic task in `scripts/` and prints a combined pass-rate. **Entirely
deterministic** — no judgment. Two tasks today:

- `validate_skill.py` — structure: `frontmatter_valid`, `name_field`,
  `description_field`, `frontmatter_unknown_keys` (Warning if any),
  `skill_md_line_count` (≤ 500), `compatibility_field`, `allowed_tools_field`,
  `metadata_field`, `metadata_version`, `license_field` (optional — absent =
  Pass), `body_present`.
- `lint_authoring.py` — the *mechanical* authoring anti-patterns:
  `description_length` (≤ 500 Pass / ≤ 1024 Warning), `description_third_person`,
  `description_no_workflow_steps` (the "dangerous shortcut"), `hard_command_density`
  (stacked MUST/ALL-CAPS), `dead_references` (broken local links).

Verify-tests % = Pass count / total across all tasks. Warning and Fail do not
count as Pass. Add tasks by dropping a conforming script into `scripts/` (see
[verify.md](verify.md)). Judgment anti-patterns (wisdom-vs-directive, jargon
names, contradictions) stay in the scored dimensions above, not here.

*Future deterministic checks (not yet implemented — note, don't fake-pass):*
artifact integrity, deprecated-surface avoidance.

## Review Lanes

Use only the lanes relevant to the request; they focus the examination that
feeds the dimension scores above.

- **Activation** — trigger clarity, realistic phrasing, near misses, non-trigger boundary.
- **Runtime clarity** — default path, output contract, stop/ask points, final checks.
- **Resources** — linked references/scripts/assets, dependency clarity, source leakage, stale files.
- **Runtime contamination** — copied user prompt text, model/provider names, raw research links, author/source provenance, thread IDs, one-off file paths, or source notes living in the payload instead of reusable behavior.
- **Controls** — user files as data, approval gates, external writes, package/publish gates.
- **Eval evidence** — captured deterministic test/validation results and any saved failure evidence.
- **Review score** — the `review.md` Quality Score, Discovery, Implementation, Verify-tests, and combined findings.

## Worked example

A Discovery review of a React + TypeScript skill — note the output shape
(**Reasoning + Score** per dimension, a leading assessment, a **Total / 12**)
and that each reason cites the skill's own wording:

> Strong description: clear niche (React + TypeScript), explicit trigger
> guidance, good keyword coverage, distinct from generic React/TypeScript
> skills. Main weakness: the capabilities stay somewhat abstract.

| Dimension | Reasoning | Score |
|---|---|---|
| Specificity | Names the domain and some actions ("building components", "typing hooks") but key terms ("type-safe patterns", "routing integration") stay vague. | 2 / 3 |
| Completeness | Answers both *what* and *when*, quoting each from the description. | 3 / 3 |
| Trigger Term Quality | Natural terms a developer would say: "React 19", "Server Components", "TanStack Router". | 3 / 3 |
| Distinctiveness / Conflict Risk | Niche = React + TypeScript + version markers; won't collide with generic React or TypeScript skills. | 3 / 3 |

**Total: 11 / 12.** A 2 (not 3) on Specificity is the realistic, common case:
strong overall, with one concrete, named weakness. Implementation tables take the
same shape with 5 dimensions (**Total / 15**).

## Output

Write to `<project>/.meta-skill/review.md`:

- **Overall Quality Score** + the three phase percentages.
- Discovery: the 2–4 sentence assessment, then the scored table (a **Reasoning**
  + **Score** row per dimension, ending in **Total X / 12**).
- Implementation: the same assessment + scored-table shape (5 dimensions,
  **Total X / 15**).
- Verify tests: the deterministic results table + Verify-tests %.
- **Combined findings:** prioritized gaps, each with the rule it violates and a
  suggested fix, highest-impact first.

**Propose only** — the completed `review.md` is *evidence*, not authorization.
Edits land only when the user asks to make/apply/update/patch/fix (see
[edit.md](edit.md)).

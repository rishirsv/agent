# Audit Rubric — Detailed Scoring Criteria

Use this rubric when reviewing a skill. Each dimension has explicit PASS / MARGINAL / FAIL thresholds.

## Contents

- [D1 — Frontmatter & Triggering](#d1--frontmatter--triggering)
- [D2 — Content Quality](#d2--content-quality)
- [D3 — Structure & Context Efficiency](#d3--structure--context-efficiency)
- [D4 — Scope & Category Fit](#d4--scope--category-fit)
- [D5 — Resource Design](#d5--resource-design)
- [D6 — Degrees of Freedom](#d6--degrees-of-freedom)
- [D7 — Gotchas & Anti-Patterns](#d7--gotchas--anti-patterns)
- [D8 — Usability & Completeness](#d8--usability--completeness)
- [D9 — Platform Feature Usage](#d9--platform-feature-usage)

## D1 — Frontmatter & Triggering

| Criterion | PASS | MARGINAL | FAIL |
|---|---|---|---|
| `name` field | Present, lowercase-hyphenated, action-oriented, specific | Present but generic or noun-oriented | Missing or contains spaces/uppercase |
| `description` field | Covers what skill does + when to trigger + when NOT to trigger. Model-facing, not human-facing. ≥20 words. | Covers what + when, but missing exclusions or reads like a summary. | Missing, vague, or under 20 words. |
| Trigger precision | Would trigger on relevant requests and not on adjacent-but-wrong requests. | Triggers correctly but also on some false-positive cases. | Would miss common invocations or fire on unrelated requests. |
| `disable-model-invocation` | Correctly set: `true` for side-effect/destructive skills, absent otherwise. | Absent but skill has mild side effects (arguable). | Missing when skill has destructive side effects (deploys, deletes, posts). |
| `allowed-tools` | Grants minimum necessary tools. No dangerous tools unnecessarily. | Slightly over-permissive but not dangerous. | Grants dangerous tools (broad Bash patterns) without justification. |
| `context: fork` | Present when skill runs independently of conversation; absent when it needs context. | — | Present but content doesn't work as standalone task, OR absent but should be isolated. |
| `argument-hint` | Present with clear format when skill takes arguments. Absent when none needed. | Skill takes arguments but hint is vague. | Skill takes arguments but no hint at all. |
| Extra frontmatter | No unnecessary fields. | Unused fields that don't harm. | Fields that conflict or confuse. |

**Overall D1 verdict:**
- FAIL if `description` is missing/vague OR trigger precision is FAIL OR `disable-model-invocation` wrong for destructive skill
- MARGINAL if any criterion is MARGINAL and none is FAIL
- PASS if all criteria are PASS

## D2 — Content Quality

| Criterion | PASS | MARGINAL | FAIL |
|---|---|---|---|
| Directive ratio | >90% of body lines are directives or concrete examples | 70-90% directive lines | <70% directive lines |
| General knowledge | Zero lines explaining what things are that the agent already knows | 1-3 lines of general knowledge | >3 lines or an entire section of general knowledge |
| Motivation/wisdom | Zero lines of "why this matters" or persuasive framing | 1-2 instances of motivation | Dedicated "Background" / "Why" / "Motivation" sections |
| Concreteness | Every instruction has a concrete example or specific criteria | Most are concrete, a few vague | Multiple instructions like "write clear X" or "ensure good Y" |
| Citations | None | 1 instance | Multiple "according to" or paper/course references |
| Voice | All instructions in active imperative ("Do X", "Use Y") | 1-2 passive constructions | Pervasive passive voice ("should be ensured that...") |

**Counting method:** Read every line in the body (excluding frontmatter, code blocks, blank lines). Classify as:
- **Directive**: imperative verb ("Do X", "Use Y", "Flag Z"), concrete example, template, formula, threshold, anti-pattern one-liner
- **Non-directive**: explanation, motivation, definition, general knowledge, citation, rhetorical question, passive instruction

Report: `{directive_count}/{total_lines} lines are directives ({percentage}%)`

**Overall D2 verdict:**
- FAIL if directive ratio <70% OR >3 general knowledge lines OR dedicated motivation sections
- MARGINAL if directive ratio 70-90% OR 1-3 general knowledge lines OR 1-2 motivation instances
- PASS if directive ratio >90% AND zero general knowledge AND zero motivation AND active imperative voice

## D3 — Structure & Context Efficiency

| Criterion | PASS | MARGINAL | FAIL |
|---|---|---|---|
| SKILL.md length | ≤400 lines | 401-500 lines | >500 lines |
| Progressive disclosure | Three clear levels: frontmatter → body → references | Two levels but detail crammed into body | Everything in SKILL.md, no splitting |
| Reference depth | All references one level from SKILL.md | — | Nested references (SKILL.md → ref.md → detail.md) |
| Reference TOC | Files >100 lines have TOC at top | — | No TOC for files >100 lines |
| Reference read guidance | SKILL.md describes when to read each reference with clear triggers | References exist but no clear read guidance | References not mentioned in SKILL.md |
| Section justification | Every section distinct, no redundancy | Minor overlap between sections | Redundant sections or copy-pasted content |
| Token budget | No section could be cut without losing capability | 1-2 "nice to have" sections | Entire sections add no capability |
| Content duplication | No duplication between SKILL.md and references | Minor overlap (1-2 points) | Significant content in multiple files |
| Bundled file references | `${CLAUDE_SKILL_DIR}` for script/asset paths | Relative paths (works but fragile) | Hard-coded absolute paths |

**Overall D3 verdict:**
- FAIL if >500 lines OR nested references OR major redundancy OR significant duplication
- MARGINAL if 401-500 lines OR missing TOC OR minor overlap OR no read guidance
- PASS if ≤400 lines AND proper disclosure AND no redundancy AND clear read guidance

## D4 — Scope & Category Fit

Valid categories (a skill must fit exactly one):
1. Library / API Reference
2. Product Verification
3. Data Fetching / Analysis
4. Business Process / Automation
5. Code Scaffolding / Templates
6. Code Quality / Review
7. CI-CD / Deployment
8. Runbook
9. Infrastructure Operations

| Criterion | PASS | MARGINAL | FAIL |
|---|---|---|---|
| Category fit | Fits cleanly into one category | Primary clear but bleeds into a second | Straddles 3+ or uncategorizable |
| Task scoping | Every sentence helps the agent do the task | 1-3 sentences of process/org advice | Sections of org guidance or project management |
| Audience | Written for the agent | Mostly agent-facing, occasional human asides | Reads like human documentation |
| Singular focus | Skill does one job well | One primary job with minor secondary concern | Multiple unrelated jobs |

**Overall D4 verdict:**
- FAIL if uncategorizable OR sections of org/process advice OR human-audience framing OR multiple unrelated jobs
- MARGINAL if bleeds into second category OR 1-3 off-scope sentences OR occasional human asides
- PASS if single-category, task-scoped, agent-facing, singular focus

## D5 — Resource Design

| Criterion | PASS | MARGINAL | FAIL |
|---|---|---|---|
| File placement | Every file in correct directory | 1 misplaced file | Multiple misplaced or files outside the three directories |
| Necessity | Every file used, couldn't be generated on the fly | 1 arguably unnecessary file | Multiple unnecessary files |
| Extraneous files | No README, CHANGELOG, INSTALLATION_GUIDE, etc. | 1 extraneous file | Multiple extraneous files |
| Script quality | Scripts tested, clear I/O, handle errors | Untested or unclear I/O | Buggy or copy-pasted boilerplate |
| Reference organization | Domain-organized. SKILL.md says when to read each. | Exist but no clear read guidance | Dumped without organization |
| Large references | Files >10k words: grep patterns in SKILL.md | Files >10k words: structured with TOC | Files >10k words: no navigation aids |
| Duplication | No duplicated information across files | Minor repetition across 2 files | Same content in multiple files |

**Overall D5 verdict:**
- FAIL if multiple misplaced OR multiple extraneous OR buggy scripts OR major duplication
- MARGINAL if 1 misplaced/unnecessary/extraneous OR unclear guidance
- PASS if all correctly placed, necessary, well-organized, non-duplicative

## D6 — Degrees of Freedom

| Criterion | PASS | MARGINAL | FAIL |
|---|---|---|---|
| Freedom calibration | Specificity matches fragility: loose for judgment, tight for error-prone | 1-2 mismatches | Systematically over- or under-specified |
| Default escalation | Simplest approach first, escalates with prerequisites | Defaults present, escalation unclear | Jumps to advanced without simpler default |
| Hard-coded values | None that should be parameters | 1-2 limiting reuse | Multiple that break in other contexts |
| Approach diversity | Flexible where multiple approaches valid | Mildly prescriptive in 1-2 areas | Dictates single approach for variable tasks |

**Overall D6 verdict:**
- FAIL if systematic railroading OR systematic under-specification OR multiple hard-coded values
- MARGINAL if 1-2 mismatches OR unclear escalation OR mildly prescriptive
- PASS if well-calibrated with clear defaults and appropriate flexibility

## D7 — Gotchas & Anti-Patterns

| Criterion | PASS | MARGINAL | FAIL |
|---|---|---|---|
| Gotchas presence | Dedicated section with concrete domain-specific failure points | No section but some gotchas woven into body | No gotchas despite domain having known pitfalls |
| Anti-pattern format | Each is one line. No paragraphs. | Most one-line, 1-2 with unnecessary explanation | Paragraphs of wisdom |
| Warning conversion | All body warnings stated as directives ("Do X, not Y") | 1-2 remain as "Be careful of X" | Multiple "watch out" / "be aware" warnings |
| Coverage | Failure modes specific to domain, agent wouldn't predict them | Covers obvious but misses domain-specific | Only generic failures ("don't write bugs") |
| Provenance | Gotchas grounded in observed failures (specific, non-obvious) | Mix of observed and hypothetical | All brainstormed (generic, predictable) |

**Overall D7 verdict:**
- FAIL if no gotchas despite pitfalls OR paragraphs of wisdom OR only generic failures
- MARGINAL if woven in but no section OR unconverted warnings OR all hypothetical
- PASS if dedicated section, one-line, domain-specific, converted warnings, observed failures

## D8 — Usability & Completeness

| Criterion | PASS | MARGINAL | FAIL |
|---|---|---|---|
| Immediate usability | No unstated prerequisites | 1 implicit prerequisite | Multiple unstated prerequisites |
| Setup handling | Config collection described (config.json, AskUserQuestion) | Mentioned but unclear | Requires setup but doesn't address it |
| Edge cases | Common cases handled with specific instructions | Mentioned without resolution | No handling despite obvious cases |
| Verifiability | Verification method included (tests, screenshots, Playwright) | Mentioned but not actionable | No verification for testable output |
| Completeness | Agent completes task with only this skill + resources | Needs 1-2 external pieces | Significantly blocked without external guidance |

**Overall D8 verdict:**
- FAIL if multiple unstated prerequisites OR no verification for testable output OR significantly blocked
- MARGINAL if 1 implicit prerequisite OR unclear setup OR non-actionable verification
- PASS if immediately usable with clear setup, edge cases, and verification

## D9 — Platform Feature Usage

Evaluate only criteria that apply. Mark N/A for irrelevant criteria. If all N/A, verdict is AUTO-PASS.

| Criterion | Applies when | PASS | MARGINAL | FAIL |
|---|---|---|---|---|
| Hooks | Skill automates pre/post-action behavior | Session-scoped, on-demand, invoked only when skill runs | Present but always-on when should be session-scoped | Obviously needed (blocking commands, enforcing standards) but absent |
| Data storage | Skill produces persistent state | Uses `CLAUDE_PLUGIN_DATA` for all mutable state | Stable location but not `CLAUDE_PLUGIN_DATA` | Writes state into skill directory (wiped on upgrade) |
| Config setup | Skill needs user-specific values | Checks `config.json`, prompts for missing fields | Mentions config but no collection pattern | Hard-codes user-varying values without config |
| Composability | Skill depends on another skill | Names dependencies explicitly by skill name | References vaguely ("use the appropriate skill") | Dependency implied but unnamed |
| String substitutions | Skill takes arguments or references bundled files | Uses `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`, `!`command`` appropriately | Uses some but misses opportunities | Hard-codes values that should use substitutions |

**Overall D9 verdict:**
- AUTO-PASS if no criteria apply
- FAIL if any applicable criterion FAILs
- MARGINAL if any applicable is MARGINAL, none FAIL
- PASS if all applicable criteria PASS

---
name: skill-audit
description: >
  Rigorous, multi-dimensional audit of an agent skill. Use when the user asks to
  review, critique, audit, or evaluate a skill they have written or are about to
  release. Accepts a path to a skill directory (containing SKILL.md), spawns 9
  parallel sub-agent reviewers across all quality dimensions, and produces a
  consolidated AUDIT.md report with a severity-ranked issues diagram and a
  cohesive fix plan. Trigger on: "audit my skill", "review this skill", "what's
  wrong with this skill", "is this skill good". Do NOT use for general code review,
  evaluator critique, or prompt review.
---

# Skill Audit

Perform a harsh first-pass quality audit of an agent skill across 9 dimensions using parallel sub-agent reviewers. Default stance: every line fails until it justifies its inclusion.

## Input

Accept the path to the skill directory (the folder containing `SKILL.md`). If not provided, ask the user. Read `SKILL.md` and inventory all files before starting.

## Audit Procedure

### 1. Inventory the Skill

Read `SKILL.md` in full. List every file and subdirectory. Record:
- Total line count of `SKILL.md` body (excluding frontmatter, code blocks, blank lines)
- Frontmatter fields present — and which valid fields are absent (`name`, `description`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `context`, `agent`, `hooks`, `argument-hint`)
- File counts in `scripts/`, `references/`, `assets/`
- Files outside those three directories (besides `SKILL.md`)
- Whether hooks are configured in frontmatter
- Whether string substitutions are used (`$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`, `!`command``)

### 2. Spawn 9 Parallel Sub-Agent Reviewers

Launch all 9 sub-agents simultaneously using the Agent tool. Each receives:
- The full text of `SKILL.md`
- The file inventory from step 1
- Contents of files relevant to its dimension
- Its rubric section from [references/rubric.md](references/rubric.md)

Instruct every sub-agent: "You are a harsh skill auditor. Default verdict is FAIL. A clean report means you weren't thorough. Quote specific lines as evidence for every finding."

Each sub-agent returns this exact format:

```
## [Dimension Name]

**Verdict: PASS | MARGINAL | FAIL**

### Issues Found
- [CRITICAL] Issue description
  Evidence: "quoted text" (line X)
- [MAJOR] Issue description
  Evidence: "quoted text" (line X)
- [MINOR] Issue description
  Evidence: "quoted text" (line X)

### Suggested Fixes
1. Fix with before → after example
2. Fix with before → after example

### Metrics
[Dimension-specific measurements, e.g. directive ratio for D2]
```

Sub-agents with no issues must still return the format with "Issues Found: none" and explicit justification for PASS. A PASS verdict with no evidence is not acceptable.

#### The 9 Dimensions

**D1 — Frontmatter & Triggering**
Audit `name` and `description` plus all optional frontmatter: `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `context`, `agent`, `hooks`, `argument-hint`.

- `name`: lowercase-hyphenated, action-oriented, specific — not a generic noun
- `description`: model-facing trigger, not a human summary. Must cover what the skill does + when to trigger + when NOT to trigger. Test: would this fire on relevant requests and stay silent on adjacent ones?
- `disable-model-invocation`: skills with side effects or destructive actions must set `true`
- `allowed-tools`: minimum necessary granted? Dangerous tools excluded?
- `context: fork`: if present, does the content work as a standalone subagent task? If absent, should it be forked?
- `argument-hint`: if the skill takes arguments, is the hint present and clear?
- Extra fields that conflict or confuse

**D2 — Content Quality**
Classify every body line (excluding frontmatter, code blocks, blank lines) as:
- **Directive**: imperative verb, concrete example, template, formula, threshold, one-line anti-pattern
- **Non-directive**: explanation, motivation, definition, general knowledge, citation, rhetorical question, passive instruction

Report: `{directive_count}/{total_lines} directive lines ({percentage}%)`

Flag every non-directive line with its line number and failure reason:
- "X is important because Y" → wisdom
- "A [thing] is..." → general knowledge the agent already has
- "Background" / "Context" / "Why This Matters" headers → cuttable section
- "consider" / "think about" / "keep in mind" → vague, convert to imperative
- "e.g., your function" / "something like X" → not concrete, show a real instance
- "according to" / citations / course references → delete, state the directive
- Framework lists without a default → lead with default, escalate with prereqs
- "You can use X, Y, or Z" without guidance → state when to use each or pick one
- Passive voice instructions ("should be ensured that...") → convert to active imperative

**D3 — Structure & Context Efficiency**
- SKILL.md body line count: ≤400 PASS, 401-500 MARGINAL, >500 FAIL (hard limit)
- Progressive disclosure: three levels present? (frontmatter → body → references)
- Reference depth: one level from SKILL.md only — no nesting (SKILL.md → ref.md → detail.md is a violation)
- Reference files >100 lines: table of contents at top?
- Every section serves a distinct purpose — no redundancy or overlap
- Token justification: could any section be cut without losing agent capability?
- SKILL.md describes when to read each reference file with clear triggers
- `${CLAUDE_SKILL_DIR}` used to reference bundled scripts/assets if they exist
- No content duplicated between SKILL.md and reference files

**D4 — Scope & Category Fit**
Classify into exactly one: (1) Library/API Reference, (2) Product Verification, (3) Data Fetching/Analysis, (4) Business Process/Automation, (5) Code Scaffolding/Templates, (6) Code Quality/Review, (7) CI-CD/Deployment, (8) Runbook, (9) Infrastructure Operations.

Straddling two → MAJOR. Three or more → FAIL.

Flag every sentence that doesn't help the agent do the task:
- Process advice ("schedule weekly review sessions")
- Organizational guidance ("assemble a team of 3-5 annotators")
- Project management content ("budget 60% of time for X")
- Human-audience framing (reads like docs for a person, not directives for an agent)

**D5 — Resource Design**
Audit every file in the skill directory:
- `scripts/`: executable code with clear inputs/outputs. Tested? Could the agent generate it on the fly? If yes → unnecessary.
- `references/`: docs loaded into context as needed. SKILL.md says when to read each? Domain-organized, not chronological?
- `assets/`: files used in output (templates, images, fonts). Not for context loading.
- Extraneous files: README.md, CHANGELOG.md, INSTALLATION_GUIDE.md, QUICK_REFERENCE.md → violations.
- Misplaced files: each in the correct directory?
- Large references (>10k words): SKILL.md includes grep patterns for discovery?
- No files that duplicate information available elsewhere in the skill

**D6 — Degrees of Freedom**
For each instruction, assess specificity vs. fragility:
- High freedom (text guidance) → context-dependent decisions
- Medium freedom (pseudocode/parameterized) → preferred patterns with acceptable variation
- Low freedom (exact scripts, few parameters) → fragile/error-prone operations

Flag:
- Railroading: too rigid for variable situations
- Under-specification: too loose for fragile operations
- Hard-coded values that should be parameters (paths, names, thresholds)
- Missing simplest-first default with escalation prerequisites
- Dictating a single approach when multiple valid approaches exist

**D7 — Gotchas & Anti-Patterns**
- Dedicated gotchas/anti-patterns section exists?
- Each anti-pattern is one line — no paragraph explanations
- Body warnings converted to directives ("Do X, not Y"), not "Be careful of X" or "Watch out for Y"
- Anti-patterns cover domain-specific failure modes the agent wouldn't predict
- Generic anti-patterns absent ("don't write bugs", "test your code")
- Gotchas built from observed failures are stronger than brainstormed ones — flag if all gotchas look hypothetical

**D8 — Usability & Completeness**
- Immediate usability without unstated prerequisites?
- Setup handling: if config is needed, skill describes collection method (config.json, AskUserQuestion)?
- Common edge cases handled with specific instructions?
- Verifiability: output verification method included (tests, screenshots, Playwright, assertions)?
- Completeness: agent can finish using only this skill + bundled resources?

**D9 — Platform Feature Usage**
Assess whether the skill uses Claude Code platform capabilities where they apply. For each criterion, first determine if it applies — if not, mark N/A:
- **Hooks:** If the skill automates pre/post-action behavior (blocking commands, enforcing standards), does it register session-scoped hooks? Are they on-demand rather than persistent?
- **Data storage:** If the skill produces state that persists between runs (logs, configs, cached results), does it use `CLAUDE_PLUGIN_DATA` rather than the skill directory (deleted on upgrade)?
- **Config setup:** If the skill needs user-specific values (Slack channels, API keys, target paths), does it check for a `config.json` and prompt the user if missing?
- **Composability:** If the skill depends on outputs from another skill, does it name the dependency explicitly?
- **String substitutions:** Does the skill use `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`, `!`command`` where beneficial?
- If all criteria are N/A, verdict is AUTO-PASS. State: "No platform features apply to this skill's domain."

### 3. Aggregate Into the Audit Report

After all sub-agents return, read [references/report-template.md](references/report-template.md) and assemble the consolidated report.

#### Scoring

Sub-agents use the rubric thresholds to classify findings as CRITICAL, MAJOR, or MINOR. The rubric's per-dimension verdict rules determine the dimension verdict. When the rubric threshold and issue-severity classification disagree, the rubric threshold wins.

Each dimension:
- **PASS** — No critical or major issues. Minor issues only.
- **MARGINAL** — Has major issues but is usable. Needs revision before release.
- **FAIL** — Has critical issues. Not ready for use.

Overall:
- **PASS** — All 9 PASS (AUTO-PASS counts as PASS)
- **MARGINAL** — No FAILs, at least one MARGINAL
- **FAIL** — Any dimension FAILs

#### Issues Diagram

Severity-grouped tree with actual findings:

```
ISSUES DIAGRAM
══════════════

CRITICAL (must fix before release)
├── D2 Content Quality: 14 lines of wisdom in Overview section
├── D3 Structure: SKILL.md is 623 lines (limit: 500)
└── D5 Resources: references/api.md is 340 lines with no TOC

MAJOR (fix before release if possible)
├── D1 Triggering: Description missing negative triggers (when NOT to use)
├── D4 Scope: Mixes Scaffolding with Business Process advice
├── D6 Freedom: Hard-coded file paths in a context-dependent workflow
└── D7 Gotchas: No anti-patterns section despite domain-specific pitfalls

MINOR (nice to fix)
├── D2 Content Quality: Line 42 explains what JSON is
├── D5 Resources: assets/logo.png is referenced but never used in output
└── D8 Usability: No output verification method
```

Use actual issues found. Do not fabricate examples.

#### Cohesive Fix Plan

Group related fixes across dimensions (e.g., "cut wisdom" from D2 and "reduce line count" from D3 are often the same work). Order by severity. For each fix:
1. Title and which D# issues it resolves
2. Scope: one-liner | paragraph rewrite | section rewrite | structural change
3. Specific instruction with before → after example
4. Never write vague advice ("improve the description")

### 4. Write the Report

Write the completed report to `{skill_directory}/AUDIT.md`. Overwrite if exists. Present the full report to the user.

## Reviewer Calibration

Sub-agents default to skepticism. Every line must justify its inclusion.

**Content flags:**
- "X is important because Y" → wisdom. Fix: "Do X" or delete.
- "A trace is the complete record of..." → general knowledge. Delete.
- Section labeled "Background", "Context", "Why This Matters", "Overview" with no directives → cuttable. Flag CRITICAL.
- "consider" / "think about" instead of "do" → vague. Flag MAJOR.
- Placeholder example ("e.g., your function", "something like X") → not concrete. Flag MINOR.
- "According to..." or paper/course reference → citation. Flag MAJOR.
- Passive voice instruction ("should be ensured that...") → convert to active. Flag MINOR.
- Framework list without a default choice → Flag MINOR.

**Frontmatter flags:**
- Description reads like a summary ("This skill helps you...") instead of a trigger → Flag CRITICAL.
- Description could describe two different skills → not precise. Flag MAJOR.
- Description under 20 words → too vague. Flag CRITICAL.
- Description has no "Do NOT use when" clause → missing negative trigger. Flag MAJOR.

**Structure flags:**
- File not in `scripts/`/`references/`/`assets/` and not `SKILL.md` → extraneous. Flag CRITICAL.
- Reference file >100 lines with no TOC → Flag CRITICAL.
- Reference file referenced from a reference file (depth > 1) → nested. Flag CRITICAL.
- SKILL.md >400 lines → approaching limit, Flag MAJOR. Over 500 → Flag CRITICAL.

**Scope flags:**
- Skill fits two categories → poorly scoped. Flag MAJOR.
- Sentence advises on process, team structure, or scheduling → off-scope. Flag MAJOR.
- Skill addresses a human reader ("you should think about...") instead of an agent → Flag MAJOR.

**Resource flags:**
- Script never referenced from SKILL.md → unused. Flag MAJOR.
- Script that regenerates boilerplate the agent writes anyway → unnecessary. Flag MINOR.
- Asset file used in SKILL.md body but not in output → misclassified. Flag MINOR.

## Anti-Patterns

- Giving PASS because the skill "mostly works" — MARGINAL at best
- Skipping a dimension without stating why it doesn't apply
- Vague fixes ("improve the description") — always show before → after
- Fabricating issues to pad the report — but don't soften to compensate
- Lenient on line count — 500 is hard, 400 is the target
- "Well-written wisdom" is still wisdom — cut it
- Praising the skill anywhere in the audit
- Rating against an idealized standard instead of the concrete rubric criteria

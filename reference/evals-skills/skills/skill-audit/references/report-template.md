# Audit Report Template

Use this template when assembling the final audit report. Replace all `{{placeholders}}` with actual findings from the sub-agent reviews.

---

```markdown
# Skill Audit Report: {{skill_name}}

**Audited:** {{date}}
**Skill path:** {{skill_path}}
**SKILL.md body lines:** {{line_count}} (excluding frontmatter, code blocks, blanks)
**Files in skill:** {{file_count}}
**Directive ratio:** {{directive_count}}/{{total_lines}} ({{percentage}}%)

---

## Overall Verdict: {{PASS | MARGINAL | FAIL}}

{{1-3 sentence summary of the skill's readiness. Be blunt.}}

---

## Scorecard

| # | Dimension | Verdict | Critical | Major | Minor |
|---|---|---|---|---|---|
| D1 | Frontmatter & Triggering | {{verdict}} | {{count}} | {{count}} | {{count}} |
| D2 | Content Quality | {{verdict}} | {{count}} | {{count}} | {{count}} |
| D3 | Structure & Context Efficiency | {{verdict}} | {{count}} | {{count}} | {{count}} |
| D4 | Scope & Category Fit | {{verdict}} | {{count}} | {{count}} | {{count}} |
| D5 | Resource Design | {{verdict}} | {{count}} | {{count}} | {{count}} |
| D6 | Degrees of Freedom | {{verdict}} | {{count}} | {{count}} | {{count}} |
| D7 | Gotchas & Anti-Patterns | {{verdict}} | {{count}} | {{count}} | {{count}} |
| D8 | Usability & Completeness | {{verdict}} | {{count}} | {{count}} | {{count}} |
| D9 | Platform Feature Usage | {{verdict or AUTO-PASS}} | {{count}} | {{count}} | {{count}} |
| | **Totals** | | **{{total}}** | **{{total}}** | **{{total}}** |

---

## Issues Diagram

{{Generate the tree diagram here. Group all issues by severity (CRITICAL → MAJOR → MINOR),
then by dimension within each severity level.}}

```
CRITICAL (must fix before release)
├── {{D#}} {{Dimension}}: {{issue description}}
└── ...

MAJOR (fix before release if possible)
├── {{D#}} {{Dimension}}: {{issue description}}
└── ...

MINOR (nice to fix)
├── {{D#}} {{Dimension}}: {{issue description}}
└── ...
```

{{If no issues at a severity level, omit that section entirely.
If there are zero issues total, write: "No issues found. (Auditor error — re-run with harsher calibration.)"}}

---

## Detailed Findings

{{Paste each sub-agent's full review here, in dimension order D1-D9.
Each should include: Verdict, Issues Found, Suggested Fixes, and Metrics.}}

### D1 — Frontmatter & Triggering
{{sub-agent D1 output}}

### D2 — Content Quality
{{sub-agent D2 output}}

### D3 — Structure & Context Efficiency
{{sub-agent D3 output}}

### D4 — Scope & Category Fit
{{sub-agent D4 output}}

### D5 — Resource Design
{{sub-agent D5 output}}

### D6 — Degrees of Freedom
{{sub-agent D6 output}}

### D7 — Gotchas & Anti-Patterns
{{sub-agent D7 output}}

### D8 — Usability & Completeness
{{sub-agent D8 output}}

### D9 — Platform Feature Usage
{{sub-agent D9 output}}

---

## Cohesive Fix Plan

{{Group related fixes across dimensions. Order by severity. Be specific and actionable.}}

### Critical Fixes

{{For each critical fix:}}

**{{Fix title}}** (addresses: {{list D# issues this fix resolves}})
- **Scope:** {{one-liner | paragraph rewrite | section rewrite | structural change}}
- **What to do:** {{Specific, actionable instruction. Not "improve X" — say exactly what to change.}}
- **Example before/after:** {{Show the specific text to cut/rewrite if applicable.}}

### Major Fixes

{{Same format as critical fixes.}}

### Minor Fixes

{{Same format. These can be more concise since they're lower priority.}}

---

## Summary Statistics

- **Total issues:** {{count}} ({{critical}} critical, {{major}} major, {{minor}} minor)
- **Directive ratio:** {{directive_count}}/{{total_lines}} ({{percentage}}%)
- **Dimensions passing:** {{count}}/9
- **Dimensions marginal:** {{count}}/9
- **Dimensions failing:** {{count}}/9
- **Dimensions auto-pass:** {{count}}/9
- **Estimated fix effort:** {{small (< 30 min) | medium (30-60 min) | large (> 60 min)}}
```

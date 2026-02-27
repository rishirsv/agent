# Workflow playbook

This document expands the workflow in SKILL.md with practical defaults and repeatable steps.

## Modes

### 1) New report mode
Use when: the user asks to write an FDD/QoE report from scratch, or provides raw notes/data.

### 2) Revision mode
Use when: the user already has a draft (or prior version) and wants edits.

### 3) QC mode
Use when: the user wants a review/check/QC before delivery.

## New report mode workflow

### Step 0: Set defaults (unless the user specifies)
These defaults keep momentum without forcing a long back-and-forth:

- **Depth default**: Standard report.
- **Core scope default**: QoE (earnings adjustments) + Working capital + Net debt/debt-like + Key risks.
- **Output default**: Markdown draft first; convert to DOCX at the end if requested.

### Step 1: Intake and scoping gate
Extract what you can from context. If missing, ask **at most two** questions:
1) **Depth**: Quick memo / Standard report / Deep report
2) **Scope**: confirm which workstreams are in-scope

Recommended intake fields (use what is available; do not block on missing items):
- Target company and sector
- Deal type and timeline (platform, add-on, growth, carve-out, recap)
- Period(s) covered (FY2023–FY2025, LTM, stub)
- Available financial inputs (IS, TB, GL, KPI pack, management adjustments schedule)
- Known priority concerns (customer concentration, one-time costs, aggressive revenue recognition, etc.)

### Step 2: Outline and evidence plan
Produce an outline that makes drafting deterministic.

For each major section:
- **Key question** the section answers
- **Likely findings** (hypotheses phrased as questions, not conclusions)
- **Evidence needed** (documents/tables)
- **Planned exhibit** (table or chart)

Also include:
- A short “Open items & data requests” section from day one (living list).

Use the canonical structure in [report-structure.md](report-structure.md).

### Step 3: Draft section-by-section
Draft in this order (unless user requests otherwise):
1) Executive summary
2) Business overview
3) Historical performance and P&L overview
4) Quality of earnings and adjustments
5) Working capital
6) Net debt and debt-like items
7) Capex
8) Tax (if in-scope)
9) Accounting policies / audit history (if in-scope)
10) Risks, red flags, and mitigants
11) Open items & data requests

Use the section templates for consistent structure: [section-templates/](section-templates/)

### Step 4: Exhibits discipline
- Use tables to present exact values and tie-outs.
- Use charts when the goal is to show a pattern quickly (trend, mix, seasonality).
- Every exhibit must have: title, period, units, and source/basis.

See [exhibits-and-tables.md](exhibits-and-tables.md).

### Step 5: QC loop and stopping rules
Run QC before converting to DOCX or delivering “final”:
- Number consistency (units, periods, repeated metrics)
- Tie-outs (bridges sum correctly)
- Evidence coverage (material claims supported)
- Open items list is present and prioritized

Use [qc-checklist.md](qc-checklist.md).

Stopping rules:
- Fix all **critical** issues first.
- If QC reveals missing source data, do not “fill in” with guesses; list it as an open item and proceed with clearly labeled placeholders.

## Revision mode protocol

When revising:
- Preserve the document structure unless asked to restructure.
- Make targeted edits; do not rewrite unrelated sections.
- After edits, provide a short “Change log” with: what changed, what remains open, what new questions were introduced.

## QC mode protocol

When QC-ing:
- Output a structured issue log:
  - Issue
  - Where found (section / exhibit)
  - Why it matters
  - Fix recommendation
- Then (if requested) implement fixes.

Optional: run scripts in `scripts/` for deterministic checks.

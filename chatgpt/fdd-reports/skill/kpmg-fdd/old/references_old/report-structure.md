# Canonical FDD report structure

This structure is anchored on the major FDD workstreams referenced in the due diligence checklist and IC memo workflows:
- QoE / earnings adjustments
- Working capital analysis
- Debt and debt-like items (net debt)
- Capex requirements
- Tax structure and exposure
- Audit history and accounting policies
- Pro forma adjustments (run-rate, synergies)  
(See the due diligence checklist and IC memo skill structures in the bundled financial services references.)

## Request intent router (primary UX)

Route by user intent first. This reflects how users actually ask for help in ChatGPT/Claude.

1) `full_report`
- Use when the user asks for a full draft (new or refresh).
- Default output should include the canonical sections below, adapted for scope.

2) `section_only`
- Use when the user asks for one or more sections only.
- Keep output focused to requested sections and preserve canonical section naming in headers.

3) `section_rewrite`
- Use when the user asks to rewrite or tighten an existing section (for example QoE adjustments narrative).
- Preserve the existing structure; change only requested content.

4) `qc_only`
- Use when the user asks to review/check/QC without drafting new content unless asked.
- Output findings and fixes clearly separated.

5) `exhibit_only`
- Use when the user asks for a single exhibit/table/bridge narrative without a full section.
- If the user asks for an actual PowerPoint slide, route to the slide skill (`kpmg-slides`).

## Canonical section names and accepted aliases

Use canonical names for output headings. Accept aliases for matching user requests and legacy drafts.
Alias matching should be case-insensitive and tolerant of punctuation differences.

- `Executive summary`
  - Accepted aliases: `Executive Summary`
- `Business overview`
  - Accepted aliases: `Business Overview`
- `Historical / financial performance`
  - Accepted aliases: `Profit and loss overview / financial performance`, `Profit and loss overview`, `P&L overview`, `Financial performance`
- `QoE and earnings adjustments`
  - Accepted aliases: `Quality of earnings`, `Quality of Earnings`, `QoE`, `QofE`, `Quality of earnings adjustments`
- `Working capital`
  - Accepted aliases: `Net working capital`, `Net Working Capital`, `NWC`, `Net working capital adjustments`
- `Net debt and debt-like items`
  - Accepted aliases: `Net debt`, `Net Debt`, `Net debt (cash)`, `Net Debt (Cash)`, `Net debt / cash`, `Net debt / cash adjustments`, `Cash reconciliation`
- `Risks and red flags`
  - Accepted aliases: `Risks`, `Key findings`, `Other considerations`, `Commitments and contingencies`, `Potential tax risk`
- `Open items & data requests`
  - Accepted aliases: `Open items`, `Data requests`, `Information outstanding from management`, `Information read and outstanding`

## Optional depth guidance

### Quick memo (typically 3–6 pages)
Use when: early diligence, week-1 readout, or the user explicitly wants “quick”.

1) Executive summary
2) Key findings by workstream (short)
3) Risks, red flags, and open items
4) Appendix: 1–2 key exhibits (only if available)

### Standard report (typically 10–25 pages)
Use when: most buy-side FDD readouts and management update cycles.

1) Executive summary
2) Business overview
3) P&L overview (historical performance)
4) QoE and earnings adjustments
5) Working capital analysis
6) Net debt and debt-like items
7) Capex analysis
8) Tax (if in-scope)
9) Accounting policies / audit history (if in-scope)
10) Risks and red flags
11) Open items & data requests
12) Appendices (supporting exhibits)

### Deep report (typically 25+ pages)
Use when: complex deals, carve-outs, or when explicitly requested.

Standard report sections plus:
- Segment/customer profitability where data allows
- More granular adjustment support and reconciliation
- Expanded sensitivity analysis (peg sensitivity, run-rate scenarios)
- Exhibit appendix with additional schedules

## Section objectives and minimum content

### 1) Executive summary
Objective: give the decision-maker the “so what” quickly.

Minimum content:
- Deal context and periods covered
- Key QoE conclusion (reported vs adjusted, if available)
- Top risks and mitigants
- Open items that could materially move conclusions

Template: [section-templates/executive-summary.md](section-templates/executive-summary.md)

### 2) Business overview
Objective: explain what the company does and what drives financial performance.

Minimum content:
- Business model and revenue streams
- Customer base and go-to-market
- Key operating metrics (if available)
- What changed recently that explains financial trends

Template: [section-templates/business-overview.md](section-templates/business-overview.md)

### 3) Historical / financial performance (P&L overview)
Objective: summarize historical performance and key drivers.

Minimum content:
- Revenue, gross profit, EBITDA trends (period-aligned)
- Key margin drivers and volatility
- Any known seasonality or concentration factors (if evidenced)

Template: [section-templates/pnl-overview.md](section-templates/pnl-overview.md)

### 4) QoE and earnings adjustments
Objective: reconcile reported earnings to a normalized, decision-useful figure.

Minimum content:
- A clear bridge: Reported → Adjustments (by type) → Adjusted
- Evidence/basis for each material adjustment
- Commentary on recurrence and sustainability
- A list of open items that could change the bridge

Template: [section-templates/qoe-adjustments.md](section-templates/qoe-adjustments.md)

### 5) Working capital
Objective: assess normalized working capital and implications for cash flow and peg.

Minimum content:
- Definition of working capital used (and any exclusions)
- Normalized vs actual analysis (or a placeholder with data request)
- Seasonality/volatility commentary if evidenced
- Implications (peg risk, cash impact) clearly labeled

Template: [section-templates/working-capital.md](section-templates/working-capital.md)

### 6) Net debt and debt-like items
Objective: identify net debt and debt-like items relevant to purchase price.

Minimum content:
- Debt schedule summary (if available)
- List of potential debt-like items reviewed and conclusions
- Cut-off considerations / timing notes
- Open items

Template: [section-templates/net-debt.md](section-templates/net-debt.md)

### 7) Capex
Objective: distinguish maintenance vs growth capex and implications.

Template: [section-templates/capex.md](section-templates/capex.md)

### 8) Tax
Objective: summarize tax structure, exposures, and key diligence questions.

Template: [section-templates/tax.md](section-templates/tax.md)

### 9) Accounting policies / audit history
Objective: highlight reporting quality signals and policy sensitivities.

Template: [section-templates/accounting-policies.md](section-templates/accounting-policies.md)

### 10) Pro forma adjustments
Objective: document run-rate changes and ensure clear labeling.

Template: [section-templates/pro-forma.md](section-templates/pro-forma.md)

### 11) Risks and red flags
Objective: present balanced bull/bear view and escalation items.

Template: [section-templates/risks-and-red-flags.md](section-templates/risks-and-red-flags.md)

### 12) Open items & data requests
Objective: make missing information explicit and prioritized.

Template: [section-templates/open-items-and-data-requests.md](section-templates/open-items-and-data-requests.md)

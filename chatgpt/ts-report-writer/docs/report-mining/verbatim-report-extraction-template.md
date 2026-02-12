# Verbatim Report Extraction Template (All Reports)

Use this template to capture **actual report text only** (no rewriting).

## Non-Negotiable Rules

- Copy text **verbatim** from source report outputs.
- Do **not** summarize, interpret, or normalize wording.
- Keep placeholders like `[ENTITY]`, `[DATE]`, `[X]` if present in source.
- If a section is missing, write: `Not present in source report`.
- Keep original section order where possible.

---

## Canonical Section List (From Full Corpus Review)

Use this as the default top-level order:

1. Executive Summary
2. Key Findings (if present)
3. Business Overview
4. Summary Financials (if present)
5. Profit and Loss Overview / Financial Performance
6. Quality of Earnings
7. Income Statement
8. Balance Sheet
9. Net Working Capital
10. Net Debt (Cash)
11. Cash Flows
12. Related Parties (if present)
13. Reporting Environment (if present)
14. Forecast Trading (if present)
15. Industry Analysis (if present)
16. Quality of Net Assets (if present)
17. Gross Margin by LOB (if present)
18. Appendices

---

## Report Metadata

- `SOURCE_FILE`:
- `REPORT_ID`:
- `SOURCE_PATH`:
- `EXTRACTION_STATUS`:
- `EXTRACTION_DATE`:

---

# Executive Summary
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Key Findings
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Business Overview
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>
- <Verbatim Bullet 3>

# Summary Financials
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Profit and Loss Overview / Financial Performance
## Overview
<Verbatim Text>

## Key Drivers
1. <Driver Name>: <Verbatim Text>
2. <Driver Name>: <Verbatim Text>

# Quality of Earnings
## Overview
<Verbatim Text>

## Quality of earnings adjustments
1. <Adjustment Name>: <Verbatim Adjustment Text>
2. <Adjustment Name>: <Verbatim Adjustment Text>
3. <Adjustment Name>: <Verbatim Adjustment Text>

## Other considerations
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Income Statement
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Balance Sheet
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Net Working Capital
## Overview
<Verbatim Text>

## Net working capital adjustments
1. <Adjustment Name>: <Verbatim Adjustment Text>
2. <Adjustment Name>: <Verbatim Adjustment Text>
3. <Adjustment Name>: <Verbatim Adjustment Text>

# Net Debt (Cash)
## Overview
<Verbatim Text>

## Net debt / cash adjustments
1. <Adjustment Name>: <Verbatim Adjustment Text>
2. <Adjustment Name>: <Verbatim Adjustment Text>
3. <Adjustment Name>: <Verbatim Adjustment Text>

# Cash Flows
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Reporting Environment
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Related Parties
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Industry Analysis
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Forecast Trading
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Quality of Net Assets
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Gross Margin by LOB
- <Verbatim Bullet 1>
- <Verbatim Bullet 2>

# Appendices
## Appendix 1: <Appendix Name>
<Verbatim Text>

## Appendix 2: <Appendix Name>
<Verbatim Text>

## Appendix 3: <Appendix Name>
<Verbatim Text>

---

## Extraction QA Checklist

- [ ] All copied content is verbatim (no paraphrase)
- [ ] All major sections attempted
- [ ] Missing sections explicitly marked
- [ ] Adjustment lists include exact source wording
- [ ] Appendices are labeled as `Appendix 1/2/3: <Appendix Name>`
- [ ] Metadata fields completed

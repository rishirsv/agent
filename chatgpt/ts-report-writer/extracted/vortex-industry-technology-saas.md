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

- `SOURCE_FILE`: Project Vortex - Simulated Report 2025.pptx
- `REPORT_ID`: project-vortex-simulated-report-2025
- `SOURCE_PATH`: /mnt/data/Project Vortex - Simulated Report 2025.pptx
- `EXTRACTION_STATUS`: complete
- `EXTRACTION_DATE`: 2026-02-17

## Required Source Evidence

- `SOURCE_TEXT_DIR`: extracted/verification/project-vortex-simulated-report-2025/source-text/pptx
- `MONTAGE_DIR`: extracted/verification/project-vortex-simulated-report-2025/montage
- `SOURCE_ARTIFACTS`:
  - `slide-01.txt`
  - `slide-02.txt`
  - `slide-03.txt`
  - `slide-04.txt`
  - `slide-05.txt`
  - `slide-06.txt`
  - `slide-07.txt`
  - `slide-08.txt`
  - `slide-09.txt`
  - `slide-10.txt`
  - `slide-11.txt`
  - `slide-12.txt`
  - `slide-13.txt`
  - `slide-14.txt`
  - `slide-15.txt`
  - `slide-16.txt`
  - `slide-17.txt`
  - `slide-18.txt`
  - `slide-19.txt`
  - `slide-20.txt`
  - `slide-21.txt`
  - `slide-22.txt`
  - `slide-23.txt`
  - `slide-24.txt`
  - `slide-25.txt`
  - `slide-26.txt`
  - `slide-27.txt`
  - `slide-28.txt`
  - `slide-29.txt`
  - `slide-30.txt`
  - `slide-31.txt`
  - `slide-32.txt`
  - `slide-33.txt`
  - `slide-34.txt`
  - `slide-35.txt`
  - `slide-36.txt`
  - `slide-37.txt`
  - `slide-38.txt`
  - `slide-39.txt`
  - `slide-40.txt`
  - `slide-41.txt`
  - `slide-42.txt`
  - `slide-43.txt`
  - `slide-44.txt`
  - `slide-45.txt`
  - `slide-46.txt`
  - `slide-47.txt`
  - `slide-48.txt`
  - `slide-49.txt`
  - `slide-50.txt`
  - `slide-51.txt`
  - `slide-52.txt`
  - `slide-53.txt`
  - `slide-54.txt`
  - `slide-55.txt`
  - `slide-56.txt`
  - `slide-57.txt`
  - `slide-58.txt`
  - `slide-59.txt`
- `OCR_USED`:
  - false
- `OCR_SLIDES`:
  - []
- `OCR_ARTIFACTS_DIR`: Not present in source report
- `OCR_RUN_METADATA`: Not present in source report
- `PROVENANCE_QA_JSON`: extracted/verification/project-vortex-simulated-report-2025/qa/provenance.json
- `PROVENANCE_STATUS`: pass
- `GATES_QA_JSON`: extracted/verification/project-vortex-simulated-report-2025/qa/gates.json
- `GATES_STATUS`: pass
- `SECTION_MAP_JSON`: extracted/verification/project-vortex-simulated-report-2025/mapping/section-map.json
- `SECTION_ACCOUNTING_JSON`: extracted/verification/project-vortex-simulated-report-2025/mapping/section-accounting.json
- `RENDER_TRACE_JSON`: extracted/verification/project-vortex-simulated-report-2025/render/render-trace.json

## Source-to-Extraction Coverage Map

Use this section to prove every extracted item is verbatim-backed by source text.

| Canonical Section   | Source slide/page IDs | Source evidence files          | Extracted reference(s)                               | Notes |
| ------------------- | --------------------- | ------------------------------ | ---------------------------------------------------- | ----- |
| Executive Summary | 7 | `slide-07.txt` | `# Executive Summary` bullets 1-2 | |
| Key Findings | 8,10 | `slide-08.txt`, `slide-10.txt` | `# Key Findings` bullets 1-2 | |
| Business Overview | 5 | `slide-05.txt` | `# Business Overview` bullet 1 | |
| Summary Financials | 6 | `slide-06.txt` | `# Summary Financials` bullets 1-2 | |
| Profit and Loss Overview / Financial Performance | 26 | `slide-26.txt` | `# Profit and Loss Overview / Financial Performance` Overview; Key Drivers 1-2 | |
| Quality of Earnings | 19,22,28 | `slide-19.txt`, `slide-22.txt`, `slide-28.txt` | `# Quality of Earnings` Overview; adjustments 1-3; Other considerations bullets 1-2 | |
| Income Statement | 10 | `slide-10.txt` | `# Income Statement` bullets 1-2 | |
| Balance Sheet | 30,31 | `slide-30.txt`, `slide-31.txt` | `# Balance Sheet` bullets 1-2 | |
| Net Working Capital | 33,35,36 | `slide-33.txt`, `slide-35.txt`, `slide-36.txt` | `# Net Working Capital` Overview; adjustments 1-3 | |
| Net Debt (Cash) | 38,39 | `slide-38.txt`, `slide-39.txt` | `# Net Debt (Cash)` Overview; adjustments 1-3 | |
| Cash Flows | 11 | `slide-11.txt` | `# Cash Flows` bullets 1-2 | |
| Reporting Environment | 43 | `slide-43.txt` | `# Reporting Environment` bullets 1-2 | |
| ARR / quality of revenue | 9 | `slide-09.txt` | `# ARR / quality of revenue` bullets 1-2 | |
| Appendices | 50,53,55 | `slide-50.txt`, `slide-53.txt`, `slide-55.txt` | `# Appendices` Appendix 1, Appendix 3, Appendix 4 | |

If any line in the extracted report is shortened, summarized, or paraphrased, set `Notes` to explain and keep status as `needs_revision` until corrected.

If OCR was used, source artifacts will include an `"[OCR_EXTRACTED_TEXT]"` section; keep those entries for audit only and ensure they are not copied into normal extracted markdown unless source text is proven required.

---

# Executive Summary

- We understand you have agreed upon a total Locked Box adjustmen...f net working capital and $(35.6) million of adjusted net debt.
- We identified a number of potential debt items during diligence...be a cash outflow for you in the future – refer to pages 39-40.

# Key Findings

- The $(40.0) Locked Box adjustment includes a NWC target of $(17... $1.3 million over delivery originally suggested by Management.
- Seller has proposed TTM Mar-25 diligence adjusted EBITDA of $11... adjustments, resulting in an adjusted EBITDA of $11.0 million.

# Business Overview

- Note: 	Fastcase Inc is a sole shareholder of two Chinese enti...posal of the entities are considered in our 	net cash / debt.
- Not present in source report
- Not present in source report

# Summary Financials

- The financial information presented below reflects the consolid...DA as presented by A&M is presented as a memo in the P&L below.
- The financial statements are prepared in accordance with Spanis... the report for commentary on potential US GAAP considerations.

# Profit and Loss Overview / Financial Performance

## Overview

Run rate subscription revenue of $51.3 million is consistent wi...sume non-subscription revenue to be consistent with TTM Mar-25.
In order to account for a recent increase in cost base of AI co...anagement noted this was a reasonable approach when questioned.
Based on recent headcount increases and offsetting software cos...TTM Mar-25. Management noted our revised approach was sensible.
Buy side adjusted run rate EBITDA is based off subscription rev...n), margin ($0.2 million) and operating expenses ($0.6 million)

## Key Drivers

1. Revenue: Run rate subscription revenue of $51.3 million is consistent wi...sume non-subscription revenue to be consistent with TTM Mar-25.
2. Cost of sales: In order to account for a recent increase in cost base of AI co...anagement noted this was a reasonable approach when questioned.

# Quality of Earnings

## Overview

Sell side pro forma adjustments: Pro forma adjustments presente...23 and the sell side diligence databook for further commentary.
Sell side run rate adjustments: Run rate adjustments presented ...ok for further commentary and see below for buy side revisions.
Buy side run rate adjustments: Buy side run rate adjustments re...approach). Refer to page 25 for further discussion on run rate.
Sell side actionable synergies: The sell side databook includes...26 and the sell side diligence databook for further commentary.
Sell side run rate adjusted EBITDA of $16.1 million for TTM Mar... – this results in a run rate adjusted EBITDA of $14.4 million.

## Quality of earnings adjustments

1. Bad debt normalization: The sell side bad debt adjustment norma... see buy side adjustment #1 for refinement to this methodology.
2. Outreach normalization costs: In FY23, Vortex incurred costs re...associated with the implementation and testing of the software.
3. Audit expense normalization: According to Management, the audit...recorded each year and the agreed fees (TTM Mar-25: $(23,000)).

## Other considerations

- Constant currency analysis demonstrates limited exposure in Vor...1, 2025 results in $0.3 million of incremental reported EBITDA.
- The main difference between constant currency at Jun-25 and Jan...hening has a net positive impact of $0.3 million at TTM Mar-25.

# Income Statement

- The analysis on this page compares our TTM Mar-25 adjusted EBIT... on adjustments for the Historical Period (FY23 to TTM Mar-25).
- Reported EBITDA excludes a significant amount of cash costs rel...on of NWC, consistent with the presentation of adjusted EBITDA.

# Balance Sheet

- Reported net assets are $64.2 million at March 31, 2025. Signif... contemplated in the Locked Box mechanism at December 31, 2024.
- Deferred income relates to customers who have paid upfront for ...racts – refer to NWC adj. #2 on page 35 for further discussion.

# Net Working Capital

## Overview

The agreed target working capital is $(17.0) million. We presen... what has been agreed in the context of the overall deal value.
The net working capital analysis presents average adjusted work...Adjusted working capital comprises of the following components:
Reported working capital: Discussed further on pages 29-30.
Sell side diligence adjustments: Adjustments in the sell side d...34 and the sell side diligence databook for further commentary.
Sell side normalizations: Normalizations included in the sell s...35 and the sell side diligence databook for further commentary.
Buy side diligence adjustments: Reflect incremental buy side ad... contract term). Please see pages 35-36 for further commentary.

## Net working capital adjustments

1. Discontinued M&A extraordinary legal fees: In FY24, a poten...ed to M&A from working capital due to the non-recurring nature.
2. Deferred expense normalization: Deferred commissions refer ...t of working capital, arising solely from accounting treatment.
3. Bad debt provision: We normalize bad debt throughout the Hi...ision to reflect bad debt expense included in the adjusted P&L.

If adjustment items are only presented in tables/charts and excluded by policy, capture any surrounding explanatory lines and add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Net Debt (Cash)

## Overview

Net debt presented below is representative of the agreed Locked...Locked Box, but relevant for your consideration on pages 39-40.
The net debt analysis presents adjusted debt consistent with th... by both parties. Adjusted net debt comprises of the following:
Reported net debt: Cash and debt items included on the reported balance sheet at December 31, 2024,
Balance sheet reclassifications: Reflect items originally inclu...$0.1 million of short term investments related to trapped cash.
Other (debt)/cash-like adjustments: Other items identified by both parties as cash / debt like over the course of diligence.

## Net debt / cash adjustments

1. Judicata former shareholder payable: Relates to an off balance ...r founder of Judicata who is currently employed in the company.
2. Douglas provision: The Fastcase office was relocated prior to D... amounting to $25,000. This item has been considered debt like.
3. NextChapter litigation final cash outflow: Related to the ongoi...provision to what will actually be paid based on the agreement.

If debt-like/working-capital adjustments are only in tables/charts, add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Cash Flows

- Positive cash flows from operations (EBITDA + change in NWC) ar...low of $(3.1) million in FY24 and $(1.5) million in TTM Mar-25.
- The Vortex financial model does not include a projected balance...sh generative (before the cash impact of financing activities).

# Reporting Environment

- The financial information presented in this report is primarily...as exported from monthly trial balances provided by Management.
- The Company uses NetSuite for financial reporting purposes and to track ARR.

# Related Parties

- Not present in source report
- Not present in source report

# Industry Analysis

- Not present in source report
- Not present in source report

# Forecast Trading

- Not present in source report
- Not present in source report

# Quality of Net Assets

- Not present in source report
- Not present in source report

# Gross Margin by LOB

- Not present in source report
- Not present in source report

# ARR / quality of revenue

- Management were unable to provide a full reconciliation between...d revenues to within ~0.2% of ARR for TTM Mar-25 (see page 14).
- Both ARR and reported revenue are overstated, as they exclude t...se to account for lost revenue due to refunds or cancellations.

# Appendices

## Appendix 1: Trial balance reconciliation to audited financial statements

Note:	We have compared FY23 per the VDD databook to the Direct...d in the relevant costs captions in the audit/directors report).

## Appendix 2: Long term contracts deferred revenue

Not present in source report

## Appendix 3: Corporate Chart. vLex Group (as at April 24, 2025)

* Fastcase Inc is a sole shareholder of two Chinese entities: H...completed, this entities will no longer form part of the Group.

## Appendix 4: Basis of preparation

KPMG LLP (‘KPMG’) has been engaged by Themis Solutions Inc. (‘Client’) prepare a financial due diligence report in connection with the potential acquisition of Felix Spain Bidco, S.L. (‘Target’). The report has been prepared in accordance with our engagement letter dated May 7, 2025.
Our work on historical trading comprises the period January 1, 2023 to March 31, 2025. Our scope of work has been focused on historical quality of earnings, including a run rate analysis with reference to March 31, 2025, as well as consideration of the balance sheet at December 31, 2023 and 2024 and March 31, 2025, and working capital for the period January 31, 2023 to March 31, 2025. Note that our work predominantly focused on considering the nature and reasonableness of the adjustments proposed by the seller and their diligence team at A&M, and identifying additional adjustments or alternative views based on the information made available. We did not perform any analysis of the drivers of underlying profitability, or conduct any other commercial analysis.

During the course of our work our main points of contact have been the Management of Target, represented by Hugo Ruiz Taboada (Global CFO), and Vortex’s financial advisors including J.P. Morgan (‘JPM’) and Alvarez & Marsal (‘A&M’).
Overall, we have had relatively limited access to Management – however, they have responded to our questions and requests through a virtual dataroom in a timely manner. We attended a meeting with Management on June 10, 2025, and exchanged various communications with Management and their advisors through email throughout the diligence process.
The contents of our report have not been reviewed by the Management of Target and the factual accuracy of this report has not been confirmed by the Management.

The requested information has been provided through the virtual data room. As of the date of this report, all available requested information has been provided in a timely manner.
Our work has relied on certain key sources of information including, but not limited to; (1) the sell side diligence databook (prepared by A&M), (2) Managements’ customer cube (ARR), and (3) other various sources of revenue (e.g., deferred revenue waterfall, reoccurring revenue, late renewals, etc.).
As noted above regarding our scope of work, based on our scope, the access to Management, and the information provided, we focused on the nature and reasonableness of adjustments prepared by the seller. However, we have not performed confirmatory work at the depth of verification of GL / invoice evidence to support adjustments, or had visibility into corresponding balance sheet accounts at a granular level each period end.
In addition, Management provided a high level reconciliation of ARR and revenue as well as a more detailed reconciliation by customer for the latest month (Mar-25) – however, a more readily available and traceable reconciliation between a ARR and revenue is a potential area of improvement under your ownership.

Scope of work

Access to management

Quality of information

Continue numbering for all appendix sections found in source.

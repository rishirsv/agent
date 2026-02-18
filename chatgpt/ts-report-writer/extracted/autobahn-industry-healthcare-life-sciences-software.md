report_md = """# Verbatim Report Extraction Template (All Reports)

Use this template to capture **actual report text only** (no rewriting).

## Non-Negotiable Rules

- Copy text **verbatim** from source report outputs.
- Do **not** summarize, interpret, or normalize wording.
- Keep placeholders like `[ENTITY]`, `[DATE]`, `[X]` if present.
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

- `SOURCE_FILE`: Project Autobahn - Report.pptx fileciteturn0file0
- `REPORT_ID`: project-autobahn-2019-04-17-draft
- `SOURCE_PATH`: /mnt/data/Project Autobahn - Report.pptx
- `EXTRACTION_STATUS`: completed
- `EXTRACTION_DATE`: 2026-02-17

## Required Source Evidence

- `SOURCE_TEXT_DIR`: extracted/verification/project-autobahn-2019-04-17-draft/source-text/pptx
- `MONTAGE_DIR`: extracted/verification/project-autobahn-2019-04-17-draft/montage
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
  - `slide-60.txt`
  - `slide-61.txt`
  - `slide-62.txt`
  - `slide-63.txt`
  - `slide-64.txt`
  - `slide-65.txt`
  - `slide-66.txt`
  - `slide-67.txt`
  - `slide-68.txt`
  - `slide-69.txt`
  - `slide-70.txt`
  - `slide-71.txt`
  - `slide-72.txt`
  - `slide-73.txt`
- `OCR_USED`:
  - false
- `OCR_SLIDES`:
  - []
- `OCR_ARTIFACTS_DIR`: Not present in source report
- `OCR_RUN_METADATA`: Not present in source report
- `PROVENANCE_QA_JSON`: Not present in source report
- `PROVENANCE_STATUS`: needs_revision
- `GATES_QA_JSON`: Not present in source report
- `GATES_STATUS`: needs_revision
- `SECTION_MAP_JSON`: Not present in source report
- `SECTION_ACCOUNTING_JSON`: Not present in source report
- `RENDER_TRACE_JSON`: Not present in source report

## Source-to-Extraction Coverage Map

Use this section to prove every extracted item is verbatim-backed by source text.

| Canonical Section                                | Source slide/page IDs      | Source evidence files                                                                                                                          | Extracted reference(s)                                                                                   | Notes |
| ------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----- |
| Executive Summary                                | 7                          | `slide-07.txt`                                                                                                                                 | `# Executive Summary` bullets                                                                            | `[x]` |
| Key Findings                                     | 9,10,11                    | `slide-09.txt`, `slide-10.txt`, `slide-11.txt`                                                                                                 | `# Key Findings` bullets                                                                                 | `[x]` |
| Business Overview                                | 7                          | `slide-07.txt`                                                                                                                                 | `# Business Overview` bullets                                                                            | `[x]` |
| Summary Financials                               | 17                         | `slide-17.txt`                                                                                                                                 | `# Summary Financials` bullets                                                                           | `[x]` |
| Profit and Loss Overview / Financial Performance | 31,32,33,34,35             | `slide-31.txt`, `slide-32.txt`, `slide-33.txt`, `slide-34.txt`, `slide-35.txt`                                                                 | `# Profit and Loss Overview / Financial Performance` `## Overview` + `## Key Drivers`                    | `[x]` |
| Quality of Earnings                              | 19,20,21,22,23             | `slide-19.txt`, `slide-20.txt`, `slide-21.txt`, `slide-22.txt`, `slide-23.txt`                                                                 | `# Quality of Earnings` `## Overview` + `## Quality of earnings adjustments` + `## Other considerations` | `[x]` |
| Income Statement                                 | 67                         | `slide-67.txt`                                                                                                                                 | `# Income Statement` bullets                                                                             | `[x]` |
| Balance Sheet                                    | 25                         | `slide-25.txt`                                                                                                                                 | `# Balance Sheet` bullets                                                                                | `[x]` |
| Net Working Capital                              | 26,27                      | `slide-26.txt`, `slide-27.txt`                                                                                                                 | `# Net Working Capital` `## Overview` + `## Net working capital adjustments`                             | `[x]` |
| Net Debt (Cash)                                  | 29                         | `slide-29.txt`                                                                                                                                 | `# Net Debt (Cash)` `## Overview` + `## Net debt / cash adjustments`                                     | `[x]` |
| Cash Flows                                       | 35                         | `slide-35.txt`                                                                                                                                 | `# Cash Flows` bullets                                                                                   | `[x]` |
| Reporting Environment                            | 47,48,49                   | `slide-47.txt`, `slide-48.txt`, `slide-49.txt`                                                                                                 | `# Reporting Environment` bullets                                                                        | `[x]` |
| Related Parties                                  | 41                         | `slide-41.txt`                                                                                                                                 | `# Related Parties` bullets                                                                              | `[x]` |
| Forecast Trading                                 | 37                         | `slide-37.txt`                                                                                                                                 | `# Forecast Trading` bullets                                                                             | `[x]` |
| <Addition Sections as Needed>                    | 39,40,41,42,43,44,45       | `slide-39.txt`, `slide-40.txt`, `slide-41.txt`, `slide-42.txt`, `slide-43.txt`, `slide-44.txt`, `slide-45.txt`                                 | `# <Addition Sections as Needed>` bullets                                                                | `[x]` |
| Appendices                                       | 63,64,65,66,67,68,69,70,71 | `slide-63.txt`, `slide-64.txt`, `slide-65.txt`, `slide-66.txt`, `slide-67.txt`, `slide-68.txt`, `slide-69.txt`, `slide-70.txt`, `slide-71.txt` | `# Appendices` Appendix 1-10                                                                             | `[x]` |

If any line in the extracted report is shortened, summarized, or paraphrased, set `Notes` to explain and keep status as `needs_revision` until corrected.

If OCR was used, source artifacts will include an `"[OCR_EXTRACTED_TEXT]"` section; keep those entries for audit only and ensure they are not copied into normal extracted markdown unless source text is proven required.

---

# Executive Summary

- It is our understanding that Great Point Partners is evaluating a potential investment in Axiom Real-Time Metrics, Inc.
- Key sources of information used during our due diligence process include:
- Internal monthly trial balances provided by Management
- Electronic data room access
- Audited financial statements for FY17 and FY18; and
- Meetings and discussions held with Management.

# Key Findings

- Significant Management adjustments to TTM Jan-19 EBITDA include:
- 2018 Bonuses paid in 2019 (increase of $0.1 million): Represents an adjustment to move bonuses paid in 2019 relating to 2018 performance to their appropriate period.
- Duplicate CFO costs – salary (increase of $40k): During the transition to a new CFO, there was an overlap during which salaries were paid to both the new and old CFO. The adjustment removes the duplication of costs.
- Significant potential adjustments identified during diligence, and their TTM Jan-19 EBITDA impact are included below:
- Salary capitalization (increase of $0.8 million): The Company performs a conservative capitalization on a monthly basis, which at year end it trues up based on the auditors calculation. The adjustment increases the capitalization estimate to be more consistent with FY17 and FY18 as a percentage of total salaries.
- Private Jet allocations (increase of $0.3 million): During the months of Nov-18 and Dec-18 there was no allocation done for the amount of the private jet costs used by Thinkworks/J2ASM. The adjustment adds back an estimated calculation of the allocation for those months.
- Significant pro forma adjustments identified during diligence, and their TTM Jan-19 EBITDA impact are included below:
- Rent adjustment (decrease of $0.8 million): Represents an adjustment to bring rent costs to the expected run-rate based on the new leased properties.
- SR&ED income removal (decrease of $0.6 million): Represents an adjustment to remove all SR&ED income. The Company’s status as a CCPC (Canadian Controlled Private Company) has changed as the Company is now ineligible to receive cash refunds for 35% of eligible expenditures. They are now eligible to receive tax credits for future taxes payable for 15% of eligible expenditures, as opposed to cash refunds. Due to the nature of the change in the way the credits will be received, we have proposed an adjustment to remove all SR&ED income.
- Significant potential adjustments identified during diligence, and their TTM Jan-19 NWC impact, include:
- Non – operational items: (increase of $0.3 million): Adjustment removes non-operational items from NWC, these include income taxes payable and current obligations under capital lease.
- Significant pro forma adjustments identified during diligence, and their TTM Jan-19 NWC impact, include:
- Private jet NWC adjustment (increase of $0.2 million): It is our understanding that Axiom pays for all private jet costs upfront and then an allocation occurs to other entities for their respective usage. Since this arrangement will cease upon closing, the proposed adjustment estimates the payables impact of the costs allocated to other entities and adds them back to NWC.
- Significant potential adjustments identified during diligence to net debt include:
- Non – operational items: Adjustment adds back income taxes payable and lease obligations to net debt.
- Other considerations identified during diligence include:
- Velicept site payments: Velicept site payments are accrued and may differ from the actual invoices received at the end of the study. As of Dec-18, the amount accrued was $2.4 million. You should consider whether the Company has already received the revenue for any site payments that may remain at close.
- Related party loan guarantor: The Company is the unlimited guarantor of a related company’s loan facility of $7.7 million.
- 190 Ronson: Vacant office space leased at ~$20,000 per month until Nov-19 that the Company has not yet been able to sublease.
- Potential tax exposures: Refer to the Tax due diligence section.
- During the historical period CAPEX has increase due to the growth in revenue. Much of this related to internally developed software.
- As revenue increased with Velicept, Net Working Capital was impacted as accrued liabilities related to site payments increased, as well as other payables relating to the Velicept contract.

# Business Overview

- Axiom Real-Time Metrics, Inc. (the “Company”, “Axiom”) delivers a range of eClinical tools; including electronic data capture, data management, interactive web response systems, and reporting.
- The Company was founded in 2001, by Andrew Schachter. The Company focuses on small to medium size biotech, pharmaceutical and contract research organizations (CROs). The Company has worked with global clients, with locations in North America, Europe, Asia, and India. Axiom’s credentials include:
- Experience in 20 therapeutic areas
- Driving studies for 17 years
- 600 studies completed

# Summary Financials

- The fiscal year-end for this Company is June 30. All amounts are denominated in Canadian dollars unless otherwise stated. Financial statements were audited by Klasner & Solomon LLP with an unmodified opinion for each of the FY16, FY17, and FY18 statements.
- Axiom Real-Time Metrics Inc. prepares financial statements on an annual basis in accordance with Canadian Accounting Standards for Private Enterprises (“ASPE”) and are in accordance with Canadian generally accepted accounting principles.

# Profit and Loss Overview / Financial Performance

## Overview

The above table illustrates the variances between actual and forecasted revenues for signed customers in FY18 and T11M Dec-18.
For customers that were signed at the start of the forecast period, the Company achieved 312.9% and 140.9% of forecasted revenues in FY18 and T11M Dec-18 respectively.
This was primarily driven by the customer Velicept in FY18, as the customer achieved 676.7% of budget. However, the Company was still able to surpass budget for other signed customers, and achieved 159.6% of forecast.

Total client revenue increased to $34.9 million in TTM Dec-18 from $11.4 million in FY17. However, only three clients increased revenues from FY18 to TTM Dec-18. Some highlights include:
Velicept: Since its first trial in 2017 the Company has continued to receive business from Velicept, currently working on two US-based phase II studies. In TTM Dec-18, Velicept accounted for 66.4% of total revenue. As of the date of this report, we understand the Company is currently negotiating Phase III studies with Velicept.
Microvention, Inc.: Increased revenue to $1.6 million in TTM Dec-18 from $0.6 million in FY18, with a YoY change of 159.8%. The Company has been awarded three studies over the last 12 months and they expect three new programs to start in FY19.

As shown in the adjacent table, the Company’s revenue during the TTM Dec-18 period, was primarily driven by one client that provided greater than $3 million in revenue ($23.5 million), followed by three clients that provided $1.0 million - $2.0 million ($4.3 million), and followed by six clients between $0.5 million - $1.0 million ($4.2 million). The one customer in the $3 million + bucket is Velicept which as mentioned previously accounts for 66.4% of total TTM Dec-18 revenues.

The adjacent table illustrates the $23.5 million increase from FY17 to TTM Dec-18 the drivers were the following:
Existing customers contributed $19.3 million to the increase in revenue;
New customers led to an increase in revenue of $4.7 million in revenue.
Lost customers led to a decrease in revenue of ($0.5) million in revenue.
Furthermore, the trend observed is that existing customers have made up more than half of the revenue, whereas customers gained or lost have accounted for no more than 8%.

The adjacent table illustrates top client decliners, some of the highlights include:
Beigene: The decline was due to Beigene discontinuing a few of their studies. Subsequent to a change in management, Beigene decided to manage studies internally.
Therapeutics MD: Client continues to work with the Company, however they are waiting for them to start work on their new drug compound which will occur later in the fiscal year.
Vital Therapies: Decline due to an unsuccessful phase III trial, which resulted in the closure of clinical trials in 2018.
Idera Pharmaceuticals Inc.: The Company decided to end the relationship with this client due to disagreement on team engagement.
Prometheus Therapeutics & Diagnostics: Programs were closed and the Company is waiting on information regarding trials for FY19.

The adjacent graph bridges the decline in revenue by categorizing the movements into different reasons behind decline. Some of the highlights include:
Ongoing client/New Work expected: As per Management representation, the biggest driver in the decline was timing in between clinical trials from their clients.
End of clinical trial: As illustrated in the adjacent graph, one of the biggest drivers behind the decline in revenue was clinical trials coming to an end. This accounted for roughly 45% of the decline from FY17 to TTM Dec-18.
Client Churn: The last major category in the decline in revenue was client churn, most of which was due to one customer (Idera) leaving after FY17.

The adjacent chart illustrates the linear relationship between the Company’s total headcount (in absolute number of employees) and direct labor costs ($’000) by department.
The increase in average headcount from 57 in FY17 to 98 in YTD Dec-18A was due to the increase in Operations, specifically project managers to assist in Velicept projects; Project VEL2001 and VEL2002.
The increase in average wages/benefits per FTE was primarily driven by the increase in S&M employees from FY17 to YTD Dec-18A.
The adjacent chart illustrates (1) the increasing headcount of full-time employees, and the subsequent increase in full-time employee direct labor costs, and (2) the decreasing headcount of sub-contractor employees and the subsequent decrease in sub-contractor direct labor costs.
Sub-contractor employee labor costs decreased approximately $1.1 million from FY17 to FY18. This was driven by a decrease of 336 in the headcount of subcontractor employees from FY17 to FY18.
Full-time employee labor costs increased approximately $1.7 million from FY17 to FY18. This was driven by an increase of 327 in the headcount of full-time employees from FY17 to FY18.
One of the drivers behind the decrease in costs of sub-contractors was due to the transition of employees to a full-time capacity. Our analysis showed that 30 employees were transitioned from sub-contractor to full-time.
The below chart illustrates employee turnover from FY17 to LTM Dec-18. Attrition increased to 180% in TTM Dec-18 from 67% in FY17, primarily due to the increase in new employees.
Note: FY19 amounts have been estimated by annualizing YTD Dec-18 figures.

An indicative cash flow analysis is presented in the adjacent table to illustrate the overall operating performance of the Company. Each component is described in greater detail below:
EBITDA, adjusted: Consistent with the QofE analysis, the EBITDA figure presented here includes potential adjustments relating to non-recurring items identified during the course of due diligence. Refer to the QofE section for further detail on the nature of the adjustments.
Change in adjusted net working capital: Similar to the EBITDA included in this analysis, the NWC changes are calculated from the adjusted NWC figures post potential and definitional adjustments. Refer to the net working capital analysis for further.
Change in Deferred Revenue: Represents the changes in deferred revenue in the historical period, as any increases in deferred revenue would signify cash was received for work to be performed later.
During the historical period, one of the biggest factors reducing FCF was CAPEX. As a result of the growth in revenue, increased expenditure on internally developed software was required to support operations. In addition, the fluctuations in NWC were attributed to the site payments and commissions related to the Velicept contract.

## Key Drivers

1. Top 10 client analysis: Total client revenue increased to $34.9 million in TTM Dec-18 from $11.4 million in FY17. However, only three clients increased revenues from FY18 to TTM Dec-18. Some highlights include:
2. Headcount analysis: The adjacent chart illustrates the linear relationship between the Company’s total headcount (in absolute number of employees) and direct labor costs ($’000) by department.

# Quality of Earnings

## Overview

The Quality of Earnings analysis is prepared based on the following sources of information:
Internal / Management Financial Statements: FY17, FY18 and YTD Jan-19 financial statements and monthly trial balance level financial statements;
Audited Financial Statements: The Company’s audited financial statements for FY17, and FY18;
Dataroom: Additional supporting data provided by Management in an electronic data room; and
Meetings / Discussions: Held with Management and their advisors.

The nature of adjustments included in the Quality of Earnings analysis are as follows:
Management Adjustments: Non-recurring/operational items defined by Management.
Potential Adjustments: Represent non-recurring and other items identified during our due diligence to reflect the underlying revenue and earnings of the core business.
Pro forma adjustments: Normalization adjustments identified and estimated to reflect go-forward EBITDA run-rate; and
Other Considerations: Certain other items identified that may impact historical and future EBITDA which are not reflected in the adjacent table.

The above Quality of Earnings schedule illustrates potential EBITDA adjustments which were identified for the fiscal years ended June 30, 2017, June 30, 2018, and trailing 12 months ended January, 31 2019. The proposed adjustments are not necessarily all-inclusive and are based on information provided by Management to date. The validity of these potential adjustments and other factors raised for your consideration may require further investigation to understand the potential impact on your valuation model.

## Quality of earnings adjustments

1. Management adjustments: The following adjustments are non-recurring/non-operational items identified by Management.
   2018 bonuses paid in 2019: This relates to the add-back of bonuses paid in December (FY19) that were related to FY18.
   Duplicate CFO costs – salary: This relates to the add-back for the CFO transition, as there was an overlap between the incoming CFO (Gianni di Lorio) and the outgoing CFO (Carey Chow).
2. Potential adjustments: The following adjustments represent non-recurring and other items identified during due diligence to reflect the underlying earnings of the core business:
   Salary capitalization: This relates to an adjustment made to normalize the salary capitalization year-end adjustments over the TTM Jan-19 period.
   The FY18 capitalization as a % of total salary (46.2%) was used to estimate the capitalization for TTM Jan-19. The difference between the estimated amount of $2.9 million and the current capitalization of $2.1 million was the adjustment to TTM Jan-19. Please refer to the table below for further detail.
   Private jet allocation: This relates to an adjustment that was made to allocate the private jet costs relating to J2ASM and Thinkworks out of Axiom’s P&L for the months of Nov-18 and Dec-18, when there was no allocation. Management represents that this has been captured in Feb-18 reporting.
3. Pro forma adjustments: The following adjustments represent our assessment of Management’s pro forma adjustments as analyzed during the diligence process.
   Rent adjustment: An adjustment has been made to represent the run-rate rent cost over the historical period. Please note the following run-rate assumed that the 190 Ronson lease will be sublet at some point, which has not yet occurred as the Company is still incurring costs for the rent of this facility.
   SR&ED income removal: A CCPC (Canadian Controlled Private Company) is eligible to claim federal SR&ED credits at a rate of 35% of eligible expenditures, in the form of a cash refund. However, when the Company reaches certain thresholds relating to taxable income/capital, or is controlled by a foreign owner, CCPC status is lost. In this case, only 15% of eligible expenditures are claimable, and are in the form of a tax credit to be applied to taxes payable in future years.
   In FY18, the Company claimed the SR&ED credit at 35%, a rate for which they will not be eligible moving forward as the Company is projected to lose CCPC status post-acquisition. Going forward, the Company will only be eligible for tax credits that can only be applied against future taxes payable, as opposed to cash refunds. Given this, and to be consistent with the definition of EBITDA, we have proposed an adjustment to remove all SR&ED income/expense offsets from EBITDA.
   Additionally, through tax due diligence, we have identified potential exposures that 50% or more of SR&ED claims made may be ineligible. Please refer to the tax due diligence section for further information.

## Other considerations

- The following adjustments include potential Quality of Earnings considerations identified during due diligence. These items relate to other potential business issues that should be considered in the overall evaluations of the business. In addition, these items may be subjective in nature – and as a result, have not been included in the Quality of Earnings schedule.
- Velicept margin: Project VEL2001 and VEL2002 have primarily driven revenue for the TTM Jan-19 period. The below table illustrates the income statement excluding Velicept. Without Velicept, there is a (59.9%) change in EBITDA in TTM Jan-19. As such GPP should consider the concentration of revenue and EBITDA growth that is highly dependent on one customer. Management used estimates to determine allocations of indirect costs associated with Velicept. Please refer to the Appendix 4 for a breakdown of these estimates.
- Vacancies/New hires: It is our understanding that current headcount is not sufficient to meet current and future growth for FY19. Management has identified future employee hires, however we have not been able to identify what headcount pertains to growth vs. intended to support current operations. As such we have not quantified an adjustment to EBITDA.
- Former CFO – consulting costs: The former CFO is presently on a consulting arrangement to close on equity investment. Currently, the Company forecasts $54k for Feb-19 to Jun-19 in consulting expenses. You may wish to consider the impact of this on your valuation model.
- 190 Ronson Dr. Lease: The Company is currently leasing a property at 190 Ronson Drive. It is our understanding that Management has been unable to sublease this facility. If this continues, Management will incur a cost of $20k monthly until Nov-19, when the lease expires.
- Potential tax exposures: Through Tax due diligence, the following potential quantifiable tax exposures have been identified. Please refer to the Tax DD section for further information.

# Income Statement

- The following items within direct costs are of note:
- CRO: For the Velicept trial, the Company uses a third party CRO, which is billed per visit. These visits are billed into cost of sales.
- Patient Cons: This line item includes nurse consultants, that sit with a patient at their location when a drug is administered.
- `Other`: “Other” includes a number of expenses including data analytics services, software licenses, and shipping.

# Balance Sheet

- Accounts Receivable: Includes accounts receivable, allowance for doubtful accounts, and work in progress.
- Prepaid: Primarily represents prepaid expenses related to rent, insurance, and other items.

# Net Working Capital

## Overview

Net working capital (“NWC”) was analyzed based on the internal trial balances for FY17 and FY18 as the Company’s audited statements are not broken out in sufficient detail for analysis.
The table below illustrates the underlying / adjusted NWC which is NWC post definitional adjustments and represents the indicative target NWC amount.
The decline in the NWC balance from FY17 to FY18 was due to an increase in current liabilities primarily accrued liabilities, and accounts payable. This was mainly driven by an increase in the Company’s revenue from Velicept, and the site payments accrued.
As a result of the Velicept contract and accrued liabilities increasing, NWC declined to (7.5%) of revenue in FY18 from 7.7% in FY17.
Current ratio
In the historical periods, the current ratio has increased to 1.72 as of FY18 from 1.54 as of FY17.

## Net working capital adjustments

1. Non-operational items: Adjustment removes non-operational items from NWC, these include income taxes payable and current obligations under capital lease.
2. Private jet NWC adjustment: It is our understanding that Axiom pays for all private jet costs upfront and then an allocation occurs to other entities for their respective usage. Since this arrangement will cease upon closing, the proposed adjustment estimates the payables impact of the costs allocated to other entities and adds them back to NWC.
3. Not present in source report

If adjustment items are only presented in tables/charts and excluded by policy, capture any surrounding explanatory lines and add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Net Debt (Cash)

## Overview

Notes payable: Bank term loan bearing interest at the rate of prime + 1.75% per annum with monthly principal repayments of $40,000 plus interest to maturity on March 12, 2023.
Related party receivables: The balances listed below are unsecured, non-interest bearing and not repayable within a year as agreed to by all related parties.
Thinkworks: Represents business aviation investment, depending on usage of the private jet and a personal withdrawal of $2.4 million by the CEO/Co-Founder Andrew Schachter.
J2ASM: Includes incremental construction costs for the interior of the corporation building.
3rd party: Includes a monthly dividend of $20,000 issued to the CEO/Co-Founder.

## Net debt / cash adjustments

1. Income tax payable: Adds income taxes payable to net debt.
2. Current obligations under capital lease: Similar to above, adds current portion of the capital lease obligation to net debt.
3. Not present in source report

If debt-like/working-capital adjustments are only in tables/charts, add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Cash Flows

- An indicative cash flow analysis is presented in the adjacent table to illustrate the overall operating performance of the Company. Each component is described in greater detail below:
- During the historical period, one of the biggest factors reducing FCF was CAPEX. As a result of the growth in revenue, increased expenditure on internally developed software was required to support operations. In addition, the fluctuations in NWC were attributed to the site payments and commissions related to the Velicept contract.

# Reporting Environment

- ASC 606 Revenue from Contracts with Customers, the new standard for revenue recognition, is effective for private companies for periods beginning after December 15, 2018. Therefore, Axiom will need to apply this standard from July 1, 2019.
- Under ASC 606, Axiom will apply the five step model to every contract to determine when and how to recognize revenue. The standard introduces specific requirements on how to separate the elements of a contract, allocation of consideration and the ability to recognize revenue over time.
- Apart from the five step model, the standard includes extensive application guidance on specific topics, including principal versus agent considerations, accounting for licensing and contract costs.
- Please note that this is a generic explanation of the five step model in ASC 606 and does not constitute any conclusion on the application of the five step model to the contracts in scope for review.

# Related Parties

- Target has a loan receivable due from Thinkworks of C$7.4M as of December 2018. Management represented that C$4.5M of the balance will be repaid prior to closing, and we estimate that the outstanding balance at close will be approximately C$2.9M ($2.2M). Management represented that Target paid expenses related to a corporate jet owned by a related party, Thinkworks as of November 2018 (and now owned by J2ASM Air), and received a reimbursement for these expenses (set off against amounts owed to these companies for travel, on a per diem basis).
- Target has a loan receivable balance due from J2ASM of $2.1M as of December 2018. Management represented that the loan receivable has historically has been amortized on a monthly basis by approximately C$20,000 for represents the lease obligation payments due from Target to J2ASM.

# Industry Analysis

- Not present in source report
- Not present in source report

# Forecast Trading

- Revenue is projected to increase to $50.2 million in FY19 from $36.7 million in TTM Jan-19. The adjacent table and graph illustrates the bridge from TTM Jan-19 to Management’s FY19 forecast.
- Signed: Signed revenue makes up $39.4 million, which is 78.4% of the forecasted FY19 revenues. The following three clients comprise 63% of the total signed revenue:
- Velicept: $17.4 million
- Microvention Inc.: $3.8 million
- Achillion Pharmaceuticals Inc.: $3.6 million
- Pending Signature/Final Budget: Pending signature/final budget revenues make up $1.6 million, which is 3.2% of forecasted FY19 revenues. The largest client is Microvention Inc. with approximately $1 million in pending signature/final budget revenue.
- Budget negotiations: Budget negotiation revenues make up $7.6 million, which is 15.2% of forecasted FY19 revenues. The key clients in this category are Anika Therapeutics and Flexion Therapeutics Inc., with $1.22 and $1.20 million, respectively.
- New business: New business revenues make up $1.2 million, which is 2.4% of forecasted FY19 revenues.
- Planned: Planned revenues make up $371k, which is 0.7% of forecasted FY19 revenues.

# Quality of Net Assets

- Not present in source report
- Not present in source report

# Gross Margin by LOB

- Not present in source report
- Not present in source report

# <Addition Sections as Needed>

- General tax compliance overview (1)
- Notwithstanding CCPC status, payroll returns for CPP contributions become normally closed 4 years from the end of the calendar year and payroll tax returns for EI premiums become normally closed 3 years from the end of the calendar year. A taxation year that has been audited may still be adjusted if the adjustments fall within the noted time limits or a waiver extending the reassessment period has been signed. Management represented that no such waivers have been signed.
- Management represented all Target entities have been and continue to be in in compliance with tax filings, instalment payments and remittances.
- Target was subject to a technical and financial SR&ED review from the CRA in FY17. Management represented that the review has been delayed but is expected to will commence in May 2019.
- Management represented Target was subject to a review over payroll remittances in FY17 which resulted in a nominal reassessment. Since the review, Management represented that all prior periods have been assessed and the Company has been compliant in its payroll fillings.
- Management represented the Company has not been subject to any other income tax and/or sales tax audits in open taxation years other than the above, .
- Target’s federal and provincial tax returns will, in general terms and subject to certain exceptions noted below, become statute barred in 3 years from the mailing date of the original Notice of Assessment (“NOA”) (“normally closed”). Post-closing, Target’s federal and provincial tax returns will generally become statute barred in 4 years.
- It should be noted that taxation authorities may re-open a taxation year normally closed in circumstances in which the taxpayer has made misrepresentations that are attributable to neglect, carelessness, or willful default or has committed any fraud in filing the return for the year.
- Notwithstanding CCPC status, sales tax returns become normally closed 4 years after the later of the day the GST/HST returns are filed and the day such returns are due to be filed.
- General tax compliance overview (2)
- On the earlier of the signing of the share purchase agreement or binding letter of intent, where a buyer (i.e., either a non-resident corporation or a Canadian corporation, that is controlled by a non-resident company) obtains the right to acquire more than 50% of the shares of a Canadian target, the Canadian target may lose its CCPC status.
- That is, on the acquisition of the majority of the issued and outstanding shares of the Company, Buyer should have the right to control the Company, such that the Company will be controlled directly or indirectly in any manner whatever by a non-resident. As a result the Company is expected to lose its CCPC status.
- We generally recommend, where otherwise feasible, the SPA is signed on the day of closing to limit the number of deemed year ends.
- Independent Contractors
- Independent contractors status is question of fact for Canadian tax purposes. Factors considered by the CRA in order to determine if any individual is an independent contractor or employee include: degree of control over the worker, tool/equipment used by the worker, subcontracting work by the worker, financial risk taken by the worker, etc.
- Indirect Tax
- Management represented that Target is registered for GST/HST.

# Appendices

## Appendix 1: Engagement letter procedures

Not present in source report

## Appendix 2: Reconciliation to audited balance sheet

The FY18 and FY17 financial statements were audited by Klasner & Solomon LLP.
Please note all of the variances observed were due to reclassifications, we have observed these and conclude that there is no impact to NWC.

## Appendix 3: Reconciliation to audited income statement

The FY18 and FY17 financial statements were audited by Klasner & Solomon LLP.
Please note all of the variances observed were due to reclassifications, we have observed these and conclude that there is no impact to Net income.

## Appendix 4: Cash reconciliation

Not present in source report

## Appendix 5: Velicept indirect cost management estimate breakdown

Not present in source report

## Appendix 6: Direct Costs

The following items within direct costs are of note:
CRO: For the Velicept trial, the Company uses a third party CRO, which is billed per visit. These visits are billed into cost of sales.
Patient Cons: This line item includes nurse consultants, that sit with a patient at their location when a drug is administered.
`Other`: “Other” includes a number of expenses including data analytics services, software licenses, and shipping.

## Appendix 7: Accounts Receivable

As shown in the adjacent table, accounts receivable and WIP has increased from $1.0 million as of FY17 to $4.0 million as of FY18.
The rise in accounts receivable is primarily due to the growth in revenue during the period. DSO increased from 32.0 days in FY17 to 42.1 days in FY18.
The Company has maintained a relatively consistent AR reserve year over year based on their historical bad debt expense experience.

## Appendix 8: Accounts Payable

Accounts payable increased from $0.8 million as of FY17 to $3.7 million as of FY18.
The increase in accounts payable is primarily due to increase in costs associated with the Velicept contract.
As shown in the adjacent table, days payable outstanding has increased from 27.0 days in FY17 to 48.3 days in FY18.

## Appendix 9: Reconciliation of SR&ED ITCs – tax returns and financial statements

Not present in source report

## Appendix 10: Information read and outstanding

Based on the FY18 T2 corporate income tax return, Target had a Schedule 1 addition of $1.487M for “SR&ED expensed per FS.” Please confirm that this entire amount was expensed to the income statement for accounting purposes.
Please confirm the amount of related party sales made by Target (output to related parties, if any) in open taxation years.
Confirmation on how outstanding related party loan receivable balances ($9.7M as of December 2019) owed to Target will be settled at the close of the Proposed Transaction.
Corporate organizational chart as of February 7, 2019
FY15-FY18 T2 corporate income tax return of Axiom Real-Time Metrics Inc.
FY15 reviewed financial statements and FY16-FY18 audited financial statements of Axiom Real-Time Metrics Inc.
FY16-FY17 Notice of Assessment, FY15-FY16 Notice of Reassessment for Axiom Real-Time Metrics Inc.
CRA letter requesting for review of FY17 SR&ED claim of Axiom Real-Time Metrics Inc.
Axiom Real-Time Metrics Inc. GST/HST filings and CRA GST/HST Notice of Assessments for the following periods:
FY17 (June 2017)
FY18 (July 2017, October 2017, January 2018, April 2018)
FY19 (July 2018, October 2018)
Axiom Real-Time Metrics Inc. GST/HST filing for the period ending January 2019
The following payroll documents:
Excel documents "FY18 12 - June - Remote Contractors v4" and "FY17 12 - June - Subcontractor" as provided in the VDR
Word document “Axiom - Independent Contractors”
The following SR&ED documents:
Excel documents “2017 - SRED Summary Final \_GPP” and “FY2018 - Software Intangible cost reconciliation vf”
The following documents as provided in the VDR:
“Axiom - Tax process”
“Axiom - Fed Prov audit”
“Axiom - Acquisitions – Disposals”
Related party loans document “FY19 related party Dec18” as provided in the VDR
"""

# quick check for placeholders remaining:

placeholders = re.findall(r"<[^>]+>", report_md)
placeholders[:20], len(placeholders)

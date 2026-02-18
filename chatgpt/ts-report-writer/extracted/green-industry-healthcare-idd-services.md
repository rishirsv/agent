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

- `SOURCE_FILE`: Project Green - Draft Report_(2.28.2020)v3.pptx
- `REPORT_ID`: project-green-draft-report-v3-2020-03-03
- `SOURCE_PATH`: /mnt/data/Project Green - Draft Report_(2.28.2020)v3.pptx
- `EXTRACTION_STATUS`: complete
- `EXTRACTION_DATE`: 2026-02-17

## Required Source Evidence

- `SOURCE_TEXT_DIR`: extracted/verification/project-green-draft-report-v3-2020-03-03/source-text/pptx
- `MONTAGE_DIR`: Not present in source report
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

| Canonical Section   | Source slide/page IDs | Source evidence files          | Extracted reference(s)                               | Notes |
| ------------------- | --------------------- | ------------------------------ | ---------------------------------------------------- | ----- |
| Executive Summary | 7,8,9 | `slide-07.txt`, `slide-08.txt`, `slide-09.txt` | `# Executive Summary` bullets | Excluded chart labels and table bodies per extraction policy. |
| Key Findings | 10,11 | `slide-10.txt`, `slide-11.txt` | `# Key Findings` bullets | Excluded table bodies per extraction policy. |
| Business Overview | 7 | `slide-07.txt` | `# Business Overview` bullets | Excluded chart labels and table bodies per extraction policy. |
| Summary Financials | 8 | `slide-08.txt` | `# Summary Financials` bullets | Excluded table bodies per extraction policy. |
| Profit and Loss Overview / Financial Performance | 10 | `slide-10.txt` | `# Profit and Loss Overview / Financial Performance` (Overview; Key Drivers) | Excluded chart/table bodies per extraction policy. |
| Quality of Earnings | 13-23 | `slide-13.txt`, `slide-14.txt`, `slide-15.txt`, `slide-16.txt`, `slide-17.txt`, `slide-18.txt`, `slide-19.txt`, `slide-20.txt`, `slide-21.txt`, `slide-22.txt`, `slide-23.txt` | `# Quality of Earnings` (Overview; adjustments; other considerations) | Excluded table bodies per extraction policy. |
| Related Parties | 16,23 | `slide-16.txt`, `slide-23.txt` | `# Related Parties` bullets | Excluded table bodies per extraction policy. |
| Net Working Capital | 25,26 | `slide-25.txt`, `slide-26.txt` | `# Net Working Capital` (Overview; adjustments note) | Excluded table bodies per extraction policy. |
| <Addition Sections as Needed> | 3 | `slide-03.txt` | `# <Addition Sections as Needed>` (Objective; Basis of Information) | Excluded cover/legal boilerplate outside substantive scope per extraction policy. |
| Appendices | 28-35 | `slide-28.txt`, `slide-29.txt`, `slide-30.txt`, `slide-31.txt`, `slide-32.txt`, `slide-33.txt`, `slide-34.txt`, `slide-35.txt` | `# Appendices` (Appendix 1-7) | Excluded table bodies per extraction policy. |

If any line in the extracted report is shortened, summarized, or paraphrased, set `Notes` to explain and keep status as `needs_revision` until corrected.

If OCR was used, source artifacts will include an `"[OCR_EXTRACTED_TEXT]"` section; keep those entries for audit only and ensure they are not copied into normal extracted markdown unless source text is proven required.

---

# Executive Summary

- For FY19, the Company reported revenue of $9.3 million (primarily consists of waiver income) and EBITDA of $1.4 million.
- The Business is a C-Corporation and Client is evaluating the potential acquisition of the Business’ IDD assets from the C-Corporation via an asset acquisition.
- Client is prepared to acquire the assets of the Company on a cash-free and debt-free basis, excluding the real estate portfolio owned by the Company.
- The Company’s fiscal year-end is December 31st.
- The Company’s financial statements are not audited or reviewed.
- The transaction perimeter excludes ABA services (child care), content, employment and executive departments. The table below presents the results of the Business, and each of the departments that are excluded from the proposed transaction perimeter.
- Revenue and expenses associated with the following divisions are removed from the transaction perimeter.
- Division’s revenue and expenses primarily consist of management fees paid to the owner and payroll expenses relating to divisions outside of the Business.
- Not present in source report

# Key Findings

- EBITDA margin decreases from 24.1% to 21.8% from FY17 to FY18, and subsequently increases to 25.4% in FY19. This is attributable to: (i) the Company increasing the number of administrative employees in FY18 to service growth realized in FY19, and (ii) step-fixed costs, such as rent expenses.
- Accounts receivable, accounts payable, and payroll accrual balances are estimated based on applying payroll cycle and days metrics on potentially adjusted revenue and expenses.
- Not present in source report

# Business Overview

- Soto Assisted Living Group (“Soto ALG” or the “Business”) provides support and health care services to individuals with intellectual and developmental disabilities (“IDD”).
- The transaction perimeter is focused on the Business’ IDD operations servicing adults (“Target” or the “Company”). The services include:
- Residential (group homes and host homes);
- Day services (community based and prevocational services);
- Community living support (“CLS”); and
- Health services (speech and occupational therapy).
- The Company has operations in six areas located in Georgia, USA (Augusta, Thomson, Evans / Martinez, Washington, Appling, and Grovetown).
- The Company currently has 15 group homes, four day services centers, 17 host homes, and two community living support locations.
- Soto Assisted Living Group.
- Day services
- Residential Services
- Health services
- Community living support
- Not present in source report
- Not present in source report

# Summary Financials

- The Company’s fiscal year-end is December 31st.
- The adjacent tables present the operating results of the Company on a combined basis.
- The Company’s financial statements are not audited or reviewed.
- Basis of presentation:
- The majority of the analysis herein is based on the financial statements compiled from the Company’s monthly trial balances.
- Note that the balance sheet presented represents the entire operating results of the organization (i.e. it does not reflect the transaction perimeter) as Management does not separately track and/or prepare the balance sheet for the contemplated transaction.
- For purposes of the net working capital analysis, the accounts receivable, accounts payable, and payroll accrual balances are estimated based on applying payroll cycle and days metrics on potentially adjusted revenue and expenses.
- Not present in source report

# Profit and Loss Overview / Financial Performance

## Overview

EBITDA margin decreases from 24.1% to 21.8% from FY17 to FY18, and subsequently increases to 25.4% in FY19. This is attributable to: (i) the Company increasing the number of administrative employees in FY18 to service growth realized in FY19, and (ii) step-fixed costs, such as rent expenses.

## Key Drivers

1. rent expenses: step-fixed costs, such as rent expenses.
2. Not present in source report: Not present in source report

# Quality of Earnings

## Overview

The quality of earnings analysis is prepared based on the following sources of information:
Internal trial balances and other information provided by Management; and
Discussions held with Allan Soto (CEO and owner), Dan McNichol (CFO), and Ashley Gilbert (Human Resources Director).
The nature of adjustments included in the quality of earnings analysis are as follows:
Management adjustments: Represents adjustments to reflect non-operating and run-rate items identified by Management; and
Potential adjustments: Represents adjustments identified during the course of diligence and adjustments proposed to Management’s adjustments. These adjustments are bifurcated into four categories:
Standalone savings – relating to contemplated post-transaction payroll and operating expenses.
Non-recurring – relating to non-recurring or one-time expenses and revenue.
Accounting – relating to out-of-period transactions, or reclassification of expenses recorded outside of the transaction perimeter.
Run-rate growth – represents the annualized run-rate attributable to new locations during the period to which it is opened.
Management and potential adjustments are discussed further on the following pages. Certain other items which were not included as an adjustment, but are included in the ‘Other considerations’ section are highlighted for your consideration.
FY19 reported EBITDA of $1.4 million increases to $1.8 million subsequent to Management adjustments.
Potential adjustments identified during due diligence increases Management adjusted EBITDA to $2.7 million.
The above quality of earnings schedule illustrates potential adjustments and other factors to be considered which are identified for fiscal years ending December 31, 2017, December 31, 2018 and December 31, 2019.
The proposed adjustments are not necessarily all-inclusive and are based on information provided by Management to date. Further analysis and access to additional information could uncover additional or different proposed adjustments.

## Quality of earnings adjustments

1. New homes – 14 and 15: Management represents that Homes 14 and 15 (opened in Sep-19) are expected to generate approximately $0.2 million in run-rate EBITDA. This adjustment is reversed and corrected as part of quality of earnings adjustment #15 (resulting in a net increase to EBITDA of $0.5 million), as it was quantified using preliminary estimates and no supporting details.
2. New summer clients: One of the Company’s competitors closed its operations during May-19, resulting in 35 of its clients moving into the Augusta Center. Management proposes a potential adjustment of $0.2 million to reflect the run-rate EBITDA as if the clients joined the Augusta Center in Sep-18. This adjustment is reversed as part of quality of earnings adjustment #16 (resulting in a net decrease to EBITDA of $0.2 million), as the Augusta Center’s reported results from May-19 to Oct-19 includes the actual impact for any new clients.
3. Cell phone: Represents cell phone expenses that are personal in nature and will not be necessary post-transaction.
4. Payroll adjustment: This adjustment: (i) eliminates compensation for employees who currently have non-operating roles, and (ii) includes the compensation for incremental roles as required by the Client post-transaction. The table below provides a detailed breakdown:
5. FMV rent: The Company leased several homes from a related party entity owned by Allan Soto. During November 2019, six homes were sold to a third party, which were subsequently leased back to the Company at market rates. This adjustment reflects the go-forward rent expense to the historical periods. Note that the adjustment is calculated on a cash basis, please see other considerations for further details.
6. Legal expense & professional fees: The Company incurs third party legal and professional fees attributable to the normal operations of the Company. Client represents that the external legal services will not be necessary post-transaction, as their legal team will take on the duties with no incremental costs. As a result, this expense is eliminated from EBITDA.
7. Bank service charges: The Company incurs service charges on its existing bank accounts. Client represents that these charges will not be recurring post-transaction, as they will consolidate the Company’s bank accounts with its own. As a result, this expense has been eliminated from EBITDA.
8. Start-up costs: The Company opened nine homes, one center (day services) and ten host homes during the historical period. As these locations ramp to maturity (30 to 90 days), they generate minimal revenue and incur start-up costs (primarily rent). This adjustment eliminates any revenue and operating expenses prior to maturity. The table below provides a detailed breakdown:
9. Non-operational conferences: Management represents that the Company's leadership team attended various conferences unrelated to the Company’s operations. As such, these expenses are eliminated from EBITDA.
10. Closed locations: The Company closed Home 7, Home 8 and Wilkes Centre during the historical period:
11. Home 7 (closed in Jun-17): This location provided services to four individuals as of Jun-17 (approximately $3,800 per individual on a monthly basis). Upon closure, two individuals transferred to host homes contracted by the Company and the other two individuals no longer receive any services. As such, the adjustment eliminates 50% of the location’s revenue and variable costs (i.e. payroll). All other operating costs (i.e. rent and utilities) are eliminated.
12. Home 8 (closed in Apr-19): This location provided services to four individuals as of Apr-19. Upon closure, all four individuals transferred to other homes within the Company. This adjustment eliminates fixed costs (primarily rent and utilities) incurred in Home 8 as the revenue and corresponding variable costs transferred to other locations (i.e. Home 13, 6, and 10).
13. Wilkes Center (closed in Mar-17): Upon closure, all members moved to the Thomson Center location. This adjustment reverses the fixed costs (primarily rent and utilities) incurred in Wilkes Center as the revenue and corresponding variable costs transferred to Thomson Center.
14. Participant payroll: Under a State sanctioned program, the Company provides employment to its clients where they perform various miscellaneous tasks (e.g. washing cars, clean driveways, etc.). The Company pays participating clients for the employment and receives a fee from the State. As the program generates minor profit/losses, Management decided to discontinue it in FY20. As such, the adjustment eliminates all revenue and expenses related to the program from EBITDA.
15. Lawsuit settlement: In FY17, the Company incurred legal and settlement fees relating to a lawsuit filed against the company by a former employee. Management represents these costs are non-recurring, as such they are eliminated from EBITDA. As of Dec-19, Management represents there are no pending legal claims.
16. Revenue reclassification: The Company inadvertently recorded revenue relating to FY18 during Jan-19. As a result, this adjustment reclassifies revenue earned to the appropriate months in FY18 from Jan-19.
17. Workers’ compensation reclassification: The Company inadvertently recorded workers’ compensation expense relating to FY18 during FY19. As a result, this adjustment reclassifies the expense to FY18 from FY19.
18. Tax payments: Management represents the Company had cash flow issues during FY16 and did not pay payroll taxes of $69,000. The Company paid this outstanding balance during FY18 and recorded the expense in the same year. As such, this out-of-period expense is reallocated to FY16.
19. Other: Consists of two adjustments which include: (i) reversal of intercompany transactions between the Business that do not eliminate when combining divisions within the transaction perimeter (i.e. $85,000 in FY17), and (ii) inclusion of utilities expense recorded outside of the transaction perimeter that relate to the Company’s operations (approximately $4,000 in FY19). As at the date of this report, Management have not provided details regarding the nature of the intercompany transactions.
20. Payroll paid via related party: Management represents that in FY17, certain employees of the Company were paid via a related party entity. These expenses are recorded outside of the transaction perimeter. As a result, FY17 EBITDA may not reflect the payroll expenses of all employees of the Company. As at the date of this report, supporting information confirming the related payroll expenses of these individuals is outstanding and as such, the adjustment is not quantifiable.
21. New locations: During the respective periods, the Company opened nine additional homes, one center (day services) and 10 host homes. According to Management, new locations typically ramp up between 30 to 90 days. As such, this adjustment annualizes the run-rate revenue and EBITDA for each location (with start-up costs excluded), within the fiscal period it opened. The respective adjustment is determined as follows:
22. Homes opened < 60 days: Represents locations open less than 60 days as at Dec-19 and are not at maturity. The adjustment is determined by using the lower of: (i) the average operating results of the Company’s fully running group portfolio, and (ii) Management’s budget for each location.
23. Reversal of Management’s adjustment #1: This adjustment includes a reversal of Management’s adjustment for Homes 14 and 15 as it is quantified using preliminary estimates.
24. Homes opened > 60 days, Host homes, and Williams (CLS): Represents locations open greater than 60 days and are at maturity levels as of Dec-19. The adjustment is calculated by annualizing the latest three month average of operating results per location (which Management represents is at 100% occupancy). Furthermore, an average occupancy percentage based on the Company’s portfolio during the historical period is applied to the annualized revenue.
25. Day hab growth: In May-19, 35 new clients moved into the Augusta center (day services) location as one of the Company’s competitors closed its operations. These individuals subsequently moved to the Downtown center, which opened in Sep-19 with  a capacity of 45 individuals. As such, this adjustment consists of the following:
26. Reversal of Management adjustment: Management’s adjustment increases EBITDA for the incremental 35 clients using preliminary estimates. The Augusta Center’s reported results from May-19 to Dec-19 includes the actual impact for any new clients. As such, Management’s total adjustment of $0.2 million relating to Nov-18 to Oct-19 is reversed.
27. Augusta center: As the 35 new clients are moving to the Downtown center (adjusted for in 14(iii) below), any revenue and variable expenses generated by these individuals are eliminated from the reported results of the Augusta Center.
28. Downtown center: Represents the annualized run-rate revenue and EBITDA for the Downtown center, which opened during Sep-19. The adjustment is based on the run-rate operating results realized in the Company’s portfolio (centers) during Dec-19, which Management represents is at 100% occupancy. Furthermore, an average occupancy percentage based on the Company’s portfolio (centers) during the historical period is applied to annualized revenue.

## Other considerations

- Unprocessed billing: Management represents that there was an IT issue with the State of Georgia’s billing system, limiting the Company's ability to invoice for services provided during Sep-19 to Dec-19. As the unbilled revenue of $47,000 is not approved by the State, the Company did not recognize the amount in its financials. Client should consider the impact to EBITDA of any unbilled and unrecorded revenue.
- The following includes potential quality of earnings considerations identified during due diligence. These items relate to other potential business issues that should be considered in the overall evaluation of the business. In addition, these items may be subjective in nature and as a result, have not been included in the quality of earnings schedule.
- Rent: The Company currently leases seven properties from a related party, which may not be at market rates. As such, Client should consider the impact to EBITDA for lease payments paid at market value.
- Cash basis rent expense: The Company records rent expense on a cash basis. However, pursuant to US GAAP, the Company should recognize rent on a straight line basis. It is our understanding that the impact may be nominal given that there is minimal / no rent free periods and rent escalations are inflationary.
- Admin costs: Management represents that the Company’s current administrative staff has additional capacity to service incremental homes in the future. Client should consider the impact to post-transaction EBITDA, as new locations may not require significant incremental administrative expenses.
- Incremental payroll savings: Client represents there are opportunities to eliminate further employees (Aliana Schuyler – Behavior Services Director and Ashley Soto – Participant Finance Director)  but have not confirmed the roles are entirely non-operational. As such, they are not included as an adjustment in the quality of earnings schedule. The incremental savings in payroll expense are noted below:
- Note: Post-transaction, Allan Soto (owner) will continue to open new locations using his real estate company and lease to the Company. Client represents majority of the start-up costs will be borne by Allan’s real estate company resulting in an immaterial balance remaining for the Company.
- Aliana Schuyler’s payroll expenses increased in FY19, due to promotion to Behavior Services Director during Aug-18, and FY19 including the full-year impact.

# Income Statement

- Not present in source report
- Not present in source report

# Balance Sheet

- Not present in source report
- Not present in source report

# Net Working Capital

## Overview

Basis of presentation
The net working capital schedule presents the estimated balances calculated for the fiscal years ended December 31, 2017, December 31, 2018 and December 31, 2019.
The estimated balances are not necessarily all-inclusive and are based on information provided by Management to date. Further analysis and access to additional information could uncover additional or different proposed adjustments.
The net working capital balances are estimated based on information provided by Management, taking the receivable / payable terms into consideration.
The adjacent table presents an estimate of the net working capital requirements.
Accounts receivable, accounts payable, and payroll accrual balances are estimated based on applying payroll cycle and days metrics on potentially adjusted revenue and expenses.
Average estimated working capital for FY19 is ($51,000).
Average working capital decreases from ($26,000) to ($51,000) from FY17 to FY19, as the Company opened additional locations.
Accounts receivable: The Company invoices the State of Georgia on a weekly basis (i.e. Fridays, one week in arrears), with approved balances paid out the following Tuesday. As such, average accounts receivable remains relatively stable and increases with revenue.
Payroll accrual: The Company does not currently accrue for its payroll, which is paid on a bi-weekly basis (one week in arrears). The estimated monthly amount is based on the Company’s payroll cycle and days outstanding at each respective month-end.
Accounts payable: Management represents that operating expenses (i.e. groceries, utilities, computer related, etc.) are paid on a weekly basis. A DPO of seven days is utilized to estimate the balance at each respective month-end.
Seven day DSO estimate is based on Management representation and the State government’s billing cycle.
(1) Excludes transferred income.
(1) Includes contractor expenses.
Seven day DPO estimate based on Management representation.
(1) Excludes intercompany, rent, and payroll expenses.

## Net working capital adjustments

1. Not present in source report: Not present in source report
2. Not present in source report: Not present in source report
3. Not present in source report: Not present in source report

Table- or chart-based adjustment details were excluded per extraction policy.

If adjustment items are only presented in tables/charts and excluded by policy, capture any surrounding explanatory lines and add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

Otherwise write `Not present in source report`.

# Net Debt (Cash)

## Overview

Not present in source report

## Net debt / cash adjustments

1. Not present in source report: Not present in source report
2. Not present in source report: Not present in source report
3. Not present in source report: Not present in source report

If debt-like/working-capital adjustments are only in tables/charts, add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Cash Flows

- Not present in source report
- Not present in source report

# Reporting Environment

- Not present in source report
- Not present in source report

# Related Parties

- FMV rent: The Company leased several homes from a related party entity owned by Allan Soto. During November 2019, six homes were sold to a third party, which were subsequently leased back to the Company at market rates. This adjustment reflects the go-forward rent expense to the historical periods. Note that the adjustment is calculated on a cash basis, please see other considerations for further details.
- Rent: The Company currently leases seven properties from a related party, which may not be at market rates. As such, Client should consider the impact to EBITDA for lease payments paid at market value.

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

# <Addition Sections as Needed>

- Not present in source report
- Not present in source report

## Objective

The objective of our engagement was to assist you with your assessment of the risks and opportunities of your prospective acquisition of Target. Our work in this report was based on information provided by you and obtained in an electronic data room and discussions with Target Management. The primary scope of our engagement was to make inquiries and perform analyses based on information made available to us, directed toward those business activities and related financial data of interest to you.

## Basis of Information

The engagement letter describes the procedures we were to perform and are attached herein in Appendix 1. Those procedures were selected by you and were limited in nature and extent to those that you determined best fit your needs. We make no representation regarding the sufficiency for your purposes of the procedures selected, and those procedures will not necessarily disclose all significant matters about Target or reveal errors in the underlying information, instances of fraud, or illegal acts, if any. This report was prepared by us on the basis that you provided us with all relevant information you received concerning Target.
The procedures we performed do not constitute an audit, examination or review in accordance with standards established by the Auditing and Assurance Standards Board (“AASB”) in Canada, and we have not otherwise verified the information we obtained or presented in this report. We express no opinion or any other form of assurance on Target’s internal control over financial reporting or on the information presented in our report, and make no representations concerning its accuracy or completeness.
We have not compiled, examined, or applied other procedures in accordance with the Assurance and Related Services Guidelines issued by the AASB to prospective information contained in this document and, accordingly, express no opinion or any other form of assurance or representations concerning the accuracy, completeness or presentation format of such prospective information. There will usually be differences between projected and actual results, because events and circumstances frequently do not occur as expected, and those differences may be material.
The data included in this report was obtained from you and/or Target from September 26, 2019 to March 3, 2020, inclusive. Since many aspects of the transaction with Target have either not been finalized or are not yet documented, changes may occur that materially affect the financial and other information we received and reported to you. We have no obligation to update our report or to revise the information contained herein to reflect events and transactions occurring subsequent to March 3, 2020. We have not reviewed this report with Target Management for the purpose of confirming the factual accuracy of the information we presented.
Because of its special nature, this report is not suited for any purpose other than to assist Client in its evaluation of Target and, as such and as agreed in the engagement letter, is restricted for your internal use only. Accordingly, KPMG does not accept any liability or responsibility to any third party who may use or place reliance on our report.

# Appendices

## Appendix 1: Engagement letter procedures

TRANSACTION SERVICES WORKPLAN
Unless otherwise noted, our work will concentrate on historical financial information of the latest fiscal years ended December 31, 2017 (“FY17”) and 2018 (“FY18”) and latest trailing twelve month period (“TTM-19”). Our findings will be documented in an executive style report outlining the key findings from the scope of work below.
Financial Due Diligence
Overview
Obtain background information of Target, including its:
Organizational structure, ownership and management reporting relationships;
Service offerings;
Significant relevant contractual relationships; and
Financial reporting framework / systems, personnel and internal control environment.
Consistency of accounting policies
Read Target’s financial statements and discuss them with Target’s management to gain an understanding of accounting policies and practices including:
Reporting methodology;
Revenue recognition policies;
Cash basis versus accrual basis of accounting;
Significant accounting estimates; and
Recent or contemplated changes in accounting principles.
Sustainability/quality of earnings
Propose potential adjustments to historical earnings before interest, taxes, depreciation, and amortization (“EBITDA”) by considering:
The impact of the normalization adjustments identified by Management (i.e. owner payroll compensation, computer software, prior period state recoupment, etc.);
The impact of flooding and closing of the Dallas day habilitation location;
The impact of related party transactions, if any;
The impact of settlements related to litigation, if any;
The impact of any changes to senior management or team structure;
The impact from the exclusion of CDSA and TxHML;
The impact from cash accounting (e.g. rent expense);
The pro forma impact of reimbursement rate changes, and census gain/loss included in reported/run rate EBITDA;
The impact of provisions, management estimates, or adjusting entries on the reported results;
Any other unusual or non-recurring events (revenue or expenses) or transactions that may have distorted results; and
Other potential items discovered in the due diligence process.
 Supporting analyses to quality/sustainability of earnings
Revenue
Obtain and read an analysis of Target’s revenue and inquire about:
Revenue and margin by type;
Comment on any non-recurring components of revenue;
Revenue seasonality, if any; and
Cut off issues, if any.

Expenses
Obtain and read an analysis of Target’s operating expenses and inquire about:
Salaries and wages (including headcount by area and function, if possible);
Incentive based compensation;
Corporate allocations;
Purchased services;
Rent and leases; and
Miscellaneous and other expenses.
Working capital
Summarize and normalize historical working capital in the business including:
Comment on the working capital trends, for the respective period;
Key drivers (i.e. seasonality, accounts payable days, days sales outstanding);
Payroll related funding and timing of cash flows; and
Large or unusual non-recurring items that may have impacted normal working capital trends including potential items identified within the quality of earnings analysis noted above.
 Supporting analyses to working capital
Accounts receivable
Obtain and read an analysis of Target’s accounts receivable and inquire about:
Aging analysis and related credit terms (including special terms);
Trade and non-trade balances;
Allowance for uncollectible accounts and write-offs; and
Reserve and adjustments.
Other assets (i.e. prepaid accounts)
Obtain a summary of and comment on unusual items, significant fluctuations, and significant balances.
Accounts payable and accruals
Obtain and read an analysis of Target’s accounts payable and accrued expenses and inquire about:
AP aging analysis, terms of trade with major vendors, days payables outstanding and trade payables aging analysis;
Accrued expenses; and
Other current and non-current liabilities.
Related party transactions
Inquire about and summarize related party transactions including:
Nature and extent of related party transactions; and
Basis of pricing for arrangements with related parties.
Fixed assets
Obtain an analysis / schedule of Target’s fixed asset continuity schedule.
Commitments and contingencies
Inquire about significant commitments and contingent liabilities including:
Pending or threatened litigations by regulatory or other authorities and by employees;
Incentive compensation and employee benefit obligations;
Significant lease and purchase obligations; and
Inquire about other off-balance sheet transactions.
Other (if required)
Cash proof testing:
Revenue vs cash collected vs change in AR (monthly roll over the historical period); and
Expenses vs cash disbursements vs AP (monthly roll over the historical period).
Quantifying significant accruals (e.g. prepaid, payroll, vacation etc.), if required.

## Appendix 2: Cash proof testing – operating account

Overview
The adjacent tables present an analysis comparing the cash inflows of the Business’ operating bank statements to the revenue, per the Business’ income statement. Management does not separate operating bank accounts for each division therefore, the adjacent analysis includes the activity for the entire Business.
The transactions are included as reconciling items to revenue as they represent changes in balance sheet accounts relating to cash, or do not relate to bank deposits.
The transactions are included as reconciling items to bank deposits as they are cash inflows unrelated to the Business’ revenue. They relate to (i) payments from shareholders, (ii) reclassification of deposits received in FY18, but recognized as revenue in FY19, and (iii) miscellaneous deposits unrelated to revenue such as bank transfers.

## Appendix 3: Cash proof testing – payroll account

Overview
The adjacent tables present an analysis comparing the cash outflows of the Business’ payroll bank statements to the payroll expense per the Business’ income statement. The payroll account is funded from the operating account on the previous page. Management does not separate payroll bank accounts for each division therefore, the adjacent analysis includes the activity for the entire Business.
The payroll related expenses are included on the income statement as separate accounts, however the cash payments were made from the payroll bank account.
The  reconciling item relates to electronic fund transfers to the Business’ operating account. The nature of these transfers is not related to payroll and therefore have been excluded.

## Appendix 4: Continuity schedule

(1) Opening date based on the earlier of transition or waiver income
Source: Management provided information; KPMG analysis
(1) Opening date based on the earlier of transition or waiver income
Source: Management provided information; KPMG analysis

## Appendix 5: Combining income statement, potentially adjusted

Source: Management provided information; KPMG analysis

## Appendix 6: Residential services, potentially adjusted

Source: Management provided information; KPMG analysis
[1] Previously owned by a related party and sold to a 3rd party during Nov-19.

## Appendix 7: Day services, potentially adjusted

Source: Management provided information; KPMG analysis

Continue numbering for all appendix sections found in source.

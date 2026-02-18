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

- `SOURCE_FILE`: Project Ascend - Report.pptx
- `REPORT_ID`: project-ascend-2018-03-27
- `SOURCE_PATH`: /mnt/data/Project Ascend - Report.pptx
- `EXTRACTION_STATUS`: pass
- `EXTRACTION_DATE`: 2026-02-17

## Required Source Evidence

- `SOURCE_TEXT_DIR`: (e.g. `extracted/verification/<report-id>/source-text/pptx` or `.../pdf`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/source-text/pptx
- `MONTAGE_DIR`: (e.g. `extracted/verification/<report-id>/montage`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/montage
- `SOURCE_ARTIFACTS`:
  - `slide-01.txt` or `page-01.txt` ...
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
- `OCR_USED`:
  - `false`
- `OCR_SLIDES`:
  - `[]`
- `OCR_ARTIFACTS_DIR`: (e.g. `extracted/verification/<report-id>/source-text/ocr`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/source-text/ocr
- `OCR_RUN_METADATA`: (e.g. `extracted/verification/<report-id>/source-text/ocr/ocr-run.json`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/source-text/ocr/ocr-run.json
- `PROVENANCE_QA_JSON`: (e.g. `extracted/verification/<report-id>/qa/provenance.json`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/qa/provenance.json
- `PROVENANCE_STATUS`: (`pass` or `needs_revision`)
  - `pass`
- `GATES_QA_JSON`: (e.g. `extracted/verification/<report-id>/qa/gates.json`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/qa/gates.json
- `GATES_STATUS`: (`pass` or `needs_revision`)
  - `pass`
- `SECTION_MAP_JSON`: (e.g. `extracted/verification/<report-id>/mapping/section-map.json`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/mapping/section-map.json
- `SECTION_ACCOUNTING_JSON`: (e.g. `extracted/verification/<report-id>/mapping/section-accounting.json`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/mapping/section-accounting.json
- `RENDER_TRACE_JSON`: (e.g. `extracted/verification/<report-id>/render/render-trace.json`)
  - /mnt/data/extracted/verification/project-ascend-2018-03-27/render/render-trace.json

## Source-to-Extraction Coverage Map

Use this section to prove every extracted item is verbatim-backed by source text.

| Canonical Section   | Source slide/page IDs | Source evidence files          | Extracted reference(s)                               | Notes |
| ------------------- | --------------------- | ------------------------------ | ---------------------------------------------------- | ----- |
| Executive Summary | 7,8 | `slide-07.txt`, `slide-08.txt` | `# Executive Summary` bullets | Non-narrative diagram labels excluded per extraction policy. |
| Key Findings | 9,10,13 | `slide-09.txt`, `slide-10.txt`, `slide-13.txt` | `# Key Findings` bullets |  |
| Business Overview | 7 | `slide-07.txt` | `# Business Overview` bullets | Non-narrative diagram labels excluded per extraction policy. |
| Summary Financials | 8 | `slide-08.txt` | `# Summary Financials` bullets | Table bodies excluded per extraction policy. |
| Profit and Loss Overview / Financial Performance | 25,26 | `slide-25.txt`, `slide-26.txt` | `# Profit and Loss Overview / Financial Performance` | Table- and chart-based details excluded per extraction policy. |
| Quality of Earnings | 15,16,17,18,19,20,21,22,23 | `slide-15.txt`, `slide-16.txt`, `slide-17.txt`, `slide-18.txt`, `slide-19.txt`, `slide-20.txt`, `slide-21.txt`, `slide-22.txt`, `slide-23.txt` | `# Quality of Earnings` | Table- and chart-based details excluded per extraction policy. |
| Income Statement | 25,26 | `slide-25.txt`, `slide-26.txt` | `# Income Statement` bullets | Table- and chart-based details excluded per extraction policy. |
| Balance Sheet | 28 | `slide-28.txt` | `# Balance Sheet` bullets | Table bodies excluded per extraction policy. |
| Net Working Capital | 29,30,31 | `slide-29.txt`, `slide-30.txt`, `slide-31.txt` | `# Net Working Capital` | Table bodies excluded per extraction policy. |
| Appendices | 33-45 | `slide-33.txt`, `slide-34.txt`, `slide-35.txt`, `slide-36.txt`, `slide-37.txt`, `slide-38.txt`, `slide-39.txt`, `slide-40.txt`, `slide-41.txt`, `slide-42.txt`, `slide-43.txt`, `slide-44.txt`, `slide-45.txt` | `# Appendices` | Table bodies excluded per extraction policy. |
| <Addition Sections as Needed> (Contacts) | 46 | `slide-46.txt` | `# Contacts` |  |

If any line in the extracted report is shortened, summarized, or paraphrased, set `Notes` to explain and keep status as `needs_revision` until corrected.

If OCR was used, source artifacts will include an `"[OCR_EXTRACTED_TEXT]"` section; keep those entries for audit only and ensure they are not copied into normal extracted markdown unless source text is proven required.

---

# Executive Summary

- Aequor Healthcare Services, LLC, Aequor Technologies, Inc. and its affiliated entities (“Aequor” or the “Company”) is a contingent and managed staffing solutions provider. The Company was founded in 1998 and is headquartered in Piscataway, New Jersey.
- The Company provides workforce solutions in healthcare and pharmaceutical industries by offering clinical, scientific, regulatory, allied (physical therapy), health, IT, and therapeutic staffing services on a contractual basis.
- For the year ended December 31, 2017, the combined Company generated $49.4 million and $5.1 million in net revenue and reported EBITDA, respectively. The combined Company generated $5.7 million in adjusted EBITDA over the same period.
- The adjacent tables present the operating results of the combined Company. The combined operating results include the operations in the USA, Switzerland and India.
- The Company prepares its USA entity financial statements in accordance with US GAAP and its fiscal year end is December 31st.
- The FY15 and FY16 financial statements for the USA entity are audited by Rosenberg Rich Baker Berman & Company (“RRBB”).  The Swiss and Indian entities are not audited.
- Refer to Appendix 2 for a reconciliation of the internal Management accounts to the audited financial statements.
- Note: FY15 combined does not include the results of Switzerland.
- The USA financial statements include the accounts of Aequor Technologies Inc., Aequor Healthcare Services LLC, AHS Staffing, Inc., Aequor Therapy Staff, Aequor Healthcare Services Inc., Lititz Healthcare Staffing Solutions LLC, AHH LLC, and AHNV LLC (collectively, Aequor USA).
- The above noted combined financial results are based on the combined USA, Switzerland and India entities. As a result, intercompany transactions are not eliminated and figures are presented on a gross basis.  Intercompany transactions primarily relate to the funding of the Swiss and Indian entities by Aequor USA.

# Key Findings

- Increase in EBITDA margin from FY16 to FY17 is primarily driven by an increase in revenue and margin. This increase is attributable to volume growth across the business.
- Only year end  balance sheets for India and Switzerland were provided (i.e. vs monthly). The monthly build-up for these accounts is the straight line difference between December 31, 2016 and December 31, 2017.   Overall, the NWC contribution is insignificant.
- Note 1: There are approximately $300,000 and $100,000 of reconciling differences related to total USA revenue for FY16 and FY17, respectively. The amounts are not considered significant for this indicative analysis.

# Business Overview

- Aequor Healthcare Services, LLC, Aequor Technologies, Inc. and its affiliated entities (“Aequor” or the “Company”) is a contingent and managed staffing solutions provider. The Company was founded in 1998 and is headquartered in Piscataway, New Jersey.
- The Company provides workforce solutions in healthcare and pharmaceutical industries by offering clinical, scientific, regulatory, allied (physical therapy), health, IT, and therapeutic staffing services on a contractual basis.
- For the year ended December 31, 2017, the combined Company generated $49.4 million and $5.1 million in net revenue and reported EBITDA, respectively. The combined Company generated $5.7 million in adjusted EBITDA over the same period.
- Allied: Provides physical and occupational therapy and speech language pathology services to rehab facilities, schools and homecare.
- Nursing: Provides temporary nurse staffing solutions to hospitals, nursing homes, government agencies and schools.
- IT, Scientific and Clinical: Provides scientist and technician support for pharmaceutical and diagnostic laboratories as well as IT staffing and software solutions.
- Payroll: The Company utilizes separate entities to process payroll across the various businesses and divisions.
- India: Provides back office, IT (including software development) and recruitment support to the Company as well as some third party sales in India.
- Switzerland: European branch focuses on growth and third party sales.
- The Transaction contemplates DWHP’s potential acquisition of an ownership interest in Aequor Healthcare Services, LLC, Aequor Technologies, Inc., and its affiliated entities.
- Note: FY15 figures are based on the audited USA financial statements and information provided by Management.  The due diligence and analysis herein focuses solely on FY16 and FY17.

# Summary Financials

- The adjacent tables present the operating results of the combined Company. The combined operating results include the operations in the USA, Switzerland and India.
- The Company prepares its USA entity financial statements in accordance with US GAAP and its fiscal year end is December 31st.
- The FY15 and FY16 financial statements for the USA entity are audited by Rosenberg Rich Baker Berman & Company (“RRBB”).  The Swiss and Indian entities are not audited.
- Refer to Appendix 2 for a reconciliation of the internal Management accounts to the audited financial statements.
- Note: FY15 combined does not include the results of Switzerland.
- The USA financial statements include the accounts of Aequor Technologies Inc., Aequor Healthcare Services LLC, AHS Staffing, Inc., Aequor Therapy Staff, Aequor Healthcare Services Inc., Lititz Healthcare Staffing Solutions LLC, AHH LLC, and AHNV LLC (collectively, Aequor USA).
- The above noted combined financial results are based on the combined USA, Switzerland and India entities. As a result, intercompany transactions are not eliminated and figures are presented on a gross basis.  Intercompany transactions primarily relate to the funding of the Swiss and Indian entities by Aequor USA.

# Profit and Loss Overview / Financial Performance

## Overview

Gross profit for the USA entity increased from 25.3% in FY16 to 26.4% in FY17.
Potentially adjusted gross margin for the combined entity increases from 25.1% in FY16 to 26.6% in FY17.

## Key Drivers

1. Gross profit: Gross profit for the USA entity increased from 25.3% in FY16 to 26.4% in FY17.
We understand that the Aequor Technology division has higher margins as typical billing rates for this division range from $50 - $150 per hour for IT contracts. This compares to rates of $40 - $70 per hour for nursing contracts and $48 to $70 per hour for Allied contracts.
2. Revenue: Consistent with Management’s representation, the graph below highlights no significant seasonal trends over the historical period.

# Quality of Earnings

## Overview

FY17 USA reported EBITDA of $5.1 million increases to $5.7 million after Management and potential adjustments identified during due diligence.
Significant adjustments are discussed on the following pages.
Overview
The quality of earnings analysis is prepared based on the following sources of information:
Internal trial balances and other information provided by Management; and
Discussions held with Management, namely Manmeet and Kamalpreet Virdi (CEOs), Michael Darbin (interim Controller) and the Company’s sell-side advisors (Capstone Headwaters).
The nature of adjustments included in the quality of earnings analysis are as follows:
USA EBITDA, reported: Reflects the Company’s view point of “reported” USA EBITDA and includes definitional add-backs (i.e. interest, income taxes, depreciation and amortization);
Management adjustments: Normalization adjustments to reported USA EBITDA identified by Management; and
Potential adjustments: Adjustments of non-recurring and other items to reflect the underlying revenue and earnings of the core business and the contributions from the Switzerland and India entities.
Significant adjustments are discussed further on the following pages. Certain other items which were not included as an adjustment, but are included in the ‘Other Considerations’ section are highlighted for your consideration.
The quality of earnings schedule above illustrates potential EBITDA adjustments and other factors to be considered which were identified for the fiscal years ended December 31, 2016 and 2017.
The proposed adjustments are not necessarily all-inclusive and are based on information provided by Management to date. Further analysis and access to additional information could uncover additional or different proposed adjustments.

## Quality of earnings adjustments

1. Management adjustments: The following are adjustments to reported USA EBITDA identified by Management:
Other income / other expense: This adjustment primarily relates to the reversal of $440,000 of contingent liabilities which were released into other income in FY17. In December 2017, Management reversed a $300,000 contingent liability associated with the acquisition of TheraStaff as the terms for paying out this amount were not achieved. Management also decreased the acquisition payable amount associated with the acquisition of SoundAdvice as the amount payable is currently estimated to be approximately $30,000 compared to the $170,000 that was initially booked. We understand that the contingent purchase obligations are excluded from the transaction and will be settled prior to close. This amount is included in the net debt analysis.
The remainder of this adjustment includes individually insignificant non-recurring items as well as exchange gains and losses.
Transaction expenses: The following reflect adjustments associated with the Company’s past acquisitions and professional fees which Management considers to be non-recurring:
Acquisition related consulting fees: Costs related to the acquisition of TheraStaff (FY16) and fees to Capstone regarding the contemplated transaction. We obtained supporting invoices for the Capstone consulting fees related to the transaction with no discrepancies noted.
Non-recurring audit fees: Represents the Company’s annual audit fees for FY16.  See QofE adjustment #8 for further considerations.
Recruiting software implementation fees: Costs related to recruitment of individuals to assist in the upgrading and customizing the Company’s information technology systems in order to integrate QuickBooks and ADP reports. Management represents that these costs are non-recurring in nature.
Duplicate bank payment: Costs related to the Company’s semi-annual bank audit (Provident bank).
Acquisition related legal fees: Costs primarily related to the Company’s acquisition of TheraStaff in FY16 incremental to the costs identified in a) above.
Bank switching fees: The Company switched from Wells Fargo to Provident in FY16 resulting in additional charges associated with loan origination.
Owner compensation adjustment: Represents the difference between the current officer salaries ($371,000 for each CEO) and their agreed upon salary post transaction ($250,000 for each CEO).
Owner personal expenses: This adjustment adds back personal expenses incurred by the Company’s CEOs. These include rent expense, legal and other professional fees, auto expenses, salaries and other benefits for non-active family members. Refer to the table below for a breakdown of these costs.
These expenses are tracked and recorded in separate GL accounts by Management. Based on discussions with Management, we understand that the rent is related to a personal property and the professional fees are related to the owners’ relatives. Based on discussions with Management as well as the monthly FY17 breakdown below, the owners stopped flowing personal expenses through the business in April 2017.
Start up expenses: This adjustment adds back the net costs associated with the Houston, Denver, Dallas, and Austin (locum) offices. These are new locations that are ramping up. Management represents that the Houston office is expected to breakeven in Q2-18 whereas the Denver, Dallas, and Austin locations have not yet generated any revenue. Refer to the table below for a breakdown of these costs.
Relocation savings (US to India): This adjustment adds back the payroll cost difference of various recruiter positions that have been relocated from the US to India. We understand that the average annual salary for a US recruiter is approximately $30,000 whereas the average annual salary for a recruiter in India is approximately $10,000 per year based on information provided by Management. The US individuals that were terminated and replaced by employees in India were shown to have equal or less productivity (converted hires) than the average Indian employee.
Non-recurring wage expenses: Represents an add back for various wages that Management determined to be non-recurring in nature including:
Retiree – Relates to the Company’s first retiring employee who was paid for an extra six months by the Company so that she would be eligible for a higher social security bracket upon retiring. Management represents that this individual did not contribute to the day-to-day operations of the Company in FY17.
IT sales consultant – Relates to an employee hired to assist in an IT role however, we understand that the individual did not have the necessary skills for the role and was terminated several months later. Management represents that this individual did not generate any revenue and that the Company is not looking to fill this role.
Bank audit support – Relates to an employee hired to assist with the semi-annual bank audit performed by Provident bank. See QofE adjustment #10 for further considerations.
2. Potential adjustments: The following are potential adjustments to Management adjusted EBITDA identified during diligence:
Audit fees: This adjustment eliminates Management’s add back for audit fees per QofE adjustment 2b given that these audit fees are recurring in nature. We have also included a normalized level of audit fees in both FY16 and FY17 based on the expenses incurred over the historical period. We have obtained invoices relating to the RRBB fees with no discrepancies noted.
Wage expenses: Reverses Management’s QofE adjustments 7b and 7c relating to wages for an IT consultant and an employee to support the semi-annual bank audit as we view these costs as recurring.
EBITDA contribution from India entity: Represents the EBITDA generated by Aequor Information Technology, PVT LTD as this entity is not consolidated with the Company’s financial statements. Refer to Appendix 5 for the India entity’s financial statements.
Note: We did not obtain monthly financial statements and the figures are therefore based on the annual statements. The operations are currently not significant to the Company’s overall operations and figures.
EBITDA contribution from Switzerland entity: Represents the EBITDA generated by Aequor Consulting GmbH that is not included in the Company’s annual audited financial statements. Refer to Appendix 6 for the Switzerland entity’s financial statements.
Note: We did not obtain monthly financial statements and the figures are therefore based on the annual statements. The operations are currently not significant to the Company’s overall operations and figures.
Revenue accrual: Represents revenue that is over accrued in Dec-16. The Company recognized $637,000 of revenue in Dec-16 that related to Jan-17 which is subsequently recognized in Jan-17. In order to correct for this, Management booked an entry in Dec-17 to decrease opening retained earnings by the over accrued amount. Based on the monthly closing process implemented in Jan-17, the Company accrues for this on a monthly basis and therefore, no equivalent adjustment is necessary in Dec-17.
Payroll accrual: Represents payroll expense that is over accrued in Dec-16. The Company recognized $192,000 of payroll expenses in Dec-16 that related to Jan-17 which is subsequently recognized in Jan-17. In order to correct for this, Management booked an entry in Dec-17 to increase opening retained earnings. Based on the monthly closing process implemented in Jan-17, the Company accrues for this on a monthly basis and therefore, no equivalent adjustment is necessary in Dec-17.
3. Not present in source report: Not present in source report

## Other considerations

- Software development costs: The Company capitalizes software development costs as follows:
- Management represents that these costs relate to a recruiting software customization project that is expected to go into service in the latter part of FY18. We understand that an additional $150,000 is expected to be incurred in FY18 relating to completing this project based on the current project plan. Management represents that nine employees and one delivery head are dedicated to the software development function and external consultants are used on an as needed basis to assist with module development. Therefore, the software development costs are tracked based on the associated payroll costs for these specific employees.
- Potential FX impact. The Company has operating entities in  Switzerland and India. Management represents that the FX impact over the historical period is not significant. However, if these operations continue to grow, the FX impact may become significant.
- Other considerations
- The following includes potential quality of earnings considerations identified during due diligence. These items relate to other potential business issues that should be considered in the overall evaluation of the business. In addition, these items may be subjective in nature and as a result, they have not been included in the quality of earnings schedule.
- Rent cash to GAAP (decrease of $144,000): The Company currently expenses rent associated with its New Jersey headquarters on a cash basis. Given that there are lease step ups associated with the current lease agreement, the annual rent expense under GAAP is $144,000 higher. It is our understanding that the lease terms will be renegotiated prior to closing of the transaction.
- Controller and CFO:  The Company’s accounting / finance team does not include a: (i) Chief Financial Officer (“CFO”) and/or (ii) Controller.  As the Company continues to grow and expand into other geographies and in order to provide adequate financial reporting on a timely basis, it is anticipated that these positions will be required.
- Note: In December 2017, the Company hired an external 	consultant to support the contemplated transaction.  The 	individual is tasked with the responsibilities of an 	interim Controller. His monthly salary of $6,300 in Dec-17      implies an annual salary of approximately $76,000.
- Director, Recruitment Education: We understand that the Company hired a Director, Recruitment Education in order to support the continued growth of the Company. He will be starting on April 1, 2018 with an annual salary of $85,000. This is a new position that is directly associated with the Company’s overall growth strategy.

# Income Statement

- Gross profit for the USA entity increased from 25.3% in FY16 to 26.4% in FY17.
- Note: There are approximately $300,000 and $100,000 of reconciling differences related to total revenue for the USA entity for FY16 and FY17, respectively.
- The adjacent table provides an indicative gross margin analysis for the USA entity.
- The revenue and direct cost figures are obtained from transaction level details (i.e. revenue and payroll) provided by Management.
- We understand that the Aequor Technology division has higher margins as typical billing rates for this division range from $50 - $150 per hour for IT contracts. This compares to rates of $40 - $70 per hour for nursing contracts and $48 to $70 per hour for Allied contracts.
- Potentially adjusted gross margin for the combined entity increases from 25.1% in FY16 to 26.6% in FY17.
- The adjacent table presents net revenue, gross profit, and gross margin for the combined entity (USA, Switzerland, and India) on a potentially adjusted basis.
- The revenue figures are based on the following sources of information:
- USA revenue per the audited financial statements.
- Potential adjustments to revenue identified during due diligence. Note that the numbers reference the corresponding QofE adjustment.
- Intercompany revenue from India and Switzerland.
- The gross profit figures are based on the following sources of information:
- USA gross profit per the audited financial statements.
- Potential adjustments to gross profit accounts identified during due diligence including the direct salaries associated with the India and Switzerland entities as well as the payroll accrual adjustment in Dec-17.
- Consistent with Management’s representation, the graph below highlights no significant seasonal trends over the historical period.

# Balance Sheet

- Accounts receivable: Includes third party trade AR.  The Company has minimal bad debt accounts due to the nature of it’s customer profile (hospitals, large corporations etc.).
- Accrued revenue: Revenue performed in the period that has not yet been invoiced.
- Prepaid expenses: This account largely relates to prepaid insurance and the funding of cash to India and Switzerland.
- Accounts payable: Third party trade payables.
- Accrued liabilities: Predominantly consists of accrued payroll.
- Fixed assets: Leasehold improvements and office furniture and equipment.
- Intangibles: Goodwill from previous acquisitions.
- Software development: The Company capitalizes its development costs related to the customization of specific staffing modules.
- Due from affiliates: Management loan receivables between from the Company’s owners and receivables from the India and Switzerland entities for start up costs.

# Net Working Capital

## Overview

Average net working capital decreases from $11.9 million to $11.0 million in FY17 subsequent to potential adjustments identified during due diligence.
The net working capital normalization schedule summarizes potential adjustments to be considered which were identified for the fiscal year ended December 31, 2016 and 2017.
The proposed adjustments are not necessarily all-inclusive and are based on information provided by Management to date. Further analysis and access to additional information could uncover additional or different proposed adjustments.

## Net working capital adjustments

1. Accrued revenue: Accrued revenue: The Company historically had “soft” month end cut-off procedures and relied on their auditors to assist in the determination of year end accruals. Beginning in January 2017, the Company initiated a detailed  methodology to provide consistent revenue and payroll cut-off procedures based on the date services are performed.  The Company did not adjust for the opening balance sheet impact from this change in methodology until December 31, 2017.
This adjustment aligns the monthly accrued revenue based on the date services are performed.
2. Accrued payroll: Accrued payroll: As discussed in NWC adjustment #1, the Company initiated a payroll cut-off methodology in January 2017 based on the date services are performed. The opening balance sheet impact from this change in methodology is not adjusted for until December 31, 2017.
This adjustment aligns the monthly accrued payroll based on the date services are performed.
3. Net working capital adjustments (continued): Prepaid expenses: The Company did not correctly record prepaid expenses at December 31, 2016 and did not draw down the annual insurance prepayments on a consistent monthly basis throughout FY17.  Management adjusted the prepaid to actual in December 2017.  This adjustment straight-lines the individual prepaid components to reflect an indicative view of the monthly prepaid expense accounts.
Working capital impact of QofE adjustments: This adjustment determined the indicative net working capital adjustment attributable to QofE adjustments #2 to #9. The adjustment is primarily determined based on DPO calculations. Refer to Appendix 9 for further details.
India NWC contribution: This adjustment presents the net working capital contribution from the India entity. Refer to Appendix 10 for further details.
Switzerland NWC contribution: This adjustment presents the net working capital contribution from the Switzerland entity. Refer to Appendix 10 for further details.

If adjustment items are only presented in tables/charts and excluded by policy, capture any surrounding explanatory lines and add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Net Debt (Cash)

## Overview

Not present in source report

## Net debt / cash adjustments

1. Not present in source report
2. Not present in source report
3. Not present in source report

If debt-like/working-capital adjustments are only in tables/charts, add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Cash Flows

- Not present in source report
- Not present in source report

# Reporting Environment

- Not present in source report
- Not present in source report

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

# <Addition Sections as Needed>

- Not present in source report
- Not present in source report

# Contacts

The contacts at KPMG in connection with this report are:
John Cho
Partner, Transaction Services
+1 416 777 3994
johncho@kpmg.ca
Mike Mammoliti
Partner, Transaction Services
+1 416 777 8931
mmammoliti@kpmg.ca
Brendan Charles
Manager, Transaction Services
+1 416 476 2559
bcharles@kpmg.ca
Eve Hurowitz
Senior Associate, Transaction Services
+1 416 791 2042
ehurowitz@kpmg.ca

# Appendices

## Appendix 1: Engagement letter procedures

Not present in source report

## Appendix 2: Reconciliation to audited financial statements

Source: Management provided consolidation schedules; audited financial statements

## Appendix 3: Combining income statement (Aequor USA, India, Switzerland)

The Company’s financials are presented on a combined (grossed) up basis.
Source: Management provided information; KPMG analysis

## Appendix 4: Combining balance sheet (Aequor USA, India, Switzerland)

The Company’s financials are presented on a combined (grossed) up basis.
Source: Management provided information; KPMG analysis

## Appendix 5: India financial statements

Source: Management provided information; KPMG analysis

## Appendix 6: Switzerland financial statements

Source: Management provided information; KPMG analysis

## Appendix 7: Top customers

Appendix 7Top customers (1) - Nursing
Note: Customers are presented in descending order based on total revenue for FY17
(1) This total represents the top 10 customers in each year (these customers are highlighted in the table)
Source: Management provided information
We understand that the Plaza acquired one of the Saint Barnabas entities during FY16 resulting in an increase in revenue for the Plaza and a decrease in Saint Barnabas revenue during FY17.
Management represents that this customer was having financial challenges and became a credit risk and therefore Management decided to discontinue working with this customer during FY17. We understand that there was no uncollectible amounts associated with these customers.
Basis of presentation
The top customer data in the adjacent table as well as in the tables in the following slides was obtained from transaction level revenue detail provided by Management.
In order to determine monthly revenue amounts given that the invoice date may be later than the date the services were provided, we used the memo field which included a description of the date the services were provided.

Appendix 7Top customers (2) – IT and clinical / scientific
Note: Customers are presented in descending order based on total revenue for FY17
(1) This total represents the top 10 customers in each year (these customers are highlighted in the table)
Source: Management provided information
The increase in Atos and XTensgrity revenue is due to the Company having dedicated account teams for these customers with an increased number of recruiters in FY17.
We understand that Pfizer has a policy in place whereby they are able to hire the Company’s employees on a full time basis after the employee has worked with them for 18 months. We understand that Pfizer hired many of Aequor’s employees in Q4 2016 and therefore revenue decreased in FY17.

Appendix 7Top customers (3) – Allied
Note: Customers are presented in descending order based on total revenue for FY17
(1) This total represents the top 10 customers in each year (these customers are highlighted in the table)
Source: Management provided information
We understand that this facility closed in FY17 resulting in the decrease in revenue during FY17.
Management represents that the decrease in revenue is a result of these state supported living centers slowly reducing patients. We understand that these centers will eventually be phased out to a residential model with less resident density.
We understand that the Company won a bid in FY17 to staff more resources.

## Appendix 8: Indicative NWC adjustment

Source: 	Management provided information
Note:          The monthly NWC adjustment is calculated as the total of QofE adjustments #2 to #9 multiplied by the monthly DPO multiplied by (12/365).

## Appendix 9: India & Switzerland NWC contribution

Source : 	Management provided information
The India and Switzerland financials were provided on an annual basis only.  As such, the FY17 monthly working capital amounts for India and Switzerland were calculated as the straight-line difference between each account’s December 31, 2016 and December 31, 2017 amounts.

## Appendix 10: Net working capital, adjusted – Days ratio metrics

Source : 	Management provided information
Working capital metrics
The Company’s cash conversion cycle has averaged 75 days over FY17.
The Company’s FY17 average DSO of 80 is expected as the majority of the customer terms are between 60 to 120 days.
The Company’s DPO average of 5 days for FY17 is due to the nature its expenses being predominantly payroll to employees.

## Appendix 11: Accounts receivable

Source : 	Management provided information
Accounts receivable management
Amounts are aged based on invoice date.
Management represents that there is no risk relating to the collectability of these accounts. We understand that receivables may be aged greater than 90 days however there has been no historical issue relating to collecting these amounts. As well, there has been minimal bad debt expense incurred over the historical period.

Continue numbering for all appendix sections found in source.
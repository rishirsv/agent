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

- `SOURCE_FILE`: Project Yukon - Report.pptx
- `REPORT_ID`: project-yukon-report
- `SOURCE_PATH`: /mnt/data/Project Yukon - Report.pptx
- `EXTRACTION_STATUS`: pass
- `EXTRACTION_DATE`: 2026-02-17

## Required Source Evidence

- `SOURCE_TEXT_DIR`: extracted/verification/project-yukon-report/source-text/pptx (e.g. `extracted/verification/<report-id>/source-text/pptx` or `.../pdf`)
- `MONTAGE_DIR`: extracted/verification/project-yukon-report/montage (e.g. `extracted/verification/<report-id>/montage`)
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
- `OCR_USED`:
  - false
- `OCR_SLIDES`:
  - []
- `OCR_ARTIFACTS_DIR`: Not present in source report (e.g. `extracted/verification/<report-id>/source-text/ocr`)
- `OCR_RUN_METADATA`: Not present in source report (e.g. `extracted/verification/<report-id>/source-text/ocr/ocr-run.json`)
- `PROVENANCE_QA_JSON`: extracted/verification/project-yukon-report/qa/provenance.json (e.g. `extracted/verification/<report-id>/qa/provenance.json`)
- `PROVENANCE_STATUS`: pass
- `GATES_QA_JSON`: extracted/verification/project-yukon-report/qa/gates.json (e.g. `extracted/verification/<report-id>/qa/gates.json`)
- `GATES_STATUS`: pass
- `SECTION_MAP_JSON`: extracted/verification/project-yukon-report/mapping/section-map.json (e.g. `extracted/verification/<report-id>/mapping/section-map.json`)
- `SECTION_ACCOUNTING_JSON`: extracted/verification/project-yukon-report/mapping/section-accounting.json (e.g. `extracted/verification/<report-id>/mapping/section-accounting.json`)
- `RENDER_TRACE_JSON`: extracted/verification/project-yukon-report/render/render-trace.json (e.g. `extracted/verification/<report-id>/render/render-trace.json`)

## Source-to-Extraction Coverage Map

Use this section to prove every extracted item is verbatim-backed by source text.

| Canonical Section   | Source slide/page IDs | Source evidence files          | Extracted reference(s)                               | Notes |
| ------------------- | --------------------- | ------------------------------ | ---------------------------------------------------- | ----- |
| Executive Summary | 7,10 | `slide-07.txt`, `slide-10.txt` | `# Executive Summary` bullets 1-6 |  |
| Key Findings | 7,8 | `slide-07.txt`, `slide-08.txt` | `# Key Findings` bullets 1-10 |  |
| Summary Financials | 10,12 | `slide-10.txt`, `slide-12.txt` | `# Summary Financials` bullets 1-2 |  |
| Profit and Loss Overview / Financial Performance | 7,10 | `slide-07.txt`, `slide-10.txt` | `# Profit and Loss Overview / Financial Performance` `## Overview` and `## Key Drivers` items 1-4 |  |
| Quality of Earnings | 12,13,14,15,16,17 | `slide-12.txt`, `slide-13.txt`, `slide-14.txt`, `slide-15.txt`, `slide-16.txt`, `slide-17.txt` | `# Quality of Earnings` sections |  |
| Income Statement | 23 | `slide-23.txt` | `# Income Statement` bullets 1-2 | Income statement details are table-based; only surrounding narrative text was extracted. |
| Balance Sheet | 19 | `slide-19.txt` | `# Balance Sheet` bullets 1-8 |  |
| Net Working Capital | 19,20 | `slide-19.txt`, `slide-20.txt` | `# Net Working Capital` sections |  |
| Net Debt (Cash) | 7,21 | `slide-07.txt`, `slide-21.txt` | `# Net Debt (Cash)` sections |  |
| Reporting Environment | 17 | `slide-17.txt` | `# Reporting Environment` bullets 1-2 |  |
| Appendices | 23,24,25,26,27 | `slide-23.txt`, `slide-24.txt`, `slide-25.txt`, `slide-26.txt`, `slide-27.txt` | `# Appendices` Appendix 1-5 text | Appendix schedules are table-based; only surrounding narrative text was extracted. |
| <Addition Sections as Needed> | 28,29 | `slide-28.txt`, `slide-29.txt` | `# <Addition Sections as Needed>` `## Glossary` and `## Contacts` |  |

If any line in the extracted report is shortened, summarized, or paraphrased, set `Notes` to explain and keep status as `needs_revision` until corrected.

If OCR was used, source artifacts will include an `"[OCR_EXTRACTED_TEXT]"` section; keep those entries for audit only and ensure they are not copied into normal extracted markdown unless source text is proven required.

---

# Executive Summary

- The pro forma reflects annualized revenue (volume), payroll, and certain other expenses as at August 2020.
- Revenue: The growth in revenue from $52,000 in FY19 to $182,000 in TTM Aug-20 is driven by volume. Subscription volume increases by 375% from 77 in December 2019 to 366 in Aug-20.
- EBITDA: The decline in EBITDA is attributable to the increase in direct expenses, rent, payroll and subcontractors. Further discussion on expenses run-rate can be found in the following pages.
- Based on August 2020 subscriber count, the annualized revenue is approximately $400,000 with an operating cost base of approximately $1,052,000.
- Net cash reported: Cash is net of $189,000 liability that should be classified as an equity item and not a debt-like liability.
- Net debt adjustments: Primarily comprised of reclassification of initial and pre-seed funding incorrectly recorded to debt, outstanding rent payables and transaction bonus liability to be paid to two employees (one of whom a senior employee).

# Key Findings

- Revenue: The underlying growth in revenue is driven by the increase in volume through website, social media and forums.
- Price: The price charged to customers are consistent at $99 per month throughout historical periods. However, Management does provide discounts (e.g. $50 or $79 per month for the first three or six months) on ad-hoc basis to certain customers for retention and marketing purpose, hence lowering the average revenue per username.
- Posted price: The current posted price listed on the Company’s website is $199/month (monthly subscription) and $179/month (annual subscription) is primarily marketing related. The Company will continue to charge $99/month for existing customers in the foreseeable future.
- Churn: There are 19 churned subscriptions (from six usernames) historically and additional 13 subscriptions terminated less than six months of usage  (included in “Other”). 
- Pipeline: Management have provided the following subscriber pipeline update as at September 24, 2020 (# of accounts):
- Lead: 79
- In Contact: 69
- Demo Booked: 61
- Platform Trial: 5
- Onboarding: 44

# Business Overview

- Not present in source report
- Not present in source report
- Not present in source report

# Summary Financials

- Based on August 2020 subscriber count, the annualized revenue is approximately $400,000 with an operating cost base of approximately $1,052,000.
- Diligence and pro forma adjustments identified during diligence results in a consistent EBITDA as reported of negative $742,000.

# Profit and Loss Overview / Financial Performance

## Overview

The pro forma reflects annualized revenue (volume), payroll, and certain other expenses as at August 2020.

Revenue: The growth in revenue from $52,000 in FY19 to $182,000 in TTM Aug-20 is driven by volume. Subscription volume increases by 375% from 77 in December 2019 to 366 in Aug-20.

EBITDA: The decline in EBITDA is attributable to the increase in direct expenses, rent, payroll and subcontractors. Further discussion on expenses run-rate can be found in the following pages.

Based on August 2020 subscriber count, the annualized revenue is approximately $400,000 with an operating cost base of approximately $1,052,000.

Going forward, Management expects the Company to realize 85% margin (i.e. 15% direct expense per subscriber) on a run-rate basis. Management did not provide a timeline of when this may transpire.

## Key Drivers

1. Revenue: The run-rate revenue is based on the annualized Aug-20 revenue, based on 366 subscription at $92 average monthly rate.
2. Payroll & subcontractors: The Company recently expanded the business development and customer success departments, and restructured and outsourced the engineering, operations and quality assurance departments. Further details on the basis of calculation for expense run-rate can be found in the QofE section. 
3. Rent: Reflects the current monthly rent expense of $4,300 across all months in the TTM Aug-20 period.
4. Software licenses, hosting and service charges (direct expenses): We normalize the software license fees and service charges based on the Aug-20 expense and adjust the hosting fees to reflect the monthly expense run-rate of $2,800. Further details on the basis of calculation for expense run-rate can be found in the QofE section and Appendix 4.

# Quality of Earnings

## Overview

Basis of preparation – The above Quality of Earnings schedule illustrates potential EBITDA adjustments which were identified for the fiscal years ended December 31, 2018 and 2019, and the trailing twelve month period ended August 31, 2020. The proposed adjustments are not necessarily all-inclusive and are based on information provided by Management to date. The validity of these potential adjustments and other factors raised for your consideration may require further investigation to understand the potential impact on your valuation model.

Diligence and pro forma adjustments identified during diligence results in a consistent EBITDA as reported of negative $742,000.

Overview
The quality of earnings schedule illustrates EBITDA adjustments and other factors to be considered which were identified for the trailing 12 month ended August 31, 2020, fiscal years ended December 31, 2018 and 2019.
The suitability of these adjustments as it pertains to the proposed transaction and other factors raised for consideration may require further investigation to understand the impact on buyer’s business model.
Adjustment overview
The nature of adjustments included in the quality of earnings analysis are as follows:  
Diligence adjusted EBITDA: Represent non-recurring, out of period and other normalization items identified during diligence.
Pro-forma adjusted EBITDA: Includes additional run-rate adjustments to reflect the current state of the business.
Significant adjustments are discussed further on the following pages. Also, see ‘Other Considerations’ for additional factors to consider.

## Quality of earnings adjustments

1. Rent: The Company moved to a new office space in January 2020 with a monthly rent expense of approximately $4,300. Management represents that there have been administrative issues with the Landlord’s bank account and the rent payment remitted  was returned to the Company in error resulting in a credit of $20,000 in August 2020. We adjusted the rent expense to reflect $4,300 rent expense from January 2020 to August 2020.
2. Professional fees: The Company capitalized non-recurring and non-operating legal fees related to capital raise. We excluded from EBITDA the non-recurring expense and the subsequent capitalization.
3. Subscriber run-rate: The Company’s monthly revenue in Aug-20 is approximately $34,000, which is comprised of 366 subscriber at $91.7 rate. We adjust the TTM Aug-20 revenue by annualizing the Aug-20 amount to reflect the revenue run rate as we noted that there have been minimal churn historically.
4. FTE payroll: The Company recently expanded the business development and customer success departments to support the growth of the business. The Company also restructured and outsourced the engineering, operations and quality assurance departments to realize cost savings. We adjust the payroll expense to reflect the recent developments in FTE for TTM Aug-20 period. See the following page for details of adjustment and Appendix 3 for further details on FTE analysis.
5. Business development: The company recruited a business development personnel in Jun-20 to promote sales growth for the business. We reflect the payroll of this personnel throughout TTM Aug-20. Note that this adjustment reflects his base compensation of $40,000 annually, excluding the potential commission (see Appendix 5 for the Company’s planned commission policy).
6. Customer success: The Company recruited a customer service representative in Jun-20, however, the employment is terminated after one month and a replacement is subsequently recruited in August. We reflect the payroll of this personnel throughout TTM Aug-20. 
7. Engineering: The Company has increased the use of overseas engineering resources from South America. Management indicates that they intend to continue this practice to realize further cost savings. We adjust the TTM Aug-20 expense run-rate based on Aug-20 payroll and 11 FTE  (i.e. approximately $36,000 annual salary per FTE, or $397,000 annually). Note that the run-rate for co-op engineering positions is assumed to be four months per year of salary translating to approximately three full time employees.
8. Operations and quality assurance: The Company terminated the operations and quality assurance personnel in Mar-20 and Aug-20 respectively (i.e. Canadian employees), and recruited a replacement from South America starting Jul-20. We adjusted the payroll expense to reflect the run-rate of one South American outsourced personnel with $10,000 salary annually.
9. Software and hosting fees: The Company received start-up credits and discounts from their suppliers for software licenses and hosting fees related to their platform. We normalize the software license fees based on the Aug-20 expense and adjust the hosting fees to reflect the monthly expense run-rate of $2,800. See below and Appendix 4 for further details: 
10. Rent: In conjunction with diligence adjustment #1,  this adjustment reflects the current monthly rent expense of $4,300 across all months in the TTM Aug-20 period.

## Other considerations

- Accounting personnel: The Company’s accounting is managed by an external bookkeeper on a part-time basis and implies the accounting can be absorbed by Client’s accounting team if required. The bookkeeper cost is $50/hour and costs approximately $300-400/month.
- BSCI and CSIA (Broker Support Center Inc. & Credit Security Insurance Agency): The Company has not generated revenue from these agencies as they started the integration with the agencies recently. Management expect future revenue growth from this relationship.
- Increase in benefits: The Company’s current benefit rate as % salaries and wages is approximately 5.2%, which is comprised of primarily payroll taxes. As the Company grows, it may provide employees with additional benefits such as medical and life insurance. For sensitivity purposes, assuming 15% benefit rate, the Company’s EBITDA may decline by $56,000. 
- Stock option plan: The Company has a stock option program for its employees that may need to be replaced with new a incentive programs post closing. See below for details on who received options historically:

# Income Statement

- The table below shows the income statement after diligence and pro forma (run-rate adjustments)
- Not present in source report

# Balance Sheet

- Net working capital (NWC): The NWC as defined in the aside table is analyzed further in the following pages. 
- Prepaid expenses: Is comprised of  prepaid rent related to the Company’s office space. 
- Sales taxes: Relates to HST receivable not yet claimed. See net working capital analysis for adjustment considerations.
- Payroll taxes liability: Reflects timing difference related to payroll taxes withheld from employees not yet remitted. 
- Deferred revenue: Payment received in advance related to an annual subscription to the Company’s platform. As at Aug-20, this balance relates to one customer which will be fully amortized (recognized to revenue) in Sep-20. 
- Credit card liability: The Company pays the suppliers through credit card and therefore carries no accounts payable. Management represents that the credit card statements are reconciled monthly. 
- Long term liabilities (classified under Other): Relates to the initial funding for the Company which is incorrectly classified as liabilities. This is comprised of initial cash from the founders of $32,000 and $157,000 pre seed funding from third party investors totaling $189,000.  This amount should be presented as an equity balance.
- Capital assets: Is primarily comprised of furniture and computer hardware.

# Net Working Capital

## Overview

Net working capital (NWC): The NWC as defined in the aside table is analyzed further in the following pages. 

The adjacent table summarizes the Company’s net working capital based on the trial balance.
Average adjusted net working capital for the twelve months ended August 31, 2020 is negative $15,000. 
Due to the nature of the business (paid immediately through credit card upon subscription), the Company does not carry accounts receivable.
The Company also does not currently carry accounts payable and pays suppliers immediately through credit card. The Company can increase the average cash on hand by increasing the days outstanding for its payables.

Basis of Presentation
The adjacent schedule summarizes the reported net working capital for the fiscal years ended December 31, 2018, December 31, 2019 and the trailing twelve months ended August 31, 2020.

## Net working capital adjustments

1. Vacation accrual: Relates to the vacation accrual of the three owners and two permanent employees, assuming 20 vacation days annually taken throughout the year. 
2. Sales taxes: The Company registered for HST in January 2020 and is not able to claim refund prior to this period. Therefore, we excluded the net receivable balances recorded in FY18 and FY19.
3. Not present in source report: Not present in source report

If adjustment items are only presented in tables/charts and excluded by policy, capture any surrounding explanatory lines and add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Net Debt (Cash)

## Overview

Net cash reported: Cash is net of $189,000 liability that should be classified as an equity item and not a debt-like liability.

Net debt adjustments: Primarily comprised of reclassification of initial and pre-seed funding incorrectly recorded to debt, outstanding rent payables and transaction bonus liability to be paid to two employees (one of whom a senior employee).

Cash and cash equivalents: Management represents that no restricted cash balances are held by the Company. The balance is primarily related to $1.75 million of seed financing of which the initial onset of $1.1 million is received in January 2020 and the remaining $0.7. million received thereafter throughout Feb-20 to Aug-20. Management represents that as at Aug-20 all funding has been received from the investors.

Long term liabilities: Relates to the initial funding for the Company which is comprised of initial cash from the founders of $32,000 and $157,000 pre seed funding from third party investors. This is incorrectly recorded as a liability and should be presented as an equity balance – see below #1 for adjustment.

Software fees: The Company has an arrangement with one of its software vendors, Filogix (a subsidiary of Client), that it will pay $100,000 in implementation fee and $25,000 in annual fee if at the first anniversary of the service effective date (i.e. Mar-21) the total funded loan volume is less than $2 billion. If the Company is acquired by client, the $125,000 fee will be canceled.

## Net debt / cash adjustments

1. Long term liabilities: The initial funding for the Company is incorrectly classified as liabilities and should have been accounted for as equity.
2. Rent: Relates to outstanding rent payable of the new office space for Jan-20 to Aug-20 periods. (See QofE adjustment #1 for further discussion on rent expense).
3. Transaction bonus liability: Reflects the transaction bonus of $20,000 to be paid to a senior employee and an additional $2,000 (including an estimated 15% payroll taxes) to another employee through payroll.

If debt-like/working-capital adjustments are only in tables/charts, add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Cash Flows

- Not present in source report
- Not present in source report

# Reporting Environment

- Accounting personnel: The Company’s accounting is managed by an external bookkeeper on a part-time basis and implies the accounting can be absorbed by Client’s accounting team if required. The bookkeeper cost is $50/hour and costs approximately $300-400/month.
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

## Glossary

Our report makes reference to “KPMG analysis”. This indicates only that KPMG has undertaken certain analytical procedures on the underlying data to arrive at the information presented. We do not accept responsibility for the underlying data. Figures throughout this report are presented in CAD, unless otherwise noted.

## Contacts

The contacts at KPMG in connection with this report are:


Eddie Chan
Partner, Transaction Services
416-777-3301
eddiechan@kpmg.ca

Juliana Lnu
Senior Manager, Transaction Services
416-218-7979
jlnu@kpmg.ca

# Appendices

## Appendix 1: Adjusted Income statement

The table below shows the income statement after diligence and pro forma (run-rate adjustments)

## Appendix 2: Revenue vintage and churn analysis

The Company’s subscription increased 375% from 77 in December 2019 to 366 in August 2020. There are 19 churned subscriptions (from six usernames) historically and additional 13 subscriptions terminated within less than six months of usage  (included in “Other”).

Note1: Total revenue for FY19 and TTM Aug-20 listed above of $37,000 and $172,000 differs from reported revenue of $52,000 and $181,000 respectively. The Company has not provided a reconciliation of the difference.

Note2: The current price listed on the Company’s website of $199/month (monthly subscription) and $179/month (annual subscription) is primarily marketing related. The Company will continue to charge $99/month for existing customers in the foreseeable future. The Company intends to eventually increase the price, however, no set timeline as of the date of this report (i.e. depending on the market). 

Note3: The Company provides discount to customers on ad-hoc basis and no formalized discount structure has been determined as at the date of this report.

## Appendix 3: Payroll and FTE analysis

Average pay per FTE declined in TTM Aug-20 due to the increased use of overseas resources in Engineering, Operations and Quality Assurance departments.

Note The above table is an indicative analysis built based on the current employee census provided by Management. Management represents that TTM Aug-20 and historical variance is due to the census capturing the current higher pay level (including mid-year increase) of the employees as compared to the actual amount paid.

## Appendix 4: Direct expense run-rate

The below tables include the basis of calculation for QofE pro forma adjustment #5, software and hosting fees.

Direct expenses: We normalize the software license fees and service charges based on the Aug-20 expense and adjust the hosting fees to reflect the monthly expense run-rate of $2,800 as represented by Management. See below for basis of adjustment:

The Company received start-up credits and discounts from their suppliers for the software license, service charges and hosting fees related to their platform. Below are the details of these expenses:
Software licenses: Third party licenses of add-on features for the Company’s platform including e-signature, bank statement retrieval, e-mail and calendar integration etc.
Hosting: Hosting fees for the Company’s website paid to Amazon Web Services.
Service charges: Relate to the payment to Stripe, an online payment processing service provider.
Management represents that these expenses are corelated with volume, however, it is not on a straight-line basis as the pricing is tiered and each supplier has varying threshold. 
Management expects to eventually realize 85% margin (i.e. 15% direct expense per subscriber) on a run-rate basis.

## Appendix 5: Commission policy

The Company’s current commission structure is as follows.
10% annual recurring revenue with a built-in exponential multiplier including 50% quota achievement, and a ceiling at 200% quota achievement. Gradual accelerate / decelerate range by using % quota attainment as an exponent in commissions calc. Example:
110% of quota achievement in a given month = monthly recurring revenue (MRR) x 10 points (%) ^ 110% = MRR x 12.6% (exponentially higher than 110% of 10 points)
80% of quota achievement in a given month = MRR x 10 points (%) ^ 80% = MRR x 6.3% (exponentially lower than 80% of 10 points).

Continue numbering for all appendix sections found in source.
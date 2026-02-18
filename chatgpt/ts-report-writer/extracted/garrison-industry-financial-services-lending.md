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

- `SOURCE_FILE`: Example report_Private Equity lender_Project Garrison.pptx
- `REPORT_ID`: project-garrison
- `SOURCE_PATH`: /mnt/data/Example report_Private Equity lender_Project Garrison.pptx
- `EXTRACTION_STATUS`: complete
- `EXTRACTION_DATE`: 2026-02-17

## Required Source Evidence

- `SOURCE_TEXT_DIR`: extracted/verification/project-garrison/source-text/pptx (e.g. `extracted/verification/<report-id>/source-text/pptx` or `.../pdf`)
- `MONTAGE_DIR`: extracted/verification/project-garrison/montage (e.g. `extracted/verification/<report-id>/montage`)
- `SOURCE_ARTIFACTS`:
  - `slide-01.txt` ... `slide-88.txt`

- `OCR_USED`:
  - `false`

- `OCR_SLIDES`:
  - `[]`

- `OCR_ARTIFACTS_DIR`: Not present in source report
- `OCR_RUN_METADATA`: Not present in source report
- `PROVENANCE_QA_JSON`: Not present in source report
- `PROVENANCE_STATUS`: `needs_revision`
- `GATES_QA_JSON`: Not present in source report
- `GATES_STATUS`: `needs_revision`
- `SECTION_MAP_JSON`: Not present in source report
- `SECTION_ACCOUNTING_JSON`: Not present in source report
- `RENDER_TRACE_JSON`: Not present in source report

## Source-to-Extraction Coverage Map

Use this section to prove every extracted item is verbatim-backed by source text.

| Canonical Section                  | Source slide/page IDs | Source evidence files                                                                                          | Extracted reference(s)                                                                                    | Notes |
| ---------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----- |
| Executive Summary                  | 10,11                 | `slide-10.txt`, `slide-11.txt`                                                                                 | `# Executive Summary` bullets                                                                             | [x]   |
| Key Findings                       | 10                    | `slide-10.txt`                                                                                                 | `# Key Findings` bullets                                                                                  | [x]   |
| Business Overview                  | 7,8,9                 | `slide-07.txt`, `slide-08.txt`, `slide-09.txt`                                                                 | `# Business Overview` bullets                                                                             | [x]   |
| Quality of Earnings                | 36,37,38              | `slide-36.txt`, `slide-37.txt`, `slide-38.txt`                                                                 | `# Quality of Earnings` -> `## Overview`, `## Quality of earnings adjustments`, `## Other considerations` | [x]   |
| Reporting Environment (if present) | 48,49,50              | `slide-48.txt`, `slide-49.txt`, `slide-50.txt`                                                                 | `# Reporting Environment` bullets                                                                         | [x]   |
| Appendices                         | 44,45,46,47           | `slide-44.txt`, `slide-45.txt`, `slide-46.txt`, `slide-47.txt`                                                 | `# Appendices` -> `## Appendix 1: Scope of work`                                                          | [x]   |
| Appendices                         | 48,49,50              | `slide-48.txt`, `slide-49.txt`, `slide-50.txt`                                                                 | `# Appendices` -> `## Appendix 2: Financial information`                                                  | [x]   |
| Appendices                         | 51,52                 | `slide-51.txt`, `slide-52.txt`                                                                                 | `# Appendices` -> `## Appendix 3: People matters`                                                         | [x]   |
| Appendices                         | 53                    | `slide-53.txt`                                                                                                 | `# Appendices` -> `## Appendix 4: Employee retention arrangements`                                        | [x]   |
| Appendices                         | 54                    | `slide-54.txt`                                                                                                 | `# Appendices` -> `## Appendix 5: SG&A costs and carve-out / shared services`                             | [x]   |
| Appendices                         | 55,56,57,58,59,60     | `slide-55.txt`, `slide-56.txt`, `slide-57.txt`, `slide-58.txt`, `slide-59.txt`, `slide-60.txt`                 | `# Appendices` -> `## Appendix 6: Originations`                                                           | [x]   |
| Appendices                         | 61,62                 | `slide-61.txt`, `slide-62.txt`                                                                                 | `# Appendices` -> `## Appendix 7: Fee income`                                                             | [x]   |
| Appendices                         | 63                    | `slide-63.txt`                                                                                                 | `# Appendices` -> `## Appendix 8: Quarterly balance sheet`                                                | [x]   |
| Appendices                         | 64,65,66,67           | `slide-64.txt`, `slide-65.txt`, `slide-66.txt`, `slide-67.txt`                                                 | `# Appendices` -> `## Appendix 9: Debt portfolio - Antares`                                               | [x]   |
| Appendices                         | 68,69                 | `slide-68.txt`, `slide-69.txt`                                                                                 | `# Appendices` -> `## Appendix 10: Equity co-investments`                                                 | [x]   |
| Appendices                         | 70,71,72,73           | `slide-70.txt`, `slide-71.txt`, `slide-72.txt`, `slide-73.txt`                                                 | `# Appendices` -> `## Appendix 11: Portfolio yield`                                                       | [x]   |
| Appendices                         | 74                    | `slide-74.txt`                                                                                                 | `# Appendices` -> `## Appendix 12: Illustrative loan economics`                                           | [x]   |
| Appendices                         | 75                    | `slide-75.txt`                                                                                                 | `# Appendices` -> `## Appendix 13: Unfunded and funded commitments`                                       | [x]   |
| Appendices                         | 76                    | `slide-76.txt`                                                                                                 | `# Appendices` -> `## Appendix 14: Asset quality`                                                         | [x]   |
| Appendices                         | 77,78                 | `slide-77.txt`, `slide-78.txt`                                                                                 | `# Appendices` -> `## Appendix 15: Budgets and projections`                                               | [x]   |
| Appendices                         | 79                    | `slide-79.txt`                                                                                                 | `# Appendices` -> `## Appendix 16: Bank Loan Group`                                                       | [x]   |
| Appendices                         | 80                    | `slide-80.txt`                                                                                                 | `# Appendices` -> `## Appendix 17: ENI bridges`                                                           | [x]   |
| Appendices                         | 81,82,83,84,85,86,87  | `slide-81.txt`, `slide-82.txt`, `slide-83.txt`, `slide-84.txt`, `slide-85.txt`, `slide-86.txt`, `slide-87.txt` | `# Appendices` -> `## Appendix 18: Supporting analysis of tax key findings`                               | [x]   |

If any line in the extracted report is shortened, summarized, or paraphrased, set `Notes` to explain and keep status as `needs_revision` until corrected.

If OCR was used, source artifacts will include an `"[OCR_EXTRACTED_TEXT]"` section; keep those entries for audit only and ensure they are not copied into normal extracted markdown unless source text is proven required.

---

# Executive Summary

- Fee income is a key driver in generating earnings for Target and involves deferred fees that are dependent upon when transactions close, therefore the timing mismatch should be considered in your valuation model.
- Greater reliance on fee income
- Certain arrangements – retention agreements, guaranteed bonuses and equity plans - were designed to provide employees long-term incentives to continue their employment with the business.
- Arrangements to retain key employees
- Significant ongoing funding needs
- Back-office support functions have historically been provided by GE. We understand that you have engaged with advisors to analyze this matter.
- Need to establish support functions to operate as a stand-alone entity
- The non-interest cost base consists principally of employee costs, which have historically been low due to the transaction-driven nature of the business and the highly variable compensation structure such that it continues to incentivize and retain this team.
- Highly variable cost base and compensation structure
- Declining portfolio yields
- On a portfolio basis, yields have been decreasing and are forecasted to continue decreasing, with the concurrent downside from narrower net interest margins.
- Target currently utilizes between $1 billion and $3 billion of funding on average and needs to determine its standalone post-transaction model as you contemplate the future business strategy.
- Earnings before tax decreased from $887 million in 2013 to $796 million in 2014.

# Key Findings

- Interest income: Interest income within the Core portfolio decreased by $16 million during the period as the company made efforts to “clean up” the portfolio by pushing out higher yield ABL loans, which have a lower yield compared to the Core portfolio. See further analysis within Key Finding section.
- FAS 91: Amortization of FAS 91 loan origination costs increased from $50 million in 2013 to $63 million in 2014. Management asserts this is due to how FAS 91 expenses were “discretionary” in years preceding 2013 and that executive income statements reflect that practice beginning in 2013.
- Reserves: Reserves increased from $38 million in 2013 to $62 million in 2014. Management asserts this increase is the result of the decrease in ABL portfolio size, as reserves on this portfolio were unusually low due to recoveries of long charged-off accounts.
- Recoveries: Recoveries on previously written-off loan amounts decreased from $22 million in 2013 to $12 million in 2014; recoveries are event-driven.
- Interest expense: Interest expense increased $15 million as the company had a $0.4 billion increase in funded assets year-over-year.
- Other revenue: Increases in both core upfront fees and SSLP management fees were offset by decreases in equity co-investment gains of $9 million.
- Comp & benefits: Compensation and benefits expense increased due to higher base salaries and benefits for employees hired in 2014, driven in part by plans for increased risk supervision and presence “on the ground”.
- Interest income decreased by $16 million during the period as the Company made efforts to “clean up” the portfolio by pushing out higher yield ABL loans, which have a lower yield compared to the Core portfolio.
- Amortization of FAS 91 loan origination costs increased from $50 million in 2013 to $63 million in 2014. Current amortization run rate is approximately $60 million per year.
- Reserves increased in 2014 to what management believes is a more normalized level based on the credit quality of its current portfolio.
- Source: 6.3 Atlas Preliminary Financial Information (05 11 2015)

# Business Overview

- GE Antares Capital, a business unit within GE Capital, is a leading middle-market lender for private equity backed transactions.
- In 2014, GE Antares Capital financed over 250 deals, which generated over $500 million in fee income off of $17 billion of gross volume with $8.5 billion syndicated.
- GE is proposing to sell GE Antares Capital as part of the broader intent to sell most of the assets of GE Capital over the next two years.
- Business overview
- GE Antares Capital (the “Company”, or “Target”), is a leading middle-market lender specializing in LBOs, doing business with more than 300 private equity sponsors.
- Its integrated origination, underwriting, and distribution platform supports LBO acquisitions, growth funding, restructurings and capitalizations.
- Its primary product offerings are cash flow and asset-based lending, junior debt financing, unitranche loans and equity investing.
- The business is 100% owned by GE Capital Corporation, a wholly-owned subsidiary of the General Electric Corporation.
- On April 10, 2015 GE announced that it would sell most of GE Capital’s assets to shrink GE Capital and focus on GE’s industrial operations.
- Information overview and access
- The analysis contained in this report is prepared based on the following sources of information and access:
- Data room access: Key information from the data room including internal management financial statements.
- Discussions: Discussions held with Target management at various dates, in person and on phone calls.
- GE has requested that, in the final offer, the purchase price be broken up into certain components.
- See the following page for a pictorial representation of the transaction perimeter.
- The assets for sale are held in a number of legal entities and it is our understanding an AcquirorCo would be set up to effect the acquisition.
- Final offer requirements
- GE has requested that bidders of GE Capital’s U.S. and Canadian sponsor finance portfolios submit their final offer breaking out the following components of their purchase:
- Core loan portfolio, excluding the Mubadala joint venture
- Debt interests in SSLP
- Equity interests in SSLP
- Debt interests in MMGP
- Equity tags
- Bank Loan Group portfolio (to the extent the bidder chooses to include in their proposal)
- Premium related to the franchise of the business
- GE has also requested the bidder to indicate the willingness to include certain ABL facilities, which present similar characteristics as the overall business.
- In addition, GE has requested that the bidder indicate the willingness to include MMGP / SSLP equity interests in the final offer in the event that the programs elect to sell via their tag-along rights.
- It is our understanding the following items will not be included in your final offer:
- Legal entity structure
- We understand that an AcquirorCo will be set up to effect the acquisition, purchasing assets held in a number of GE Capital legal entities, as depicted in Appendix 18:
- Loans are held within:
- GE Capital Corporation,
- Antares Capital Corporation,
- GE Capital Bank,
- GE Capital Canada Finance, Inc.,
- GE Canada Finance Holding Company
- SSLP equity interests are held within GE Global Sponsor Finance LLC
- Equity tags are held within:
- GE Capital Corporation,
- Antares Capital Corporation,
- GE Capital Equity Inv., Inc.
- GE Capital Equity Holdings, Inc.
- Source: Final Offer Process Letter dated May 26,2015
- Note: \* Represents outstanding / funded balances as of Q1’15
- 1 – BLG employees, CLOs and revolver facilities are not expected to be included in your Final Offer
- 2 – ABL facilities within the Target’s Core loan portfolio are not expected to be included in your Final Offer
- Golden Hill CLO I, LLC – a $400 million strategic investor program – is not expected to be included in your Final Offer
- A 50/50 joint venture between Mubadala Development Company and GE Capital Corporation
- Strategic program with Ares Capital; GE owns 100% of the senior debt
- Strategic program with Ares Capital; Target holds a 12.5% equity interest

# Summary Financials

- Not present in source report
- Not present in source report

# Profit and Loss Overview / Financial Performance

## Overview

Not present in source report

## Key Drivers

1. Not present in source report: Not present in source report
2. Not present in source report: Not present in source report

# Quality of Earnings

## Overview

We have adjusted Target’s pre-tax income by normalizing for one-time and non-recurring items, as well as illustrating an indicative bridge between reported pre-tax income to pre-tax cash flows available to service debt.
Basis of presentation
The table presented above includes potential adjustments to pre-tax income, but is not all encompassing; your further analysis could identify additional or different potential adjustments.
The tables on the following page do not include the financial impact related to determining inclusion/exclusion from the Quality of Earnings and Cash Flows table.

## Quality of earnings adjustments

1. Cost of funds: Target’s source of funds is from GE’s Corporate, and therefore the cost of funds is not reflective of the cost of funds for a standalone entity; the table above illustrates the reduction to pre-tax cash flows available to service any funding liability upon acquisition.
2. Revenue from excluded portfolios: Revenue from excluded portfolios:
   We understand that Target’s SSLP and MMGP senior debt, loans related to the Mubadala JV, and/or other portfolio segments are not expected to be included in your Final Offer. As a result, the table above includes an adjustment to exclude revenue associated with these segments of Target’s earnings.
   Revenue from excluded portfolios (continued):
   Reported and adjusted amounts however include income on the junior debt and management fees as these are understood to recur.
   The tables on the following page do not include the financial impact related to determining inclusion/exclusion from the Quality of Earnings and Cash Flows table.
3. Expenses relating to excluded portfolios: Expenses relating to excluded portfolios: We note that with the exclusion of SSLP / MMGP and Mubadala joint venture portfolios from your Final Offer, certain operating expenses and miscellaneous expenses could be added back to pre-tax income.
   Expenses relating to excluded portfolios (continued): At this stage, however, we have only adjusted for the reduction to pre-tax income associated with the above; any potential SG&A cost savings may not be a factor (refer to item #9).
4. Non-core activities: Tag-along equity investments represent an opportunity for Target to potentially participate in the profitability of the deals they sponsor. As these investments are understood to not be included as part of the Final Offer, the above table has adjusted to remove gains (net of marks and impairments) from reported pre-tax income.
5. FAS 91 adjustment for preceding years: FAS 91 requires direct costs from loan origination and syndication events to be deferred and amortized into income over the life of a loan. An initial analysis indicates that, if the company had been consistently following FAS 91, there would have been a $3 million reduction to interest income in 2013 and a $22 million reduction to interest income in 2014.
6. Amortization adjustment: Various fees (such as closing fees, arrangement / underwriting fees and syndication fees) are amortized into income over the expected life of the loans. However, these fees are based on volumes and may not correlate to the level of pre-tax cash flows in a given year. The table below shows the adjustment made.

## Other considerations

- Allocation of treasury function costs: Management noted that the treasury function is based at the corporate GE level, and that significant incremental costs may be incurred in a standalone entity. This may impact pre-tax income and pre-tax cash flows available to service debt.
- Future state of SSLP / MMGP programs: We understand that, over time, Target expects to reduce reliance on the SSLP / MMGP programs; this would have a significant impact on volume and fee income. Total SSLP / MMGP volume in 2013 and 2014 totaled $4.1 billion and $3.1 billion, respectively.
- Standalone / employment matters: Target expects to realize cost savings from moving to a standalone entity, however, expects incremental SG&A costs. We recommend that you continue to engage with advisors to determine incremental costs and savings post-transaction.
- Note: 1 – After consultation with Management, we were unable to determine if ABL facilities were material given the volume of ABL facilities issued in 2013 and 2014

# Income Statement

- Not present in source report
- Not present in source report

# Balance Sheet

- Not present in source report
- Not present in source report

# Net Working Capital

## Overview

Not present in source report

## Net working capital adjustments

1. Not present in source report: Not present in source report
2. Not present in source report: Not present in source report
3. Not present in source report: Not present in source report

If adjustment items are only presented in tables/charts and excluded by policy, capture any surrounding explanatory lines and add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

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

- Financial Reporting Systems / Infrastructure
- Source Systems
- Source systems used by Target to record loans and other transactions include ACBS (Loan Tracking System), Oracle (general ledger), and Hyperion (financial reporting). These systems currently interface directly with Target’s Oracle-based general ledger system.
- Manual Journal Entries
- Within the GL system, manual journal entries (“MJEs”) are posted to record adjustments / accruals required to comply with accrual-based accounting guidelines. Major classes of MJEs include:
- Volume accruals: There is usually a lag between the execution of a loan transaction and the close of the transaction into ACBS once Operations has input the transaction data into ACBS.
- Expense accruals: Accruals for expenses incurred, but not paid in a given reporting period.
- ALLL-related entries: Subsequent to the determination by a dedicated committee, the ALLL is booked to the GL system via a MJE; we recommend reviewing the final ALLL COE list and the journal entries to ensure consistency.
- Unapplied cash: Cash received on or close to the last day of the reporting period may not have been applied to balances and is therefore accrued in this suspense account; balances in this suspense account are cleared shortly after period end.
- Provision for credit losses: Provisions are booked to the GL on a quarterly basis via MJEs. We recommend reviewing the quarterly close packages for specific procedures performed on reported provision amounts.
- Hyperion
- Hyperion is a financial reporting tool that sits on top of the general ledger (GL) and is used by Target to create executive income statements. Hyperion pulls balances from the Oracle GL system, from which SF balances are aggregated for financial reporting purposes.
- Financial Reporting Systems / Infrastructure (continued)
- Hyperion (continued):
- Management stated any deals not assigned a “BSLA” tag are aggregated under the “Core” bucket, and Management has verified that these deals are accurately reflected in Target’s financial records.
- Tie-out of Financial Information
- In 2012 and 2013, changes to GL account usage and chart of accounts and a number of system conversions required Management to rely on additional documentation for the tie-out. In addition, the original Hyperion system has been replaced by the current system (i.e., Hyperion system-3), and therefore cannot be relied upon to determine certain balances in 2007 through 2011.
- Balances relating to the SSLP / MMGP portfolio and the Mubadala JV are not incorporated into the Hyperion reporting system. We recommend that you gain comfort around the process by which Target arrives at these amounts and that you assess if these amounts are directionally consistent with the nature of the balances being reported.
- Specific procedures performed over Target’s financial information are as follows:
- 2012 to 2014
- Target management extracted live versions of Hyperion system-3 executive income statements (and total ENI / ENI spreads broken down by the core vs. non-core split and non-ABL vs. on-ABL asset base split) with the following minor adjustments:
- LIBOR floors on certain assets provide an income benefit in periods of low LIBOR; these floors are removed in the executive income statement through a “LIBOR Floor Adjustment” which sits within “Other Income”. We recommend that you gain comfort around how this amount is determined and if the benefit of the LIBOR floors is correctly represented as an adjustment to the specific GL account in which the balance resides.
- Certain upfront fees are reported as part of “Other Income” for internal purposes. However, management indicated that for GAAP financial statements, they adjust to report these amounts as “Fee Income.” We recommend that you gain comfort around the accounting and treatment of these amounts and whether it is appropriate to adjust these amounts to the specific GL accounts in which the balance resides.
- Tie-out of Financial Information (continued)
- 2007 to 2011
- We were able to agree aggregate balances (Total Revenue, Net Revenue, and Net Income) from the 2007-2011 Hyperion reports to Management’s reported financial information. We were also able to agree certain line items to supporting documentation and confirm that the adjustments made appear to be consistent with the nature of the balances being reported.
- The following adjustments were made to 2007-2011 Hyperion reports to arrive at reported financial information:
- SG&A (2008): Management asserts that the 2008 SG&A amount per Hyperion was overstated due to an erroneous MJE. Management supported the adjustment through executive income statements in 2007 and 2009 to ensure reported net income was consistent with Hyperion.
- Yield Income (2010 and 2011): In 2010 and 2011, reported yield income per Hyperion was adjusted due to a system conversion that aggregated the receivable balances across all loan portfolios, including those not included in the yield calculation (note: of the $750 million in ABL portfolio, only $250 million of ABL loans have been securitized).
- Yield Income (2007): Reported yield income for 2007 was reduced per reported financial information. As per Management, this is a result of an MJE that moved yield income from a co-mingled account in Hyperion set up to accumulate income from this asset.
- Sweeps (2007 – 2011): Pre-2012, sweeps were aggregated with a number of other accounts in Hyperion, and were therefore difficult to identify. Management supported the adjustment by tying sweeps to quarterly close packages and extrapolating the balance for 2007-2011. However, we note that the adjustment made is minimal; Management’s methodology appears materially reasonable.
- Upfront Fees, Management Fees and Equity Gains (2007-2011): These accounts are co-mingled and therefore difficult to verify. Management supported their adjustment by tying the reported balances to quarterly close packages and performing an extrapolation for 2007 through 2011; we recommend that you gain comfort around Management’s methodology for arriving at reported amounts of these co-mingled accounts to management close packages.
- Provision for Credit Losses (2008 to 2014)
- The provision for credit losses is booked to the GL via manual journal entries. We were able to agree the amounts per quarterly close package to the provision for credit losses reported per Hyperion. We also noted that the provision amounts per this source document agreed with the amounts per Hyperion.

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

# Appendices

## Appendix 1: Scope of work

Not present in source report

## Appendix 2: Financial information

Financial Reporting Systems / Infrastructure
Source Systems
Source systems used by Target to record loans and other transactions include ACBS (Loan Tracking System), Oracle (general ledger), and Hyperion (financial reporting). These systems currently interface directly with Target’s Oracle-based general ledger system.
Manual Journal Entries
Within the GL system, manual journal entries (“MJEs”) are posted to record adjustments / accruals required to comply with accrual-based accounting guidelines. Major classes of MJEs include:
Volume accruals: There is usually a lag between the execution of a loan transaction and the close of the transaction into ACBS once Operations has input the transaction data into ACBS.
Expense accruals: Accruals for expenses incurred, but not paid in a given reporting period.
ALLL-related entries: Subsequent to the determination by a dedicated committee, the ALLL is booked to the GL system via a MJE; we recommend reviewing the final ALLL COE list and the journal entries to ensure consistency.
Unapplied cash: Cash received on or close to the last day of the reporting period may not have been applied to balances and is therefore accrued in this suspense account; balances in this suspense account are cleared shortly after period end.
Provision for credit losses: Provisions are booked to the GL on a quarterly basis via MJEs. We recommend reviewing the quarterly close packages for specific procedures performed on reported provision amounts.
Hyperion
Hyperion is a financial reporting tool that sits on top of the general ledger (GL) and is used by Target to create executive income statements. Hyperion pulls balances from the Oracle GL system, from which SF balances are aggregated for financial reporting purposes.
Financial Reporting Systems / Infrastructure (continued)
Hyperion (continued):
Management stated any deals not assigned a “BSLA” tag are aggregated under the “Core” bucket, and Management has verified that these deals are accurately reflected in Target’s financial records.
Tie-out of Financial Information
In 2012 and 2013, changes to GL account usage and chart of accounts and a number of system conversions required Management to rely on additional documentation for the tie-out. In addition, the original Hyperion system has been replaced by the current system (i.e., Hyperion system-3), and therefore cannot be relied upon to determine certain balances in 2007 through 2011.
Balances relating to the SSLP / MMGP portfolio and the Mubadala JV are not incorporated into the Hyperion reporting system. We recommend that you gain comfort around the process by which Target arrives at these amounts and that you assess if these amounts are directionally consistent with the nature of the balances being reported.
Specific procedures performed over Target’s financial information are as follows:
2012 to 2014
Target management extracted live versions of Hyperion system-3 executive income statements (and total ENI / ENI spreads broken down by the core vs. non-core split and non-ABL vs. on-ABL asset base split) with the following minor adjustments:
LIBOR floors on certain assets provide an income benefit in periods of low LIBOR; these floors are removed in the executive income statement through a “LIBOR Floor Adjustment” which sits within “Other Income”. We recommend that you gain comfort around how this amount is determined and if the benefit of the LIBOR floors is correctly represented as an adjustment to the specific GL account in which the balance resides.
Certain upfront fees are reported as part of “Other Income” for internal purposes. However, management indicated that for GAAP financial statements, they adjust to report these amounts as “Fee Income.” We recommend that you gain comfort around the accounting and treatment of these amounts and whether it is appropriate to adjust these amounts to the specific GL accounts in which the balance resides.
Tie-out of Financial Information (continued)
2007 to 2011
We were able to agree aggregate balances (Total Revenue, Net Revenue, and Net Income) from the 2007-2011 Hyperion reports to Management’s reported financial information. We were also able to agree certain line items to supporting documentation and confirm that the adjustments made appear to be consistent with the nature of the balances being reported.
The following adjustments were made to 2007-2011 Hyperion reports to arrive at reported financial information:
SG&A (2008): Management asserts that the 2008 SG&A amount per Hyperion was overstated due to an erroneous MJE. Management supported the adjustment through executive income statements in 2007 and 2009 to ensure reported net income was consistent with Hyperion.
Yield Income (2010 and 2011): In 2010 and 2011, reported yield income per Hyperion was adjusted due to a system conversion that aggregated the receivable balances across all loan portfolios, including those not included in the yield calculation (note: of the $750 million in ABL portfolio, only $250 million of ABL loans have been securitized).
Yield Income (2007): Reported yield income for 2007 was reduced per reported financial information. As per Management, this is a result of an MJE that moved yield income from a co-mingled account in Hyperion set up to accumulate income from this asset.
Sweeps (2007 – 2011): Pre-2012, sweeps were aggregated with a number of other accounts in Hyperion, and were therefore difficult to identify. Management supported the adjustment by tying sweeps to quarterly close packages and extrapolating the balance for 2007-2011. However, we note that the adjustment made is minimal; Management’s methodology appears materially reasonable.
Upfront Fees, Management Fees and Equity Gains (2007-2011): These accounts are co-mingled and therefore difficult to verify. Management supported their adjustment by tying the reported balances to quarterly close packages and performing an extrapolation for 2007 through 2011; we recommend that you gain comfort around Management’s methodology for arriving at reported amounts of these co-mingled accounts to management close packages.
Provision for Credit Losses (2008 to 2014)
The provision for credit losses is booked to the GL via manual journal entries. We were able to agree the amounts per quarterly close package to the provision for credit losses reported per Hyperion. We also noted that the provision amounts per this source document agreed with the amounts per Hyperion.

## Appendix 3: People matters

(1) Base includes benefits such as 401k, pension, healthcare, training & education
(2) Other includes legal, marketing, finance and HR
Note: The weighted average compensation by function in this table does not reconcile to the “Compensation and Benefits Breakdown” table above. Per Management,
this is because (a) for internal purposes, certain employees within the IT function were categorized under Shared Services for the purposes of the
“Compensation and Benefits Breakdown” table, and (b) the average compensation in this view is based on headcount and compensation as of May 2015 (vs. the historical calculations in the “Compensation
and Benefits Breakdown” table). Because this view provides greater transparency and because the averages are directionally consistent between the
two data sources, we have included this analysis for your consideration.
Note: The above headcount numbers do not reconcile to headcount numbers presented elsewhere in this
appendix because they exclude Franchise employees and Legal/Finance employees allocated from other
functions. The numbers are, however, directionally consistent with the headcount including such employees.

## Appendix 4: Employee retention arrangements

Not present in source report

## Appendix 5: SG&A costs and carve-out / shared services

Not present in source report

## Appendix 6: Originations

Note: The 2013 numbers in the origination volume chart above do not match the origination volume numbers presented on page 18. Although not fully consistent, we have only used them for directional analysis.
Management attributes lower originations to slower markets and more intense competition in terms of pricing and deal activity. Management further notes that due to low originations, fees (and ENI) may have been weighted higher than the case would be in normal-volume quarters.
ABL NBMs for 2014 have not been shown as ABL on- book originations were $6 million in Q1 (NBM 0.92%), $9 million in Q2 (NBM 1.07%), $1 million in Q3 (NBM 3.57%) and $7 million in Q4 (NBM 13.3%).
Note: The figures in the “On-book volume by deal type” chart above do not agree to the above data (which is directionally consistent with 6.5.3).
Upper mid cap & ABL loans have been excluded from the above analysis. Management notes the volume of these loans has historically been very low and steadily decreasing during the historical period.

## Appendix 7: Fee income

Accounting for Syndication Fees
The terms underwriting fees, arrangement fees, syndication fees and closing fees are common in the industry but not always consistent with the terminology used by Target in its books of record.
Target’s accounting for upfront fees is contingent upon whether Target is participating in a loan syndication or participation. To be a “Loan Syndication”, each of the following conditions must be met:
Target must be the lead arranger or the joint lead arranger;
Syndication partners must be committed directly to the borrower on the credit agreement; and
Syndication partners must fund their commitments on the date of close, either directly to the borrower or to Target
An instance where syndication partners, although committed directly to the borrower, fund their commitments to Target is not considered a loan syndication, the accounting treatment is different.
Fee Recognition in a Loan Syndication
All fees received are recognized upfront into income unless a portion of the loan is retained and the yield on the retained amount is set less than the average yield to other syndication participants.
Fee Recognition in a Loan Participation
All fees received are deferred and amortized into income over the expected life of a loan. Portions of the deferred income are re-classified into income on a pro-rata basis for the portion of the loan sold.

## Appendix 8: Quarterly balance sheet

Not present in source report

## Appendix 9: Debt portfolio - Antares

Not present in source report

## Appendix 10: Equity co-investments

Included in Other are Aerospace & Defense and Plant & Forest Products

## Appendix 11: Portfolio yield

1. As per Management Presentation (Financial Break-out). Calculated as 5-point average.
2. All yields calculated as income or fees divided by average receivables.
3. Corresponds to management yield calculations. Difference of 2 bps due to rounding.
4. Annualized.
   \*Estimated.
   Yield not defined in source document.
   We note that these maturities in the source document are incorrect and likely correspond to original maturity dates at issuance; source document has not been updated for refinancing of these loans.
   Included within this amount are SSLP and MMGP Senior Debt + Equity investments (as classified by Management in the source document). Management classifies all such senior debt and equity investments as maturing in 2016 regardless of actual maturity year, giving rise to this large balance.

## Appendix 12: Illustrative loan economics

Fact Pattern of Sample Transaction
Cash-flow loan facility is agreed with customer - $100 million, closing on Jan 1, 2014, with nominal interest rate of L+4.00% (L floor 1.00%), stated term of 60 months, expected term of 36 months
Target is lead underwriter of the loan, or “left lead lender”
Syndication fee – 2% ($2 million)
Closing fee – 1% ($1 million), passed along to syndication participants pro-rata based on committed amounts
Target unreimbursed loan origination costs – $100,000
Loan administration fee to Target – $50,000 / year
Amount syndicated to third parties - $60 million
Target hold & fund - $40 million
Closing fee on the portion of loan retained must be deferred as part of FAS 91 given that the yield on the portion of the retained loan is equal to the average yield obtained by syndication participants

## Appendix 13: Unfunded and funded commitments

Not present in source report

## Appendix 14: Asset quality

Not present in source report

## Appendix 15: Budgets and projections

Not present in source report

## Appendix 16: Bank Loan Group

(1) Figures have not been calculated as sum of above items. The quarterly package does not include all line items such as lease expense and marketing which would be required to calculate net income. KPMG is unable to calculate net income based on data provided.

## Appendix 17: ENI bridges

ENI bridge – Q4-13 to Q4-14
ENI bridge – Q4-14 to Q1-15
Volume: includes activities such as new deal origination, line increases, and new customer roll-on. Increased competition in Q2 and Q3 in the form of refinancing and other activity likely led to more attractive rates for borrowers, thus driving up volumes.
Refinancing volume: increased significantly in Q2 2014 as a result of increased prepayment activity. Also increased from Q3 2014 onwards, driven by refinancing activity. Refinancing volume, however, appears to have reverted to an average of approximately $260 million per quarter.
Refinancing runoff: represents the cash flows foregone as a result of refinancing. Refinancing runoff occurs when customers refinance with other lenders. This factor tends to be correlated with refinancing volumes but does not necessarily match refinancing volumes in cases where the corresponding increase in ENI is represented through new customers or line increases.
Payouts: represents payouts of loans by borrowers. Payouts increased significantly in Q2 2014 and Q2 2015. We note that payouts broadly track new volumes by quarter.
Other items: includes changes during the year related to amortization and other factors. The most significant other factor impacting the bridge is a release of the company’s deferred tax asset of which increased ENI by $518 million in Q4 2014.

## Appendix 18: Supporting analysis of tax key findings

Tax Compliance Profile
General Electric Capital Corporation (“GECC”) is a US corporation that files consolidated federal income tax returns and is subject to regular reviews by the SEC. Accordingly, GECC is required to submit to the SEC audited financial statements on an annual basis.
Management indicated that the Target has been relatively inactive from a tax compliance and planning perspective and that any material tax matters are dealt with by GECC or its subsidiaries. The assets being acquired include:
SSLP Senior Notes - $5.7B
Financing Receivables (Core Antares and MMGP) - $8.6B
Bank Loan Group Portfolio - $3.3B
Assets Held for Sale - $483M
Equity Investments (SSLP & MMGP) and Equity Co-Investments - $537M
Other Business Value / Goodwill - $1.1B
Management made the following representations with respect to the Target:
It’s federal and state income and indirect tax return filings and associated payments are up to date; and
It is not subject to any tax indemnity or sharing agreements.
Tax Attributes
Management has represented that Target has the following tax attributes:
Approx. $10M in overall net deferred tax liabilities. The net deferred tax liability is due to:
Certain fee income that has been recognized earlier for GAAP purposes (e.g., origination fees and syndication fees) for which for tax purposes they can defer or adjust the timing or recognition of that income.
Certain deductions related to compensation (e.g. bonus accrual) which has been deducted for GAAP but for tax purposes are not yet deductible until the amounts have been paid.
Net deferred tax liabilities related to closed loans / deferred fees, which over time will reverse and will reduce the net deferred tax liability.
No net operating losses.
Capital losses are not expected to be significant.
Management has indicated that GECC has a significant amount of net operating losses and other tax attributes; however, those tax attributes are held and will remain in other legal entities within the GECC group.
Tax Planning
Management indicated they do not anticipate any significant tax planning opportunities or savings arising from the acquisition of Target.
Tax Function & Transition Consideration
Although the Target has approximately 25 back office professionals, there are no dedicated tax resources or tax professionals on staff. Management indicated that some of these individuals focus primarily on federal income tax issues.
Affiliates of GECC provide the tax compliance and reporting support to the Target in the following areas:
State income and franchise taxes;
Indirect state taxes, including sales and use and property taxes (noting that Target does not file any personal property tax returns);
Payroll taxes (noting that Target Management has stated that Target does not currently have employees in Canada, and therefore no payroll tax return filing requirement); and
Withholding taxes and information reporting.
Until suitable internal or external resources can be located, it may be advisable to negotiate a Tax Services Agreement with GECC to ensure that any tax support which is not available within the Target is negotiated and concluded.
That agreement should also cover the quantum of historical information needed in connection with any future income or indirect tax audit for federal and state tax purposes.
Foreign Investment in Real Property Act of 1980 (“FIRPTA”)
If following the acquisition of the Target, Holdco or the SPVs dispose of a “United States real property interest”, such non-US persons may be subject to US tax on the gain from such disposition under FIRPTA.
Only approximately 0.8% of the Target’s investment portfolio (based on the Q1-2015 loan tape) is comprised of assets that would be classified as a United States real property interest. However, we recommend that this representation be confirmed prior to signing.
Following the acquisition, we recommend that certain controls and procedures be developed and implemented to monitor the Target’s assets and investments for exposure to any subsequent dispositions of US real property interests.
Acquisition Structure and Mechanics
The Seller’s Proposed Acquisition Structure:
Target Management suggested that prior to the proposed acquisition, the Seller will carve the Target out of the existing consolidated tax group by having the seller transfer all of the assets (other than the Canadian legal entities and the legacy debt) and employees (including target employees to be transferred from affiliates) in to a standalone tax entity. In addition, the targeted employees would be transferred to Target.
Management indicated that the Seller will likely undertake a “drop and check” transaction (i.e., a drop down of the assets into a newly created legal entity, followed by an election to treat that entity as a disregarded entity for US tax purposes) which would allow the acquired company to have an immediate step up in the tax basis of its assets.
Management also indicated that the drop and check structure would allow the purchaser to avoid a higher level of embedded tax in the entity due to some built in gain of the current assets (primarily due to the deferred fee accounting), which would be realized if it is a stock acquisition without a step up in the tax basis of assets.
Management indicated that GECC / the Seller expects to be compensated for any benefit arising from the drop and check structure and the associated tax basis step-up.
The Buyer’s Proposed Acquisition Structure:
The Buyer expects to establish a Canadian acquisition company (“Acquirorco”) that will directly acquire the stock of Target (or Holdco as the case may be).
The buyer has proposed to finance the acquisition through the use of a mix of debt and equity.
Structure for Funding Operations
Management noted that Target has historically been funded from GECC sources. Management indicated that Target has used a mixture of debt and equity to fund operations and that debt is considered to be the more cost efficient option.
Target management indicated that it expects to use the same structure to fund operations going forward post-acquisition and expects that they will likely need a significant amount of debt financing.
The Target is expected to borrow money directly from the Buyer’s acquisition entity or one of its subsidiaries; the loan would be structured as a receivable / payable.
The Target expects to incur “interest expense” on the internal borrowing. Target would be able to claim a tax deduction for the interest expense, subject to the thin capitalization and other interest deductibility rules.
Thin Capitalization
If following the acquisition, Target is considered to be a Canadian resident corporation, the acquisition could create a Canadian permanent establishment due to the presence of the Canadian acquisition entity and Canadian management team.
If a Canadian permanent establishment exists, Target may become subject to Canada’s thin capitalization rules. Those rules may limit the amount of interest deductibility on loans which are considered to be “outstanding debts to specified non-residents”. Those rules are complex and are beyond the scope of this report.
We recommend confirming if the thin capitalization rules may apply following the transaction and to ensure that any required filings are made.
Non-Resident Withholding Tax
In the event interest is paid from Target to the acquisition company or a holding company (and as a result interest is paid to a non-resident entity), withholding tax may apply to the interest payments.
The rate of withholding tax depends on the residence jurisdiction of the acquisition entity and how any applicable tax treaty applies.
We recommend confirming if any withholding tax may apply.
Tax Elections
Management indicated that the Seller expects the new company will have the ability to create “taxable income” (i.e. tax liabilities) using cash accounting methodologies on the receivables and deferring the deduction for compensation expenses.
However, Management also noted that it will be important to ensure that any required tax elections are made to ensure a deferred fee income is taxed on an accrual basis (so that there is no significant taxable income / tax liabilities).
We recommend that the Buyer ensure that appropriate tax elections and filings are made at acquisition / post-acquisition.
Intercompany Borrowing
In the event the Buyer structures funding using internal or related party loans, Transfer Pricing rules could apply to determine that an arm’s length interest rate and other loan terms are in place.
If the arm’s length interest rate and other loan terms are not in place, the IRS and other tax authorities could challenge the interest deductibility and / or could potentially treat a portion of the interest as a distribution (which could have withholding and other tax implications).
We recommend confirming the applicability of the Transfer Pricing rules to any intercompany borrowings and to ensure compliance.
State Income Tax and Other Considerations
State income taxes
Management indicated that the Target currently does not have any state tax return filings because it does not have nexus in any other states. However, it currently has certain activities in other states (e.g. leasing space, etc.). Management indicated that this is monitored by the Seller.
We recommend that the Buyer confirm the state tax filing requirements for the Target and to ensure compliance.
Non-Income Tax considerations
Management indicated that indirect taxes (e.g. sales and use taxes, etc.) are generally not material for the Target.
However, as a lending business, there may be indirect taxes which arise in relation to the Target’s leasing / acquisition of certain assets (e.g. computers, equipment, etc.).
We recommend that the Buyer confirm the Target’s compliance with indirect tax requirements.
Transition of tax compliance
To the extent the Target has relied on GECC / its affiliates to perform tax compliance and reporting, those functions will need to be replaced post-acquisition.
We recommend that the Buyer ensure that appropriate tax resources are in place to perform the required compliance and reporting functions and to negotiate a Tax Services Agreement with GECC to cover any transition period.
Potential tax risk
Given the nature of the Target’s business and the relatively limited tax planning activity, historical tax risk exposures are expected to be limited.
However, the Target’s business includes a number of complex financial transactions and accounting methodologies (e.g. deferred fees, securitizations, etc.) which could have significant tax implications.
We recommend that the Buyer perform additional due diligence on those complex transactions and accounting methodologies to confirm the Target’s tax positions and compliance.
Significant Tax Positions and Elections
Management stated that GE and GECC do not carry any reserves for uncertain tax positions (i.e. FIN 48 / FAS 5) on their financial statements that pertain to the Target.
We have not received Target’s standalone tax provision or statements of uncertain tax positions for review. We recommend these items are received and confirmed prior to signing.
However, based on the foregoing points and level of activity, management believes that the quantum of historical tax risk exposures are likely to be limited.
Management stated the Target has historically undertaken certain securitization transactions involving the creation of special purpose vehicles (“SPVs”). In order to ensure that the SPVs are not treated as separate tax entities, Management stated that the Target treats those SPVs as “grantor trusts” for US tax purposes.
Management stated that if the acquisition is structured as a drop and check transaction, the target expects to continue treating those SPVs as grantor trusts. However, if the acquisition is structured as a stock acquisition without a step-up in the tax basis of assets, Management noted that the grantor trust status may be challenged.
We recommend that the Buyer confirm the appropriate tax treatment of the SPVs and to ensure that the acquisition structure does not adversely impact that treatment.
Management stated the Target has not entered in to any listed transactions.
In tax year 2009, the Target, as a dealer in certain securities, made an election under section 475 to mark-to-market those securities. Management indicated that the Target’s receivables are treated as securities for these purposes and that the Target reports its taxable income using the mark-to-market method of accounting under section 475.
Effective Tax Rate
Management has estimated the Target’s ETR to be 38%. This rate includes a federal tax rate of 35% and a state tax rate of approx. 3%.
This approximate ETR seems slightly low, as we would expect the blended ETR when combining state and federal taxes to be approximately 40-42%.
Management noted that this is a rough estimate and that they will need to perform further apportionment workpapers to assist in solidifying these numbers.

Continue numbering for all appendix sections found in source.

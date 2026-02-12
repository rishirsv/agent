# Generation Notes — Simulated FDD Content Package

## 1) Assumptions (explicit)
1. **Simulation disclaimer:** All company names, metrics, and narratives are simulated for `kpmg-slidegen-fdd` testing and do not represent any real entity.
2. **Period anchors:** FY2023–FY2025 represent full fiscal years ended December 31. **TTM Jun-2026** represents the trailing twelve months ended June 30, 2026 (used as the primary valuation / run-rate period).
3. **Currency and units:** All financials are presented in **USD millions** unless otherwise noted.
4. **Accounting basis:** Financials are assumed to be prepared under a GAAP-like basis consistent with contract accounting (contract assets / deferred revenue). No audit procedures were performed.
5. **Definition of “Reported EBITDA”:** EBITDA as presented in `exports/source-data/financials-income-statement.csv` (gross profit less operating expenses excluding D&A).
6. **QoE adjustment period:** QoE adjustments are applied to **TTM Jun-2026** unless otherwise stated in the adjustment register.
7. **Operating NWC definition (for peg discussion):**  
   - **Included (operating):** AR, contract assets, prepaids & other current assets; AP, accrued expenses, accrued compensation, current deferred revenue, other current liabilities.  
   - **Excluded (non-operating / debt-like for this simulation):** cash, term debt, leases; taxes payable may be excluded subject to SPA definition (reflected in WC06).
8. **Support language:** Any item labeled **pending** or **partial** is treated as preliminary and requires tie-out to source documents before final conclusions.

---

## 2) Fact Ledger (summary)
The fact ledger is the “single source of truth” for the simulated deck. Facts with **low confidence** are management-reported or process-observation items intentionally marked support-pending.

| fact_id   | metric_or_claim                                              | value                                  | period       | source_note                                                      | confidence   |
|:----------|:-------------------------------------------------------------|:---------------------------------------|:-------------|:-----------------------------------------------------------------|:-------------|
| F001      | Target company legal name                                    | NorthBridge Compliance Solutions, Inc. | N/A          | Simulated engagement context                                     | high         |
| F002      | HQ location                                                  | Toronto, Ontario                       | N/A          | Simulated engagement context                                     | medium       |
| F003      | Fiscal year end                                              | Dec 31                                 | N/A          | Assumption for dataset                                           | medium       |
| F004      | Currency convention                                          | USD millions                           | N/A          | Assumption for dataset                                           | high         |
| F010      | Revenue                                                      | USD 125.0m                             | FY2023       | exports/source-data/financials-income-statement.csv              | high         |
| F011      | Revenue                                                      | USD 142.0m                             | FY2024       | exports/source-data/financials-income-statement.csv              | high         |
| F012      | Revenue                                                      | USD 160.0m                             | FY2025       | exports/source-data/financials-income-statement.csv              | high         |
| F013      | Revenue                                                      | USD 168.0m                             | TTM Jun-2026 | exports/source-data/financials-income-statement.csv              | high         |
| F014      | Reported EBITDA                                              | USD 29.0m                              | TTM Jun-2026 | exports/source-data/financials-income-statement.csv              | high         |
| F015      | Gross margin (blended)                                       | 64.3%                                  | TTM Jun-2026 | Derived from income statement (GP/Revenue)                       | high         |
| F016      | Net cash from operations (CFO)                               | USD 22.4m                              | TTM Jun-2026 | exports/source-data/financials-cashflow-bridge.csv               | high         |
| F017      | Free cash flow before financing (CFO - capex - cap software) | USD 14.9m                              | TTM Jun-2026 | exports/source-data/financials-cashflow-bridge.csv               | medium       |
| F018      | Cash balance                                                 | USD 13.0m                              | Jun-2026     | exports/source-data/financials-balance-sheet-stratified.csv      | high         |
| F019      | Term debt                                                    | USD 38.0m                              | Jun-2026     | exports/source-data/financials-balance-sheet-stratified.csv      | high         |
| F020      | Lease liabilities                                            | USD 4.0m                               | Jun-2026     | exports/source-data/financials-balance-sheet-stratified.csv      | high         |
| F021      | Net debt (term debt + leases - cash)                         | USD 29.0m                              | Jun-2026     | Derived from balance sheet                                       | high         |
| F022      | Deferred revenue (current)                                   | USD 38.0m                              | Jun-2026     | exports/source-data/financials-balance-sheet-stratified.csv      | high         |
| F023      | Deferred revenue (non-current)                               | USD 8.0m                               | Jun-2026     | exports/source-data/financials-balance-sheet-stratified.csv      | high         |
| F024      | Operating NWC (reported, excluding cash)                     | USD -28.0m                             | Jun-2026     | Derived from balance sheet; definition in notes                  | medium       |
| F025      | Net QoE adjustments                                          | +USD 3.4m                              | TTM Jun-2026 | exports/source-data/qoe-adjustments.csv                          | high         |
| F026      | Normalized EBITDA (reported EBITDA + QoE adjustments)        | USD 32.4m                              | TTM Jun-2026 | Derived from QoE adjustments and income statement                | high         |
| F027      | Working capital adjustments (net)                            | +USD 1.5m                              | Jun-2026     | exports/source-data/working-capital-adjustments.csv              | high         |
| F028      | Adjusted NWC (reported NWC + adjustments)                    | USD -26.5m                             | Jun-2026     | Derived from working capital adjustments                         | medium       |
| F030      | SaaS subscription revenue share                              | ~82%                                   | TTM Jun-2026 | Management reporting; not tied to GAAP schedules in this package | low          |
| F031      | Customer concentration (top 10 share)                        | ~22%                                   | FY2025       | Management reporting; support pending to billing extract         | low          |
| F032      | Retention metrics (NRR/GRR)                                  | NRR ~109%, GRR ~93%                    | FY2025       | Management reporting; support pending to cohort file             | low          |
| F040      | Close timeline                                               | ~8 business days                       | FY2025–TTM   | Management walkthrough (simulated)                               | low          |
| F041      | Manual journal intensity                                     | ~18% of quarter-end entries            | FY2025–TTM   | Simulated process observation                                    | low          |

---

## 3) Claim Ledger (summary)
Claims are intentionally framed as **transaction decisions**, each tied to fact IDs and an explicit open question.

| claim_id   | claim                                                                                                                                                             | supporting_fact_ids              | open_question                                                                                                     |
|:-----------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------|:------------------------------------------------------------------------------------------------------------------|
| C001       | Revenue growth from FY23 to TTM Jun-26 is primarily driven by SaaS subscriptions and supports a durable base case.                                                | ['F010', 'F013', 'F030']         | Validate subscription mapping and ARR reconciliation to GAAP revenue.                                             |
| C002       | Reported gross margin is stable (~64%) and EBITDA margin remains ~17–18%, implying incremental gross profit is largely reinvested.                                | ['F010', 'F013', 'F014', 'F015'] | Confirm segment margin split and allocation methodology for hosting and services delivery.                        |
| C003       | Preliminary QoE bridge indicates normalized EBITDA of USD 32.4m, but valuation should reference a range until pending items are supported.                        | ['F014', 'F025', 'F026']         | Resolve support for QA03/QA09/QA11/QA12 and confirm no double-counting with NWC adjustments.                      |
| C004       | Operating NWC is structurally negative (reported -USD 28.0m at Jun-26) driven by deferred revenue and annual upfront billing.                                     | ['F022', 'F023', 'F024']         | Obtain deferred revenue rollforward and confirm delivery alignment / refund exposure.                             |
| C005       | Adjusted NWC after normalizations is approximately -USD 26.5m; peg should be set as a negative value and aligned to SPA definitions.                              | ['F027', 'F028']                 | Confirm which items are debt-like vs working capital and obtain monthly working capital schedule for seasonality. |
| C006       | Cash conversion is strong (TTM CFO USD 22.4m on EBITDA USD 29.0m), supporting debt paydown and leverage capacity.                                                 | ['F014', 'F016', 'F021']         | Stress test cash conversion under slower growth (lower deferred revenue tailwind) and higher capex/cap dev.       |
| C007       | Balance sheet includes meaningful intangible assets (goodwill and acquired intangibles), increasing reliance on capitalization policy and impairment assumptions. | ['F018']                         | Obtain intangible rollforwards, impairment testing, and capitalization eligibility documentation.                 |
| C008       | Reporting environment risk is elevated during ERP transition, increasing likelihood of cut-off and accrual variability.                                           | ['F040', 'F041']                 | Obtain JE listing, reconciliation status, and document controls around revenue and capitalization.                |

---

## 4) Review Rubric — pass/fail notes
Rubric dimensions are aligned to `dist/kpmg-slidegen-fdd/knowledge/writing-standards.md` requirements (layout fit, density, evidence, implication, language, and fidelity).

### 4.1 Rubric scores (per slide)
| slide_id   | intent                    | layout_slug                         |   layout_fit |   content_density |   evidence_quality |   implication_quality |   language_quality |   fidelity_placeholders | status   |
|:-----------|:--------------------------|:------------------------------------|-------------:|------------------:|-------------------:|----------------------:|-------------------:|------------------------:|:---------|
| s01        | cover                     | layout.fdd_cover                    |            5 |                 3 |                  3 |                     3 |                  4 |                       5 | pass     |
| s02        | table_of_contents         | layout.fdd_agenda                   |            5 |                 3 |                  3 |                     3 |                  4 |                       5 | pass     |
| s03        | key_takeaways             | layout.fdd_key_takeaways            |            5 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s04        | key_takeaways             | layout.fdd_key_takeaways            |            5 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s05        | key_takeaways             | layout.fdd_key_takeaways            |            5 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s06        | business_overview         | layout.fdd_two_column_bullets       |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s07        | business_overview         | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s08        | revenue_bridge            | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s09        | customer_concentration    | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s10        | general_fdd_analysis      | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s11        | business_overview         | layout.fdd_one_column_narrative     |            4 |                 4 |                  4 |                     4 |                  5 |                       5 | pass     |
| s12        | profit_and_loss_overview  | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s13        | general_fdd_analysis      | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s14        | general_fdd_analysis      | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s15        | general_fdd_analysis      | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s16        | general_fdd_analysis      | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s17        | general_fdd_analysis      | layout.fdd_two_column_bullets       |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s18        | general_fdd_analysis      | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s19        | general_fdd_analysis      | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s20        | working_capital_review    | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s21        | general_fdd_analysis      | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s22        | general_fdd_analysis      | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s23        | general_fdd_analysis      | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s24        | general_fdd_analysis      | layout.fdd_two_column_bullets       |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s25        | qoe_adjustment_highlights | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s26        | qoe_adjustment_highlights | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s27        | qoe_adjustment_highlights | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s28        | qoe_adjustment_highlights | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s29        | qoe_adjustment_highlights | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s30        | qoe_adjustment_highlights | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s31        | qoe_adjustment_highlights | layout.fdd_chart_left_content_right |            4 |                 4 |                  3 |                     4 |                  4 |                       5 | pass     |
| s32        | key_takeaways             | layout.fdd_key_takeaways            |            5 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s33        | working_capital_review    | layout.fdd_chart_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s34        | working_capital_review    | layout.fdd_chart_left_content_right |            4 |                 4 |                  3 |                     4 |                  4 |                       5 | pass     |
| s35        | working_capital_review    | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s36        | working_capital_review    | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s37        | working_capital_review    | layout.fdd_table_left_content_right |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s38        | working_capital_review    | layout.fdd_two_column_bullets       |            4 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s39        | key_diligence_risks       | layout.fdd_key_takeaways            |            5 |                 4 |                  4 |                     4 |                  4 |                       5 | pass     |
| s40        | reporting_environment     | layout.fdd_two_column_bullets       |            4 |                 4 |                  3 |                     4 |                  4 |                       5 | pass     |
| s41        | general_fdd_analysis      | layout.fdd_one_column_narrative     |            4 |                 4 |                  3 |                     4 |                  5 |                       5 | pass     |
| s42        | appendix_support          | layout.fdd_table_left_content_right |            4 |                 4 |                  3 |                     3 |                  4 |                       5 | pass     |
| s43        | payroll_appendix          | layout.fdd_table_left_content_right |            4 |                 4 |                  3 |                     3 |                  4 |                       5 | pass     |
| s44        | appendix_support          | layout.fdd_table_left_content_right |            4 |                 4 |                  3 |                     3 |                  4 |                       5 | pass     |
| s45        | appendix_support          | layout.fdd_table_left_content_right |            4 |                 4 |                  3 |                     3 |                  4 |                       5 | pass     |

### 4.2 Observed gaps and rewrite actions (simulated)
- **Support-pending items:** For slides referencing pending items (for example QA03/QA11/QA12 and WC02/WC04/WC10), language was rewritten to be explicitly qualified (`preliminary`, `support pending`, `subject to tie-out`) and paired with concrete follow-up asks.
- **Placeholder fidelity:** All slides that defer exhibits preserve tokens exactly: `[CHART PLACEHOLDER]` and/or `[TABLE IMAGE PLACEHOLDER]`.
- **Implication enforcement:** Each analytical slide includes an explicit transaction implication (valuation base, debt sizing, peg mechanics, closing accounts dispute risk).
- **De-duplication:** QoE and working capital sections cross-reference cut-off/capitalization topics to reduce double-counting risk.

---

## 5) Unresolved diligence items (intentionally left open)
### 5.1 QoE open items (support pending)
- **QA03:** Legal settlement documentation and final invoice support.
- **QA09:** Related-party hosting contract terms and market pricing benchmark.
- **QA11:** Services milestone delivery evidence supporting revenue cut-off adjustment.
- **QA12:** Capitalization policy memo, time tracking, and eligibility testing for major dev projects.

### 5.2 Working capital / peg open items (support pending)
- **WC02:** ERP vendor payable classification (debt-like vs operating AP) and settlement expectation.
- **WC04:** AR disputes log and subsequent receipts testing to validate reserve magnitude.
- **WC05:** Contract asset schedule by project and customer approval status.
- **WC09:** Deferred revenue release rules and delivery evidence for “delivered but deferred” services.
- **WC10:** Litigation reserve detail and settlement expectation (debt-like treatment).

### 5.3 Reporting environment open items
- Month-end close timeline evidence (calendar and close checklist).
- Journal entry listing and reconciliation status for quarter-end cut-off and capitalization entries.

---

## 6) Quick consistency checks performed
- Reported EBITDA in deck aligns to income statement for each period (FY23–TTM Jun-26).
- QoE adjustments sum to **+USD 3.4m** and reconcile to normalized EBITDA of **USD 32.4m** (TTM).
- Working capital adjustments sum to **+USD 1.5m** and reconcile to adjusted NWC of **-USD 26.5m** at Jun-26.
- Balance sheet balances by period (total assets = total liabilities + equity).

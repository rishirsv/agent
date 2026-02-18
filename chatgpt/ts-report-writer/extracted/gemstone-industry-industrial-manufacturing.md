# Verbatim Report Extraction Template (All Reports)

Use this template to capture **actual report text only** (no rewriting).

## Non-Negotiable Rules

* Copy text **verbatim** from source report outputs.
* Do **not** summarize, interpret, or normalize wording.
* Keep placeholders like `[ENTITY]`, `[DATE]`, `[X]` if present in source.
* If a section is missing, write: `Not present in source report`.
* Keep original section order where possible.

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

* `SOURCE_FILE`: Project Gemstone - Simulated Report 2025.pdf
* `REPORT_ID`: project-gemstone-simulated-report-2025
* `SOURCE_PATH`: /mnt/data/Project Gemstone - Simulated Report 2025.pdf
* `EXTRACTION_STATUS`: complete
* `EXTRACTION_DATE`: 2026-02-17

## Required Source Evidence

* `SOURCE_TEXT_DIR`: extracted/verification/project-gemstone-simulated-report-2025/source-text/pdf
* `MONTAGE_DIR`: extracted/verification/project-gemstone-simulated-report-2025/montage
* `SOURCE_ARTIFACTS`:

  * `page-01.txt`
  * `page-02.txt`
  * `page-03.txt`
  * `page-04.txt`
  * `page-05.txt`
  * `page-06.txt`
  * `page-07.txt`
  * `page-08.txt`
  * `page-09.txt`
  * `page-10.txt`
  * `page-11.txt`
  * `page-12.txt`
  * `page-13.txt`
  * `page-14.txt`
  * `page-15.txt`
  * `page-16.txt`
  * `page-17.txt`
  * `page-18.txt`
  * `page-19.txt`
  * `page-20.txt`
  * `page-21.txt`
  * `page-22.txt`
  * `page-23.txt`
  * `page-24.txt`
  * `page-25.txt`
  * `page-26.txt`
  * `page-27.txt`
  * `page-28.txt`
  * `page-29.txt`
  * `page-30.txt`
  * `page-31.txt`
  * `page-32.txt`
  * `page-33.txt`
  * `page-34.txt`
  * `page-35.txt`
  * `page-36.txt`
  * `page-37.txt`
  * `page-38.txt`
  * `page-39.txt`
  * `page-40.txt`
  * `page-41.txt`
  * `page-42.txt`
  * `page-43.txt`
  * `page-44.txt`
  * `page-45.txt`
  * `page-46.txt`
  * `page-47.txt`
  * `page-48.txt`
  * `page-49.txt`
  * `page-50.txt`
  * `page-51.txt`
  * `page-52.txt`
  * `page-53.txt`
  * `page-54.txt`
  * `page-55.txt`
  * `page-56.txt`
  * `page-57.txt`
* `OCR_USED`:

  * false
* `OCR_SLIDES`:

  * []
* `OCR_ARTIFACTS_DIR`: Not present in source report
* `OCR_RUN_METADATA`: Not present in source report
* `PROVENANCE_QA_JSON`: extracted/verification/project-gemstone-simulated-report-2025/qa/provenance.json
* `PROVENANCE_STATUS`: pass
* `GATES_QA_JSON`: extracted/verification/project-gemstone-simulated-report-2025/qa/gates.json
* `GATES_STATUS`: pass
* `SECTION_MAP_JSON`: extracted/verification/project-gemstone-simulated-report-2025/mapping/section-map.json
* `SECTION_ACCOUNTING_JSON`: extracted/verification/project-gemstone-simulated-report-2025/mapping/section-accounting.json
* `RENDER_TRACE_JSON`: extracted/verification/project-gemstone-simulated-report-2025/render/render-trace.json

## Source-to-Extraction Coverage Map

Use this section to prove every extracted item is verbatim-backed by source text.

| Canonical Section     | Source slide/page IDs                   | Source evidence files                                                                                                                                                                                            | Extracted reference(s)                                                           | Notes |
| --------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----- |
| Executive Summary     | 8                                       | `page-08.txt`                                                                                                                                                                                                    | # Executive Summary bullets 1-2                                                  | [x]   |
| Business Overview     | 10,16,20                                | `page-10.txt`, `page-16.txt`, `page-20.txt`                                                                                                                                                                      | # Business Overview bullets 1-3                                                  | [x]   |
| Quality of Earnings   | 7,9,11,12,13,14,15,17,18,19,21,22,24,25 | `page-07.txt`, `page-09.txt`, `page-11.txt`, `page-12.txt`, `page-13.txt`, `page-14.txt`, `page-15.txt`, `page-17.txt`, `page-18.txt`, `page-19.txt`, `page-21.txt`, `page-22.txt`, `page-24.txt`, `page-25.txt` | # Quality of Earnings ## Overview; ## Quality of earnings adjustments items 1-49 | [x]   |
| Quality of Earnings   | 8,27,28,29                              | `page-08.txt`, `page-27.txt`, `page-28.txt`, `page-29.txt`                                                                                                                                                       | # Quality of Earnings ## Other considerations bullets 1-2                        | [x]   |
| Reporting Environment | 7                                       | `page-07.txt`                                                                                                                                                                                                    | # Reporting Environment bullets 1-2                                              | [x]   |
| Appendices            | 31,43,44,55,56                          | `page-31.txt`, `page-43.txt`, `page-44.txt`, `page-55.txt`, `page-56.txt`                                                                                                                                        | # Appendices Appendix 1,6,7,17,18                                                | [x]   |

If any line in the extracted report is shortened, summarized, or paraphrased, set `Notes` to explain and keep status as `needs_revision` until corrected.

If OCR was used, source artifacts will include an `"[OCR_EXTRACTED_TEXT]"` section; keep those entries for audit only and ensure they are not copied into normal extracted markdown unless source text is proven required.

---

# Executive Summary

* Approximately $5.8 million of the
  $6.8 million adjustments relating to
  TTM September 2013 relates to
  Q4-FY12 and will not impact FY13.
* The “EBITDA-CIM (adjusted)”
  figure presented in the aside
  analysis differs from the CIM due
  to update to adjustments. See
  Appendix 5 for a reconciliation.

# Key Findings

* Not present in source report
* Not present in source report

# Business Overview

* Overview
  ■ Headquartered in Etobicoke, Ontario, Fresh division has
  approximately 3,400 employees and operates 16 bakeries across
  Canada.
  ■ Since FY11, Fresh implemented transformative actions that have
  impacted its financial results and is also reflected within the
  EBITDA adjustments. The key events include:
  – FY11: Start-up of the new Trillium plant in Hamilton, Ontario.
  – FY12-FY13: As a result of the new Trillium plant, Fresh closed
  three other pre-existing bakeries (Fraser, Central, and
  Etobicoke).
  – FY11-FY12: Various distribution centre closures.
  – FY11: Implementation of SAP.
  – In Q3-FY12, Trillium’s employees changed to a new union. Due
  to this change, the risk of strike triggered Fresh to increase
  production at other bakeries.
  – FY12: Established a new transformation department with a full
  time team of approximately three FTEs drawn from Fresh’s
  existing personnel to focus on costs savings initiatives. These
  initiatives are broad based across Fresh whereas previously,
  cost saving initiatives were focused at the local plant and
  regional level.
* Overview

  * ■ Headquartered in Chicago, Illinois, the Frozen division has
    over 1,500 employees and operates seven bakeries
    across Canada and the US.
    ■ The plants in Canada (Calgary, Rivermede, Viceroy and
    Pita) primarily produce bagels, crusty bread and laminated
    dough products. The plants in the US (Roanoke, Oxnard
    and Grace) primarily produce bread (crusty, hearth and
    artisan) and bagels.
    ■ Since FY11, Frozen results were primarily impacted by
    one key event for which EBITDA has been adjusted for:
    – The Roanoke plant located in the state of Virginia is the
    largest plant in the Frozen division. It runs seven
    different lines and primarily produces bagels and crusty
    products. This plant was not operating efficiently for a
    period of time and there are certain non-recurring costs
    that were incurred as a result. The inefficiencies were
    due to management issues and delays in necessary
    maintenance which caused the plant performance to
    suffer. Frozen has since hired new management and
    has invested significant capital expenditure to restore
    performance of the plant. See Appendix 18 for capital
    expenditure spend details and Appendix 14 for
    improvement in Roanoke efficiency metrics.
* Overview
  ■ Headquartered in North London, the UK division has over
  550 employees and operates two bakeries in Rotherham
  (bagels) and Maidstone (Viennoiserie).
  ■ Since FY11, the UK division implemented transformative
  actions that has impacted its financial results and is also
  reflected in the EBITDA adjustments. The key events
  include:
  – FY11 – Sale of the Cumbria plant which produced
  specialty bread.
  – FY11– Closure of the Park Royal plant and
  consolidation of its Croissants production with
  Maidstone.
  – FY12– Closure of the Walsall Plant which produced
  ISB, Sliced and Speciality Bread.
  – FY13 – Sale of Premier Park plant which produced
  specialty bread.
  – FY12 conversion to SAP from BPCS.
  ■ The closure and sale of the plants noted above resulted in
  restructuring costs, start-up costs, and operational
  inefficiency costs during the period being analyzed. The
  impact of these non-recurring costs have been taken into
  consideration in the TTM September 2013 EBITDA
  analysis.
  ■ UK results are converted to Canadian dollars from GBP
  based on monthly average FX rate provided by the
  Company.

# Summary Financials

* Not present in source report
* Not present in source report

# Profit and Loss Overview / Financial Performance

## Overview

Not present in source report

## Key Drivers

1. Not present in source report: Not present in source report
2. Not present in source report: Not present in source report

# Quality of Earnings

## Overview

Overview
■ The quality of earnings analysis is prepared based on the following sources of information:
– Reporting packs: Detailed monthly Management Control Reports (“MCR”) for Fresh, Frozen and UK, and annual
MCR for Corporate;
– This data was combined to form the reported EBITDA that was analyzed for the quality of earnings analysis.
– Consolidating schedules: To reconcile the MCR information to the audited financial statements of Canada Bread.
– The reconciliation includes the breakout of Pasta (or Olivieri division) that was recently sold by Canada
Bread. Food to Go represents a sandwich business unit that was sold in February 2011. See Appendix 1 for
reconciliation.
– Audit work papers: KPMG LLP’s audit work papers;
– Information memorandum: Confidential Information Memorandum (“CIM”) prepared by Canada Bread, MFI, RBC
and Center View Partners dated October 2013;
– Meetings/discussions: held with Finance VPs from Fresh, Frozen, and UK, as well as, Corporate VP (MFI).

■ Adjustments: The nature of the adjustments included in the quality of earnings analysis are categorized as follows:
– CIM adjustments: Potential adjustments to reported EBITDA as identified in the CIM;

## Quality of earnings adjustments

1. 2.3 EBITDA Sweet Goods Business: The adjustment eliminates the historical
   EBITDA loss generated by the Sweet Goods Business that was closed in
   June 2013. The Sweet Goods business operated out of two plants –
   Shawinigan (closed May 2013) and Grand Falls (closed in June 2013).
   Refer to Appendix 6 for further details.
2. 2.4 Disposal of fixed assets: Accounting losses (and gains) arising from the
   disposal of fixed assets are non-cash/non-recurring and therefore excluded
   from EBITDA.
3. 3.1 Duplicative overheads of Toronto bakeries: In FY11, the Company was
   operating three smaller bakeries in the Greater Toronto Area. The
   Company gradually consolidated production at its new Fresh bakery
   (Trillium) in Hamilton, Ontario, commissioned in mid-2011. Two of these
   facilities (Fraser and Central) were closed in Q1-FY12. The third bakery in
   Etobicoke was closed in Q2-FY13. During this period, the concurrent
   operation of the new and existing bakeries resulted in duplicative
   overheads.
   The adjustment is calculated as the difference between actual overheads
   incurred for all four bakeries during the period under consideration and
   Management’s estimation of normal overheads for Trillium bakery as
   budgeted for FY14. Overhead costs include production, utilities, quality
   control, maintenance, sanitation, etc. For FY12 and TTM Sept-13, the
   majority of duplicative overheads relate to the Etobicoke bakery as it was
   closed in Q2-FY13.
   Management believes Fresh would be able to produce the same level of
   volume and product mix in FY11 – TTM September 2013 using the FY14
   Trillium overhead budget cost structure (e.g. Fresh is budgeting 70.7 million
   kg of production in FY14 at Trillium compared to 69.7 kg million for TTM
   September 2013 and 68.2 million kg for FY12). Refer to Appendix 7 for
   further details.
4. 3.2 Trillium start-up inefficiencies: – As noted in the previous adjustment, Fresh’s Trillium plant is a new
   $110 million plant that began operations in FY11. As the plant is still in
   its early phase of operation, the plant experienced certain inefficiencies
   and therefore retained a higher level of employees.
   – In addition, the main bakery equipment supplier for the Trillium plant,
   went into bankruptcy just prior to delivery of some of the Trillium
   equipment. As a result, the Company received little technical support
   from the manufacturer during the start up phase causing a number of
   inefficiencies and abnormal unfavorable direct product cost variances.
   Fresh continues to fine-tune its equipment to maximize efficiencies.
   – The direct product cost variances include raw material and packaging
   costs, and direct labour costs (rate + efficiency + overtime). These
   variances are calculated as the difference between the standard cost of
   the volume produced and the actual cost. The 2013 standards for direct
   product costs represent the expected efficiency levels of the facility.
   The significant unfavorable variances (e.g. higher level of raw
   material/packaging waste and overtime, etc) at Trillium was a result of
   the aforementioned start-up challenges and are expected to be
   eliminated over time.
   – According to Management, FY12 and FY13 standard costs for Trillium
   also includes provisions for potential inefficiencies relating to the start-
   up phase as three new lines were commissioned in FY13. Going
   forward, Management fully expects DPC variances will normalize as
   the plant migrates from start-up phase to a normal course operation. As
   a result, the proposed adjustment removes historical “direct product
   cost variances” (recorded within COGS) from EBITDA.
   – Refer to Appendix 13 for a breakdown of direct product cost variances
   relating to the Trillium plant.
5. 3.3 Trillium strike contingency: During Q3-FY12, the incumbent BCT Union
   was decertified by the Teamsters Union. In preparation for any disruption
   arising from the inability of the Teamster’s union to successfully ratify a new
   contract, management decided to ramp up production at the Company’s other
   bakeries to avoid any potential lost sales. During Q1 FY13 as contract
   negotiations were continuing with the Teamsters Union, Management again
   decided to ramp up production at the Company’s other bakeries in
   preparation for a potential worker strike to avoid any potential sales losses.
   Consequently, the Company incurred significant line haulage and storage
   costs for transferring products between plants, and storing higher than normal
   inventory as a precaution during Q1/Q2 FY13. In addition, this event also led
   to higher direct product cost variances in the Etobicoke plant. In the end, the
   Company was able to successfully negotiate and agreement with the
   Teamster’s union and no labour disruption occurred. This event is considered
   non-recurring thus related costs are added back to reported EBITDA.
6. 3.6 SAP implementation costs: This adjustment eliminates non-recurring
   costs resulting from disruptions experienced due to the SAP
   implementation (November 2011 for West and early 2011 for Atlantic).
   ■ These costs included employment costs of additional staff, training an
   sales waste expenses. The cost of SAP consultants was borne by MF
   Management represents that during the go-live period (November 201
   – June 2012) the Company had to hire temporary inventory controllers
   to manage the inventory. Due to the new processes, the Company for
   short period of time did not manage its supply planning well and
   incurred elevated levels of sales waste.
   ■ As presented in Appendix 10, the sales waste adjustment is calculated
   based on comparison of average monthly sales waste of FY09 and
   FY10 with the sales waste experienced during the go-live period.
   – Sales waste calculation for West for the period November 2011 to
   July 2012.
   – Waste calculation for East for the period January 2011 to
   December 2011.
7. 3.7 SG&A headcount: As part of its cost reduction initiative, Fresh terminate
   approximately 90 employees in Q1-FY13. Severance payments for this
   staff reduction were recorded in exceptional items (below EBITDA). This
   adjustment reflects proforma employment costs savings of the terminated
   employees in the historical period, net of replacement hires and expected
   future hires. Refer to Appendix 11 for further details.
8. 4.1 Franchisee Route Resale: The Company often reorganizes its routes
   within its franchise network, resulting in the acquisition of a route from one
   franchisee and the sale of it to another. The Company records these
   transactions in other income and these transactions usually result in net
   impact of nil. During the period under consideration, the Company re-
   engineered certain routes before it sold them within the franchise network
   This resulted in timing differences in buying and selling as well as gains o
   losses. Given that the Company does not intend to make any gains or
   losses from such activities, the proposed adjustment to EBITDA removes
   impact of such gains or losses.
9. 5. Reversal of Quebec TMA provision: The adjustment relates to the turn back
      (or reversal) of aged volume incentive accruals. These aged balances were
      carried forward from prior years and adjusted in FY12 after it was certain that
      the customers will not claim any old TMAs.
10. 6. Payable write off: Management performed a cleanup of payables (relating to
       2011 or earlier) which resulted in non-recurring income of $976,000 in FY12
       and $293,000 in FY11 from the reversal. Accordingly, the adjustment is made
       to EBITDA to eliminate one-time impact of this reversal.
11. 7. Other income (various): There were a number of potential non-recurring items
       recorded in “Other” within other income. The table below presents a summary
       of such non-recurring items. Note: Due to a number of clean up entries, FY11
       impacts due to timing difference from FY12 or TTM Sept-13 matters are not
       reflected in the adjustment.
12. ii. Adrian’s decommissioning costs: Reflects a reversal of
    decommissioning costs relating to the Adrian property in November
    2012, for which a provision was created in September 2012. The
    adjustment eliminates the gain resulting from an accounting timing
    difference.
13. iii. Laval tax appeal: Relates to a non-recurring gain recorded in
    September 2012 as a result of winning 2007-2010 property tax
    assessment appeal relating to the Laval plant.
14. iv. Spare parts inventory cleanup: Represents reversal of a general
    accrual for spare parts relating to historical periods prior to FY11.
15. v. Packaging write-off: Reflects clean up of packaging accruals relating to
    FY11.
16. vi. Correction of billing adjustments: Correction of adjustments
    incorrectly made to the income statement instead of the balance sheet.
17. vii. Quebec franchisee receivable: Correction of prior year franchisee
    receivable.
18. viii. Hamilton PY property tax: Represents true-up of FY11 property tax
    expense for Trillium plant as an updated FY11 assessment for property
    tax was not received until some time after the plant had begun
    operations.
19. ix. CSST Retro adj: Relates to true-up for Quebec workers' compensation
    obligations relating to FY09.
20. x. CSST: Relates to true-up for Quebec workers' compensation obligations
    primarily relating to FY11
21. 8. Freight capitalization: – The freight costs associated with inventory are expensed as incurred and
       are not capitalized into the finished goods inventory valuation. Given that
       distribution costs are incurred in bringing the inventories to their present
       location and condition, such costs should be capitalized into inventory.
22. 10. Variance capitalization: 10. Variance capitalization:
        – The Company records inventory on a standard cost basis. Standard costs
        are updated at the beginning of each fiscal year to reflect the average
        expected unit cost for the year. Monthly variances are recorded in the
        income statement and not capitalized to inventory.
        – Inventory turnover for this business is typically less than 15 days. As a
        result, the impact of expensing variances would result in an approximately
        15 day timing difference.
        – To reflect actual inventory cost at period end, a portion of the above
        variance would be allocated to inventory, based on the premise of inventory
        days. See the following table for this allocation. The auditors similarly
        prepared an analysis to estimate what portion of variances would be
        capitalized to the balance sheet. The auditors reflected this calculation in
        their annual accounting differences schedule.
23. 11. Bonus: 11. Bonus: Bonuses paid for FY11 and FY12 do not equate to the bonus expense
        recorded. This is due to over/under accruals being carried forward. For
        indicative purposes, the potential bonus adjustment compares the difference
        between bonus expense recorded and bonus paid. The bonus paid (e.g. bonus
        paid in 2013 relating to 2012) is applied on a straight-line basis. For 2013, we
        applied a bonus monthly run-rate of approximately $250,000, based on
        Management’s estimation.
24. 12. Investment tax credit: Investment tax credit earned by the Company
        decreased from $1 million in FY11 to $0.5 million in TTM September 2013. This
        was primarily due to the investment in the Trillium plant which resulted in higher
        tax credits during FY11 and FY12. According to Management, on a recurring
        basis, Fresh should expect to earn approximately $0.2 million of ITC annually.
        The net difference between the expected normal run-rate compared to reported
        amounts has been deducted from EBITDA for normalization purposes.
25. 3.1 Roanoke manufacturing variances: Roanoke is Frozen’s flagship
    plant and was not operating efficiently in FY12 and Q1-FY13 due to
    certain management issues and delays in necessary maintenance
    which caused the plant performance to suffer. This resulted in
    significant adverse direct product cost (e.g. high level of waste and
    labour inefficiencies) and overhead spend variances. In addition, during
    YTD Sept-13, Frozen has made significant capital investments (see
    Appendix 18) to enhance its production efficiencies, as well as, hired
    new management to improve profitability. Going forward, Management
    expects the plant will run according to the 2013 standard cost levels or
    better. Refer to Appendix 14 for further details.
26. 4.1 Management bonus: During FY12, the Company incurred various one-
    time consulting and other fees unrelated to the business operations.
    These costs were recorded in SG&A in Q1-FY12. The proposed
    adjustment removes the impact of these non-recurring items.
27. i. TMA accrual true-up: ■ In YTD Sept-13, the Company undertook a clean-up of their TMA
    accounts which resulted in reversals of TMA accruals that relate to
    FY12. This impact was $1.5 million benefit (net of $2.9 million income
    and $1.3 million in expense that was recorded within the TMA expense
    account). Although the account clean-up occurs periodically, this
    balance was larger than normal. Accordingly, the proposed adjustment
    removes the non-recurring net gain impact from YTD Sept-13 and
    corrects the amount to FY12.
    ■ Prior year adjustments to TMA occur naturally in this business due to
    the accrual and payment process. Management anticipates FY14 will
    benefit from a release of prior year accruals, but currently the impact
    cannot be quantified.
28. ii. 2012 rebate (Sysco): The Company recorded a $177,000 rebate accrual
    reduction for Sysco in February 2013; however, this amount related to Q4-
    FY12. This adjustment removes the impact from YTD Sept-13 and straight
    lines the impact across Q4-FY12.
29. iii. Wind-up of allowance for doubtful accounts: In December 2012,
    Frozen fully reversed its provision for bad debt expense in light of the
    change in provisioning policy by MFI. The proposed adjustment eliminates
    the non-recurring credit impact to EBITDA.
30. iv. Gain/ loss on disposal of fixed assets: The proposed adjustment
    eliminates the non-recurring loss on sale of assets derived from the assets
    disposed in Roanoke.
31. v. True-up of workers comp accrual: Represents unusual true-up of prior
    period (pre-FY11) balances of workers compensation accrual. The
    potential adjustment removes the non-recurring impact.
32. Note on Freight capitalization: As per MFI policy, the Company does not
    capitalize freight costs (e.g. inbound freight). For accounting purposes, freight
    cost should be capitalized. However, specific details to quantify this impact for
    Frozen on a monthly basis is not available at the date of this report. Based on
    the audit differences, the estimated freight cost that should be capitalized at the
    end of December was a positive impact of $56,000 to EBITDA in FY12.
33. 1. Bad debt expense and inventory reversals: In FY11, the Company reversed
       $320,000 of bad debt provision (related to a FY10 receivable from Quiznos) to
       income due to collection. This reversal has been removed from EBITDA for
       normalization purposes. In addition, in September 2011, the Company
       recorded an adjustment to inventory that resulted in a non-recurring credit to
       EBITDA. This has been excluded for normalization purposes.
34. 2. Exclude MFI allocations: Similar to Fresh, corporate allocations have been
       eliminated to present EBITDA excluding allocation charges. Refer to Other
       Considerations for further details.
35. 3.2 Start-up costs on transfer to 3rd party: In Q4-FY12, the Company
    eliminated its in-house freight and distribution services and contracted a
    third party to perform these services on a go-forward basis. This
    adjustment reflects the additional costs incurred due to the inefficiencies
    caused during the transition period between Q4-FY12 to Q2-FY13 (as
    estimated by Management).
    ■ Rotherham freight costs increased abnormally by 1.5% during Q4-
    FY12 and 2% in January 2013.
    ■ Maidstone freight costs increased abnormally 3% during Q4-FY12 and
    1% during the first half of 2013.
    ■ Refer to Appendix 17 for further details on the historical expense run-
    rates.
36. 3.3 Start-up costs for Tesco Viennoiserie: In FY12, the Company won a
    large contract with existing customer, Tesco, to produce their line of
    ambiant products. There were certain additional labour and training costs
    incurred due to the recruitment of new people as the line was adjusting to
    accommodate the higher volumes from Tesco. These inefficiencies were
    non-recurring and have been rectified. Management has proposed an
    adjustment to EBITDA. The adjustment is estimated by Management
    based on a 5% abnormal increase in labour cost during Q4 2012 and 1.5%
    increase in material cost during the first half of 2013 in the Maidstone
    plant. Refer to Appendix 17 for further details.
37. 3.4 Bagel efficiency: In the first half of 2013 there were additional costs in
    respect of Rotherham. There were adverse variances on storage,
    increased freight costs and production inefficiencies due to the level of
    activity and limited production capacity.
38. 8. Other income: Included in other income are certain non-recurring gains in
       FY11 and FY12. The non-recurring gain recorded in FY11 related to insurance
       claim proceeds and dilapidations accrual release. In FY12 UK changed the
       estimated useful life of the Rotherham building from 20 years to 40 years,
       which resulted in a non-recurring accounting gain. These amounts are
       eliminated from EBITDA for normalization purposes. (The TTM Sept-13 figure
       represents spillover from amounts recorded in Q4 2012.)
39. 9. Provision reversal: The adjustment eliminates a non-recurring gain (net) from
       the following:
       ■ $0.5 million of release of dilapidations provisions relating to Park Royal
       ■ ($0.1) million of amortization of grants relating to Cumbria site
40. 10. Exclude MFI allocations: Similar to Fresh and Frozen, corporation allocations
        have been eliminated to present EBITDA excluding allocation charges. Refer to
        Other Considerations for further details.
41. 4.1 Pension adjustment: For 2013, pension accounting rules were
    changed whereby, unlike US GAAP or prior Canadian GAAP, asset
    return assumptions must now be calculated at the same amount as the
    long-term discount rates used to value liabilities in the pension plans.
    The (previously positive) spread between asset return assumptions
    and discount rates are now reflected in Other Comprehensive Income
    (OCI) and may not be included in the income statement. This has no
    effect on cash contributions for pensions but resulted in a reduction in
    earnings in 2013. This IAS19 non-cash pension adjustment has been
    added back to make it consistent with prior years.
42. 5. Non-recurring consolidation entries: Upon consolidation of Canada Bread,
       additional consolidation entries are recorded to true-up the Company’s financi
       results. There are certain consolidation entries which create a non-recurring
       impact to EBITDA. These entries are reversed for normalization purposes and
       include the following:
43. a. Sun-maid royalty overpayment: In December 2012, Management
    recorded $0.8 million of royalty income relating to the full year FY12. The
    adjustment removes the impact of the royalty income relating to the period
    from January 2012 to September 2012, by spreading out the amount
    equally over FY12.
44. b. Bonus provision reversal: To eliminate the bonus provision reversal
    adjustment (Corporate performs a top-side true-up upon consolidation). Th
    proposed adjustment eliminates the non-recurring gain to EBITDA.
45. c. Vacancy costs: Certain vacancy costs are recorded as exceptional item b
    business units. This entry by corporate reclasses the amount to other
    income. However, for EBITDA normalization purposes, the vacancy costs
    are considered non-recurring
46. d. Bad debt provision adjustment: To reverse the bad debt provision
    reversal adjustment due to correction of prior period errors. The proposed
    adjustment eliminates the non-recurring gain to EBITDA.
47. 6. Martel settlement: This adjustment removes one-time proceeds from a
       legal settlement of $1.4 million, related to the Company’s fresh sandwich
       product line, which was sold in 2011. We understand that the proceeds were
       received by the Company in Q3-FY12, resulting in no adjustment for TTM
       Sept-13.
48. 7. Severance: This relates to one-time relocation expenses for the former
       President of Fresh Prepared Foods (Olivieri). Given the Olivieri business is
       not part of the transaction, this expense has been added back to the
       reported EBITDA.
49. 8. Exclude MFI allocations: Similar to other business units, corporate
       allocations have been eliminated to present EBITDA excluding allocation
       charges. Refer to Other Considerations for further details.

## Other considerations

* ■ The quality of earnings analysis
  excludes the potential impact of
  cost saving initiatives that have
  been implemented at Fresh and
  Frozen.
  ■ Management estimates the
  annual savings from these
  initiatives to be approximately
  $26.7 million of which
  approximately $7.7 million has
  been realized in YTD September
  2013. Furthermore, an estimated
  $1.3 million (net of incremental
  bonus) is expected to be realized
  for the remainder of FY13.
  ■ See other considerations section
  for additional information.
* The following are other Allocations
  considerations which ■ MFI allocations:
  may be factored in the
  – As noted in the CIM, MFI allocates costs to the Company
  overall assessment of related to general, marketing, direct purchasing, six sigma,
  information services, and master data shared services. These
  EBITDA.
  costs may need to be replaced on a go-forward basis
  depending on the buyer and subject to transition services
  Management represents
  agreement.
  that there is an additional
  ■ The first table summarizes the corporate allocations as
  annual impact of $1
  presented in the CIM.
  million in allocations
  ■ The second table summarizes the corporate allocation
  related to facilities owned costs recorded at each of the business units (excluding
  by MFI which are rented Olivieri) and is derived from the MCR.
  out by the Fresh and – These allocations have been removed from EBITDA to
  present EBITDA excluding allocation charges (e.g. see
  Frozen divisions. These
  Exclude MFI allocation adjustment in the quality of earnings).
  allocations are not split
  It is our understanding the Company will provide additional
  out separately in the information/analysis on potential stand-alone considerations.

  Bread. Note: Difference in TTM September 2013 is due to timing difference of when
  expenses and recovery are recorded by each division. The net amount at
  – The following summarizes the current arrangement with Pasta and
  each year-end will typically net to nil. The difference included in TTM
  Rothsay: September 2013 indicates more expenses may have been recorded at the
  divisions than what Fresh has charged out. Since the amount is not material,
  ■ Pasta (Olivieri): key services currently provided to the Pasta division
  no EBITDA adjustment is proposed.
  include accounts receivable, accounts payable, and food service sales.
  There is a transition services agreement in effect the term of which is 6
  months.
  ■ Rothsay: the key service provided to Rothsay is primarily payroll
  related. The transition services agreement in effect has a term of 18
  months. As such, Rothsay is expected to continue to pay for these
  services through at least 2014.

# Income Statement

* Not present in source report
* Not present in source report

# Balance Sheet

* Not present in source report
* Not present in source report

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

* Not present in source report
* Not present in source report

# Reporting Environment

* Overview
  ■ The quality of earnings analysis is prepared based on the following sources of information:
  – Reporting packs: Detailed monthly Management Control Reports (“MCR”) for Fresh, Frozen and UK, and annual
  MCR for Corporate;
  – This data was combined to form the reported EBITDA that was analyzed for the quality of earnings analysis.
  – Consolidating schedules: To reconcile the MCR information to the audited financial statements of Canada Bread.
  – The reconciliation includes the breakout of Pasta (or Olivieri division) that was recently sold by Canada
  Bread. Food to Go represents a sandwich business unit that was sold in February 2011. See Appendix 1 for
  reconciliation.
  – Audit work papers: KPMG LLP’s audit work papers;
  – Information memorandum: Confidential Information Memorandum (“CIM”) prepared by Canada Bread, MFI, RBC
  and Center View Partners dated October 2013;
  – Meetings/discussions: held with Finance VPs from Fresh, Frozen, and UK, as well as, Corporate VP (MFI).
* Not present in source report

# Related Parties

* Not present in source report
* Not present in source report

# Industry Analysis

* Not present in source report
* Not present in source report

# Forecast Trading

* Not present in source report
* Not present in source report

# Quality of Net Assets

* Not present in source report
* Not present in source report

# Gross Margin by LOB

* Not present in source report
* Not present in source report

# <Addition Sections as Needed>

* Not present in source report
* Not present in source report

# Appendices

## Appendix 1: Consolidating schedules – FY11

■ Olivieri (Pasta): This division has been sold by CB and is not included in the transaction – Other income reclass: Represents a reclassification of other income figures to cost
■ Fresh/Frozen/UK Bakery/Corp MCR: MCR data was used to build up the Fresh, Frozen. have been analyzed separately.
■ Food to go/CBAM/Consol adj./reclasses: This set of data was obtained from CB’s See Appendix 4.
– Food to go: This represents the sandwich business and its financial results. The
– CBAM : primarily relates to administrative and operating expense costs flowing

## Appendix 2: Consolidating schedules – CBAM

Not present in source report

## Appendix 3: Consolidating entries

Not present in source report

## Appendix 4: Exceptional items and restructuring (1)

Not present in source report

## Appendix 5: CIM EBITDA adjustment reconciliation (1)

Not present in source report

## Appendix 6: Fresh – Sweet Goods business

Sweet goods business See Fresh quality of earnings adjustment #2
for additional details.
The Company continues to sell certain sweet
goods to Costco made by another company
on a resale basis. Revenue and costs of
these transactions with Costco are included
in the Sweet Goods division. Accordingly, the
EBITDA adjustment is net of the historical
gross profit generated from Costco as the
transactions with Costco are expected to
continue in the future.

## Appendix 7: Fresh – Duplicative overheads

Trillium duplicative overhead Trillium overhead costs See Fresh quality of earnings
adjustment #3 for additional details.

## Appendix 8: Fresh – Trillium strike contingency

Not present in source report

## Appendix 9: Fresh – Transport costs to cover shortfalls

Not present in source report

## Appendix 10: Fresh – SAP implementation (1) – additional costs incurred

Not present in source report

## Appendix 11: Fresh – SG&A headcount reduction

Not present in source report

## Appendix 12: Fresh – Franchisee route resale

Not present in source report

## Appendix 13: Fresh – Trillium start-up inefficiencies – DPC variance trends

Not present in source report

## Appendix 14: Frozen – Roanoke plant operations

Not present in source report

## Appendix 15: Frozen – Operating expenses - overheads

Not present in source report

## Appendix 16: UK – Specialty bread disposal

Not present in source report

## Appendix 17: UK – Start up cost impacts expense trends

Start-up costs - Rotherham See UK quality of earnings
adjustment #3 for additional

## Appendix 18: Frozen – Capital expenditure by project type

Frozen - capex by project type Higher spend in FY11 relates to
improvements in the lines related to bagel
items in the Rivermede plant and
spend at Roanoke including various line
upgrades.

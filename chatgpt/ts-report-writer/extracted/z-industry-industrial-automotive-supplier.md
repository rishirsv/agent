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

- `SOURCE_FILE`: Project Z_sell side_fact book.pptx
- `REPORT_ID`: project-z-sell-side-fact-book
- `SOURCE_PATH`: /mnt/data/Project Z_sell side_fact book.pptx
- `EXTRACTION_STATUS`: complete
- `EXTRACTION_DATE`: 2026-02-17

## Required Source Evidence

- `SOURCE_TEXT_DIR`: extracted/verification/project-z-sell-side-fact-book/source-text/pptx
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
  - `slide-74.txt`
  - `slide-75.txt`
  - `slide-76.txt`
  - `slide-77.txt`
  - `slide-78.txt`
  - `slide-79.txt`
  - `slide-80.txt`
  - `slide-81.txt`
  - `slide-82.txt`
  - `slide-83.txt`
  - `slide-84.txt`
  - `slide-85.txt`
  - `slide-86.txt`
  - `slide-87.txt`
  - `slide-88.txt`
  - `slide-89.txt`
  - `slide-90.txt`
  - `slide-91.txt`
  - `slide-92.txt`
  - `slide-93.txt`
  - `slide-94.txt`
  - `slide-95.txt`
  - `slide-96.txt`
  - `slide-97.txt`
  - `slide-98.txt`
  - `slide-99.txt`
  - `slide-100.txt`
  - `slide-101.txt`
  - `slide-102.txt`
  - `slide-103.txt`
  - `slide-104.txt`
  - `slide-105.txt`
  - `slide-106.txt`
  - `slide-107.txt`
  - `slide-108.txt`
  - `slide-109.txt`
  - `slide-110.txt`
  - `slide-111.txt`
  - `slide-112.txt`
  - `slide-113.txt`
  - `slide-114.txt`
  - `slide-115.txt`
  - `slide-116.txt`
  - `slide-117.txt`
  - `slide-118.txt`
- `OCR_USED`:
  - false
- `OCR_SLIDES`:
  - []
- `OCR_ARTIFACTS_DIR`: Not present in source report
- `OCR_RUN_METADATA`: Not present in source report
- `PROVENANCE_QA_JSON`: Not present in source report
- `PROVENANCE_STATUS`: pass
- `GATES_QA_JSON`: Not present in source report
- `GATES_STATUS`: pass
- `SECTION_MAP_JSON`: Not present in source report
- `SECTION_ACCOUNTING_JSON`: Not present in source report
- `RENDER_TRACE_JSON`: Not present in source report

## Source-to-Extraction Coverage Map

Use this section to prove every extracted item is verbatim-backed by source text.

| Canonical Section   | Source slide/page IDs | Source evidence files          | Extracted reference(s)                               | Notes |
| ------------------- | --------------------- | ------------------------------ | ---------------------------------------------------- | ----- |
| Executive Summary | 17, 18, 19, 20 | `slide-17.txt`, `slide-18.txt`, `slide-19.txt`, `slide-20.txt` | `# Executive Summary` bullets 1-33 |  |
| Key Findings | 16, 103 | `slide-16.txt`, `slide-103.txt` | `# Key Findings` bullets 1-9 |  |
| Business Overview | 6, 7, 8, 9 | `slide-06.txt`, `slide-07.txt`, `slide-08.txt`, `slide-09.txt` | `# Business Overview` bullets 1-15 |  |
| Summary Financials | 13 | `slide-13.txt` | `# Summary Financials` bullets 1-1 |  |
| Profit and Loss Overview / Financial Performance | 31, 32, 33, 43, 44, 45, 46 | `slide-31.txt`, `slide-32.txt`, `slide-33.txt`, `slide-43.txt`, `slide-44.txt`, `slide-45.txt`, `slide-46.txt` | `# Profit and Loss Overview / Financial Performance` `## Overview` + `## Key Drivers` items 1-3 |  |
| Quality of Earnings | 34, 35, 36 | `slide-34.txt`, `slide-35.txt`, `slide-36.txt` | `# Quality of Earnings` `## Overview` + `## Quality of earnings adjustments` items 1-18 + `## Other considerations` bullets |  |
| Income Statement | 31, 32, 33, 45, 46, 54, 55 | `slide-31.txt`, `slide-32.txt`, `slide-33.txt`, `slide-45.txt`, `slide-46.txt`, `slide-54.txt`, `slide-55.txt` | `# Income Statement` bullets 1-17 |  |
| Balance Sheet | 77, 78, 95, 96 | `slide-77.txt`, `slide-78.txt`, `slide-95.txt`, `slide-96.txt` | `# Balance Sheet` bullets 1-14 |  |
| Net Working Capital | 89 | `slide-89.txt` | `# Net Working Capital` `## Overview` + `## Net working capital adjustments` |  |
| Net Debt (Cash) | 91, 92 | `slide-91.txt`, `slide-92.txt` | `# Net Debt (Cash)` `## Overview` + `## Net debt / cash adjustments` |  |
| Cash Flows | 93, 100, 20 | `slide-93.txt`, `slide-100.txt`, `slide-20.txt` | `# Cash Flows` bullets 1-10 |  |
| Reporting Environment | 22, 23, 24, 77 | `slide-22.txt`, `slide-23.txt`, `slide-24.txt`, `slide-77.txt` | `# Reporting Environment` bullets 1-18 |  |
| Industry Analysis | 103 | `slide-103.txt` | `# Industry Analysis` bullets 1-5 |  |
| Forecast Trading | 64, 65, 70, 75 | `slide-64.txt`, `slide-65.txt`, `slide-70.txt`, `slide-75.txt` | `# Forecast Trading` bullets 1-12 |  |
| <Addition Sections as Needed> | 59, 60, 61, 62, 105 | `slide-59.txt`, `slide-60.txt`, `slide-61.txt`, `slide-62.txt`, `slide-105.txt` | `# <Addition Sections as Needed>` `## Stand-alone considerations` + `## Value creation potential` |  |

If any line in the extracted report is shortened, summarized, or paraphrased, set `Notes` to explain and keep status as `needs_revision` until corrected.

If OCR was used, source artifacts will include an `"[OCR_EXTRACTED_TEXT]"` section; keep those entries for audit only and ensure they are not copied into normal extracted markdown unless source text is proven required.

---

# Executive Summary

- Topline is expected to grow at a CAGR of 13.2% over the business plan period driven by strong PRODUCT 2 development, reflecting major acquisitions of display-centric projects. PRODUCT 1  is expected to generate moderate growth until FYXX, overall market decline drives NPS reductions in the periods thereafter.
- PRODUCT 2 gross margins are expected to gradually improve from FYXX onwards driven by NPS development and efficiency gains in production. Strong PRODUCT 1 gross margins are expected to remain relatively stable in the plan period.
- Gross margin improvements in PRODUCT 2 also drive EBIT margins. Further drivers are economies of scale as well as focus on resources in best cost countries starting FYXX. Optimization of development costs (incl. shift of R&D capacities to PRODUCT 2) and lower overhead allocation (based on NPS) lead to EBIT margin improvement in PRODUCT 1.
- Note:		(a) Adj. EBIT margins calculated as a % of adjusted NPS.
- FYXX financials were adversely impacted by the Covid-19 crisis. Since then, CLIENT successfully returned to the growth path while improving profitability. With respect to counter-measures to the pandemic, CLIENT focused on sustainable and long-term effects. The main levers of recovery included:
- CLIENT’s efforts with respect to project acquisition proved expedient, thus growing FYXX NPS above pre-crisis levels and securing a long-standing project pipeline;
- Restructuring measures (particularly aimed at the production function) initiated in FYXX efficiently increased profitability resulting in EBIT margin improvement;
- Successfully negotiated pass-through of raw material price inflation reduced the adverse impact of geopolitical supply chain disruptions.
- As at DATE, CLIENT’s net debt primarily related to cash and cash equivalents, bank liabilities, shareholder loans and minor other loans and derivatives.
- Other major debt-like items identified by management included:
- Leasing liabilities mainly related to rental contracts;
- Specific warranty provisions of which the major portion resulted from a claim of one [X] (please refer to QoE);
- Net pension provisions.
- The major income and expense positions that management identified as non-representative of a recurring trend in EBIT comprise:
- FYXX: Reversed income included provision releases phased to the period of respective build-up and a one-off compensation payment received from an [X]. Expense adjustments addressed warranty costs related to one extraordinary claim as well as extraordinarily high freight expenses related to global supply chain disruption;
- FYXX: Major FYXX adjustments also apply for FYXX (excl. income from [X] compensation);
- FYXX: CLIENT incurred non-recurring expenses in relation to the restructuring program initiated in FYXX. The program aimed a rightsizing the workforce, focusing on production staff.
- Quality of earnings
- CLIENT’s strong fixed asset base largely relates to project specific efforts, which are capitalized and amortized over the contract period as well as PPE. Major historical net asset movements included:
- Due to the prospective and secured order book, CLIENT invested in capacity expansion (mostly in COUNTRY), driving the fixed assets’ growth;
- Working capital management procedures (introduction of factoring in MM YY) resulted in a reduction of net working capital. Increases in sales discounts not yet claimed further contributed to this development;
- Settlement of bank liabilities reduced CLIENT’s net debt position.
- Increase in projected fixed asset base is largely driven by investments in PRODUCT 2  projects (capitalized development efforts) as well as capacity expansions (COUNRY/ REGION);
- Projected increases in NWC primarily relates to NPS growth and the shift to more expensive PRODUCT 2 raw materials. Factoring is expected to mitigate NWC increases;
- Projected decreases in net debt relate to repayments of bank liabilities from strong free cash flows expected from FYXX onwards.
- Source: Management information.
Note: (a) Fixed assets (excl. net debt item) do not include cash-like plan assets related to pension provisions.
- Despite a largely stable EBITDA, operating cash flow increases result from NWC reductions, mainly due to unclaimed sales accruals.
- The increase in capex was primarily caused by:
- Increases in tooling and other PRODUCT 2 related investments;
- Capacity expansion in REGION
- Stable growth in operating cash flows in FYXX and FYXX is expected to be offset by increased capex requirements due to:
- Investments in building of production site in REGION.
- FCFs are projected to turn positive from FYXX onwards due to strong EBITDA increases partially off-set by NWC increases following the NPS development.

# Key Findings

- Business plan indicates CLIENT benefiting from the shift in product portfolio to PRODUCT 2 and the establishment within this segment leading to larger projects
- The effects are visible within the forested R&D and SG&A costs resulting in an optimization of those cost ratios
- In addition to those benefits, functional optimization initiatives are planned to drive additional efficiencies and reduce the cost further
- As a result, CLIENT's projected EBIT margins are in the range of its competitors
- While [CLIENT NAME] shows industry average gross margins compared to electrical component suppliers, profitability benchmarking indicates value potential below COGS
- Shift in portfolio to Display/[PRODUCT 2]negatively impacts [CLIENT NAME]‘s gross margin driven by increase of material expense ratio
- Gross margin generally in line with peers, however, [COMPANY NAME] ([REGION]) with gross margin slightly above [CLIENT NAME] FYXX
- [CLIENT NAME] EBIT margin FYXX 3pp below peer average, indicating optimization potential in cost categories below COGS
- Considering negative macroeconomic effects in FYXX/FYXX, further EBIT improvement assumed feasible

# Business Overview

- Established in YEAR, CLIENT NAME is a joint venture between [X] [COMPANY NAME] ([X], 50%) and [X] [COMPANY NAME] ( [X], 50%) that specializes in providing climate control and thermal management products and services to the automotive industry.
- CLIENT NAME offers a horizontally integrated business model: Product offerings include PRODUCT 1 units and PRODUCT 2 system solutions. CLIENT NAME has a global presence, with development and production sites located in REGION
- Source: Management information.
- Note:     (a) Average Headcount (MM YY to MM YY) w/o apprentice but incl. external contract workers.
- (b) Average Headcount ((MM YY + MM YY) / 2) w/o apprentice but incl. external contract workers.
.
- Note:     (a) Please note that this location forms a permanent establishment and not a legal entity.
- (b) Including rest of the world.
- (c) Based on reported and reclassified NPS as management adjustments are not available on a regional level.
- (d) Headcount data for all entities as of DATE
- PRODUCT components and air conditioning control devices.
- PRODUCT for modern PRODUCT 1 in cross-vehicle platforms with algorithms to ensure individual climate comfort.
- Electric auxiliary heaters and blower controllers in connection with sensors to supply input signals for controlling level of climate comfort
- CLIENT NAME provides PRODUCT 1 applications through standalone devices, which manage the AC system through software and hardware. Advanced sensors measure ambient conditions for a safe and comfortable travel experience.
- Note:     (a) Based on reported NPS, adjustments not available on segment level in FYXX.
              (b) NPS are incl. management adjustments in FYXX and FYXX. Thus, NPS shares of product groups / customers add up to >100% in FYXX.
- The PRODUCT 2  segment manufactures central operating elements, climate and audio panels as well as fully integrated center stacks.
- Note: 	(a) Based on reported NPS, adjustments not available on segment level in FYXX. 
		(b) ‘Other’ relates to adjustments to reconcile BP and FC23 figures. From FYXX onwards, ‘Other’ relates to quick savings.

# Summary Financials

- Source: Management information.
Note: Gross margin and EBIT margin based on reported values. To ensure comparability, margins are based on total sales.

# Profit and Loss Overview / Financial Performance

## Overview

[CLIENT NAME] successfully managed to recover from adverse Covid-19 impacts and to grow DATE above pre-crisis levels. Restructuring measures proved effective, with production related efficiency gains mostly driving the adjusted EBIT margin increase.

Presented historical P&L figures have been adjusted and reclassified as outlined in the ‎Basis of preparation section. The figures are based on consolidated management a [PRODUCT 1] counts prepared under IFRS.

Net product sales (NPS)

Net product sales in [DATE] and [DATE] were significantly impacted by Covid-19 pandemic related reduction in production (mainly a three month lock down in [REGION] in [DATE] ) and geopolitically driven supply chain disruptions in the area of electronic components.

[DATE] NPS increased by %, exceeding pre Covid-19 levels. Strong growth was mainly related to strong business development, in particular with one large [X]. Further, [CLIENT NAME] was able to sure [PRODUCT 1] successfully pass-through higher material prices to customers.

Cost of goods sold

Net product sales y-o-y growth

In addition to NPS, major gross profit components comprise:

Cost of goods sold largely characterized by manufacturing material and personnel expenses;

Cost reimbursements from customers and suppliers, e.g. for tooling, packaging, quality claims and logistics are presented as other sales;

Other production related tooling expenses and income (tooling depreciation net of respective reimbursements).

The historical gross profit margin development was largely driven by:

[CLIENT NAME] was able to largely pass on significant raw material price increases to customers. Further, [CLIENT NAME] benefitted from sustainable, restructuring related production efficiency gains.

However, respective improvement was offset by an increase in quick savings (sales discounts granted to customers during project tender processes) in [DATE]. Please note that [CLIENT NAME] partly recognized respective customer incentive costs as selling expenses over the historical period. Refer to the gross margin analysis for a like-for-like presentation.

Absolute administration costs growth in [DATE] primarily resulted from higher personnel expenses, reflecting workforce expansion in functions and wage inflation at all legal entities. Except for higher intra-[CLIENT NAME] functional cost allocation (without EBIT impact), administration costs largely developed in line with NPS.

Personnel expenses (DATE: $X MM) and nomination fees (one-time payments granted to customers during project tender processes, $X MM) represented the major components of selling costs.

Due to a continuous decline of nomination fees since [DATE], the selling cost margin improved a[PRODUCT 1] accordingly. Please note, however, that [CLIENT NAME] partly recognized similar customer incentive costs within gross profit over the historical period. Refer to the selling costs section for a like-for-like presentation.

Other expenses mainly included withholding taxes and various smaller items. Other operating income mostly consisted of received warranty reimbursements [DATE: $X MM] and public grants : $X MM].

## Key Drivers

1. Net product sales (NPS): Since [DATE] [CLIENT NAME] continuously outperformed prior year’s NPS due to ramp-up of new projects and pass-through of material price increases.
Sales with shareholders mainly comprised business with [x] entities.
Covid-19 related lock down in [REGION].
Main drivers for higher NPS levels in [DATE] were:
Ramp-up of new projects after recovery of the business post-Covid-19;
Material cost pass through to customers.
2. Like-for-like gross margin analysis: [CLIENT NAME] benefits from the restructuring initiative started in [DATE], supplier discounts received and a supplier change. Such production related measures resulted in a continuous increase of like-for-like gross margins.
[DATE] is highly impacted by substantial raw material price increases, which [CLIENT NAME] passed-through to customers ($X MM higher NPS and COGS). A likewise effect is not applicable for [DATE] and [DATE].
The gross margin development on a like-for-like basis is more meaningful. Please refer to Appendix for a trail from the adjusted and reclassified to a like-for-like P&L.
The restructuring program initiated in [DATE] mainly focused on production. [PRODUCT 1] successful implementation led to continuous like-for-like gross margin improvements in [DATE] and [DATE].
[CLIENT NAME] received supplier discounts of $X million in [DATE] after purchase volume thresholds were exceeded. Such supplier discounts are a common part of supplier contracts.
Additionally, a supplier change for a major [PRODUCT 2] project in [DATE] and [DATE] contributed to decreased material costs. Full year impact materialized in [DATE].
3. Cost of goods sold: Raw material price inflation was the major driver of historical COGS increases which [CLIENT NAME] [PRODUCT 1] successfully passed on to customers. Due to the effectiveness of the restructuring program, [CLIENT NAME] kept production related personnel expenses largely constant while increasing NPS.
Material costs moved largely in line with NPS as material price increases were passed on to customers.
Manufacturing material mainly included raw materials such as plastic parts and active / passive electronic components. Absolute growth in [DATE] was driven by a substantial price increase in electronic components. Further, higher procurement broker fees contributed to the development, as [CLIENT NAME] did not obtain components from regular suppliers due to supply chain disruptions. Please note that [CLIENT NAME] largely managed to pass-through raw material price increases to customers.
Cost of purchased services mainly included external services from contract manufacturers utilized for [X] brand #1 X projects. Higher levels in [DATE] were driven by the attempt to set up a bonding facility in [REGION].
Except for direct and indirect personnel, production costs moved largely in line with NPS.
Direct personnel expenses and indirect personnel expenses refer to internal and leased production and logistics staff. Due to the restructuring program initiated in [REGION]. in [DATE] (workforce release primarily related to the production function), NPS growth exceeded respective personnel expense increases, resulting in realized efficiency gains.
Management adjustments in [DATE] mainly include exceptional warranty (ref. to QoE #‎) and freight expenses (ref. to QoE #‎). The large [DATE] balance predominantly relates to restructuring (ref. to QoE #‎‎).

# Quality of Earnings

## Overview

Restructuring expenses in [DATE] represent the largest adjustment identified by management. Further major adjustment items include the correct phasing of provision releases as well as one-off income and expenses related to warranty cases and premature contract termination.

In order to present [CLIENT NAME] results on a comparable basis, management performed an in-depth analysis and identified one-off and pro-forma adjustments to EBITDA / EBIT.

## Quality of earnings adjustments

1. Restructuring expenses in [DATE] represent the largest adjustment identified by management. Further major adjustment items include the correct phasing of provision releases as well as one-off income and expenses related to warranty cases and premature contract termination.: Restructuring expenses in [DATE] represent the largest adjustment identified by management. Further major adjustment items include the correct phasing of provision releases as well as one-off income and expenses related to warranty cases and premature contract termination.
2. Income from release of provisions is phased to the periods with corresponding additions build-up. In [DATE] releases mainly related to sales provisions [$X MM], warranty [$X MM], restructuring [$X MM] and inventor remuneration [$X MM].: Income from release of provisions is phased to the periods with corresponding additions build-up. In [DATE] releases mainly related to sales provisions [$X MM], warranty [$X MM], restructuring [$X MM] and inventor remuneration [$X MM].
3. In [DATE] [CLIENT NAME] received a compensation payment from an [X] for contract termination prior to the agreed end of production (EOP) due to earlier discontinuation of the [X] series.: In [DATE] [CLIENT NAME] received a compensation payment from an [X] for contract termination prior to the agreed end of production (EOP) due to earlier discontinuation of the [X] series.
4. One-off other operating income relates to reimbursed overpayments from [CLIENT NAME] [REGION] to an external interim employment company especially established for the transitional period of the redundant employees related to the restructuring program initiated in [DATE].: One-off other operating income relates to reimbursed overpayments from [CLIENT NAME] [REGION] to an external interim employment company especially established for the transitional period of the redundant employees related to the restructuring program initiated in [DATE].
5. Expenses for a one-off guarantee case, where [CLIENT NAME] acted as Tier 2 supplier [DATE] : $X MM;: Expenses for a one-off guarantee case, where [CLIENT NAME] acted as Tier 2 supplier [DATE] : $X MM;
6. The severance payment for a former board member [DATE] : $X MM, and: The severance payment for a former board member [DATE] : $X MM, and
7. Exceptional bonus expenses related to [x] transaction [DATE] : $X MM.: Exceptional bonus expenses related to [x] transaction [DATE] : $X MM.
8. FX gains and losses are considered non-operational and thus have been adjusted a[PRODUCT 1]ordingly.: FX gains and losses are considered non-operational and thus have been adjusted a[PRODUCT 1]ordingly.
9. Gains and losses from fixed asset disposals are considered non-operational in nature.: Gains and losses from fixed asset disposals are considered non-operational in nature.
10. Non-recurring consulting fees comprised [FUNCTION] for [FUNCTION], as well as lawsuits related to inventors' remuneration and supplier insolvencies.: Non-recurring consulting fees comprised [FUNCTION] for [FUNCTION], as well as lawsuits related to inventors' remuneration and supplier insolvencies.
11. During the Covid-19 pandemic, [CLIENT NAME] initiated a restructuring program at the [REGION]. The program encompassed a planned reduction of production and administrative workforce and included the release or early retirement of X FTEs. Expenses related mainly to redundancy payments. At the time of this Report the restructuring program is completed.: During the Covid-19 pandemic, [CLIENT NAME] initiated a restructuring program at the [REGION]. The program encompassed a planned reduction of production and administrative workforce and included the release or early retirement of X FTEs. Expenses related mainly to redundancy payments. At the time of this Report the restructuring program is completed.
12. In [DATE] and [DATE]  [CLIENT NAME] a[PRODUCT 1]rued for specific warranty related to customers claims:: In [DATE] and [DATE]  [CLIENT NAME] a[PRODUCT 1]rued for specific warranty related to customers claims:
13. Panel products delivered to an [X[ [DATE] : $X MM; [DATE] : $X MM, and: Panel products delivered to an [X[ [DATE] : $X MM; [DATE] : $X MM, and
14. [X] products delivered to Tier 1 customer [DATE] : $X MM.: [X] products delivered to Tier 1 customer [DATE] : $X MM.
15. Due to global supply chain disruptions, [CLIENT NAME] incurred extraordinary freight rates in [DATE] and [DATE] . The adjusted amount is based on a historically experienced normal level of freight expenses of approx. % of NPS (as incurred in [DATE]).: Due to global supply chain disruptions, [CLIENT NAME] incurred extraordinary freight rates in [DATE] and [DATE] . The adjusted amount is based on a historically experienced normal level of freight expenses of approx. % of NPS (as incurred in [DATE]).
16. [CLIENT NAME] a [PRODUCT 1]rued for outstanding import tax obligations [$X MM] and related interest payments [$X MM] in [REGION] related to [DATE] and [DATE] As these relate to prior periods, the amounts have been adjusted a[PRODUCT 1] accordingly.: [CLIENT NAME] a [PRODUCT 1]rued for outstanding import tax obligations [$X MM] and related interest payments [$X MM] in [REGION] related to [DATE] and [DATE] As these relate to prior periods, the amounts have been adjusted a[PRODUCT 1] accordingly.
17. In [DATE] , [CLIENT NAME] started to build a bonding facility in [REGION]. Related uncapitalized ramp-up costs of [DATE] and [DATE] are considered non-recurring in nature and have been adjusted a[PRODUCT 1] accordingly.: In [DATE] , [CLIENT NAME] started to build a bonding facility in [REGION]. Related uncapitalized ramp-up costs of [DATE] and [DATE] are considered non-recurring in nature and have been adjusted a[PRODUCT 1] accordingly.
18. In [DATE] [CLIENT NAME] introduced a new inventory write down policy. Expenses related to the first-time application of the new policy are considered non-recurring in nature and have been adjusted a [PRODUCT 1] accordingly.: In [DATE] [CLIENT NAME] introduced a new inventory write down policy. Expenses related to the first-time application of the new policy are considered non-recurring in nature and have been adjusted a [PRODUCT 1] accordingly.
19. [CLIENT NAME] currently relies on certain services rendered by shareholder [X] (as well as [X] to a minor extent). Respective dependencies mostly relate to purchasing, IT and R&D tools (incl. licenses for PDM, CADBAS/CADENCE and other component databases). [CLIENT NAME] cost structure highly depends on capabilities and resources of the new owner. Please refer to the dedicated Report section for further details on potential separation impacts.: [CLIENT NAME] currently relies on certain services rendered by shareholder [X] (as well as [X] to a minor extent). Respective dependencies mostly relate to purchasing, IT and R&D tools (incl. licenses for PDM, CADBAS/CADENCE and other component databases). [CLIENT NAME] cost structure highly depends on capabilities and resources of the new owner. Please refer to the dedicated Report section for further details on potential separation impacts.
20. Depreciation during the ramp up phase of the new bonding facility in [REGION] has been adjusted as related benefits lie in the future. For further detail, please refer to QoE #‎‎.: Depreciation during the ramp up phase of the new bonding facility in [REGION] has been adjusted as related benefits lie in the future. For further detail, please refer to QoE #‎‎.
21. Extraordinary depreciation related to:
Premature wear of specific tools [$X MM], which resulted in unplanned depreciation; and
Stopped launch of a bonding facility in [REGION] and write off of all related capitalized expenses [$X MM].: Extraordinary depreciation related to:
Premature wear of specific tools [$X MM], which resulted in unplanned depreciation; and
Stopped launch of a bonding facility in [REGION] and write off of all related capitalized expenses [$X MM].

## Other considerations

- [CLIENT NAME] currently relies on certain services rendered by shareholder [X] (as well as [X] to a minor extent). Respective dependencies mostly relate to purchasing, IT and R&D tools (incl. licenses for PDM, CADBAS/CADENCE and other component databases). [CLIENT NAME] cost structure highly depends on capabilities and resources of the new owner. Please refer to the dedicated Report section for further details on potential separation impacts.
- Depreciation during the ramp up phase of the new bonding facility in [REGION] has been adjusted as related benefits lie in the future. For further detail, please refer to QoE #‎‎.

# Income Statement

- Cost of goods sold
- In addition to NPS, major gross profit components comprise:
- Cost of goods sold largely characterized by manufacturing material and personnel expenses;
- Cost reimbursements from customers and suppliers, e.g. for tooling, packaging, quality claims and logistics are presented as other sales;
- Other production related tooling expenses and income (tooling depreciation net of respective reimbursements).
- The historical gross profit margin development was largely driven by:
- [DATE] to [DATE] : Profitability gains from restructuring measures initiated in [DATE] in [X] started to materialize, resulting in respective margin improvements;
- [DATE] to [DATE] :
- [CLIENT NAME] was able to largely pass on significant raw material price increases to customers. Further, [CLIENT NAME] benefitted from sustainable, restructuring related production efficiency gains.
- [DATE] to [DATE] (continued):
- However, respective improvement was offset by an increase in quick savings (sales discounts granted to customers during project tender processes) in [DATE]. Please note that [CLIENT NAME] partly recognized respective customer incentive costs as selling expenses over the historical period. Refer to the gross margin analysis for a like-for-like presentation.
- Absolute administration costs growth in [DATE] primarily resulted from higher personnel expenses, reflecting workforce expansion in functions and wage inflation at all legal entities. Except for higher intra-[CLIENT NAME] functional cost allocation (without EBIT impact), administration costs largely developed in line with NPS.
- Personnel expenses (DATE: $X MM) and nomination fees (one-time payments granted to customers during project tender processes, $X MM) represented the major components of selling costs.
- Due to a continuous decline of nomination fees since [DATE], the selling cost margin improved a[PRODUCT 1] accordingly. Please note, however, that [CLIENT NAME] partly recognized similar customer incentive costs within gross profit over the historical period. Refer to the selling costs section for a like-for-like presentation.
- Other expenses mainly included withholding taxes and various smaller items. Other operating income mostly consisted of received warranty reimbursements [DATE: $X MM] and public grants : $X MM].
- Cost of goods sold (1/2)
- Raw material price inflation was the major driver of historical COGS increases which [CLIENT NAME] [PRODUCT 1] successfully passed on to customers. Due to the effectiveness of the restructuring program, [CLIENT NAME] kept production related personnel expenses largely constant while increasing NPS.
- Material costs moved largely in line with NPS as material price increases were passed on to customers.
- Manufacturing material mainly included raw materials such as plastic parts and active / passive electronic components. Absolute growth in [DATE] was driven by a substantial price increase in electronic components. Further, higher procurement broker fees contributed to the development, as [CLIENT NAME] did not obtain components from regular suppliers due to supply chain disruptions. Please note that [CLIENT NAME] largely managed to pass-through raw material price increases to customers.
- Cost of goods sold - Adjusted and reclassified
- Cost of purchased services
- Cost of goods sold, adjusted and reclassified
- Cost of goods sold, reported
- Cost of goods sold, adjusted
- Cost of goods sold, reported (as a % of rep. NPS)
- Cost of goods sold (2/2)
- Cost of goods sold (continued)
- Incoming freight largely related to shipping and customs duties.
- Cost of purchased services mainly included external services from contract manufacturers utilized for [X] brand #1 X projects. Higher levels in [DATE] were driven by the attempt to set up a bonding facility in [REGION].
- Except for direct and indirect personnel, production costs moved largely in line with NPS.
- Direct personnel expenses and indirect personnel expenses refer to internal and leased production and logistics staff. Due to the restructuring program initiated in [REGION]. in [DATE] (workforce release primarily related to the production function), NPS growth exceeded respective personnel expense increases, resulting in realized efficiency gains.
- Personnel expenses increased in line with NPS. The absolute growth in [DATE] mostly resulted from the build-up of IT personnel in [REGION], wage inflation and bonus payments in [REGION].
- The increase in other expenses in [DATE] resulted from higher withholding taxes and bad debt expenses.
- Other expenses predominately consisted of bad debt write-offs ([DATE]: $[X] MM) based on the result of a supplier case after clearance and bad debt allowances ([DATE]: $[X] MM.
- Other expenses - Adjusted and reclassified
- Other expenses, adjusted and reclassified
- Other expenses, reported (as a % of rep. NPS)
- Other operating income mostly comprises recurring warranty reimbursements, grant income and benefits in kind.

# Balance Sheet

- Presented historical balance sheet figures are based on consolidated management accounts prepared under IFRS.
- Capitalized contract costs for customer projects as well as land & buildings (Dec-XX: $xx.x million) and technical equipment ($xx.x million) represented the major components of fixed assets. The increase over the historical period was largely driven by capacity expansion in [REGION] and [REGION] (partly offset by IFRS 16 lease liabilities included in other liabilities).
- The historical trade working capital reduction was mostly caused by the introduction of a factoring program as at Nov-XX. This decrease was partly offset by higher inventories due to raw material price increases related and caused by general capacity constraints following increased chip demand of private households during Covid-19 times. These general capacity constraints were further aggravated by fire incidents at Asian chip manufacturers and by the Ukraine war.
- Net financial debt mostly related to various bank loans and cash balances mainly held in [CURRENCY], [CURRENCY] and [CURRENCY]. The historical reduction was largely driven by operating cash generation.
- The major components and historical drivers of other balance sheet items included:
- Other assets: Security deposits related to the implementation of the factoring facility in Nov-XX represented the largest component and historical growth driver (Dec-XX: $x.x million). Other major balances included trade receivables due from [X] and [X] ($x.x million).
- Deferred contract liabilities include project related development work reimbursements received from customers in relation to capitalized contract costs.
- Other liabilities: The increase as at Dec-XX was mostly due to higher IFRS 16 lease liabilities (Dec-XX: $xx.x million) caused by the capacity expansion in [REGION] and [REGION]. Further major components comprised personnel related liabilities ($x.x million) and deferred income ($x.x million).
- Other provisions: Unclaimed sales provisions (Dec-XX: $xx.x million) represented the major position and growth driver within other provisions. Further major reported balances included warranty provisions ($xx.x million) as well as personnel related accruals ($x.x million).
- [PRODUCT 2] project growth largely impacts projected balance sheet movements, in particular through increasing capitalized contract costs and higher TWC levels.
- The adjacent table presents projected balance sheet figures which are based on a hybrid  planning (planned bottom-up and adjusted top-down). For further information on key business plan assumptions, please refer to the ‎Basis of preparation slide.
- The projected fixed assets development is driven by planned growth in the[PRODUCT 2]segment and related project investments. Furthermore, facility expansions in [REGION] (FYXX-25), [REGION] and [REGION] (FYXX-27) drive additional capex requirements. Total gross capex is projected between $65 million and $78 million p.a.
- Trade working capital projections are largely based on [CLIENT NAME]’s project pipeline and driven by increasing NPS levels. Projections also consider a factoring program mitigating NWC growth.
- Projected net financial debt includes the assumption of a constant minimum cash balance of $40 million throughout the business plan. Positive FCFs are assumed to be used to repay bank liabilities. Negative FCFs in FYXX and FYXX will be covered by bank liabilities.
- The major components of projected other balance sheet items include:
- Other assets which are expected to mainly decrease due to (i) lower security deposits for factoring from FYXX onwards (due to lower volumes factored) and (ii) lower shareholder receivables due to[PRODUCT 1]NPS decline throughout the business plan. Shareholder receivables are related to trade activities and are presented as other working capital.
- In connection with incurred and capitalized contract costs, [CLIENT NAME] also receives reimbursements from customers. Reimbursements are invoiced and recognized as a liability (deferred contract liabilities).
- Fluctuations in projected other liabilities largely relate to lease liabilities, which are expected to increase in FYXX and FYXX mainly due to new facility leases in [REGION].
- Projected other provisions are expected to increase due to sales and warranty provisions which are projected based on NPS levels.

# Net Working Capital

## Overview

The historical decline in trade working capital was mostly driven by the introduction of a factoring program as at Nov-XX. The overall decline in net working capital was further driven by the timing of customer discount claims within other working capital.

The historical reduction in trade working capital was primarily related to the utilization of factoring since Nov-XX, partly offset by an increase in DIO driven by raw material price increases due to general capacity constraints following increased chip demand of private households, fire incidents at Asian chip manufacturers and the Ukraine war.

Trade payables (including minor capex payables) fluctuated largely in-line with cost of goods sold. Average payment terms generally range around 60 days.

Please note that trade working capital does not include trading related receivables and payables with [X] and [X] and their subsidiaries. Respective balances are included as other working capital items within net working capital.

Other assets (adj.), other liabilities (adj.) and other provisions (adj.) as presented in the net working capital calculation are adjusted for financing related balances identified by Management and considered debt-like.

The overall decline in other working capital over the historical period was primarily driven by the development of sales provisions. Further, higher leasing liabilities contributed to the downward trend.

Declining other working capital was partly offset by higher factoring related other assets.

## Net working capital adjustments

1. Other assets (adj.), other liabilities (adj.) and other provisions (adj.) as presented in the net working capital calculation are adjusted for financing related balances identified by Management and considered debt-like.: Other assets (adj.), other liabilities (adj.) and other provisions (adj.) as presented in the net working capital calculation are adjusted for financing related balances identified by Management and considered debt-like.

If adjustment items are only presented in tables/charts and excluded by policy, capture any surrounding explanatory lines and add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Net Debt (Cash)

## Overview

[CLIENT NAME]’s net debt primarily related to net financial debt balances. Other major debt-like items are IFRS 16 leasing liabilities, specific warranty provisions and net pension provisions. Please refer to ‎Appendix for details on the off-balance sheet commitments.

Cash and cash equivalents comprised [CLIENT NAME]’s cash balances mainly held in [CURRENCY], [CURRENCY] and [CURRENCY]. Other currencies included [CURRENCY], [CURRENCY] and [CURRENCY].

Bank liabilities as of Dec-XX referred to a syndicated credit loan from diverse creditors, one promissory note, a loan from [X] (A [REGION] state-owned investment and development bank), two loans in [REGION] as well as multiple smaller bilateral credit lines. For an overview of credit lines please refer to ‎Appendix.

Shareholder loans related to promissory notes [CLIENT NAME] received from both shareholders in equal amounts of $x.xx million each. According to management, respective note conditions are at arm's length.

Other loans and derivatives as at Dec-XX exclusively related to out-of-the-money financial derivatives for FX hedging. As at Dec-XX, the balance further included a customer discount received which was recognized as a customer loan ($x.x million).

Financial derivatives as of 31 Dec-XX comprised in-the-money forward FX transactions.

Income tax receivables related to tax receivables attributable to periods prior to closing.

Leasing liabilities predominantly included rental contracts (equipment to a minor extent) and largely increased in-line with capacity expansions in [REGION] and [REGION] (see also land and buildings within fixed assets).

Specific warranty provisions refer to the portion of warranty provisions with an estimated amount accrued for specifically known claims. The major portion resulted from a claim of one [X] for a panel project (ref. QoE #4).

Net pension provisions included pension provisions (Dec-XX: $x.x million) partly off-set by underlying plan assets ($x.x million) which are presented as financial assets on [CLIENT NAME]'s balance sheet.

[CLIENT NAME] partly accrued for extraordinary transaction bonus provisions for retention in connection with project [CLIENT NAME] (ref. QoE #8) as of Dec-XX.

Income tax liabilities related to tax payables attributable to periods prior to closing.

Accrued interest liabilities mainly related to obligations at [CLIENT NAME] [REGION] (ref. QoE #6).

## Net debt / cash adjustments

1. Financial derivatives as of 31 Dec-XX comprised in-the-money forward FX transactions.: Financial derivatives as of 31 Dec-XX comprised in-the-money forward FX transactions.
2. Leasing liabilities predominantly included rental contracts (equipment to a minor extent) and largely increased in-line with capacity expansions in [REGION] and [REGION] (see also land and buildings within fixed assets).: Leasing liabilities predominantly included rental contracts (equipment to a minor extent) and largely increased in-line with capacity expansions in [REGION] and [REGION] (see also land and buildings within fixed assets).
3. Specific warranty provisions refer to the portion of warranty provisions with an estimated amount accrued for specifically known claims. The major portion resulted from a claim of one [X] for a panel project (ref. QoE #4).: Specific warranty provisions refer to the portion of warranty provisions with an estimated amount accrued for specifically known claims. The major portion resulted from a claim of one [X] for a panel project (ref. QoE #4).
4. Net pension provisions included pension provisions (Dec-XX: $x.x million) partly off-set by underlying plan assets ($x.x million) which are presented as financial assets on [CLIENT NAME]'s balance sheet.: Net pension provisions included pension provisions (Dec-XX: $x.x million) partly off-set by underlying plan assets ($x.x million) which are presented as financial assets on [CLIENT NAME]'s balance sheet.

If debt-like/working-capital adjustments are only in tables/charts, add:
`Table- or chart-based adjustment details were excluded per extraction policy.`

# Cash Flows

- The indicative indirect free cash flow calculation presented in the adjacent table is based on [CLIENT NAME]’s consolidated IFRS financial statements (P&L items and balance sheet movements). For reconciliation purposes a total cash flow calculation is presented in the ‎Appendix of this Report.
- Operating cash flows: The increase in FYXX was predominately driven by other working capital fluctuation. This particularly related to the increase in accruals for unclaimed sales discounts.
- Investing cash flows: The increase in capex was primarily caused by increases in tooling and other[PRODUCT 2]related investments. Further, capacity expansion mainly in [REGION] and [REGION] contributed to capex growth.
- The projected free cash flow development reflects strong growth in the[PRODUCT 2]segment with increasing EBITDA and slightly higher working capital and capex requirements.
- Projected operating cash flows are largely driven by changes in capitalized contract costs and trade working capital reflecting business growth, mainly through project acquisitions in the[PRODUCT 2]segment.
- Projected free cash flows are expected to be negative in FYXX and FYXX due to high capex requirements for capacity expansions as well as development activities needed to accommodate new acquired projects, e.g. production site expansion in [REGION] in FYXX.
- From FYXX onwards, free cash flows are expected to ramp-up in line with operating cash flows, while capex are expected to remain at x-x% of NPS.
- Despite a largely stable EBITDA, operating cash flow increases result from NWC reductions, mainly due to unclaimed sales accruals.
- Stable growth in operating cash flows in FYXX and FYXX is expected to be offset by increased capex requirements due to:
- FCFs are projected to turn positive from FYXX onwards due to strong EBITDA increases partially off-set by NWC increases following the NPS development.

# Reporting Environment

- KPMG has been engaged by [X] [COMPANY NAME] and [X][COMPANY NAME] to prepare a financial fact book report in connection with the potential divestment of their Joint Venture CLIENT. The Report has been prepared in accordance with our engagement letter dated DATE.
- Our work on historical trading comprises the period FYXX to FYXX. With respect to prospective financial trading, our scope of work includes FYXX budget and FYXX to FYXX business plan. We have analyzed the balance sheet as at DD MM YYYY, 20YY and 20YY, and our analysis of net working capital was performed on monthly balance sheet captions for the period MM YYYY To MM YYYY.
- Please refer to the appendices for a detailed ‎Scope of work.
- During the course of our work our main points of contact have been the management team of CLIENT, represented by NAME (CEO), NAME  (CFO), NAME (COO) and NAME (head of corporate development) as well as the controlling and accounting team represented by NAME (head of controlling) and NAME (head of corporate services).
- We attended several meetings with management and the controlling/ accounting team and had regular follow-up calls and communication through email.
- Overall, we had very good access to management, who put a significant amount of time and effort into this financial fact book process by responding to our questions and requests in a timely and comprehensive manner.
- The contents of our Report have been reviewed and the factual accuracy of this Report has been confirmed by CLIENT’s management. Please refer to ‎Appendix for the signed factual accuracy letter.
- The requested information has been provided through a virtual data room (VDR) and via e-mails. As of the date of this Report, all available requested information has been provided in a timely and comprehensive manner.
- Key sources of financial information used in this financial fact book include, but are not limited to:
- Audited Group statutory accounts for CLIENT in accordance with COUNTRY GAAP  for FYXX, FYXX and FYXX;
- Consolidated monthly IFRS reporting packages (management accounts) for CLIENT in accordance with IFRS for FYXX to FYXX comprising P&L, balance sheet and cash flow statements. Information for FYXX and FYXX was provided on a monthly basis. Please note that respective year-end IFRS packages form part of CLIENT’s shareholders’ ([X] [COMPANY NAME] and [X][COMPANY NAME] ) audited consolidated financial statements;
- Financials presented in this financial fact book are based on consolidated monthly trial balances for CLIENT Group in accordance with IFRS for the period MM YY to MM YY. FYXX financials were highly impacted by the Covid-19 pandemic. As such FYXX financial information was provided on a full-year basis only.
- Financial statements of CLIENT Group (consolidated Group financials) were audited by PWC in FYXX and FYXX and by EY in FYXX with unqualified audit opinions. Group financial statements are prepared in accordance with COUNTRY GAAP . Individual statutory accounts are based on local GAAP. Those entities subject to an audit, received unqualified opinions in all periods. CLIENT REGION is subject to a desktop audit. Please refer to the ‎Appendix for the consolidation trail.
- Reconciliation differences between IFRS Group financials as presented in this financial fact book and audited COUNTRY GAAP accounts result from:
- GAAP conversion (COUNTRY GAAP vs IFRS).
- In order to show the NPS development on a consistent like-for-like basis throughout the historical period, sales from pass-through of material price increases have been reclassified from other sales to NPS ($ XX million, in FYXX only).
- In addition, R&D sales (customer reimbursements) have been reclassified from other sales to development costs (presented net of R&D sales) in all periods.
- Quality of earnings adjustments for one-off and non-operational income and expenses.
- Please refer to the Appendix for a ‎bridge from audited accounts (COUNTRY GAAP) to management (IFRS) accounts as well as a ‎Profit and loss – Reclassification and adjustment trail.
- SAP is used as ERP system for most of the individual Group entities (CLIENT REGION, CLIENT REGION, CLIENT REGION, and CLIENT REGION). The remaining legal entities (CLIENT REGION) use local tax advisors for preparation of the reporting packages. Consolidation, management reporting and business planning are performed in [X] .
- IC consolidation as well as cut-off procedures for all major items are performed on a monthly basis, except for pension accruals, year-end inventory count, tax and warranty provisions.
- Board approval was obtained in [DATE] for the business plan incl. [DATE] to [DATE].
- Board approval was obtained in [DATE].
- Bottom-up update at project level based on actual financials per FYXX:
- Top-down adjustments:
- Presented historical balance sheet figures are based on consolidated management accounts prepared under IFRS.

# Related Parties

- Not present in source report
- Not present in source report

# Industry Analysis

- While [CLIENT NAME] shows industry average gross margins compared to electrical component suppliers, profitability benchmarking indicates value potential below COGS
- Source:	KPMG Research & Analysis
- Note:	(a) % of total sales in FYXX for [CLIENT NAME]. Gross margin and EBIT margin based on reported values.
- Shift in portfolio to Display/[PRODUCT 2]negatively impacts [CLIENT NAME]‘s gross margin driven by increase of material expense ratio
- Gross margin generally in line with peers, however, [COMPANY NAME] ([REGION]) with gross margin slightly above [CLIENT NAME] FYXX
- [CLIENT NAME] EBIT margin FYXX 3pp below peer average, indicating optimization potential in cost categories below COGS
- Considering negative macroeconomic effects in FYXX/FYXX, further EBIT improvement assumed feasible

# Forecast Trading

- Strong NPS growth is backed by the current project pipeline. EBIT margin is projected to increase significantly based on economies of scale and further cost saving measures.
- Source: Management information.
- Projected P&L figures are based on a bottom-up planning on project (down to gross margin) and entity level. For further information on key business plan assumptions, please refer to ‎Basis of preparation.
- Net product sales are projected based on the current project pipeline and expected project acquisitions with a win probability >60%. Quantities and prices are planned bottom-up based on direct feedback and discussions with customers and the sales & purchase department.
- Projected NPS include a 100% purchase (PUR) price increase compensation (refer to next page).
- Development costs (net of reimbursements)
- Development costs (net of reimbursements) are mainly driven by personnel expenses which are assumed to increase based on country-specific labor cost inflation rates. R&D headcount incl. project management is projected to increase from X in [DATE] to X in [DATE] and remain constant thereafter.
Further optimization potential by shifting R&D resources to best cost countries is included in the business plan from [DATE] onwards.
- Short-term growth (CAGR of 15.7%) is expected to be driven by [PRODUCT 2] display-centric projects by [X] brands #1 and #2 and [PRODUCT 1] black box projects by [X] brand #3. Long-term growth (CAGR of 12%) is mainly driven by [X] brand #2 and SOP of a major display-centric project.
- Source: Management information.
Note:     (a) The change in the NPS management adjustments in [DATE] was not assigned to [X]s therefore it was included in ‘Other’.
- Key business plan assumptions – Cost of goods sold
- Key business plan assumptions – Development costs (net of reimbursements)
- Development costs (net of reimbursements) (FYXX-XX)
- Development costs as a % of NPS reduce steadily over the business plan period as R&D headcount incl. project management is projected to remain constant at xxx employees between FYXX (xxx [PRODUCT 2]; xxx [PRODUCT 1]) and FYXX (xxx [PRODUCT 2]; xxx [PRODUCT 1]). R&D incl. project management resources are expected to shift from [PRODUCT 1] to[PRODUCT 2]on the back of the strategic shift towards[PRODUCT 2]projects. Nominal increases in personnel expenses are driven by tariff increases and country-specific labor cost assumptions.
- Development costs (net of reimbursements) have been projected based on planned projects and expected headcount requirements.
- Key business plan assumptions – Administration costs
- Key business plan assumptions – Selling costs
- Selling costs are growing slower than NPS due to larger projects. Nomination fees are projected to decline from 1.9% to 1.7%.
- Backed by strong NPS growth in[PRODUCT 2]as well as concluded productivity improvement measures EBIT and EBIT margin are projected to significantly increase between FYXX and FYXX.
- Key business plan assumptions – Projected EBIT drivers
- Projected NPS are the main driver for EBIT growth between FYXX and FYXX. The ramp-up of the[PRODUCT 2]market demand and shift in [CLIENT NAME]’s order book from [PRODUCT 1] to[PRODUCT 2]projects contribute to strong sales volume growth generated in the[PRODUCT 2]segment. For a like-for-like comparison impacts from PUR price increases and nomination fees were excluded (refer to ‎Appendix for a trail from the adjusted and reclassified to a like-for-like P&L).
- Expected shift from the mature [PRODUCT 1] segment to the fast-growing[PRODUCT 2]segment results in negative product mix effects, which are partially offset by material cost and productivity improvement measures.
- Development costs (net of reimbursements) and SG&A costs are projected to increase primarily due to labor cost inflation while headcount is projected to remain relatively stable from FYXX onwards. Additionally, a shift of R&D and G&A resources to best cost countries is expected to drive profitability.
- Furthermore, nomination fees in absolute terms are planned to increase in connection with further sales growth.
- Note:     (a) Please refer to ‎Appendix for the detailed calculation of like-for-like EBIT bridge components.
- (b) Please refer to Appendix for indicative P&L like-for-like trail.

# Quality of Net Assets

- Not present in source report
- Not present in source report

# Gross Margin by LOB

- Not present in source report
- Not present in source report

# <Addition Sections as Needed>

- Not present in source report
- Not present in source report

## Stand-alone considerations

- On a stand-alone basis, incremental cost would relate to higher material expenses as well as the build-up of additional purchasing workforce. The timing of respective stand-alone impacts depends on [X] agreements.
- In both scenarios (with and w/o [X]) [CLIENT NAME] will establish a supplier quality (+X FTE) as well as a commodity purchasing department (+X FTE) contributing to increased personnel costs (incl. training and travel) assuming remuneration of $X thousand per FTE. Phasing is assumed for the hiring process, with the build-up of X FTE in [DATE] and X FTE in [DATE] . The assumption of a total number of X additional FTEs is based on [REGION] current headcount in the department.
- The slight decrease in [DATE] personnel costs is related to reduced training requirements. In [DATE], other personnel costs (e.g. travel) are expected to increase.
- In the theoretical case a [X] will not be signed (Management does not consider this a realistic scenario), Management assumes that material costs will increase significantly already in [DATE]. Furthermore, overall material costs increase at ~X% due to yearly increases in electronic components’ volumes.
- Please note that a risk of increasing material costs also exists in case of a [X] signing. Certain suppliers might reject common price negotiations with [X]. However, the a [PRODUCT 1] acceptance of a common price negotiation is the current assumption for the stand-alone material costs.
- [CLIENT NAME] assumes two scenarios for the estimation of stand-alone purchase costs: (i) including a 3 year [X[ with [X] covering DATE and (ii) without such a [X].
- In case of signing a [X], the current service charge of $X MM will be replaced by expected [X] charges of ~$X MM in DATE, which will increase by X% per year until the end of the [X] in DATE.
- Please note that stand-alone SAP costs presented in adjacent table do not include costs for S/4HANA transformation.
- Currently, [X] assembles sample printed circuit boards (PCBs) for [CLIENT NAME]. [X]’s respective services include purchasing, testing of raw PCBs as well as programming of all relevant process machines. Current service charges from [X] apply.
- An additional ~X FTE requirement is estimated for sample shop purchases and management of the electronic components (total annual personnel expenses of $X thousand).
- Additional incremental stand-alone costs (excl. personnel expenses) relate to external services, i.e. assembly of sample PCBs, purchasing and testing of raw PCBs and programming of process machines. These annual costs are indicatively estimated at ~X% above the current [X] fees. [CLIENT NAME] assumes that full transition to an external service provider will take up to one year.
- One-off costs relate to the set-up of a data-exchange (incl. LOG system) with the external service provider.

## Value creation potential

- Identified initiatives prepare [CLIENT NAME] for the increase in revenue and profitability as envisaged in the business plan
- As the initial benchmarking indicated, the focus of the cost optimization exercise within the business plan was on cost items below COGS
- To explain the efficiency gains within the different functions, total functional costs have been upscaled in line with revenue
- Impact due to portfolio shift and economies of scale through larger average project size and a higher price per unit has been estimated and incorporated
- In response to the growth and changing requirements, additional process optimization measures have been identified
- Source:	KPMG Research & Analysis
- Note: 	(a) Upscaling defined as keeping the cost structure exactly in line with revenue growth of 110%; (b) Not include corporate logistic costs (14% of total logistics costs and 4% of total logistics FTE); (c) Include 	corporate logistics costs.

# Appendices

## Appendix 1: Not present in source report

Not present in source report

## Appendix 2: Not present in source report

Not present in source report

## Appendix 3: Not present in source report

Not present in source report

## Appendix 4: Not present in source report

Not present in source report

Continue numbering for all appendix sections found in source.

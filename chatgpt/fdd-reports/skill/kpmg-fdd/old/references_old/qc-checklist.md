# Quality control checklist

Use this checklist before calling a report “final” or converting to DOCX for delivery.

## Critical “do not deliver if” checks

Do not deliver a “final” report if any of the following are true:

- ❌ No executive summary (or it is purely descriptive with no key findings and open items).
- ❌ QoE section present but **no reported-to-adjusted bridge** (or bridge does not sum correctly).
- ❌ Material quantitative claims have **no basis/source** and are not clearly flagged as open items.
- ❌ Units and periods are inconsistent across sections (e.g., $k vs $m; FY vs LTM without explanation).
- ❌ The report contains invented placeholders that are not labeled (e.g., “EBITDA was $X” without data).
- ❌ Red flags are minimized or missing when the draft itself identifies issues elsewhere.

If any of the above occur, fix them first or convert them into explicitly labeled open items.

## QC dimensions

### 1) Number consistency and tie-outs
Verify:
- Key metrics match everywhere they appear (revenue, EBITDA, adjusted EBITDA, net debt, working capital).
- Calculations are correct (totals, percentages, growth).
- Units are consistent (pick one: $m vs $mm; % vs bps).
- Time periods align (FY vs LTM vs quarterly).
- Bridges add up (reported + sum(adjustments) = adjusted).

Optional deterministic help:
- Run `python scripts/extract_numbers.py --in report.md` and scan for mismatches.

### 2) Evidence–narrative alignment
Verify:
- Claims in headings and opening sentences are supported by the exhibit or cited basis.
- If the exhibit is missing, the claim is reframed as a question or open item.
- Adjustment rationales reference the evidence reviewed (e.g., TB/GL extract, management schedule).

### 3) Language polish and professionalism
Scan for:
- Casual phrasing (“pretty good”, “a lot of”).
- Vague quantifiers without specifics (“meaningful”, “significant”) unless clearly qualitative.
- Inconsistent terminology (different definitions of EBITDA, working capital).

### 4) Structure and readability
Verify:
- Sections follow the canonical structure.
- No orphaned headers (a header followed by a single sentence and no content).
- Exhibits have titles, units, periods, and sources.
- Open items list is present and prioritized (P0, P1, P2).

## Standard QC issue log format

Use this format so issues are easy to action:

**ISSUE:** Short label  
**WHERE:** Section / exhibit reference  
**WHY IT MATTERS:** One sentence  
**RECOMMENDED FIX:** One sentence  
**STATUS:** Open / Fixed / Needs client input

Example:

**ISSUE:** Adjusted EBITDA bridge does not tie  
**WHERE:** QoE section, Exhibit 6  
**WHY IT MATTERS:** The decision-useful earnings figure is not defensible if the reconciliation is wrong.  
**RECOMMENDED FIX:** Recalculate the adjustment total and ensure reported + adjustments = adjusted; add basis lines per adjustment.  
**STATUS:** Open

# TS Engagement Assistant — Scope Library Issues and Default-Scope Assessment

**Document purpose**
This report audits the current reusable **FDD scope library** and related scope-selection taxonomy, and recommends a governance-ready disposition for each scope area:

1. **Core default scope** (remain default)
2. **Legitimate but uncommon** (optional / non-default)
3. **Deal-specific artifact** (exclude from reusable default library)
4. **Taxonomy duplicate/variant** (normalize/merge)

**Primary source text improved from:** `context/docs/issues.md`
**Authoritative sources audited:**

- `context/dist/scope-library.json` (scope content)
- `context/dist/scope-review-buckets.json` (bucket taxonomy, aliases, concepts)
- `context/dist/el-placeholder-schema.json` (placeholder contract)
- `context/dist/engagement_letter_generator.py` (generation and scope assembly behavior)
- `context/docs/mining/audit-mapping.md` (mining taxonomy mapping + promotion logic)
- `context/docs/mining/audit-verification-results.md` (prior verification findings)

---

## Implementation Progress Tracker (Updated: 2026-02-11)

### Status Note (Current)

- The full industry cleanup pass is now complete in the **docs-layer review surface**:
  - `docs/scope-library/section-applicability.json`
  - `docs/scope-library/industries/*.json`
  - `docs/scope-library/industries/*.md`
- Industry-specific `audit_work_paper` sections are now removed globally (common-only).
- Remaining work is **canonical merge into `dist/scope-library.json`** plus final regression validation.

### Phase A (completed) — Establish a clear source of truth

This phase removes ambiguity about which scope file is authoritative so every downstream check and export is consistent.

- [x] 1.0 Set `dist/scope-library.json` as canonical source
  - [x] 1.1 Treat `reference` scope copies as historical snapshots, not authoritative source
  - [x] 1.2 Update project hygiene guidance to reflect canonical-source policy
  - [x] 1.3 Re-export `docs/scope-library/industries/*` from `dist`
  - [x] 1.4 Re-run validation (`check-scope-spelling`, `validate-scope-exports`, JSON parse checks)

### Phase B (completed) — Fix obvious text-quality defects

This phase removes clear wording defects that reduce professionalism and trust but do not change scope structure.

- [x] 2.0 Correct high-confidence text defects in `dist/scope-library.json`
  - [x] 2.1 Remove repeated-token defects (for example, `the the`)
  - [x] 2.2 Fix malformed phrase duplication (`sell-side due diligence advisor sell-side advisor`)
  - [x] 2.3 Fix punctuation spacing defects (`customers,etc.`)
  - [x] 2.4 Update spelling QA gate to catch these defect patterns

### Phase C (completed) — Remove duplicate scope bullets

This phase trims duplicated asks so default scope is easier to read and less inflated.

- [x] 3.0 Deduplicate `manufacturing.working_capital` overlaps
  - [x] 3.1 Keep-set approved: retain `scope.249` + `scope.253`
  - [x] 3.2 Remove `scope.257` + `scope.258` and re-export affected docs
  - [x] 3.3 Re-run validation and confirm no unintended section loss

### Phase D (in progress) — Taxonomy normalization + optionality model

This phase addresses larger structural risk (key drift + default over-inclusion) and requires explicit governance choices.

- [x] 4.0 Normalize approved key families (`audit_work_*`, `inventory/inventories`, `related_part*`, `work_in_progress*`)
  - [x] 4.1 Canonicals approved: `audit_work_paper`, `inventory`, `related_parties`, `work_in_progress`
  - [x] 4.2 Update bucket mappings + aliases for approved families
  - [x] 4.3 Migrate section keys in `scope-library.json` and preserve underlying bullets per industry
- [x] 4.4 Apply section-level normalization and incremental-only rewrites across all industry modules in docs-layer (`section-applicability.json`)
  - [x] 4.4.1 Remove redundant industry bullets already covered by common skeleton
  - [x] 4.4.2 Remove industry-specific `audit_work_paper` across all industries
  - [x] 4.4.3 Remove optional/deal-specific artifacts from default industry modules (kept out of baseline)
  - [x] 4.4.4 Regenerate all industry exports for review (`docs/scope-library/industries/*`)
- [ ] 5.0 Merge docs-layer decisions into canonical dist library
  - [ ] 5.1 Port approved replacements/exclusions into `dist/scope-library.json`
  - [ ] 5.2 Regenerate docs exports from updated dist
  - [ ] 5.3 Run regression checks (JSON validity, spelling QA, export validation, sample generation)

### Canonicalization policy for underlying bullets (applied)

- Key normalization is handled as **rename-first**; existing industry-specific bullet text remains intact under the canonical key.
- If two variant keys ever coexist in one industry module, merge into the canonical key and deduplicate only exact/near-duplicate bullets.
- Distinct bullets are preserved (no content loss) unless explicitly approved for consolidation.

---

## Post-Output QA + Oracle Delta (Updated: 2026-02-11)

This section captures new findings from generated `.docx` review and Oracle feedback, with current repo-state verification.

### Executed now

- [x] **Q-004 (HVAC balance sheet integration):** Removed `hvac.balance_sheet.scope.163` from canonical dist and kept relevant balance-sheet analysis within section-aligned components (`working_capital`, `accounts_receivable`, `accounts_payable_and_accrued_liabilities`, `inventory`, `prepaids_and_other_current_assets`) rather than as a trailing standalone section.
- [x] **Q-005 (Manufacturing deal-specific artifact):** Rewrote `manufacturing.business_overview.scope.221` child text from deal-specific geography language to reusable language:
  - from: `Start-up costs, capital expenditures, and status of operations in Morocco;`
  - to: `Start-up costs, capital expenditures, and status of operations in significant sites/geographies.`

### Decision point (requested)

- [x] **Q-006 (Manufacturing redundancy cleanup):** Executed incremental-only trimming.
  - `working_capital`: kept only `scope.256`
  - `accounts_payable_and_accrued_liabilities`: kept only `scope.262`
  - `capital_expenditure_requirements`: kept only `scope.266` and `scope.267`
  - `commitments_and_contingencies`: kept only `scope.275`
  - Removed redundant bullets from those sections that duplicated common lead-ins or common coverage.

### Remaining active issues (next pass)

- [x] **Q-007 (Global ordering for industry-only sections):** Implemented resilient ordering with:
  - bucket-aware placement using `dist/scope-review-buckets.json` mapping, and
  - optional anchor rules (`section_ordering.anchor_rules`) with cycle-safe fallback to deterministic base order.
  - Ordering is best-effort and robust when sections are deleted/excluded.
- [x] **Q-008 (Runtime applicability enforcement):** Implemented runtime applicability application in `dist/engagement_letter_generator.py` with companion-file loading.
  - Runtime now loads and applies `section-applicability.json` before section assembly (best-effort).
  - Dist companion file added: `dist/section-applicability.json`.
  - Result: runtime `.docx` generation now matches docs-layer exclusions/replacements (validated with `banking` where generic `working_capital` is no longer injected).

### Oracle feedback reconciliation (verified against current repo)

- [x] `docs/scope-library/excluded-sections-review.md` now exists.
- [x] “Excluded via applicability but still present in dist” issue is currently **resolved** (`0` section keys currently excluded-by-applicability while still populated in canonical dist).
- [ ] Optional-pack governance remains an open enhancement: keep excluded from default dist, but maintain rewrite-ready optional modules in a separate artifact for controlled opt-in.

---

## Executive Summary

### Overall assessment

- The scope library is **structurally viable**: all section keys used by the library have bucket assignments, and the generator assembles scope as intended using **common skeleton + industry module + industry-only “extra sections”**. (Generator behavior: `context/dist/engagement_letter_generator.py:L1151-L1237`; placeholder contract: `context/dist/el-placeholder-schema.json:L21-L35`.)
- The largest maintainability and governance risks are:
  1. **Default scope over-inclusion** (high volume, many single-industry keys included by default).
  2. **Taxonomy drift** (near-duplicate section keys and variant naming families).
  3. **Deal-specific artifacts present as default scope language** (deliverable tooling, sell-side phrasing, fee notes, phased/addendum language, jurisdiction-specific GAAP).
  4. **Text quality + structure defects** (typos, incomplete “parent bullet” structure, inconsistent punctuation causing duplicates).

### Top priority remediation (in order)

1. **Normalize section-key families** (reduce drift and simplify UI/QA) — especially `audit_work_*`, `inventory/inventories`, `related_part*`, `supporting_analysis_*`, `work_in_progress*`, and the “other assets / prepaids” cluster. See “Taxonomy Normalization Plan” below. (Bucket keys show these variants exist today: `context/dist/scope-review-buckets.json:L34-L90`.)
2. **Create an explicit Optional (non-default) tier** and move clearly optional/phase-specific/transaction-documentation support out of default scope. Today, everything is included unless explicitly excluded. (See assembly logic: `context/dist/engagement_letter_generator.py:L1151-L1237`.)
3. **Purge or relocate deal-specific artifacts** from reusable library:
   - Fee note (“Fees for this optional procedure…”) should not ship as reusable scope text. (`context/dist/scope-library.json:L3116-L3125`.)
   - Tool-specific deliverables (Power BI / PowerPoint / data cube) are not universally appropriate as default scope. (`context/dist/scope-library.json:L1918-L1952`, `context/dist/scope-library.json:L3564-L3571`.)
   - Jurisdiction-specific “Spanish GAAP” should not be embedded in a reusable library key. (`context/dist/scope-library.json:L4093-L4111`.)

4. Add automated checks (CI or pre-merge) for **duplicate bullets**, **typos**, **sell-side phrasing**, and **tool/vendor references**.

---

## Scope assembly behavior and why it matters

### Current behavior (facts)

- Scope selection is driven by **industry**. The placeholder schema explicitly states industry “controls which FDD scope section is inserted from `scope-library.json`.” (`context/dist/el-placeholder-schema.json:L21-L35`.)
- The generator:
  - Builds `nodes_default` from the **common skeleton**
  - Builds `nodes_industry` from the industry module
  - Builds `extra_sections` for module sections not present in the common skeleton
  - Emits everything unless excluded (section keys via `excluded_section_keys`, or bullet IDs via `excluded_top_level_ids`). (`context/dist/engagement_letter_generator.py:L1151-L1237`.)

- There is currently **no native concept of “optional (non-default)”** in generation logic; “optional” can only be expressed by pre-populating exclusions. (`context/dist/engagement_letter_generator.py:L1087-L1094`, `context/dist/engagement_letter_generator.py:L1151-L1237`.)

### Implication

Any deal-specific phrasing, deliverable/tooling language, phased/addendum language, or jurisdiction-specific terms embedded in the library can appear as **default scope**, unless the user proactively excludes it. That creates **scope creep**, **misalignment between buy-side and sell-side templates**, and **review burden**.

---

## Quantitative snapshot (computed from `context/dist/scope-library.json`)

> These metrics are computed by parsing `scope-library.json` and counting top-level bullets across common skeleton + industry modules.

- **Industries with modules:** 17 (e.g., construction, healthcare, hvac, manufacturing, tech, banking, insurance, etc.).
- **Common skeleton sections:** 11 (included for all industries). (`context/dist/scope-library.json:L2-L353`.)
- **Distinct section keys across library:** 60.
- **Section keys used in exactly one industry module:** 42 (high “rare-key” density).
- **Top-level bullet volume by industry (common + module):**
  - HVAC: **117** (outlier)
  - Manufacturing: **95** (outlier)
  - Median across industries: **36**

---

## Findings and recommendations

### I‑001 — Taxonomy drift: duplicate/variant section keys

**Severity: High (governance + QA + UI mapping risk)**

#### What we found

Several section concepts exist under multiple section keys, increasing risk of:

- inconsistent bucket assignment,
- inconsistent alias coverage,
- duplicative scope output, and
- harder exclusion logic.

Examples of key drift currently present in the bucket taxonomy:

- `audit_work_paper`, `audit_work_papers`, `audit_working_papers` (`context/dist/scope-review-buckets.json:L38-L41`)
- `inventory`, `inventories` (`context/dist/scope-review-buckets.json:L52-L53`)
- `related_parties`, `related_party_transactions` (`context/dist/scope-review-buckets.json:L78-L80`)
- `supporting_analysis_for_quality_of_earnings`, `supporting_analysis_to_quality_of_earnings` (`context/dist/scope-review-buckets.json:L83-L85`)
- `work_in_progress`, `work_in_progress_and_backlog` (`context/dist/scope-review-buckets.json:L88-L90`)
- A broader “other assets / prepaids / other current assets” cluster (`context/dist/scope-review-buckets.json:L63-L75`)

#### Recommendation

Adopt a **canonical key** per family and treat the others as **aliases** (or migrate them fully).
This should be reflected in:

- `scope-library.json` (canonical keys only),
- `scope-review-buckets.json` (`section_to_bucket`, `section_aliases`, and `concept_to_sections`),
- any UI logic consuming the taxonomy.

---

### I‑002 — Rare key proliferation inflates default scope and complicates governance

**Severity: High (default scope creep + maintainability)**

#### What we found

A majority of section keys (42/60) appear in only one industry module. This increases:

- review overhead for each new key,
- duplication risk (since new keys often overlap existing common sections), and
- inconsistent phrasing or scope semantics.

The generator currently includes all industry sections by default, including “extra sections” not in the common skeleton. (`context/dist/engagement_letter_generator.py:L1151-L1237`.)

#### Recommendation

Introduce a **tiering model**:

- **Core (default)**: common skeleton + selected industry-true essentials
- **Optional (non-default)**: specialized procedures, transaction-documentation support, post-bid support, data/analytics deliverables, VDD review, etc.
- **Excluded (not reusable)**: fee notes, jurisdiction-specific GAAP language, and other deal artifacts.

Implementation-wise, the existing `excluded_section_keys` mechanism can support optional-by-default by populating it automatically, but this requires a governance decision on default exclusions. (`context/dist/engagement_letter_generator.py:L1087-L1094`, `context/dist/engagement_letter_generator.py:L1151-L1237`.)

---

### I‑003 — Deal-specific artifacts in the reusable library

**Severity: High (incorrect scope semantics + legal/commercial risk)**

#### What we found

Several bullets encode engagement-specific artifacts rather than reusable scope language:

1. **Fee note embedded as scope bullet**

- “Fees for this optional procedure…” (`scope.317`) is not reusable scope content. (`context/dist/scope-library.json:L3116-L3125`.)

2. **Tool/deliverable language embedded in default scope**

- PowerPoint / Power BI / Excel data cube and buyer-facing language appear in HVAC’s analytics sections. (`context/dist/scope-library.json:L1918-L1952`.)
- Similar PowerBI/PowerPoint references occur in other sections. (`context/dist/scope-library.json:L3564-L3571`.)

3. **Phase-specific / addendum language embedded in reusable bullets**

- “Perform Phase 2 top up due diligence…” is embedded inside default sections. (`context/dist/scope-library.json:L3814-L3817`, `context/dist/scope-library.json:L3875-L3878`.)
- “Scope extension would be covered by an addendum…” appears in the GAAP considerations section. (`context/dist/scope-library.json:L4093-L4111`.)

4. **Jurisdiction-specific GAAP embedded in reusable library**

- “Spanish GAAP and US GAAP” is not generic and is inherently deal/jurisdiction-specific. (`context/dist/scope-library.json:L4093-L4111`.)

#### Recommendation

- **Exclude** fee and pricing statements from the library entirely.
- Rework deliverable/tooling references into:
  - either a separate **Optional “deliverables package”** concept, or
  - neutral scope language that avoids specific tools and buyer-sharing claims.

- Move Phase 2 / post-bid / addendum language to optional modules (non-default), or require explicit user selection.

---

### I‑004 — Redundancy: duplicated bullets within sections and across industries

**Severity: Medium (clarity + unnecessary scope expansion)**

#### What we found

- **Within-section duplicates** in `manufacturing.working_capital`:
  - `scope.249` and `scope.258` are functionally duplicates (“Summarize and normalize historical working capital…”) with punctuation variance. (`context/dist/scope-library.json:L2489-L2540`.)
  - `scope.253` and `scope.257` duplicate “Large or unusual non-recurring items…” with punctuation variance. (`context/dist/scope-library.json:L2502-L2525`.)

- **Common vs industry overlap duplication**:
  - `common_skeleton.operating_expenses` (`scope.009`) is duplicated in `healthcare.operating_expenses` (`scope.089`). (`context/dist/scope-library.json:L184-L215`, `context/dist/scope-library.json:L1040-L1048`.)

#### Recommendation

- Deduplicate at source and standardize punctuation normalization.
- Where a module bullet duplicates a common bullet exactly, remove the module copy unless it adds true industry specificity.

---

### I‑006 — Text quality and structural consistency issues

**Severity: Medium (professionalism + ambiguity)**

#### What we found (examples)

- Typos:
  - “Obtain and read **the the** …” (`scope.245`). (`context/dist/scope-library.json:L2473-L2477`.)
  - “... achieving **the the** …” (`scope.248`). (`context/dist/scope-library.json:L2483-L2487`.)
  - “... customers,**etc.**” (`scope.208`). (`context/dist/scope-library.json:L2000-L2012`.)
  - “Target’s **the**” (e.g., `scope.315`, `scope.388`). (`context/dist/scope-library.json:L3084-L3105`, `context/dist/scope-library.json:L3672-L3679`.)

- Broken phrasing:
  - “sell-side due diligence advisor sell-side advisor” (`scope.225`). (`context/dist/scope-library.json:L2176-L2180`.)

- Parent/child structure inconsistencies (colon implies children, but the list is flattened without children in some sections), making downstream formatting inconsistent.

#### Recommendation

Add a QA pass that checks:

- spelling/grammar,
- repeated tokens,
- “sell-side” phrasing (if the library must be template-neutral),
- tool/vendor terms, and
- colon-ended parent bullets without children (where applicable).

---

### I‑005 — Alias coverage gaps reduce robustness of scope selection (deprioritized)

**Severity: Low for current phase (usability hardening; not core scope-content cleanup)**

#### What we found

- `scope-review-buckets.json` provides `section_to_bucket` for all current keys (good), but `section_aliases` only covers a subset of concepts (for example, canonicalized scope keys can still be missing plain-language alias coverage). (`context/dist/scope-review-buckets.json:L13-L101`, `context/dist/scope-review-buckets.json:L103-L147`.)

#### Recommendation

Defer broad alias expansion until after scope-content cleanup (taxonomy + artifacts + optionality). Then expand `section_aliases` to include:

- all canonical keys post-normalization,
- all deprecated variant keys as aliases to canonicals, and
- high-frequency user language that maps to uncommon keys (for example, “VDD report review”, “locked box”, “audit working papers”, “post-bid support”).

---

## Taxonomy normalization plan (recommended canonicals)

The following families should be normalized. Canonical naming is proposed for consistency; exact naming can be adjusted, but the **merge targets should be explicit**.

1. **Audit workpapers**
   Canonical: `audit_working_papers`
   Variants to merge: `audit_work_paper`, `audit_work_papers`
   Evidence: `context/dist/scope-review-buckets.json:L38-L41`

2. **Inventory**
   Canonical: `inventory`
   Variants to merge: `inventories`
   Evidence: `context/dist/scope-review-buckets.json:L52-L53`

3. **Related parties**
   Canonical: `related_party_transactions` (or `related_parties`; choose one and alias the other)
   Variants to merge: the other key
   Evidence: `context/dist/scope-review-buckets.json:L78-L80`

4. **Supporting analysis for QoE**
   Canonical: `supporting_analysis_to_quality_of_earnings`
   Variants to merge: `supporting_analysis_for_quality_of_earnings`
   Evidence: `context/dist/scope-review-buckets.json:L83-L85`

5. **WIP / backlog**
   Canonical: `work_in_progress`
   Variants to merge: `work_in_progress_and_backlog`
   Evidence: `context/dist/scope-review-buckets.json:L88-L90`

6. **Prepaids / other assets cluster**
   Recommended action: collapse into one canonical section (e.g., `other_current_assets`) and ensure bucket placement is consistent.
   Evidence: `context/dist/scope-review-buckets.json:L63-L75`

---

## Default-scope disposition summary

This section classifies each scope area into one of the four disposition categories. The full audit log (with evidence) follows outside this document.

### Core default (keep as default)

- All common skeleton sections (11 keys) should remain default, subject to text QA. (`context/dist/scope-library.json:L2-L353`.)
- Banking and insurance-specific sections appear appropriately industry-bound and should remain default for those industries. (`context/dist/scope-library.json:L4618-L4667`, `context/dist/scope-library.json:L4689-L4722`.)

### Legitimate but uncommon (make optional / non-default)

- Post-bid/Phase 2 support, locked box mechanisms, VDD report review, transaction documentation review support, waterfall/cash-proof procedures, advanced operational analytics, etc.

### Deal-specific artifacts (exclude from reusable library)

- Fee notes, jurisdiction-specific GAAP references, and any language asserting buyer-sharing/tooling deliverables as default scope.

### Taxonomy duplicates/variants (merge/normalize)

- Key families listed in “Taxonomy normalization plan.”

---

## Appendix — Sources and promotion guidance from mining

- The mining audit defined a promotion heuristic: sections with high cross-industry frequency (≥ 8/11 in the analyzed set) are candidates for common skeleton; others should remain industry modules. (`context/docs/mining/audit-mapping.md:L209-L217`.)
- Prior verification emphasized removing non-reusable specifics and standardizing phrasing. (`context/docs/mining/audit-verification-results.md:L55-L112`.)

---

## 4) Detailed Audit Log (required)

> **Legend (Recommended State):**
> **Keep Default** = core default scope
> **Optional** = legitimate but uncommon; should be non-default
> **Exclude** = deal-specific artifact; remove from reusable default library
> **Merge/Normalize** = taxonomy duplicate/variant; consolidate into a canonical key
> **Needs Clarification** = intent not evidenced sufficiently

| Type           | Industry                                                                                               | Section Key / Item ID                                                                        | Current State                                                                                        | Recommended State                    | Rationale                                                                                                                          | Evidence                                                                                                                                                                                                                                      | Impact if unchanged                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Disposition    | Common (all)                                                                                           | `business_overview`                                                                          | Included by default via common skeleton                                                              | Keep Default                         | Foundational cross-industry FDD scope area                                                                                         | `context/dist/scope-library.json:L2-L26`; generator includes common skeleton by default: `context/dist/engagement_letter_generator.py:L1151-L1203`                                                                                                            | Losing baseline scope consistency if removed                                          |
| Disposition    | Common (all)                                                                                           | `accounting_overview`                                                                        | Included by default via common skeleton                                                              | Keep Default                         | Cross-industry accounting policies + reporting environment                                                                         | `context/dist/scope-library.json:L27-L75`                                                                                                                                                                                                     | Missing baseline accounting policy diligence                                          |
| Disposition    | Common (all)                                                                                           | `quality_of_earnings`                                                                        | Included by default via common skeleton                                                              | Keep Default                         | Core QoE normalization framework is part of baseline                                                                               | `context/dist/scope-library.json:L76-L111`                                                                                                                                                                                                    | QoE output becomes inconsistent across engagements                                    |
| Disposition    | Common (all)                                                                                           | `revenue_analysis`                                                                           | Included by default via common skeleton                                                              | Keep Default                         | Core revenue understanding; industry modules add specificity                                                                       | `context/dist/scope-library.json:L112-L183`                                                                                                                                                                                                   | Incomplete revenue diligence if removed                                               |
| Disposition    | Common (all)                                                                                           | `operating_expenses`                                                                         | Included by default via common skeleton                                                              | Keep Default                         | Core expense analysis baseline                                                                                                     | `context/dist/scope-library.json:L184-L215`                                                                                                                                                                                                   | Missing baseline opex diligence                                                       |
| Disposition    | Common (all)                                                                                           | `working_capital`                                                                            | Included by default via common skeleton                                                              | Keep Default                         | Core NWC/peg diligence; however dedupe required for manufacturing                                                                  | `context/dist/scope-library.json:L216-L245`; manufacturing duplicates: `context/dist/scope-library.json:L2489-L2540`                                                                                                                          | Duplicative/overlong scopes; confusing selection                                      |
| Disposition    | Common (all)                                                                                           | `accounts_receivable`                                                                        | Included by default via common skeleton                                                              | Keep Default                         | AR analysis baseline                                                                                                               | `context/dist/scope-library.json:L246-L269`                                                                                                                                                                                                   | Missing AR diligence for most deals                                                   |
| Disposition    | Common (all)                                                                                           | `accounts_payable_and_accrued_liabilities`                                                   | Included by default via common skeleton                                                              | Keep Default                         | AP/accruals baseline                                                                                                               | `context/dist/scope-library.json:L270-L293`                                                                                                                                                                                                   | Missing AP diligence                                                                  |
| Disposition    | Common (all)                                                                                           | `capital_expenditure_requirements`                                                           | Included by default via common skeleton                                                              | Keep Default                         | Capex baseline                                                                                                                     | `context/dist/scope-library.json:L294-L311`                                                                                                                                                                                                   | Capex diligence omitted                                                               |
| Disposition    | Common (all)                                                                                           | `commitments_and_contingencies`                                                              | Included by default via common skeleton                                                              | Keep Default                         | Commitments/contingencies baseline                                                                                                 | `context/dist/scope-library.json:L312-L339`                                                                                                                                                                                                   | Missing legal/obligation diligence baseline                                           |
| Disposition    | Common (all)                                                                                           | `net_debt`                                                                                   | Included by default via common skeleton                                                              | Keep Default                         | Net debt baseline                                                                                                                  | `context/dist/scope-library.json:L340-L353`                                                                                                                                                                                                   | Missing debt-like items diligence baseline                                            |
| Taxonomy       | Multi (real_estate, service, supermarket, healthcare)                                                  | `audit_work_paper` / `audit_work_papers` / `audit_working_papers`                            | Three variant keys exist; bucketed separately but same concept                                       | Merge/Normalize                      | Same concept expressed under different keys, creating drift and inconsistent selection behavior                                    | Bucket mapping shows variants: `context/dist/scope-review-buckets.json:L38-L41`; example bullets: `context/dist/scope-library.json:L1348-L1357`, `context/dist/scope-library.json:L3280-L3288`, `context/dist/scope-library.json:L3423-L3426` | Confusing UI; inconsistent defaults; duplicated or missing audit workpaper procedures |
| Taxonomy       | Multi (construction, hvac, manufacturing, transportation)                                              | `related_parties` / `related_party_transactions`                                             | Two keys for same concept                                                                            | Merge/Normalize                      | Duplicate taxonomy; also concept already referenced in common skeleton text                                                        | Bucket mapping: `context/dist/scope-review-buckets.json:L78-L80`; common skeleton references related parties: `context/dist/scope-library.json:L27-L47`                                                                                       | Drift causes missed/duplicated related-party diligence and harder exclusion logic     |
| Taxonomy       | Multi (supermarket, tech, eyecare)                                                                     | `supporting_analysis_for_quality_of_earnings` / `supporting_analysis_to_quality_of_earnings` | Two keys; content inconsistent and includes deliverable/tooling in some cases                        | Merge/Normalize                      | Variant naming + heterogeneous content; should unify and set clear intent                                                          | Bucket mapping: `context/dist/scope-review-buckets.json:L83-L85`; tool language example: `context/dist/scope-library.json:L3564-L3571`                                                                                                        | Harder governance; inconsistent expectations; default scope creep                     |
| Taxonomy       | Multi (7+ industries)                                                                                  | `inventory` / `inventories`                                                                  | Both keys exist; concept is shared                                                                   | Merge/Normalize                      | Prefer single canonical key (`inventory`) and alias plural variant                                                                 | Bucket mapping: `context/dist/scope-review-buckets.json:L52-L53`; example `inventories` content: `context/dist/scope-library.json:L730-L744`                                                                                                  | Duplicate concepts, alias gaps, and inconsistent exclusions                           |
| Taxonomy       | Multi (building, prof_services)                                                                        | `work_in_progress` / `work_in_progress_and_backlog`                                          | Two keys; bucketed differently                                                                       | Merge/Normalize                      | Variant keys for WIP; inconsistent bucket placement suggests drift                                                                 | Bucket mapping shows mismatch: `context/dist/scope-review-buckets.json:L88-L90`                                                                                                                                                               | Confusing scope review grouping; inconsistent defaults                                |
| Taxonomy       | Multi (construction, hvac, manufacturing, service, eyecare, healthcare, transportation, prof_services) | Prepaids / other assets cluster: `prepaids*`, `prepaid_*`, `other_*`                         | Many one-off keys exist for overlapping “other current assets / other assets & liabilities” concepts | Merge/Normalize                      | High drift, thin bullets, and overlapping meaning; should collapse into fewer canonical sections (or merge into `working_capital`) | Bucket mapping cluster: `context/dist/scope-review-buckets.json:L63-L75`; example thin bullets: `context/dist/scope-library.json:L1170-L1173`, `context/dist/scope-library.json:L3048-L3052`                                                  | Key explosion worsens governance; scope becomes inconsistent and hard to curate       |
| Artifact       | Construction                                                                                           | `financial_due_diligence` (`scope.017`, `scope.018`)                                         | Deliverable/time-period wording embedded as scope bullets                                            | Exclude                              | Not an industry-scope procedure; reads like engagement-specific deliverable framing                                                | `context/dist/scope-library.json:L355-L366`                                                                                                                                                                                                   | Default scope text may conflict with actual SOW terms; requires heavy editing         |
| Disposition    | Banking                                                                                                | `loan_portfolio_and_credit_quality`                                                          | Banking-only section; industry-appropriate                                                           | Keep Default                         | Clearly banking-specific diligence area                                                                                            | `context/dist/scope-library.json:L4618-L4635`                                                                                                                                                                                                 | Banking scopes become incomplete                                                      |
| Disposition    | Banking                                                                                                | `allowance_for_credit_losses`                                                                | Banking-only; paired to credit quality                                                               | Keep Default                         | Industry-bound and coherent                                                                                                        | `context/dist/scope-library.json:L4635-L4649`                                                                                                                                                                                                 | Missed ACL analysis                                                                   |
| Disposition    | Banking                                                                                                | `regulatory_capital_and_liquidity`                                                           | Banking-only                                                                                         | Keep Default                         | Industry-bound regulatory diligence                                                                                                | `context/dist/scope-library.json:L4650-L4667`                                                                                                                                                                                                 | Missed regulatory capital/liquidity diligence                                         |
| Disposition    | Insurance                                                                                              | `underwriting_and_loss_reserves`                                                             | Insurance-only                                                                                       | Keep Default                         | Industry-bound                                                                                                                     | `context/dist/scope-library.json:L4689-L4707`                                                                                                                                                                                                 | Missed underwriting/loss reserve diligence                                            |
| Disposition    | Insurance                                                                                              | `claims_and_reinsurance`                                                                     | Insurance-only                                                                                       | Keep Default                         | Industry-bound                                                                                                                     | `context/dist/scope-library.json:L4708-L4722`                                                                                                                                                                                                 | Missed claims/reinsurance diligence                                                   |
| Disposition    | Real estate                                                                                            | `operating_cash_flow_funds_from_operations`                                                  | Real-estate-only; core cash-flow focus                                                               | Keep Default                         | Real-estate-relevant cash flow diligence                                                                                           | `context/dist/scope-library.json:L3269-L3278`                                                                                                                                                                                                 | Cash-flow diligence gap for real estate                                               |
| Taxonomy       | HVAC + Real estate                                                                                     | `balance_sheet`                                                                              | Standalone section overlaps common keys (WC/AR/AP/Capex/Debt)                                        | Merge/Normalize                      | Content should be redistributed to existing common sections to reduce redundancy                                                   | Example overlap bullets: `context/dist/scope-library.json:L1720-L1735`, `context/dist/scope-library.json:L336-L353`                                                                                                                           | Duplicate scope sections and confusing scope review toggles                           |
| Disposition    | HVAC                                                                                                   | `data_and_analytics`                                                                         | Included by default; contains tooling + buyer-sharing language                                       | Optional                             | Clearly a specialized deliverables package, not baseline FDD                                                                       | Tooling/buyer language: `context/dist/scope-library.json:L1918-L1952`                                                                                                                                                                         | Over-scoped default; introduces deliverable commitments                               |
| Disposition    | HVAC                                                                                                   | `revenue_and_profitability_analysis_da`                                                      | Included by default; specialized analytics                                                           | Optional                             | Specialized, tooling-driven analysis; not universally required                                                                     | `context/dist/scope-library.json:L1924-L1938`                                                                                                                                                                                                 | Default scope inflation                                                               |
| Disposition    | HVAC                                                                                                   | `customer_base_health_da`                                                                    | Included by default; specialized analytics                                                           | Optional                             | Specialized module                                                                                                                 | `context/dist/scope-library.json:L1954-L1966`                                                                                                                                                                                                 | Default scope inflation                                                               |
| Disposition    | HVAC                                                                                                   | `marketing_and_advertising_performance_da`                                                   | Included by default; specialized analytics                                                           | Optional                             | Specialized module                                                                                                                 | `context/dist/scope-library.json:L1972-L1986`                                                                                                                                                                                                 | Default scope inflation                                                               |
| Disposition    | HVAC                                                                                                   | `operations_performance_da`                                                                  | Included by default; specialized analytics                                                           | Optional                             | Specialized module                                                                                                                 | `context/dist/scope-library.json:L1990-L2006`                                                                                                                                                                                                 | Default scope inflation                                                               |
| Disposition    | HVAC                                                                                                   | `optional_fdd_procedures`                                                                    | Included by default; explicitly optional by name                                                     | Optional                             | Should be opt-in; otherwise “optional” content ships by default                                                                    | `context/dist/scope-library.json:L2036-L2059`                                                                                                                                                                                                 | “Optional” procedures become default commitment                                       |
| Disposition    | HVAC                                                                                                   | `phase_2_post_bid_support`                                                                   | Included by default; post-bid participation                                                          | Optional                             | Post-bid support is engagement-dependent                                                                                           | `context/dist/scope-library.json:L2020-L2033`                                                                                                                                                                                                 | Scope creep; misaligned expectations                                                  |
| Disposition    | Manufacturing                                                                                          | `vdd_report_review`                                                                          | Included by default; sell-side advisor phrasing                                                      | Optional                             | VDD review is deal-specific and should be opt-in                                                                                   | `context/dist/scope-library.json:L2274-L2283`                                                                                                                                                                                                 | Default scope includes sell-side reliance; misfit for buy-side work                   |
| Disposition    | Manufacturing                                                                                          | `forecast_and_budget_analysis`                                                               | Included by default; contains typo                                                                   | Optional                             | Forecast/budget review is valid but not universal; also needs text QA                                                              | “the the” typo: `context/dist/scope-library.json:L2473-L2481`                                                                                                                                                                                 | Professionalism risk; inflated baseline                                               |
| Disposition    | Manufacturing                                                                                          | `budget_vs_actual`                                                                           | Included by default; contains “the the”                                                              | Optional                             | Similar to above; also needs text QA                                                                                               | `context/dist/scope-library.json:L2483-L2487`                                                                                                                                                                                                 | Professionalism risk; inflated baseline                                               |
| Disposition    | Manufacturing                                                                                          | `operational_cost_margin_assessment`                                                         | Included by default; deep operational benchmarking                                                   | Optional                             | Specialized operational diligence; not core baseline                                                                               | `context/dist/scope-library.json:L2808-L2847`                                                                                                                                                                                                 | Overscoped default; more time/cost implied                                            |
| Disposition    | Manufacturing                                                                                          | `normalized_ebitda_bridges`                                                                  | Included by default                                                                                  | Keep Default                         | Coherent EBITDA bridge analysis; text grammar cleanup needed but scope intent is clear                                             | `context/dist/scope-library.json:L2453-L2470`                                                                                                                                                                                                 | Minor text risk if unchanged                                                          |
| Disposition    | Manufacturing                                                                                          | `aspe_to_ifrs_us_gaap_assessment`                                                            | Included by default                                                                                  | Optional                             | Highly context-dependent accounting framework conversion analysis                                                                  | `context/dist/scope-library.json:L2790-L2794`                                                                                                                                                                                                 | Adds scope not applicable to many deals                                               |
| Disposition    | Tech                                                                                                   | `arr_drivers`                                                                                | Included by default                                                                                  | Optional                             | ARR/KPI focus is business-model-specific; text assumes client-provided analysis                                                    | `context/dist/scope-library.json:L3793-L3817`                                                                                                                                                                                                 | Misfit for non-ARR tech deals; default inflation                                      |
| Disposition    | Tech                                                                                                   | `locked_box`                                                                                 | Included by default                                                                                  | Optional                             | Locked-box is a deal mechanic; not always in scope                                                                                 | `context/dist/scope-library.json:L4056-L4067`                                                                                                                                                                                                 | Scope includes deal-mechanic language unnecessarily                                   |
| Artifact       | Tech                                                                                                   | `phase_1_gaap_considerations` (`scope.438`)                                                  | Included by default; jurisdiction-specific “Spanish GAAP” + addendum language                        | Exclude                              | Not reusable as-is; jurisdiction and phased addendum language should not be default                                                | `context/dist/scope-library.json:L4093-L4111`                                                                                                                                                                                                 | Incorrect default scope and potential legal/commercial mismatch                       |
| Disposition    | Healthcare                                                                                             | `store_portfolio_analysis`                                                                   | Included by default; very specific multi-site analysis                                               | Optional                             | Applicable only to certain target profiles                                                                                         | `context/dist/scope-library.json:L912-L929`                                                                                                                                                                                                   | Overscoped default for healthcare                                                     |
| Disposition    | Healthcare                                                                                             | `waterfall_revenue_analysis`                                                                 | Included by default; specialized procedure                                                           | Optional                             | Legitimate but uncommon                                                                                                            | `context/dist/scope-library.json:L1290-L1305`                                                                                                                                                                                                 | Overscoped default                                                                    |
| Disposition    | Healthcare                                                                                             | `purchase_and_sale_agreement`                                                                | Included by default; transaction doc review                                                          | Optional                             | Transaction documentation review is not universal FDD scope                                                                        | `context/dist/scope-library.json:L1280-L1287`                                                                                                                                                                                                 | Scope creep / legal-adjacent content in default scope                                 |
| Disposition    | Multi (healthcare, prof_services, supermarket)                                                         | `assistance_with_transaction_documentation`                                                  | Included by default; includes a fee note in one industry                                             | Optional                             | Transaction-doc support is deal-dependent; fee note must be excluded                                                               | Fee note: `context/dist/scope-library.json:L3116-L3125`                                                                                                                                                                                       | Default scope includes pricing language + non-core work                               |
| Disposition    | Eyecare                                                                                                | `quality_of_revenue_and_receivables_and_cash_proof`                                          | Included by default                                                                                  | Optional                             | Specialized “cash proof” procedure; candidate for naming normalization                                                             | `context/dist/scope-library.json:L678-L699`                                                                                                                                                                                                   | Overlong default scope; confusing taxonomy                                            |
| Redundancy     | Manufacturing                                                                                          | `working_capital` duplicates (`scope.249`, `scope.258`, `scope.253`, `scope.257`)            | Duplicate bullets exist in same section                                                              | Merge/Normalize                      | Same procedure stated twice; punctuation differences only                                                                          | `context/dist/scope-library.json:L2489-L2540`                                                                                                                                                                                                 | Inflated scope and confusing review/editing                                           |
| Alias Coverage | All                                                                                                    | Missing alias targets (38 keys not covered)                                                  | Many keys have no alias mapping                                                                      | Merge/Normalize (and extend aliases) | Without aliases, user intent mapping will be brittle and post-normalization will remain fragile                                    | `context/dist/scope-review-buckets.json:L103-L147`                                                                                                                                                                                            | Incorrect scope selection, poor UX, higher support burden                             |
| Text Quality   | Multi                                                                                                  | Typos (“the the”, “Target’s the”, “customers,etc.”, repeated phrase)                         | Professional defects present                                                                         | Merge/Normalize (QA)                 | These should be caught in validation gate                                                                                          | Examples: `context/dist/scope-library.json:L2473-L2487`, `context/dist/scope-library.json:L2000-L2012`, `context/dist/scope-library.json:L2176-L2180`                                                                                         | Reduced trust; more manual cleanup per engagement                                     |
| Artifact       | Multi                                                                                                  | Sell-side phrasing appears in default scope bullets                                          | Default text assumes sell-side advisors/reports                                                      | Optional (or rewrite to neutral)     | Scope library is selected by industry only; no template-type gating is present in scope assembly                                   | Example sell-side bullets: `context/dist/scope-library.json:L884-L901`, `context/dist/scope-library.json:L1432-L1442`, `context/dist/engagement_letter_generator.py:L894-L914`                                                                                | Wrong assumptions in buy-side templates; legal/commercial confusion                   |

---

## 5) Difference Documentation (required)

| Section changed            | What changed                                                                                                  | Why changed                                                           | Risk/benefit                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Document framing           | Added explicit purpose, sources, and disposition categories (Core/Optional/Exclude/Merge)                     | User requested deep audit + classification for each scope area/item   | **Benefit:** makes decisions actionable; **Risk:** introduces recommendations where prior doc was “issues only”                            |
| Scope assembly explanation | Added “how generation works” section with citations                                                           | Many findings depend on default inclusion behavior in generator       | **Benefit:** aligns technical + governance stakeholders; **Risk:** none                                                                    |
| Quantitative snapshot      | Reframed as computed metrics and clarified what “top-level bullets” means                                     | Improves interpretability and auditability                            | **Benefit:** reduces ambiguity; **Risk:** minimal                                                                                          |
| Taxonomy drift             | Expanded and formalized into a normalization plan (canonicals + variants)                                     | Required to address “section-key drift and variants” explicitly       | **Benefit:** clear path to reduce drift; **Risk:** canonical naming requires stakeholder sign-off                                          |
| Deal-specific artifacts    | Elevated severity and expanded examples (fees, tool deliverables, jurisdiction GAAP, phase/addendum language) | These create the highest real-world scope/legal/commercial risk       | **Benefit:** prevents scope creep and mis-scoped templates; **Risk:** may remove content some teams relied on (mitigated by Optional tier) |
| Sell-side language         | Broadened beyond original examples to include additional occurrences                                          | Repo evidence shows sell-side phrasing appears in multiple industries | **Benefit:** more complete remediation; **Risk:** requires deciding on template neutrality policy                                          |
| Appendices                 | Added a disposition summary and explicit mapping to audit-mapping promotion logic                             | Improves governance; aligns to documented mining heuristics           | **Benefit:** defensible, testable rules; **Risk:** none                                                                                    |
| Tone/editorial             | Standardized severity language and rewrote for executive readability                                          | Requested “executive-ready” documentation                             | **Benefit:** clearer decisions and implications; **Risk:** none                                                                            |

---

## 6) Recommended Next Steps

1. **Adopt and document a canonical taxonomy**
   - Decide canonical keys for each variant family (audit workpapers, inventory, related parties, supporting analysis, WIP, prepaids/other assets).
   - Update `context/dist/scope-review-buckets.json` (`section_to_bucket`, `concept_to_sections`) to match canonicals first. (`context/dist/scope-review-buckets.json:L13-L147`.)

2. **Refactor `scope-library.json` to remove drift and artifacts**
   - Merge/rename section keys per canonicals; migrate bullet lists; delete deprecated keys.
   - Remove the fee note bullet `scope.317` entirely. (`context/dist/scope-library.json:L3116-L3125`.)
   - Remove or rewrite jurisdiction/phase/addendum language to either (a) optional modules or (b) neutral phrasing. (`context/dist/scope-library.json:L3814-L3817`, `context/dist/scope-library.json:L4093-L4111`.)

3. **Implement Optional (non-default) behavior in generation/UI**
   - Short-term: populate `excluded_section_keys` defaults based on an “optional-by-default” list until proper metadata exists. (`context/dist/engagement_letter_generator.py:L1087-L1094`, `context/dist/engagement_letter_generator.py:L1151-L1237`.)
   - Medium-term: add metadata to scope sections indicating default state (Core vs Optional) and have generator respect it.

4. **Add automated validation gates** (pre-commit or CI)
   - Detect duplicate normalized bullets within a section (e.g., manufacturing WC).
   - Detect prohibited terms (fees, buyer-sharing claims, tool/vendor names if policy prohibits).
   - Detect “sell-side” phrasing if library must remain template-neutral.
   - Detect typos (“the the”, “Target’s the”, etc.) and colon-ended parent bullets without children.

5. **Regression test generated engagement letters**
   - Generate output for each industry before/after and compare: section counts, bullet counts, and excluded defaults.

6. **Alias hardening (deprioritized; do after scope cleanup)**
   - Expand `section_aliases` for canonical keys and high-frequency user phrasing only after scope-content cleanup is complete.
   - Validate phrase-to-key mapping accuracy with a small intent test set.

---

## 7) Risks / Unknowns

- **Template neutrality policy:** The generator’s scope assembly is keyed on industry only (no template-type gating in scope insertion), so keeping sell-side-specific language would require either neutral text or separate scope libraries by template. (`context/dist/engagement_letter_generator.py:L894-L914`, `context/dist/engagement_letter_generator.py:L1151-L1237`.)
- **Optional-by-default governance:** Some teams may rely on the current “everything included” behavior. Moving content to Optional may change expectations unless the UI makes opt-in easy and defaults are clearly communicated.
- **Ambiguous thin sections:** A few sections have very thin bullets that don’t evidence intended meaning (e.g., `other_assets`, `other_current_assets_liabilities`). Without source provenance in this zip, their intended scope may need stakeholder confirmation before final removal/merge. (Examples: `context/dist/scope-library.json:L1170-L1173`, `context/dist/scope-library.json:L3048-L3052`.)
- **Mining provenance not included:** The zip does not include raw mined source documents, so we cannot validate whether some “odd” bullets are faithful extractions vs. artifacts; we can only assess what is present in `dist/`. (Noted in mining verification: `context/docs/mining/audit-verification-results.md:L13-L27`.)

---

## Execution Update — Dual Distribution Finalization (2026-02-11)

Status: `Completed`

Implemented:

- Added shared scope core module: `scope_engine.py` and runtime copy `dist/scope_engine.py`.
- Wired runtime and export validators to shared core entrypoints for applicability/order logic parity.
- Added internal generation entrypoint: `scripts/run_internal_generation.py` (subprocess wrapper).
- Removed internal direct dist module loading from:
  - `scripts/generate_demo_letter.py`
  - `scripts/smoke_test_scope_insertion.py`
- Added manifest and boundary checks:
  - `scripts/validate_upload_manifest.py`
  - `scripts/validate_internal_runtime_boundary.py`
- Added optional-scope docs exporter:
  - `scripts/export_optional_scope_docs.py`
- Added unknown optional-key runtime fallback (synthesized ad hoc optional section bullets in house style).
- Regenerated review surfaces:
  - `docs/scope-library/industries/*`
  - `docs/scope-library/skeleton-by-industry/*`
  - `docs/scope-library/optional-scope-library.md`
  - `docs/scope-library/optional-scope-library.json`

Validation run (pass):

- `python3 scripts/export_scope_review_surface.py --with-skeleton`
- `python3 scripts/validate_scope_review_exports.py`
- `python3 scripts/validate_scope_bucket_mapping.py`
- `python3 scripts/refresh-scope-metadata.py --check`
- `python3 scripts/check-system-prompt-contract.py --prompt dist/ts-engagement-assistant.md --max-chars 8000`
- `python3 scripts/validate_internal_runtime_boundary.py`
- `python3 scripts/validate_upload_manifest.py`

Manual output runs (pass):

- 5-industry sample generation via `scripts/generate_demo_letter.py` (both templates).
- 3-industry smoke generation via `scripts/smoke_test_scope_insertion.py`.


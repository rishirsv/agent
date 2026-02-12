# Optional Pack Lifecycle

## Goal

Keep baseline scope lean and reusable, while preserving useful optional analyses for controlled reintroduction.

## Inputs

- `docs/scope-library/excluded-sections-review.md`
- `docs/scope-library/section-applicability.json`
- Oracle review bundles under `.agents/oracle/*`

## Lifecycle

1. **Exclude from baseline**
- Keep optional/deal-specific sections excluded in `industry_section_replacements` (empty list).

2. **Review and rewrite**
- Rewrite excluded content into reusable, incremental, industry-specific bullets.
- Remove buyer/seller/legal drafting/tool/deliverable language.

3. **Create optional candidate set**
- Add reviewed optional content under a dedicated applicability block (or separate optional config file).
- Do not merge directly into default industry sections.

4. **Approval gate**
- Business review approves optional candidates section by section.

5. **Controlled release**
- Optional candidates are activated only when explicitly requested.
- Baseline dist remains unchanged unless an approved candidate becomes default-worthy.

6. **Runtime fallback for unknown optional keys**
- If user requests an optional key that is not in `scope-library-optional.json`, runtime synthesizes an ad hoc optional section in house style.
- Assistant should still ask whether to use once or save to optional catalog.

## Acceptance Criteria For Optional Content

- Incremental to common skeleton
- Industry-specific value
- No deal-specific framing
- No duplicate coverage of common bullets
- Style matches existing scope tone/format

## Automation

- Optional review docs are generated from JSON source of truth:
  - `python3 scripts/export_optional_scope_docs.py`

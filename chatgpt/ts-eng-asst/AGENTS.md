# TS SoW — Agent Instructions

## Purpose

This project contains artifacts intended to be uploaded into a ChatGPT GPT / project workspace (system prompt + supporting files).

## Decision principles

- Prefer **defaults + derivations** over asking/gating users (smooth UX, fewer loops).
- Only keep schema fields that are **meaningfully user-provided**; if a value is a reasonable default, bake it into the template (or derive it) and **remove the schema + intake questions**.
- Never rewrite legal language; only change templates to (a) set defaults, (b) add deterministic markers, or (c) remove/replace placeholders.
- Keep the system prompt under `8000` characters.
- Keep practical headroom in the system prompt (`<= 7800` target) to reduce late-stage compression regressions.

## `dist/` (final uploads only)

The `chatgpt/ts-sow/dist/` directory is **only** for the exact files a user should upload into ChatGPT.

Keep `dist/` limited to:

- System prompt markdown(s)
- Prompt sidecar guidance docs referenced by the system prompt (e.g. `assistant-playbook.md`)
- Generator scripts needed by the prompt
- Template `.docx` files
- The current schema(s) / library files referenced by the prompt (e.g. `scope-library.json`)
- Any icon assets explicitly used for the GPT configuration

Current upload manifest (must stay exact unless intentionally changed):

- `dist/engagement_letter_generator.py`
- `dist/scope_engine.py`
- `dist/ts-engagement-assistant.md`
- `dist/assistant-playbook.md`
- `dist/el-placeholder-schema.json`
- `dist/scope-library.json`
- `dist/scope-review-buckets.json`
- `dist/section-applicability.json`
- `dist/scope-library-optional.json`
- `dist/buyside-engagement-letter.docx`
- `dist/sellside-engagement-letter.docx`
- `dist/ts-engagement-assistant-icon.png` (only if used in GPT config)

Do **not** add to `dist/`:

- Demo artifacts (example outputs, example variable dumps)
- Test outputs or golden files
- Local caches (`__pycache__/`, `*.pyc`)
- OS/editor metadata (`.DS_Store`, etc.)
- Build or review artifacts (`*.tmp`, `*-candidate*.json`, test `.docx`, screenshots)

Dual-distribution rule:

- Internal scripts must not directly import/load `dist/engagement_letter_generator.py`.
- Use `scripts/run_internal_generation.py` for internal generation runs.
- Runtime upload path remains `dist/engagement_letter_generator.py` + `dist/scope_engine.py`.

If you need demo or test materials, put them under `chatgpt/ts-sow/reference/` (or another non-`dist/` folder) instead.

## Hygiene

- Prefer writing generated outputs to a temporary or dedicated non-`dist/` location.
- Before finishing a change, verify `dist/` contains only final-upload artifacts.
- For prompt changes, run:
  - `python3 scripts/check-system-prompt-contract.py --prompt dist/ts-engagement-assistant.md --max-chars 8000`
- Validate outputs are “clean”: no remaining `{{...}}` tokens in generated `.docx`.
- For scope text changes, treat `dist/scope-library.json` as canonical.
- Keep `docs/scope-library/industries/*` synced to `dist` (re-export with `python3 scripts/export_scope_review_surface.py`).
- `reference/legacy/*` contains historical snapshots only (not authoritative).
- For scope text QA, run:
  - `python3 scripts/refresh-scope-metadata.py`
  - `python3 scripts/check-scope-spelling.py`
  - `python3 scripts/validate_scope_review_exports.py`
  - `python3 -m json.tool dist/scope-library.json >/dev/null`
  - `python3 -m json.tool dist/scope-review-buckets.json >/dev/null`
  - `python3 scripts/validate_upload_manifest.py`
  - `python3 scripts/validate_internal_runtime_boundary.py`

- If merge candidates/backups are created during scope canonicalization:
  - Move them to `reference/legacy/` after merge.
  - Do not leave merge temp files in `dist/`.
- If any non-manifest file appears in `dist/`:
  - Move generated samples to `reference/generated/examples/`.
  - Move diagnostics/review docs to `docs/` or `reference/legacy/`.
  - Re-run `python3 scripts/validate_upload_manifest.py` before finishing.

## Scope Library Review Workflow (Docs-first)

When scope cleanup is in review mode, use `docs/scope-library/industries` as the working review surface.

- Update/review full per-industry outputs in:
  - `docs/scope-library/industries/*.json`
  - `docs/scope-library/industries/*.md`
- Regenerate industry files with:
  - `python3 scripts/export_scope_review_surface.py`
- Only generate skeleton pack when explicitly requested:
  - `python3 scripts/export_scope_review_surface.py --with-skeleton`
- Do not update `dist/scope-library.json` unless the user explicitly says to finalize/canonicalize changes.
- After exports, always run:
  - `python3 scripts/validate_scope_review_exports.py`
  - `python3 scripts/check-scope-spelling.py`

## Section Applicability (Docs-layer)

Use `docs/scope-library/section-applicability.json` to control industry behavior during docs export without changing `dist/scope-library.json`.

- `section_applicability.common_skeleton.<section>.exclude_for_industries`
  - Excludes a common section for listed industries.
  - Example: exclude `revenue_analysis` for `banking`.
- `common_section_replacements.<section>`
  - Replaces a common skeleton section for all industries (after exclusions are applied).
  - Use this when a “common” section is too industry-biased and needs neutral baseline wording.
- `industry_section_replacements.<industry>.<section>`
  - Replaces the base industry section bullets (full replacement) for review-mode exports.
  - Use this to remove redundancy and keep only incremental industry content.
- `industry_section_additions.<industry>.<section>`
  - Appends or creates bullets for a section after replacements are applied.
  - Use this for new sections (or incremental adds where replacement is not required).

Workflow:

1. Update `docs/scope-library/section-applicability.json`.
2. Regenerate exports:
   - `python3 scripts/export_scope_review_surface.py`
   - Optional skeleton pack: `python3 scripts/export_scope_review_surface.py --with-skeleton`
3. Validate:
   - `python3 scripts/validate_scope_review_exports.py`
   - `python3 scripts/check-scope-spelling.py`

Notes:

- Applicability config is docs-review behavior only until canonicalized in `dist/scope-library.json`.
- Prefer replacements over layered additions when duplicate/overlapping bullets appear in the same section.

## Scope Curation Learnings (Current)

- Scope assembly is currently `common + industry` and is not side-specific at the scope-bullet layer.
  - Do not assume buy-side/sell-side gating for bullets unless explicitly implemented.
  - Keep default industry bullets side-neutral; move side-specific language (for example, sell-side advisor phrasing) to optional sections or rewrite.

- Keep industry modules incremental to common.
  - If an industry bullet repeats common intent, remove the industry duplicate.
  - If an industry section fully supersedes common for that industry, exclude the common section for that industry in applicability and keep only the industry section.

- Prefer one canonical bullet per intent inside an industry section.
  - Merge near-duplicate bullets into one clean parent bullet with children.
  - Remove orphan bullets that end with `including:` or `; and` without proper continuation.

- Treat advanced analyses as optional by default unless user requests otherwise.
  - Typical optional examples: VDD report review, normalized EBITDA bridges, forecast/budget analysis, budget-vs-actual bridges, operational cost/margin assessment, and GAAP conversion assessments.

- When editing review-surface files, keep `docs/scope-library/industries/<industry>.json` and `.md` in sync in the same change.

## Banking Revenue Drafting Standard

For banking-oriented revenue wording, prefer income-stream framing over generic product sales framing.

Use this structure when drafting/revising banking revenue scope:

Revenue - Gain an understanding of income streams by type, including:

a) Net interest margin - trends therein / evolution thereof, including:
   i. Interest rate profile (fixed vs variable; differences by term / duration);
   ii. Product features (variable/floating and fixed);
   iii. Changes in maturity profile (including extensions of amortization periods and impact on yields); and
   iv. Cost of funding.

b) Non-interest income / margin - trends therein and key drivers (service charges, card/payment fees, wealth/asset-management fees, trading/treasury results, and other recurring non-interest streams).

c) Other fee income and commissions - trends therein and noted one-time / non-cash items.

## Constraint

- System prompt is limited to 8000 characters

## Template/generator conventions

- **Guidance text:** bracketed guidance like `[GUIDANCE: ...]` is intended to **remain in the output** for humans to edit; only curly-brace guidance placeholders (e.g. `{{GUIDANCE_01}}`, `{{GUIDANCE: ...}}`) are internal and should be removed during generation.
- **Section removal:** prefer explicit marker paragraphs (e.g. `{{BLOCK_*_START}}` / `{{BLOCK_*_END}}`) so the generator can delete entire sections deterministically.
- **Generation invocation contract:** always call `engagement_letter_generator.py` via subprocess flags, and pass `--variables` as a JSON file path (temp file), not a long inline JSON string.
- **Independence behavior (intended):**
  - If `CHOICE_INDEPENDENCE_APPLIES=no`, remove the full Independence Considerations block.
  - `CHOICE_SEC_STATUS` is conditionally required only when `CHOICE_INDEPENDENCE_APPLIES=yes` and the section remains in-template.
- **Canvas behavior (intended):**
  - Canvas is a review layer; working variables are source of truth.
  - Re-render full Canvas each turn (never partial line patches).
  - If Canvas update fails, continue generation flow with working variables and add a brief stale-canvas warning.
- **Scope exclusion contract (intended):**
  - Prefer `scope_selection.excluded_section_keys` over id-only exclusions.
  - Use `excluded_top_level_ids` only as backward-compatible fallback.
  - If user accepts full scope, pass no exclusions.
- **Optional scope contract (intended):**
  - Optional catalog source is `dist/scope-library-optional.json`.
  - If user requests an optional key not in catalog, create an ad hoc optional section in matching style and pass via `ad_hoc_optional_sections`.
  - If optional scope is not confirmed, proceed with baseline scope (non-blocking).
- **Scope review mapping (intended):**
  - Keep `scope-review-buckets.json` aligned with `scope-library.json` section keys.
  - Maintain `section_aliases` for common user phrasing.
  - Maintain `concept_aliases` + `concept_to_sections` for concept-wide removals (for example, debt-like exclusions).
- When updating templates, apply changes consistently to **both** buyside and sellside unless explicitly scoped to one.

## Repo note

- `chatgpt/ts-sow` and `chatgpt/TS-SoW` may refer to the same files; use the git-tracked paths when staging/committing.

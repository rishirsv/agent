---
status: draft
last-reviewed: 2026-03-05
review-cycle-days: 30
source-of-truth:
  - generator/index.js
  - generator/app/cli.js
  - generator/app/postprocess.js
  - generator/app/strict-overflow.js
  - generator/runtime/render-deck.js
  - generator/runtime/paginate.js
  - generator/runtime/render-context.js
  - generator/runtime/slide-registry.js
  - generator/runtime/pagination-policy.js
  - generator/runtime/template-package.js
  - generator/runtime/template-contracts.js
  - generator/runtime/geometry-contract.js
  - generator/postprocess/slides-adapter.js
  - templates/kpmg-diligence/package/layouts.json
  - templates/kpmg-diligence/package/pagination-policy.json
  - templates/kpmg-diligence/package/tokens.json
  - templates/kpmg-diligence/package/assets/manifest.json
  - package.json
verification-state: partially-verified
---

# KPMG SlideGen Project Specification

## 1. Problem Statement

KPMG SlideGen is a local CLI system that converts typed `deckSpec` JSON into:

- a generated PowerPoint deck (`.pptx`)
- a consolidated QA JSON report that captures validation, pagination, overlap, strict status, and optional postprocess results

The project standardizes deck generation and quality checks through template contracts and deterministic runtime behavior.

## 2. Goals and Non-Goals

### 2.1 Goals

- Enforce template-driven slot contracts and geometry contracts before render output is trusted.
- Produce deterministic, branded decks from structured input.
- Split dense content across continuation slides with policy-based pagination.
- Emit machine-readable QA output even on validation failure.
- Support strict mode quality gates with fail-closed visual overflow checks.
- Keep runtime and distributable skill bundle aligned and portable.

### 2.2 Non-Goals

- Backward-compatibility dual-path parsers for legacy payloads.
- Remote serving/API orchestration.
- Persistent datastore-backed orchestration.
- Semantic content authoring or narrative generation logic.
- Inferring slide contracts outside the declared template package.

## 3. System Overview

### 3.1 Primary Components

1. CLI Orchestrator (`generator/index.js`)

- Reads input deck JSON and template package.
- Runs validation, render, overlap checks, optional postprocess, strict status mapping, and QA write.

2. CLI Parser (`generator/app/cli.js`)

- Parses required and optional runtime flags.
- Validates `--montage-label-mode` and required `--in`/`--out` presence.

3. Validation + Render Runtime (`generator/runtime/render-deck.js`)

- Validates slot shape and density.
- Runs pagination.
- Dispatches slide builders via runtime registry.
- Returns render-stage QA findings.

4. Runtime Contracts (`generator/runtime/*.js`)

- Registry parity, pagination policy parity, strict geometry contracts, theme/build context contracts.

5. Overlap Analyzer (`generator/strict/overlap.js`)

- Computes severe/non-severe overlaps for QA and strict gating.

6. Postprocess Pipeline (`generator/app/postprocess.js`, `generator/postprocess/slides-adapter.js`)

- Optionally renders previews, montage, and visual overflow checks via bundled Python scripts.

### 3.2 End-to-End Workflow

1. Parse CLI flags.
2. Load input deck JSON.
3. Load template package files.
4. Start diagnostics.
5. Validate deck against slot and density contracts.
6. On invalid input: write invalid QA report and throw.
7. Build render context (theme, registry, policy, template contracts).
8. Paginate slides.
9. Render slides and write `.pptx`.
10. Run overlap analyzer (unless skipped).
11. Run optional postprocess (or strict-triggered overflow check).
12. Resolve strict overflow status (fail-closed).
13. Assemble final QA report and summary.
14. Exit with strict failure code when applicable.

## 4. Domain Model

| Entity                  | Purpose                              | Key Fields                                                                                                             |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `DeckSpec`              | Input model                          | `metadata`, `slides[]`                                                                                                 |
| `SlideSpec`             | Typed logical slide payload          | `type`, slot fields                                                                                                    |
| `TemplatePackage`       | Runtime template bundle              | `tokens`, `layouts`, `paginationPolicy`, `assetsManifest`, `resolveAssetPath()`                                        |
| `SlideRegistryEntry`    | Runtime dispatch map                 | `builder`, `master`, `requiredGeometry`, `paginationPolicyKey`, `excludeFromLogicalPaging`                             |
| `TemplateContract`      | Canonical geometry contract per type | `boxes`, `slots`, `masterName`, `footerSafeTop`                                                                        |
| `PaginationPolicyEntry` | Split/recompute behavior             | `strategy`, `mode`, `dropFields[]`, `recomputeFields[]`, `options`                                                     |
| `PaginatedDeck`         | Post-pagination result               | `slides[]`, `paginationDecisions[]`, `overflowEvents[]`, `tableWarnings[]`, `recomputeFields[]`                        |
| `OverlapReport`         | Render overlap diagnostics           | `summary`, per-slide overlap details                                                                                   |
| `PostprocessReport`     | Optional visual pipeline statuses    | `availability`, `preview`, `montage`, `overflowVisual`                                                                 |
| `StrictOverflowStatus`  | Strict gate decision                 | `status`, `mode`, `reason`, `skipped`, `failingSlides[]`                                                               |
| `QAReport`              | Consolidated output                  | `valid`, `errors`, `warnings`, `slotIssues`, `densityFindings`, `pagination*`, `overlap*`, `strictOverflow`, `summary` |

Index conventions:

- `slideIndex` is 0-based.
- `overlapFindings.slideNumber` is 1-based.
- visual overflow failing slide indices are 1-based.

## 5. Contracts

### 5.1 CLI Contract

| Flag                                   | Required | Default                 | Behavior                                      |
| -------------------------------------- | -------- | ----------------------- | --------------------------------------------- |
| `--in`                                 | yes      | none                    | input deck path                               |
| `--out`                                | yes      | none                    | output pptx path                              |
| `--qa-out`                             | no       | `<out>.qa.json`         | QA output path                                |
| `--template`                           | no       | `kpmg-diligence`        | template name                                 |
| `--allow-sparse`                       | no       | false                   | sparse density becomes warning                |
| `--strict`                             | no       | false                   | enables strict gate                           |
| `--skip-overlap`                       | no       | false                   | skip overlap scan                             |
| `--with-preview`                       | no       | false                   | emit preview PNGs                             |
| `--with-montage`                       | no       | false                   | emit montage image (requires preview success) |
| `--with-visual-overflow`               | no       | false                   | run visual overflow check                     |
| `--preview-width` / `--preview-height` | no       | `1600` / `900`          | preview image size target                     |
| `--preview-dir`                        | no       | `<out-dir>/preview`     | preview output directory                      |
| `--montage-out`                        | no       | `<out-dir>/montage.png` | montage output path                           |
| `--montage-cols`                       | no       | `5`                     | montage columns                               |
| `--montage-label-mode`                 | no       | `number`                | `number` / `filename` / `none`                |
| `--visual-overflow-pad-px`             | no       | `100`                   | overflow padding                              |

### 5.2 Input Deck Contract

Minimum shape:

- deck must be an object
- `slides` must be an array

Supported slot kinds in `layouts.json`:

- `text`, `textArray`, `stringArray`, `kpiArray`, `columns`, `contentsSections`, `table`, `chart`, `bridge`, `businessStructure`

Notable rules:

- `textArray` nested arrays are disallowed; nesting must use object `children`.
- max text-array depth is 4 levels.
- table rows must match header width.
- chart series must include values arrays.
- strict mode blocks runtime-reserved slide keys (`masterName`, `geometry`, `assets`).

Footer metadata contract:

- when not in sparse/demo mode, `year`, `legalEntityName`, `jurisdiction`, and `legalStructure` are required

### 5.3 Slide Type and Pagination Contract

| Slide Type                                 | Required Slots                       | Policy Key                   |
| ------------------------------------------ | ------------------------------------ | ---------------------------- |
| `cover`                                    | `title`, `subtitle`                  | `none.v1`                    |
| `divider` / `dividerDark` / `dividerLight` | `sectionNumber`, `sectionTitle`      | `none.v1`                    |
| `contents`                                 | `title`, `sections`                  | `contents.sections.v1`       |
| `oneColumnText`                            | `title`, `body`                      | `text.oneColumn.v1`          |
| `twoColumnText`                            | `title`, `leftBody`, `rightBody`     | `text.twoColumn.v1`          |
| `analysisNarrowTable`                      | `title`, `table`, `insights`         | `table.rows.v1`              |
| `analysisWideChart2ColsText`               | `title`, `body`, `chart`             | `text.analysisWide.2cols.v1` |
| `analysisWideChartTableText`               | `title`, `body`, `chart`             | `text.analysisWide.table.v1` |
| `analysisBridge`                           | `title`, `bridge`, `analysisColumns` | `bridge.analysisColumns.v1`  |
| `businessOverview`                         | `title`, `structure`, `overviewBody` | `business.overviewBody.v1`   |
| `titleStrapline4TextBoxes`                 | `title`, `columns`                   | `none.v1`                    |
| `backCover`                                | none                                 | `none.v1`                    |

### 5.4 Template Package Contract

Required template package files:

- `tokens.json`
- `layouts.json`
- `pagination-policy.json`
- `assets/manifest.json`

Required invariants:

- token dimensions must be finite
- registry must cover all template types
- policy keys referenced by registry must exist
- geometry keys must satisfy strict canonical geometry contract
- pagination policy schema version must be `1.0.0`

### 5.5 Output Contract

Always produced:

- `.pptx` on successful render
- QA JSON on both validation-failure and successful render paths

QA summary behavior:

- `blockingIssues = errors + missingSlots + overlapSevere`
- pass only when `valid` and `blockingIssues == 0`
- strict failure when strict requested and either overlap severe exists or strict overflow status is non-zero

Strict overflow behavior:

- visual overflow `pass` -> strict status `0`
- visual overflow `fail` -> strict status `1`
- visual overflow `skipped/error` in strict mode -> strict status `1` (fail-closed)

## 6. Failure Model

| Stage                           | Failure                                    | Handling                                        |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| CLI parse                       | required args missing / invalid label mode | exit code `2`                                   |
| Template load                   | required package file missing              | throw hard error                                |
| Input preflight                 | deck/slide shape invalid                   | write invalid QA then throw                     |
| Slot validation                 | required slot/type/pattern errors          | write invalid QA then throw                     |
| Density gate                    | sparse content without allow-sparse        | validation error                                |
| Footer contract                 | required non-demo footer fields missing    | throw during render setup                       |
| Registry/policy/geometry parity | missing contract coverage                  | throw hard error                                |
| Master contract                 | expected master mismatch                   | throw hard error                                |
| Overlap analyzer                | severe overlaps                            | recorded in QA and strict/blocking calculations |
| Postprocess                     | runtime unavailable or script failures     | record statuses/warnings in QA                  |
| Strict overflow                 | visual check unavailable/failed            | strict status fails closed                      |

Non-blocking warnings currently include thin density warnings, repeated long body lines, table density/orphan warnings, and non-severe overlap warnings.

## 7. Validation Matrix

| ID  | Objective                       | Command                                                                      | Expected Signal                               |
| --- | ------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| V1  | Layout contract parity          | `npm run -s test:contracts`                                                  | template/runtime layout contract checks pass  |
| V2  | Registry-policy-template parity | `npm run -s test:contracts:registry`                                         | each type has builder/master/policy coverage  |
| V3  | Smoke generation                | `npm run -s smoke`                                                           | deck and QA generated                         |
| V4  | Validation failure path         | `npm run -s test:validation:failure`                                         | invalid QA emitted with errors                |
| V5  | QA snapshot stability           | `npm run -s test:qa:golden`                                                  | QA golden remains stable                      |
| V6  | Strict overflow fail-closed     | `npm run -s test:strict:overflow-fail-closed`                                | strict fails on skipped/error/fail overflow   |
| V7  | Postprocess matrix              | `npm run -s test:postprocess`                                                | preview/montage/overflow status mapping holds |
| V8  | Pagination regressions          | `npm run -s test:pagination:one-column-merge` and related pagination tests   | split + metadata behavior stable              |
| V9  | Overlap regression              | `npm run -s test:strict:overlap-sizing`                                      | overlap bounds behavior stable                |
| V10 | Visual regressions              | `npm run -s test:visual:all`                                                 | visual baselines remain stable                |
| V11 | Drift guards                    | `npm run -s test:drift:theme:strict` and `npm run -s test:drift:grep:strict` | style/theme drift checks pass                 |
| V12 | Skill portability               | `npm run skill:sync` and `npm run skill:verify`                              | self-contained skill bundle remains valid     |

Manual baseline generation:

```bash
node generator/index.js \
  --in decks/<input>.deckSpec.json \
  --out outputs/my-run/deck.pptx \
  --qa-out outputs/my-run/qa.json
```

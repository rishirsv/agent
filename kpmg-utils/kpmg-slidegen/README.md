# KPMG SlideGen

Template-driven generator that converts `deckSpec` JSON inputs into:
- a branded PowerPoint deck (`.pptx`)
- a consolidated QA report (`.json`)
- optional visual artifacts (preview PNGs, montage PNG, visual overflow diagnostics)

## What This Repo Owns

- Runtime generation pipeline in `generator/`
- Template contracts in `templates/kpmg-diligence/package/`
- Skill bundle packaging and portability checks in `skills/kpmg-slides/`

## Contributor Guardrails

- Edit generation logic only in `generator/`.
- Keep template contracts in `templates/kpmg-diligence/package/`.
- Treat `fixtures/harness/` as the curated test surface and `presets/authoring/` as user-facing starters.
- Keep runtime minimal; avoid unnecessary frameworks.
- Keep docs and code aligned when changing slide types, slot rules, or QA shape.
- Validate with explicit CLI paths when you need deterministic artifact locations.
- Do not add backward-compatibility fallback paths unless explicitly requested.

## Prerequisites

- Node.js 18+
- npm

For strict visual overflow and postprocess flows:
- Python 3 (`python3` or `PYTHON_BIN`)
- LibreOffice (`soffice`)
- Poppler tools (`pdfinfo`, `pdftoppm`)
- Python packages: `pdf2image`, `Pillow`, `python-pptx`, `numpy`

## Install

```bash
npm install
```

## Quick Start

Preferred baseline command:

```bash
npm run generate:detailed
```

Explicit fixture run:

```bash
node generator/index.js \
  --in fixtures/harness/scenario/saas-mid-diligence/deckSpec.json \
  --out outputs/my-run/deck.pptx \
  --qa-out outputs/my-run/qa.json \
  --with-preview \
  --with-montage \
  --with-visual-overflow
```

Strict mode (fail-closed overflow gate):

```bash
node generator/index.js \
  --in presets/authoring/extensive.deckSpec.json \
  --strict
```

## CLI Reference

```bash
node generator/index.js --in <deck.json> [--out <out.pptx> | --out-dir <dir>] \
  [--qa-out <qa.json>] \
  [--allow-sparse] \
  [--strict] \
  [--skip-overlap] \
  [--template <name>] \
  [--with-preview] \
  [--with-montage] \
  [--with-visual-overflow] \
  [--preview-width <px>] \
  [--preview-height <px>] \
  [--preview-dir <path>] \
  [--montage-out <path>] \
  [--montage-cols <n>] \
  [--montage-label-mode <number|filename|none>] \
  [--visual-overflow-pad-px <px>]
```

If `--out` is omitted, generation writes to `./outputs/kpmg-slidegen/<timestamp>/`.

## Common Workflows

- `npm run generate:minimal|generate:concise|generate:detailed|generate:extensive`: run the four authoring presets.
- `npm run qa`: fast PR-grade harness lane.
- `npm run test:contracts`: template, registry, geometry, and pagination-policy parity.
- `npm run test:fixtures`: curated fixture and preset governance.
- `npm run test:structure`: validation, pagination, continuation, and verbosity behavior.
- `npm run test:render`: end-to-end generation plus normalized `qa.json` assertions.
- `npm run test:visual`: preview, montage, and visual-overflow lane.
- `npm run test:onboarding`: reference-parity onboarding scorecard lane.
- `npm run test:dist`: skill bundle sync, portability, and smoke verification.
- `npm run test:nightly`: full parent harness sweep.

## Output Artifacts

Main outputs per run:
- `<run-root>/deck.pptx`
- `<run-root>/qa.json`

QA report includes:
- `schemaVersion`
- `run`
- `outcome`
- `checks`
- `findings`
- `slides`
- `artifacts`

Optional postprocess artifacts:
- `preview/slide-<n>.png`
- `montage.png`
- overflow diagnostic image paths in `qa.artifacts.overflowVisual.imagePaths`

## Troubleshooting

- `Usage: node generator/index.js --in ...`:
  - `--in` is required; output paths default to `outputs/kpmg-slidegen/<timestamp>/`.
- `Unknown type: <type>`:
  - Type must exist in both `templates/kpmg-diligence/package/layouts.json` and `generator/runtime/slide-registry.js`.
- `Missing required template package file: ...`:
  - Ensure `tokens.json`, `layouts.json`, `pagination-policy.json`, and `assets/manifest.json` exist.
- `Missing required footer metadata for non-demo render`:
  - Provide `metadata.footer.year`, `legalEntityName`, `jurisdiction`, and `legalStructure`.
- Strict mode fails with `visual_overflow_*` reason:
  - Strict is fail-closed; ensure Python + rasterization dependencies are available.

## Documentation Map

- `ARCHITECTURE.md`: runtime architecture and module boundaries.
- `docs/exec-plans/active/agent-harness-engineering-plan.md`: active harness reset plan and implementation checklist.
- `AGENTS.md`: working rules and repo scope.
- `skills/kpmg-slides/SKILL.md`: portable skill instructions and preset vocabulary.
- `skills/kpmg-slides/references/quality_assurance.md`: QA triage guide for the normalized `qa.json`.
- `testing/README.md`: data preparation helpers.
- `testing/manual-test-plan.md`: manual verification plan.
- `testing/data/SCENARIO_INPUTS.md`: scenario fixture map.

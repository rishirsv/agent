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
- Use the repo-only onboarding workflow when creating new canonical layouts. Keep draft PPTX inputs, seeds, prompts, and diff artifacts in the parent repo only.

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
  --out outputs/my-run/partythrow-tech-mid-market-saas-diligence.pptx \
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

If `--out` is omitted, generation writes to `./outputs/kpmg-slidegen/<timestamp>/<topic>.pptx`, where `<topic>` is derived from the deck content. `qa.json` still lands beside the generated deck.

## Common Workflows

- `npm run generate:concise|generate:detailed|generate:extensive`: run the three authoring presets.
- `npm run qa`: fast PR-grade harness lane.
- `npm run test:contracts`: template, registry, geometry, and pagination-policy parity.
- `npm run test:fixtures`: curated fixture and preset governance.
- `npm run test:structure`: validation, pagination, continuation, and verbosity behavior.
- `npm run test:render`: end-to-end generation plus normalized `qa.json` assertions.
- `npm run test:visual`: preview, montage, and visual-overflow lane.
- `npm run test:dist`: skill bundle sync, portability, and smoke verification.
- `npm run test:onboarding`: repo-only onboarding smoke lane.
- `npm run onboard:run`: initialize, render, and compare one draft layout.
- `npm run test:nightly`: full parent harness sweep.
- Repo CI note: GitHub Actions runs `npm run test:pr` on every push and pull request, and runs `npm run test:nightly` on the scheduled nightly job.

## Output Artifacts

Main outputs per run:
- `<run-root>/<topic>.pptx`
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

Repo-only onboarding artifacts:
- `onboarding/layouts/<layout-id>/`: stable draft workspace (`source.json`, candidate scaffold files, optional seed data)
- `outputs/onboarding/<layout-id>/candidate/`: draft deck, QA, preview, optional montage
- `outputs/onboarding/<layout-id>/compare/`: reference, candidate, diff, metrics, scorecard

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
- `docs/exec-plans/active/agent-harness-engineering-plan.md`: active harness maintenance plan and implementation checklist.
- `docs/exec-plans/completed/repo-only-layout-onboarding-plan.md`: completed repo-only layout onboarding implementation plan.
- `docs/onboarding/README.md`: repo-only single-layout onboarding workflow.
- `docs/onboarding/agent-batch-workflow.md`: repo-only batch workflow for agent-driven onboarding loops.
- `AGENTS.md`: working rules and repo scope.
- `references/INDEX.md`: canonical parent-repo references index.
- `references/slide-contract.md`: canonical slide contract.
- `references/deckspec.schema.json`: canonical deck spec schema.
- `skills/kpmg-slides/SKILL.md`: portable skill instructions and preset vocabulary.
- `skills/kpmg-slides/references/quality_assurance.md`: skill-local mirrored QA guidance for the portable bundle.
- `testing/README.md`: data preparation helpers.
- `testing/manual-test-plan.md`: manual verification plan.

import assert from 'node:assert/strict';
import path from 'node:path';

import { RECOMPUTE_FIELD_CONTENTS_PAGE_RANGES } from '../generator/helpers/pagination-constants.js';
import { buildRenderContext } from '../generator/runtime/render-context.js';
import { paginateDeckSpec } from '../generator/runtime/paginate.js';
import { validateDeckSpecWithTemplate } from '../generator/runtime/render-deck.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';
import { PRESET_ROOT, loadFixture, readJson } from './harness/lib.mjs';

const templatePackage = loadTemplatePackage('kpmg-diligence');
const renderContext = buildRenderContext({ templatePackage });

const invalidFixture = loadFixture('invalid-legacy-nested-bullets');
const invalidValidation = validateDeckSpecWithTemplate(invalidFixture.deckSpec, templatePackage, {
  allowSparse: true,
});
assert.equal(invalidValidation.valid, false, 'Invalid fixture should fail validation.');
assert.ok(
  invalidValidation.errors.some((message) => String(message).includes('legacy nested array')),
  'Invalid fixture should fail on legacy nested bullet arrays.',
);

const nestedFixture = loadFixture('regression-nested-bullets-children');
const nestedValidation = validateDeckSpecWithTemplate(nestedFixture.deckSpec, templatePackage, {
  allowSparse: true,
});
assert.equal(nestedValidation.valid, true, 'Children-based nested bullets should be valid.');

const goldenFixture = loadFixture('golden-all-layouts');
const goldenPaged = paginateDeckSpec(goldenFixture.deckSpec, renderContext);
assert.ok(
  goldenPaged.paginationDecisions.some(
    (entry) =>
      entry?.slideType === 'contents' &&
      entry?.mode === 'contents-sections' &&
      Number(entry?.splitInto || 0) > 1,
  ),
  'Golden fixture should exercise contents pagination.',
);
assert.ok(
  goldenPaged.recomputeFields.includes(RECOMPUTE_FIELD_CONTENTS_PAGE_RANGES),
  'Contents pagination should request contentsPageRanges recomputation.',
);

const tableFixture = loadFixture('regression-analysis-wide-chart-table-overflow');
const tablePaged = paginateDeckSpec(tableFixture.deckSpec, renderContext);
assert.ok(
  tablePaged.paginationDecisions.some(
    (entry) =>
      entry?.slideType === 'analysisWideChartTableText' &&
      entry?.mode === 'text-with-chart' &&
      Number(entry?.splitInto || 0) > 1,
  ),
  'Chart/table regression should exercise text-with-chart pagination.',
);

const overflowFixture = loadFixture('regression-one-column-overflow');
const overflowPaged = paginateDeckSpec(overflowFixture.deckSpec, renderContext);
assert.ok(
  overflowPaged.paginationDecisions.some(
    (entry) =>
      entry?.slideType === 'oneColumnText' &&
      entry?.mode === 'one-column-bullets' &&
      Number(entry?.splitInto || 0) > 1,
  ),
  'Overflow regression should exercise one-column pagination splits.',
);

const minimalPreset = readJson(path.join(PRESET_ROOT, 'minimal.deckSpec.json'));
const minimalValidation = validateDeckSpecWithTemplate(minimalPreset, templatePackage, {
  allowSparse: false,
});
assert.equal(
  minimalValidation?.qa?.verbosityContract?.summary?.status,
  'pass',
  'Minimal preset should satisfy the runtime verbosity contract.',
);
const minimalPaged = paginateDeckSpec(minimalPreset, renderContext);
assert.ok(
  !minimalPaged.paginationDecisions.some(
    (entry) =>
      entry?.slideType === 'oneColumnText' &&
      entry?.mode === 'one-column-bullets' &&
      Number(entry?.splitInto || 0) > 1,
  ),
  'Minimal preset should not force one-column continuation splits.',
);

const extensivePreset = readJson(path.join(PRESET_ROOT, 'extensive.deckSpec.json'));
const extensiveValidation = validateDeckSpecWithTemplate(extensivePreset, templatePackage, {
  allowSparse: false,
});
assert.equal(
  extensiveValidation?.qa?.verbosityContract?.summary?.status,
  'pass',
  'Extensive preset should satisfy the runtime verbosity contract.',
);

console.log('Structure lane passed.');

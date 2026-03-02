import assert from 'node:assert/strict';

import { paginateDeckSpec } from '../generator/runtime/paginate.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const templatePackage = loadTemplatePackage('kpmg-diligence');
const layouts = templatePackage?.layouts?.types || {};

assert.ok(layouts.analysisNarrowTable, 'Expected analysisNarrowTable layout to be present');

const headers = ['Metric', 'FY2024', 'FY2025'];
const rows = Array.from({ length: 14 }, (_, idx) => [
  `Metric ${idx + 1}`,
  `Narrative for FY2024 row ${idx + 1}: ${'detailed commentary '.repeat(10).trim()}`,
  `${(120 + idx * 3).toFixed(0)}`,
]);

const tableMetadata = {
  title: 'Table metadata title',
  heading: 'Table metadata heading',
  keyTakeawayTitle: 'Key takeaway title',
  keyTakeawayBody: 'Metadata should persist across continuation pages.',
  customFutureField: {
    owner: 'regression-test',
    flags: ['retain-on-pagination'],
  },
};

const deck = {
  metadata: { title: 'Table Pagination Metadata Regression', allowSparse: true },
  slides: [
    {
      type: 'analysisNarrowTable',
      title: 'Analysis narrow table metadata regression',
      insightTitle: 'Insights',
      insights: [
        'First insight line with enough descriptive text to remain valid in dense review scenarios.',
        'Second insight line confirms that pagination should preserve table metadata on every split page.',
      ],
      table: {
        ...tableMetadata,
        headers,
        rows,
      },
      notes: 'Only the final continuation slide should retain notes.',
    },
  ],
};

const paged = paginateDeckSpec(deck, layouts);

assert.ok(paged.slides.length > 1, 'Expected analysisNarrowTable scenario to split into continuation slides');

for (const [idx, slide] of paged.slides.entries()) {
  assert.equal(slide?.table?.title, tableMetadata.title, `Expected table.title to persist on page ${idx + 1}`);
  assert.equal(slide?.table?.heading, tableMetadata.heading, `Expected table.heading to persist on page ${idx + 1}`);
  assert.equal(
    slide?.table?.keyTakeawayTitle,
    tableMetadata.keyTakeawayTitle,
    `Expected table.keyTakeawayTitle to persist on page ${idx + 1}`,
  );
  assert.equal(
    slide?.table?.keyTakeawayBody,
    tableMetadata.keyTakeawayBody,
    `Expected table.keyTakeawayBody to persist on page ${idx + 1}`,
  );
  assert.deepEqual(
    slide?.table?.customFutureField,
    tableMetadata.customFutureField,
    `Expected customFutureField to persist on page ${idx + 1}`,
  );
}

const pagedRows = paged.slides.flatMap((slide) => (Array.isArray(slide?.table?.rows) ? slide.table.rows : []));
assert.deepEqual(pagedRows, rows, 'Expected rows to be partitioned with no loss/duplication');

console.log('Analysis narrow table metadata pagination regression passed.');

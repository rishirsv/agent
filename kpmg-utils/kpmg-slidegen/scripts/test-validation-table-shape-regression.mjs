import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateToFile } from '../generator/index.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const templatePackage = loadTemplatePackage('kpmg-diligence');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slidegen-table-shape-validation-'));

function buildDeck(table) {
  return {
    metadata: {
      title: 'Table Shape Validation Regression',
      allowSparse: true,
    },
    slides: [
      {
        type: 'analysisNarrowTable',
        title: 'Table shape validation regression',
        insightTitle: 'Insights',
        insights: [
          'Insight one provides enough detail to satisfy slot density expectations in this validation-focused regression.',
          'Insight two verifies malformed table shapes fail before rendering and return clear validation errors.',
        ],
        table,
      },
    ],
  };
}

async function runInvalidCase(name, table, expectedMessages) {
  const outPath = path.join(tmpDir, `${name}.pptx`);
  const qaPath = path.join(tmpDir, `${name}.qa.json`);
  let thrown = null;

  try {
    await generateToFile(buildDeck(table), outPath, {
      templatePackage,
      qaPath,
      strict: false,
      enforceOverlap: false,
      allowSparse: true,
    });
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown instanceof Error, `${name}: expected validation failure`);
  assert.equal(fs.existsSync(qaPath), true, `${name}: expected QA output`);

  const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
  assert.equal(qa?.valid, false, `${name}: expected qa.valid=false`);
  assert.ok(Array.isArray(qa?.errors) && qa.errors.length > 0, `${name}: expected validation errors`);

  for (const message of expectedMessages) {
    assert.ok(
      qa.errors.some((item) => String(item).includes(message)),
      `${name}: expected error containing "${message}"`,
    );
  }
}

async function runValidCase() {
  const outPath = path.join(tmpDir, 'valid-rectangular.pptx');
  const qaPath = path.join(tmpDir, 'valid-rectangular.qa.json');
  await generateToFile(
    buildDeck({
      headers: ['Metric', 'FY2024', 'FY2025'],
      rows: [
        ['Revenue', '102', '118'],
        ['EBITDA', '21', '26'],
        ['Cash Conversion', '67%', '71%'],
      ],
    }),
    outPath,
    {
      templatePackage,
      qaPath,
      strict: false,
      enforceOverlap: false,
      allowSparse: true,
    },
  );

  const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
  assert.equal(qa?.valid, true, 'valid-rectangular: expected qa.valid=true');
}

await runInvalidCase(
  'invalid-empty-headers',
  {
    headers: [],
    rows: [
      ['Revenue', '102', '118'],
      ['EBITDA', '21', '26'],
      ['Cash Conversion', '67%', '71%'],
    ],
  },
  ['slides[0]: table headers must contain at least 1 item'],
);

await runInvalidCase(
  'invalid-empty-rows',
  {
    headers: ['Metric', 'FY2024', 'FY2025'],
    rows: [],
  },
  ['slides[0]: table rows must contain at least 1 row'],
);

await runInvalidCase(
  'invalid-ragged-short-row',
  {
    headers: ['Metric', 'FY2024', 'FY2025'],
    rows: [
      ['Revenue', '102', '118'],
      ['EBITDA'],
      ['Cash Conversion', '67%', '71%'],
    ],
  },
  ['slides[0]: table row 2 has 1 cell(s); expected 3 to match headers'],
);

await runInvalidCase(
  'invalid-ragged-long-row',
  {
    headers: ['Metric', 'FY2024', 'FY2025'],
    rows: [
      ['Revenue', '102', '118'],
      ['EBITDA', '21', '26', 'unexpected'],
      ['Cash Conversion', '67%', '71%'],
    ],
  },
  ['slides[0]: table row 2 has 4 cell(s); expected 3 to match headers'],
);

await runValidCase();

console.log('Table shape validation regression passed.');
console.log(`Temp output: ${tmpDir}`);

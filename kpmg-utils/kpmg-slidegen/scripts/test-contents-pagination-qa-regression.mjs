import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateToFile } from '../generator/index.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const templatePackage = loadTemplatePackage('kpmg-diligence');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slidegen-contents-pagination-qa-'));
const outPath = path.join(tmpDir, 'deck.pptx');
const qaPath = path.join(tmpDir, 'qa.json');

const sections = Array.from({ length: 12 }, (_, idx) => ({
  number: String(idx + 1).padStart(2, '0'),
  title: `Section ${idx + 1}`,
  pageRange: '',
  items: [`Key item ${idx + 1}a`, `Key item ${idx + 1}b`],
}));

function makeSectionSlide(titleText) {
  return {
    type: 'oneColumnText',
    title: titleText,
    bodyStyle: 'bullets',
    body: [
      'Section narrative heading',
      'Section narrative body text with enough detail to satisfy minimum content requirements for regression validation.',
    ],
  };
}

const deck = {
  metadata: {
    title: 'Contents Pagination QA Regression',
    allowSparse: true,
  },
  slides: [
    {
      type: 'contents',
      title: 'Agenda',
      sections,
    },
    {
      type: 'divider',
      sectionNumber: '01',
      sectionTitle: 'Section 1',
    },
    makeSectionSlide('Section 1 detail'),
    {
      type: 'divider',
      sectionNumber: '11',
      sectionTitle: 'Section 11',
    },
    makeSectionSlide('Section 11 detail'),
    {
      type: 'divider',
      sectionNumber: '12',
      sectionTitle: 'Section 12',
    },
    makeSectionSlide('Section 12 detail'),
  ],
};

await generateToFile(deck, outPath, {
  templatePackage,
  qaPath,
  strict: false,
  allowSparse: true,
  enforceOverlap: false,
});

const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
assert.equal(qa?.valid, true, 'Expected QA to be valid for contents pagination scenario');
assert.equal(qa?.inputSlideCount, 7, 'Expected regression input slide count');
assert.equal(qa?.outputSlideCount, 8, 'Expected output slide count to include one extra contents continuation');

const decision = (qa?.paginationDecisions || []).find(
  (item) => item?.slideType === 'contents' && item?.mode === 'contents-sections',
);
assert.ok(decision, 'Expected contents pagination decision in QA');
assert.equal(decision?.originalCount, 12, 'Expected contents pagination decision originalCount=12');
assert.equal(decision?.splitInto, 2, 'Expected contents pagination decision splitInto=2');

const overflowEvent = (qa?.overflowEvents || []).find(
  (item) => item?.slideType === 'contents' && item?.mode === 'contents-sections' && item?.event === 'auto_split',
);
assert.ok(overflowEvent, 'Expected contents overflow auto_split event in QA');

console.log('Contents pagination QA regression passed.');
console.log(`Temp output: ${tmpDir}`);

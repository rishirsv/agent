import assert from 'node:assert/strict';

import { paginateDeckSpec } from '../generator/runtime/paginate.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const templatePackage = loadTemplatePackage('kpmg-diligence');
const layouts = templatePackage?.layouts?.types || {};

assert.ok(layouts.contents, 'Expected contents layout to be present');

function makeSections(count) {
  return Array.from({ length: count }, (_, idx) => ({
    number: String(idx + 1).padStart(2, '0'),
    title: `Section ${idx + 1}`,
    pageRange: '',
    items: [`Topic ${idx + 1}a`, `Topic ${idx + 1}b`],
    customFutureField: {
      marker: `section-${idx + 1}`,
    },
  }));
}

function flattenSections(slides) {
  return (Array.isArray(slides) ? slides : []).flatMap((slide) => (Array.isArray(slide?.sections) ? slide.sections : []));
}

{
  const sections = makeSections(12);
  const deck = {
    metadata: { title: 'Contents Pagination', allowSparse: true },
    slides: [
      {
        type: 'contents',
        title: 'Agenda',
        sections,
      },
    ],
  };

  const paged = paginateDeckSpec(deck, layouts);
  assert.equal(paged.slides.length, 2, 'Expected 12 sections to split across 2 contents slides');
  assert.equal(paged.slides[0]?.sections?.length, 10, 'Expected first contents page to hold 10 sections');
  assert.equal(paged.slides[1]?.sections?.length, 2, 'Expected second contents page to hold remaining sections');
  assert.equal(paged.slides[1]?.title, 'Agenda (cont.)', 'Expected continuation title suffix for contents split');
  assert.deepEqual(flattenSections(paged.slides), sections, 'Expected section order preserved with no loss/duplication');

  const split = (paged.paginationDecisions || []).find(
    (item) => item?.slideType === 'contents' && item?.mode === 'contents-sections',
  );
  assert.ok(split, 'Expected paginationDecisions entry for contents split');
  assert.equal(split?.originalCount, 12, 'Expected original section count in pagination decision');
  assert.equal(split?.splitInto, 2, 'Expected splitInto=2 for 12 sections');

  const overflowEvent = (paged.overflowEvents || []).find(
    (item) => item?.slideType === 'contents' && item?.mode === 'contents-sections' && item?.event === 'auto_split',
  );
  assert.ok(overflowEvent, 'Expected overflowEvents auto_split entry for contents split');
}

{
  const maxLenTitle = '1234567890123456789012345678901234567890';
  assert.equal(maxLenTitle.length, 40, 'Expected 40-char contents title fixture');
  const sections = makeSections(11);
  const deck = {
    metadata: { title: 'Contents Pagination', allowSparse: true },
    slides: [
      {
        type: 'contents',
        title: maxLenTitle,
        sections,
      },
    ],
  };

  const paged = paginateDeckSpec(deck, layouts);
  assert.equal(paged.slides.length, 2, 'Expected 11 sections to split across 2 contents slides');
  assert.equal(
    paged.slides[1]?.title,
    maxLenTitle,
    'Expected continuation title suffix suppression when title maxChars would be exceeded',
  );
}

console.log('Contents sections pagination regression passed.');

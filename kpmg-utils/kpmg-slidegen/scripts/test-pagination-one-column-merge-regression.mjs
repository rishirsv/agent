import assert from 'node:assert/strict';

import { paginateDeckSpec } from '../generator/runtime/paginate.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const templatePackage = loadTemplatePackage('kpmg-diligence');
const layouts = templatePackage?.layouts?.types || {};

assert.ok(layouts.oneColumnText, 'Expected oneColumnText layout to be present');

function makeLong(prefix, repeats = 420) {
  return `${prefix} ${'long text '.repeat(repeats).trim()}`;
}

function isBulletObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && value.text !== undefined);
}

function textOf(value) {
  if (typeof value === 'string') return value;
  if (isBulletObject(value)) return String(value.text ?? '');
  return String(value ?? '');
}

function countTokenInNode(node, token) {
  if (typeof node === 'string') {
    return node.includes(token) ? 1 : 0;
  }
  if (Array.isArray(node)) {
    return node.reduce((sum, child) => sum + countTokenInNode(child, token), 0);
  }
  if (isBulletObject(node)) {
    const own = textOf(node).includes(token) ? 1 : 0;
    const childCount = Array.isArray(node.children)
      ? node.children.reduce((sum, child) => sum + countTokenInNode(child, token), 0)
      : 0;
    return own + childCount;
  }
  return 0;
}

function countTokenInSlides(slides, token) {
  return (Array.isArray(slides) ? slides : []).reduce((sum, slide) => {
    const body = Array.isArray(slide?.body) ? slide.body : [];
    return sum + body.reduce((inner, node) => inner + countTokenInNode(node, token), 0);
  }, 0);
}

function flattenTopLevelBodyText(slides) {
  const out = [];
  for (const slide of Array.isArray(slides) ? slides : []) {
    const body = Array.isArray(slide?.body) ? slide.body : [];
    for (const item of body) out.push(textOf(item));
  }
  return out;
}

function findParentWithChildToken(slides, parentToken, childToken) {
  for (const slide of Array.isArray(slides) ? slides : []) {
    for (const item of Array.isArray(slide?.body) ? slide.body : []) {
      if (!isBulletObject(item) || !textOf(item).includes(parentToken)) continue;
      if (!Array.isArray(item.children)) continue;
      if (item.children.some((child) => countTokenInNode(child, childToken) > 0)) return true;
    }
  }
  return false;
}

function paginateOneColumnBody(body, extras = {}) {
  const deck = {
    metadata: { title: 'Pagination Regression', allowSparse: true },
    slides: [
      {
        type: 'oneColumnText',
        title: 'Pagination Regression',
        strapline: 'One-column pagination regression scenario',
        bodyStyle: 'bullets',
        body,
        callouts: [
          { heading: 'C1', body: ['A'] },
          { heading: 'C2', body: ['B'] },
          { heading: 'C3', body: ['C'] },
          { heading: 'C4', body: ['D'] },
        ],
        ...extras,
      },
    ],
  };
  return paginateDeckSpec(deck, layouts);
}

{
  const token = 'TOKEN_CASE1_MERGE_ONCE';
  const paged = paginateOneColumnBody([
    'Heading alpha',
    makeLong(token, 500),
    'Heading beta',
    'Beta body detail line',
    'Heading gamma',
    'Gamma body detail line',
  ]);

  assert.ok(paged.slides.length > 1, 'Case 1 should paginate into continuation slides');
  assert.equal(
    countTokenInSlides(paged.slides, token),
    1,
    'Case 1: merged heading+long-body token should appear exactly once across paginated slides',
  );
}

{
  const childToken = 'TOKEN_CASE2_CHILD_ONCE';
  const paged = paginateOneColumnBody([
    'Intro heading',
    makeLong('TOKEN_CASE2_LONG', 380),
    { text: 'PARENT_TOKEN_CASE2', children: [childToken, 'Nested sibling text'] },
    'Trailing heading',
    makeLong('TOKEN_CASE2_TAIL', 220),
  ]);

  assert.ok(paged.slides.length > 1, 'Case 2 should paginate into continuation slides');
  assert.equal(
    countTokenInSlides(paged.slides, childToken),
    1,
    'Case 2: nested child token should appear exactly once',
  );
  assert.ok(
    findParentWithChildToken(paged.slides, 'PARENT_TOKEN_CASE2', childToken),
    'Case 2: parent bullet should retain child content after pagination',
  );
}

{
  const longA = makeLong('TOKEN_CASE3_A', 420);
  const longB = makeLong('TOKEN_CASE3_B', 420);
  const paged = paginateOneColumnBody([
    'Alpha heading',
    longA,
    'Middle marker',
    'Beta heading',
    longB,
    'Tail marker',
  ]);

  const expected = [`Alpha heading: ${longA}`, 'Middle marker', `Beta heading: ${longB}`, 'Tail marker'];
  const actual = flattenTopLevelBodyText(paged.slides);

  assert.ok(paged.slides.length > 1, 'Case 3 should paginate into continuation slides');
  assert.deepEqual(
    actual,
    expected,
    'Case 3: cross-page flattened top-level body should match normalized order with no duplicates or omissions',
  );
}

console.log('One-column bullet pagination merge regression tests passed.');

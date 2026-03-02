import assert from 'node:assert/strict';

import { analyzeSlideOverlaps, compareElementPosition } from '../generator/strict/overlap.js';

function makeSlide(objects) {
  return { _slideObjects: objects };
}

function makePptx(slide) {
  return { _slides: [slide] };
}

{
  const slide = makeSlide([
    {
      type: 'image',
      data: {
        x: 1,
        y: 1,
        // Full scaled image size (larger than visible box)
        w: 6,
        h: 4,
        sizing: { type: 'cover', w: 2, h: 2 },
      },
    },
    {
      type: 'text',
      data: {
        x: 3.4,
        y: 1.1,
        w: 0.8,
        h: 0.4,
        text: 'outside visible cover box',
      },
    },
  ]);

  const comparison = compareElementPosition(slide, 0, 1);
  assert.equal(comparison.relation, 'disjoint', 'cover sizing should use visible sizing box for overlap bounds');
}

{
  const slide = makeSlide([
    {
      type: 'image',
      data: {
        x: 2,
        y: 2,
        w: 5,
        h: 5,
        sizing: { type: 'contain', w: 1.8, h: 1.2 },
      },
    },
    {
      type: 'text',
      data: {
        x: 4.2,
        y: 2.2,
        w: 0.7,
        h: 0.4,
        text: 'outside visible contain box',
      },
    },
  ]);

  const comparison = compareElementPosition(slide, 0, 1);
  assert.equal(comparison.relation, 'disjoint', 'contain sizing should use visible sizing box for overlap bounds');
}

{
  const slide = makeSlide([
    {
      type: 'image',
      data: {
        x: 1,
        y: 1,
        w: 5,
        h: 5,
        sizing: { type: 'crop', w: 1.5, h: 1.5 },
      },
    },
    {
      type: 'text',
      data: {
        x: 1.3,
        y: 1.3,
        w: 0.8,
        h: 0.5,
        text: 'inside visible crop box',
      },
    },
  ]);

  const comparison = compareElementPosition(slide, 0, 1);
  assert.equal(comparison.relation, 'contained', 'crop sizing overlap behavior should remain intact');
}

{
  const slide = makeSlide([
    {
      type: 'image',
      data: {
        x: 1,
        y: 1,
        w: 6,
        h: 4,
        sizing: { type: 'cover', w: 2, h: 2 },
      },
    },
    {
      type: 'text',
      data: {
        x: 3.4,
        y: 1.1,
        w: 0.8,
        h: 0.4,
        text: 'outside visible cover box',
      },
    },
  ]);
  const pptx = makePptx(slide);

  const report = analyzeSlideOverlaps(slide, pptx);
  assert.equal(report.overlaps.length, 0, 'cover sizing should not produce false overlap warnings for outside text');
}

console.log('Overlap sizing bounds regression passed.');

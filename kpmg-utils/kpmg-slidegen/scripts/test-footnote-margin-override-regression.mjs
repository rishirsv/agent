#!/usr/bin/env node
import assert from 'node:assert/strict';

import { addFootnoteBlock } from '../generator/helpers/slide-components.js';

function makeFakeSlide() {
  const calls = [];
  return {
    calls,
    addText(text, options) {
      calls.push({ text, options });
    },
  };
}

const box = { x: 1, y: 1, w: 5, h: 0.2 };

{
  const slide = makeFakeSlide();
  const rendered = addFootnoteBlock(slide, {
    lines: ['Source: regression'],
    box,
    style: { margin: 0 },
  });
  assert.equal(rendered, true);
  assert.equal(slide.calls.length, 1);
  assert.equal(slide.calls[0].options.margin, 0, 'style.margin should override theme default when textBox.margin is not set');
}

{
  const slide = makeFakeSlide();
  const rendered = addFootnoteBlock(slide, {
    lines: ['Source: regression'],
    box,
    style: { margin: 0 },
    textBox: { margin: [1, 2, 3, 4] },
  });
  assert.equal(rendered, true);
  assert.equal(slide.calls.length, 1);
  assert.deepEqual(
    slide.calls[0].options.margin,
    [1, 2, 3, 4],
    'textBox.margin should take precedence when explicitly provided',
  );
}

console.log('Footnote margin override regression passed.');

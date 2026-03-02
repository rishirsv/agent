#!/usr/bin/env node
import assert from 'node:assert/strict';

import { buildRenderContext } from '../generator/runtime/render-context.js';
import { renderDeck } from '../generator/runtime/render-deck.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const templatePackage = loadTemplatePackage('kpmg-diligence');
const ctx = buildRenderContext(templatePackage);

assert.equal(ctx.theme.tokens, templatePackage.tokens, 'theme.tokens should reference raw template tokens');
assert.ok(ctx.theme.colors.primary, 'theme semantic colors should be present');
assert.ok(
  ctx.layoutContract.get('contents')?.boxes?.topRow,
  'layout contract should expose named geometry boxes',
);

const deckSpec = {
  metadata: {
    allowSparse: true,
    footer: {
      year: 2026,
      legalEntityName: 'KPMG LLP',
      jurisdiction: 'Ontario',
      legalStructure: 'limited liability partnership',
    },
  },
  slides: [
    { type: 'cover', title: 'Theme Refactor', subtitle: 'Regression check' },
    {
      type: 'backCover',
      url: 'example.com',
    },
  ],
};

const { pptx } = renderDeck(deckSpec, templatePackage, { allowSparse: true });
const backCover = pptx._slides[pptx._slides.length - 1];
const textObjects = (backCover?._slideObjects || []).filter((item) => item?._type === 'text');
const renderedText = textObjects
  .flatMap((obj) => Array.isArray(obj?.text) ? obj.text : [])
  .map((run) => String(run?.text || '').trim())
  .filter(Boolean);

assert.ok(
  renderedText.some((text) => text.includes('Firstname Lastname')),
  'back cover should render fallback contacts when contacts are omitted',
);

const urlRun = textObjects
  .flatMap((obj) => Array.isArray(obj?.text) ? obj.text : [])
  .find((run) => String(run?.text || '').trim() === 'example.com');

assert.ok(urlRun, 'back cover URL text should be rendered');
assert.equal(
  urlRun?.options?.hyperlink?.url,
  'https://example.com',
  'back cover hyperlink should come from deck spec URL',
);

console.log('Render-context refactor regression passed.');

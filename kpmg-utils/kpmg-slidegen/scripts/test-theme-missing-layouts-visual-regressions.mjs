import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateToFile } from '../generator/index.js';
import { getImageDimensions } from '../generator/helpers/media.js';
import { createSlidesAdapter } from '../generator/postprocess/slides-adapter.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const DECK_NAME = 'regression-theme-missing-layouts.deckSpec.json';

function parseOutDir(argv = process.argv.slice(2)) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out-dir' && argv[i + 1]) return path.resolve(argv[i + 1]);
    if (argv[i].startsWith('--out-dir=')) return path.resolve(argv[i].slice('--out-dir='.length));
  }
  if (process.env.VISUAL_OUT_DIR) return path.resolve(process.env.VISUAL_OUT_DIR);
  return fs.mkdtempSync(path.join(os.tmpdir(), 'slidegen-theme-missing-layouts-visual-'));
}

function listSlidePngs(previewDir) {
  const names = fs
    .readdirSync(previewDir)
    .filter((name) => /^slide-\d+\.png$/i.test(name))
    .sort((a, b) => {
      const ai = Number(a.match(/\d+/)?.[0] || 0);
      const bi = Number(b.match(/\d+/)?.[0] || 0);
      return ai - bi;
    });
  return names.map((name) => path.join(previewDir, name));
}

function assertImageValid(imagePath) {
  assert.equal(fs.existsSync(imagePath), true, `Expected image to exist: ${imagePath}`);
  const stat = fs.statSync(imagePath);
  assert.ok(stat.size > 0, `Expected image size > 0: ${imagePath}`);
  const { width, height } = getImageDimensions(imagePath);
  assert.ok(width > 0, `Expected width > 0: ${imagePath}`);
  assert.ok(height > 0, `Expected height > 0: ${imagePath}`);
}

const deckSpec = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'decks', DECK_NAME), 'utf8'),
);

const adapter = createSlidesAdapter();
const availability = adapter.detectAvailability();
if (!availability.available) {
  throw new Error(
    `Theme missing-layout visual regressions require an available slides runtime. Reason: ${availability.reason || 'unknown'}`,
  );
}

const templatePackage = loadTemplatePackage('kpmg-diligence');
const outDir = parseOutDir();
fs.mkdirSync(outDir, { recursive: true });

const caseDir = path.join(outDir, 'theme-missing-layouts');
const outPath = path.resolve(caseDir, 'deck.pptx');
const qaPath = path.resolve(caseDir, 'qa.json');
const previewDir = path.resolve(caseDir, 'preview');
fs.mkdirSync(caseDir, { recursive: true });

await generateToFile(deckSpec, outPath, {
  templatePackage,
  qaPath,
  strict: false,
  allowSparse: true,
  enforceOverlap: true,
  postprocess: {
    withPreview: true,
    withMontage: false,
    withVisualOverflow: true,
    previewWidth: 1600,
    previewHeight: 900,
    previewOutputDir: previewDir,
    visualOverflowPadPx: 100,
  },
  postprocessAdapter: adapter,
});

const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
assert.equal(qa?.postprocess?.preview?.status, 'ok', 'expected preview status ok');
assert.equal(qa?.postprocess?.overflowVisual?.status, 'pass', 'expected overflow status pass');

const contentsSplits = (qa?.paginationDecisions || []).filter(
  (item) => item?.slideType === 'contents' && item?.mode === 'contents-sections' && Number(item?.splitInto || 0) > 1,
);
assert.ok(contentsSplits.length > 0, 'expected contents pagination split for >10 sections');

const outputSlideCount = Number(qa?.outputSlideCount || 0);
assert.ok(outputSlideCount >= 8, `expected at least 8 output slides, got ${outputSlideCount}`);

const slides = listSlidePngs(previewDir);
assert.equal(slides.length, outputSlideCount, `expected ${outputSlideCount} preview PNGs, got ${slides.length}`);
for (const imagePath of slides) {
  assertImageValid(imagePath);
}

console.log('Theme missing-layout visual regressions passed.');
console.log(`Deck fixture: ${DECK_NAME}`);
console.log(`Output root: ${outDir}`);
console.log(`Case output: ${caseDir}`);
console.log(`Rendered slides: ${outputSlideCount}`);

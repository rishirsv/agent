import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateToFile } from '../generator/index.js';
import { getImageDimensions } from '../generator/helpers/media.js';
import { createSlidesAdapter } from '../generator/postprocess/slides-adapter.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

const BASELINE_DECK = 'regression-nested-bullets-dense-baseline.deckSpec.json';
const NESTED_DECK = 'regression-nested-bullets-dense-children.deckSpec.json';

function parseOutDir(argv = process.argv.slice(2)) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out-dir' && argv[i + 1]) return path.resolve(argv[i + 1]);
    if (argv[i].startsWith('--out-dir=')) return path.resolve(argv[i].slice('--out-dir='.length));
  }
  if (process.env.VISUAL_OUT_DIR) return path.resolve(process.env.VISUAL_OUT_DIR);
  return fs.mkdtempSync(path.join(os.tmpdir(), 'slidegen-bullet-nesting-visual-'));
}

function readDeck(deckName) {
  const deckPath = path.join(process.cwd(), 'decks', deckName);
  return JSON.parse(fs.readFileSync(deckPath, 'utf8'));
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

async function runVariant({ variantId, deckName, outRoot, templatePackage, adapter }) {
  const runDir = path.join(outRoot, variantId);
  const outPath = path.join(runDir, 'deck.pptx');
  const qaPath = path.join(runDir, 'qa.json');
  const previewDir = path.join(runDir, 'preview');
  fs.mkdirSync(runDir, { recursive: true });

  const deckSpec = readDeck(deckName);
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
  assert.equal(qa?.valid, true, `${variantId}: expected qa.valid=true`);
  assert.equal(qa?.postprocess?.preview?.status, 'ok', `${variantId}: expected preview status ok`);
  assert.equal(qa?.postprocess?.overflowVisual?.status, 'pass', `${variantId}: expected overflow visual pass`);
  assert.equal(Number(qa?.overlapSummary?.severeCount || 0), 0, `${variantId}: expected no severe overlap findings`);

  const slides = listSlidePngs(previewDir);
  assert.ok(slides.length > 0, `${variantId}: expected at least one preview image`);
  assert.equal(slides.length, Number(qa?.outputSlideCount || 0), `${variantId}: preview count mismatch`);
  slides.forEach(assertImageValid);

  return {
    outPath,
    qaPath,
    previewDir,
    outputSlideCount: Number(qa?.outputSlideCount || 0),
    paginationDecisions: Array.isArray(qa?.paginationDecisions) ? qa.paginationDecisions.length : 0,
  };
}

const adapter = createSlidesAdapter();
const availability = adapter.detectAvailability();
if (!availability.available) {
  throw new Error(
    `Bullet nesting visual regressions require an available slides runtime. Reason: ${availability.reason || 'unknown'}`,
  );
}

const outRoot = parseOutDir();
fs.mkdirSync(outRoot, { recursive: true });
const templatePackage = loadTemplatePackage('kpmg-diligence');

const baseline = await runVariant({
  variantId: 'baseline-flat-bullets',
  deckName: BASELINE_DECK,
  outRoot,
  templatePackage,
  adapter,
});

const nested = await runVariant({
  variantId: 'children-nested-bullets',
  deckName: NESTED_DECK,
  outRoot,
  templatePackage,
  adapter,
});

console.log('Bullet nesting visual regressions passed (automated checks).');
console.log(`Output root: ${outRoot}`);
console.log('Manual visual signoff checklist:');
console.log('1. Compare baseline and nested previews for overflow, clipping, and alignment drift.');
console.log('2. Confirm nested bullets render with clear hierarchy and dash bullets at deeper level.');
console.log('3. Confirm oneColumnText, twoColumnText, and analysisWideChart2ColsText remain readable.');
console.log(
  `- baseline: slides=${baseline.outputSlideCount}, paginationDecisions=${baseline.paginationDecisions}, preview=${baseline.previewDir}`,
);
console.log(
  `- nested: slides=${nested.outputSlideCount}, paginationDecisions=${nested.paginationDecisions}, preview=${nested.previewDir}`,
);

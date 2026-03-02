import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { generateToFile } from '../generator/index.js';
import { getImageDimensions } from '../generator/helpers/media.js';
import { createSlidesAdapter } from '../generator/postprocess/slides-adapter.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

function parsePositiveInt(value, flagName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${flagName} value '${value}'. Expected a positive integer.`);
  }
  return parsed;
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    referencePptx: null,
    referenceSlide: null,
    candidateDeck: null,
    candidateSlide: 1,
    outDir: null,
    template: 'kpmg-diligence',
    previewWidth: 1600,
    previewHeight: 900,
    allowSparse: false,
    strict: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const [flag, inlineValue] = token.split('=', 2);
    const hasInline = inlineValue !== undefined;
    const next = hasInline ? inlineValue : argv[i + 1];

    if (flag === '--reference-pptx') {
      args.referencePptx = hasInline ? inlineValue : next;
      if (!hasInline) i += 1;
      continue;
    }
    if (flag === '--reference-slide') {
      args.referenceSlide = parsePositiveInt(next, '--reference-slide');
      if (!hasInline) i += 1;
      continue;
    }
    if (flag === '--candidate-deck') {
      args.candidateDeck = hasInline ? inlineValue : next;
      if (!hasInline) i += 1;
      continue;
    }
    if (flag === '--candidate-slide') {
      args.candidateSlide = parsePositiveInt(next, '--candidate-slide');
      if (!hasInline) i += 1;
      continue;
    }
    if (flag === '--out-dir') {
      args.outDir = hasInline ? inlineValue : next;
      if (!hasInline) i += 1;
      continue;
    }
    if (flag === '--template') {
      args.template = hasInline ? inlineValue : next;
      if (!hasInline) i += 1;
      continue;
    }
    if (flag === '--preview-width') {
      args.previewWidth = parsePositiveInt(next, '--preview-width');
      if (!hasInline) i += 1;
      continue;
    }
    if (flag === '--preview-height') {
      args.previewHeight = parsePositiveInt(next, '--preview-height');
      if (!hasInline) i += 1;
      continue;
    }
    if (flag === '--allow-sparse') {
      args.allowSparse = true;
      continue;
    }
    if (flag === '--strict') {
      args.strict = true;
    }
  }

  if (!args.referencePptx || !args.referenceSlide || !args.candidateDeck) {
    throw new Error(
      [
        'Usage: node scripts/test-reference-slide-parity.mjs \\',
        '  --reference-pptx <path/to/reference.pptx> \\',
        '  --reference-slide <1-based-index> \\',
        '  --candidate-deck <path/to/candidate.deckSpec.json> \\',
        '  [--candidate-slide <1-based-index>] [--template <name>] [--out-dir <dir>] \\',
        '  [--preview-width <px>] [--preview-height <px>] [--allow-sparse] [--strict]',
      ].join('\n'),
    );
  }

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  args.outDir = args.outDir
    ? path.resolve(args.outDir)
    : path.resolve(process.cwd(), 'outputs', 'reference-parity', runId);
  args.referencePptx = path.resolve(args.referencePptx);
  args.candidateDeck = path.resolve(args.candidateDeck);

  if (!fs.existsSync(args.referencePptx)) {
    throw new Error(`Reference PPTX not found: ${args.referencePptx}`);
  }
  if (!fs.existsSync(args.candidateDeck)) {
    throw new Error(`Candidate deckSpec not found: ${args.candidateDeck}`);
  }

  return args;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function slidePngPath(previewDir, slideNumber) {
  return path.join(previewDir, `slide-${slideNumber}.png`);
}

function listRenderedSlides(previewDir) {
  return fs
    .readdirSync(previewDir)
    .filter((name) => /^slide-\d+\.png$/i.test(name))
    .sort((a, b) => {
      const ai = Number(a.match(/\d+/)?.[0] || 0);
      const bi = Number(b.match(/\d+/)?.[0] || 0);
      return ai - bi;
    })
    .map((name) => path.join(previewDir, name));
}

function assertSlideExists(imagePath, label) {
  if (!fs.existsSync(imagePath)) {
    const previewDir = path.dirname(imagePath);
    const availableSlides = fs.existsSync(previewDir) ? listRenderedSlides(previewDir).length : 0;
    throw new Error(`${label} image not found: ${imagePath} (available rendered slides: ${availableSlides})`);
  }
}

const args = parseArgs();
const adapter = createSlidesAdapter();
const availability = adapter.detectAvailability();
if (!availability.available) {
  throw new Error(
    `Reference parity check requires an available slides runtime. Reason: ${availability.reason || 'unknown'}`,
  );
}

const referencePreviewDir = path.join(args.outDir, 'reference', 'preview');
const candidateDir = path.join(args.outDir, 'candidate');
const candidateOutPath = path.join(candidateDir, 'deck.pptx');
const candidateQaPath = path.join(candidateDir, 'qa.json');
const candidatePreviewDir = path.join(candidateDir, 'preview');
fs.mkdirSync(referencePreviewDir, { recursive: true });
fs.mkdirSync(candidateDir, { recursive: true });

const referenceRender = adapter.renderPreview({
  pptxPath: args.referencePptx,
  outputDir: referencePreviewDir,
  width: args.previewWidth,
  height: args.previewHeight,
});
assert.equal(
  referenceRender.status,
  'ok',
  `Expected reference preview status 'ok', got '${referenceRender.status}' (${referenceRender.reason || 'no-reason'})`,
);

const deckSpec = JSON.parse(fs.readFileSync(args.candidateDeck, 'utf8'));
const templatePackage = loadTemplatePackage(args.template);
await generateToFile(deckSpec, candidateOutPath, {
  templatePackage,
  qaPath: candidateQaPath,
  strict: args.strict,
  allowSparse: args.allowSparse,
  enforceOverlap: true,
  postprocess: {
    withPreview: true,
    withMontage: false,
    withVisualOverflow: true,
    previewWidth: args.previewWidth,
    previewHeight: args.previewHeight,
    previewOutputDir: candidatePreviewDir,
    visualOverflowPadPx: 100,
  },
  postprocessAdapter: adapter,
});

const qa = JSON.parse(fs.readFileSync(candidateQaPath, 'utf8'));
assert.equal(qa?.valid, true, 'Candidate QA is invalid; fix validation errors before parity check.');
assert.equal(qa?.postprocess?.preview?.status, 'ok', 'Candidate preview generation failed.');
assert.equal(
  qa?.postprocess?.overflowVisual?.status,
  'pass',
  `Candidate overflow visual check must pass before parity. Got '${qa?.postprocess?.overflowVisual?.status}'.`,
);

const referenceImage = slidePngPath(referencePreviewDir, args.referenceSlide);
const candidateImage = slidePngPath(candidatePreviewDir, args.candidateSlide);
assertSlideExists(referenceImage, 'Reference slide');
assertSlideExists(candidateImage, 'Candidate slide');

const referenceDims = getImageDimensions(referenceImage);
const candidateDims = getImageDimensions(candidateImage);
assert.deepEqual(
  candidateDims,
  referenceDims,
  `Dimension mismatch.\nreference=${JSON.stringify(referenceDims)}\ncandidate=${JSON.stringify(candidateDims)}`,
);

const referenceHash = sha256File(referenceImage);
const candidateHash = sha256File(candidateImage);
assert.equal(
  candidateHash,
  referenceHash,
  [
    'Exact visual parity failed (sha256 mismatch).',
    `reference slide: ${referenceImage}`,
    `candidate slide: ${candidateImage}`,
    `expected hash: ${referenceHash}`,
    `actual hash:   ${candidateHash}`,
  ].join('\n'),
);

console.log('Reference slide parity passed.');
console.log(`Output root: ${args.outDir}`);
console.log(`Reference: ${referenceImage}`);
console.log(`Candidate: ${candidateImage}`);
console.log(`Hash: ${candidateHash}`);

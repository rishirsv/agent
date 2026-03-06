import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { getImageDimensions } from '../generator/helpers/media.js';
import {
  FIXTURE_ROOT,
  generateFixture,
  listPreviewPngs,
  makeTempRunDir,
  readFixtureManifest,
  writeJson,
} from './harness/lib.mjs';

const manifest = readFixtureManifest();
const referenceFixture = (manifest.fixtures || []).find((entry) => entry.class === 'reference-parity');
assert.ok(referenceFixture, 'Onboarding lane requires at least one reference-parity fixture.');

const outDir = makeTempRunDir('slidegen-onboarding');
const candidateDir = path.join(outDir, 'candidate');
const referenceDir = path.join(outDir, 'reference');

const candidateRun = await generateFixture(referenceFixture.id, {
  outDir: candidateDir,
  enforceOverlap: true,
  postprocess: {
    withPreview: true,
    withMontage: false,
    withVisualOverflow: true,
    previewWidth: 1600,
    previewHeight: 900,
    visualOverflowPadPx: 100,
  },
});

const adapter = candidateRun.adapter;
const availability = adapter.detectAvailability();
assert.equal(
  availability.available,
  true,
  `Onboarding lane requires an available slides runtime (${availability.reason || 'unknown'}).`,
);

const referencePptxPath = path.resolve(FIXTURE_ROOT, referenceFixture.reference.pptx);
fs.mkdirSync(referenceDir, { recursive: true });
const referencePreview = adapter.renderPreview({
  pptxPath: referencePptxPath,
  outputDir: referenceDir,
  width: 1600,
  height: 900,
});
assert.equal(referencePreview.status, 'ok', 'Reference preview should render successfully.');

const candidatePreviewImages = listPreviewPngs(path.join(candidateDir, 'preview'));
const referencePreviewImages = listPreviewPngs(referenceDir);
assert.ok(candidatePreviewImages.length > 0, 'Candidate preview images should exist.');
assert.ok(referencePreviewImages.length > 0, 'Reference preview images should exist.');

const referenceImage =
  referencePreviewImages[Number(referenceFixture.reference.slideNumber || 1) - 1] || referencePreviewImages[0];
const candidateImage =
  candidatePreviewImages[Number(referenceFixture.reference.candidateSlideNumber || 1) - 1] || candidatePreviewImages[0];
assert.ok(referenceImage, 'Reference image must be resolvable.');
assert.ok(candidateImage, 'Candidate image must be resolvable.');

const referenceDims = getImageDimensions(referenceImage);
const candidateDims = getImageDimensions(candidateImage);
const scorecard = {
  fixtureId: referenceFixture.id,
  referenceImage,
  candidateImage,
  candidateOverflowStatus: candidateRun.qa?.artifacts?.overflowVisual?.status || 'skipped',
  referenceDimensions: referenceDims,
  candidateDimensions: candidateDims,
  dimensionsMatch: JSON.stringify(referenceDims) === JSON.stringify(candidateDims),
};
assert.ok(referenceDims.width > 0 && referenceDims.height > 0, 'Reference slide dimensions must be measurable.');
assert.ok(candidateDims.width > 0 && candidateDims.height > 0, 'Candidate slide dimensions must be measurable.');

writeJson(path.join(outDir, 'scorecard.json'), scorecard);

console.log('Onboarding lane passed.');
console.log(`Scorecard: ${path.join(outDir, 'scorecard.json')}`);

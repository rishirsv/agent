import assert from 'node:assert/strict';

import { getImageDimensions } from '../generator/helpers/media.js';
import { generateFixture, listPreviewPngs, makeTempRunDir } from './harness/lib.mjs';

const visualRun = await generateFixture('golden-all-layouts', {
  outDir: makeTempRunDir('slidegen-visual'),
  enforceOverlap: true,
  postprocess: {
    withPreview: true,
    withMontage: true,
    withVisualOverflow: true,
    previewWidth: 1600,
    previewHeight: 900,
    previewOutputDir: null,
    montageOutputFile: null,
    montageCols: 5,
    montageLabelMode: 'number',
    visualOverflowPadPx: 100,
  },
});

const availability = visualRun.adapter.detectAvailability();
assert.equal(availability.available, true, `Visual lane requires an available slides runtime (${availability.reason || 'unknown'}).`);

const qa = visualRun.qa;
const previewDir = `${visualRun.outDir}/preview`;
const previewImages = listPreviewPngs(previewDir);
const previewArtifact = qa?.artifacts?.preview || {};
const montageArtifact = qa?.artifacts?.montage || {};
const overflowArtifact = qa?.artifacts?.overflowVisual || {};

assert.equal(previewArtifact.status, 'pass', 'Preview generation should pass.');
assert.equal(montageArtifact.status, 'pass', 'Montage generation should pass.');
assert.ok(
  ['pass', 'fail'].includes(overflowArtifact.status),
  `Overflow visual status should be pass or fail, got ${overflowArtifact.status}.`,
);
assert.equal(
  previewImages.length,
  qa.run.outputSlideCount,
  'Preview PNG count should match the rendered slide count.',
);

for (const imagePath of previewImages) {
  const dims = getImageDimensions(imagePath);
  assert.ok(dims.width > 0, `Preview width should be > 0 for ${imagePath}`);
  assert.ok(dims.height > 0, `Preview height should be > 0 for ${imagePath}`);
}

console.log('Visual lane passed.');

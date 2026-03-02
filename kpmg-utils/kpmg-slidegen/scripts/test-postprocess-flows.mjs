import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

import { generateToFile } from '../generator/index.js';
import { loadTemplatePackage } from '../generator/runtime/template-package.js';

/**
 * Build a tiny valid deck for postprocess flow tests.
 * @returns {object}
 */
function makeDeck() {
  return {
    metadata: {
      title: 'Postprocess Test Deck',
      author: 'Automated Test',
      company: 'KPMG LLP',
      subject: 'Postprocess',
      allowSparse: true,
      footer: {
        year: 2026,
        legalEntityName: 'KPMG LLP',
        jurisdiction: 'Ontario',
        legalStructure: 'limited liability partnership',
        documentClassification: 'KPMG Confidential',
      },
    },
    slides: [
      {
        type: 'cover',
        title: 'Postprocess',
        subtitle: 'Flow tests',
      },
      {
        type: 'divider',
        sectionNumber: '01',
        sectionTitle: 'Section',
      },
      {
        type: 'oneColumnText',
        title: 'Test',
        strapline: 'Body slide',
        body: ['One', 'Two', 'Three'],
      },
      {
        type: 'backCover',
      },
    ],
  };
}

/**
 * Execute one postprocess scenario.
 * @param {string} caseName
 * @param {object} adapter
 * @returns {Promise<object>}
 */
async function runCase(caseName, adapter) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `slidegen-${caseName}-`));
  const outPath = path.join(tmpDir, 'deck.pptx');
  const qaPath = path.join(tmpDir, 'qa.json');
  const strictDir = path.join(tmpDir, 'strict');
  const templatePackage = loadTemplatePackage('kpmg-diligence');

  const result = await generateToFile(makeDeck(), outPath, {
    templatePackage,
    qaPath,
    allowSparse: true,
    enforceOverlap: false,
    strict: true,
    strictDir,
    postprocess: {
      withPreview: true,
      withMontage: true,
      withVisualOverflow: true,
      previewWidth: 1200,
      previewHeight: 675,
      previewOutputDir: path.join(tmpDir, 'preview'),
      montageOutputFile: path.join(tmpDir, 'montage.png'),
      montageCols: 4,
      montageLabelMode: 'number',
      visualOverflowPadPx: 100,
    },
    postprocessAdapter: adapter,
  });

  const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));
  return { result, qa };
}

const successAdapter = {
  detectAvailability() {
    return { available: true, reason: null, slidesDir: '/fake/slides', python: 'python3' };
  },
  renderPreview({ outputDir, width, height }) {
    return { status: 'ok', reason: null, outputDir, slideImageCount: 4, width, height };
  },
  createMontage({ outputFile, numCol, labelMode }) {
    return { status: 'ok', reason: null, path: outputFile, numCol, labelMode };
  },
  runVisualOverflow() {
    return { status: 'pass', reason: null, failingSlides: [], imagePaths: [] };
  },
};

const failureAdapter = {
  detectAvailability() {
    return { available: true, reason: null, slidesDir: '/fake/slides', python: 'python3' };
  },
  renderPreview({ outputDir }) {
    return { status: 'error', reason: 'preview_failed', outputDir, slideImageCount: 0 };
  },
  createMontage({ outputFile }) {
    return { status: 'error', reason: 'montage_failed', path: outputFile };
  },
  runVisualOverflow() {
    return {
      status: 'fail',
      reason: 'overflow_detected',
      failingSlides: [2],
      imagePaths: ['/tmp/problem-slide-2.png'],
    };
  },
};

const unavailableAdapter = {
  detectAvailability() {
    return {
      available: false,
      reason: 'slides_skill_dir_not_found',
      slidesDir: null,
      python: 'python3',
    };
  },
  renderPreview() {
    return { status: 'skipped', reason: 'slides_skill_dir_not_found', outputDir: null, slideImageCount: 0 };
  },
  createMontage() {
    return { status: 'skipped', reason: 'slides_skill_dir_not_found', path: null };
  },
  runVisualOverflow() {
    return { status: 'skipped', reason: 'slides_skill_dir_not_found', failingSlides: [], imagePaths: [] };
  },
};

const success = await runCase('success', successAdapter);
assert.equal(success.result.strictFailed, false, 'Success case should not fail strict checks');
assert.equal(success.qa.postprocess.preview.status, 'ok');
assert.equal(success.qa.postprocess.montage.status, 'ok');
assert.equal(success.qa.postprocess.overflowVisual.status, 'pass');
assert.equal(success.qa.summary.postprocess.previewAttempted, 1);
assert.equal(success.qa.summary.postprocess.previewFailed, 0);
assert.equal(success.qa.summary.postprocess.montageAttempted, 1);
assert.equal(success.qa.summary.postprocess.montageFailed, 0);
assert.equal(success.qa.summary.postprocess.overflowVisualAttempted, 1);
assert.equal(success.qa.summary.postprocess.overflowVisualFailed, 0);

const failure = await runCase('failure', failureAdapter);
assert.equal(failure.result.strictFailed, true, 'Failure case should fail strict checks');
assert.equal(failure.qa.postprocess.preview.status, 'error');
assert.equal(failure.qa.postprocess.montage.status, 'skipped');
assert.equal(failure.qa.postprocess.overflowVisual.status, 'fail');
assert.equal(failure.qa.summary.postprocess.previewFailed, 1);
assert.equal(failure.qa.summary.postprocess.montageFailed, 0);
assert.equal(failure.qa.summary.postprocess.overflowVisualFailed, 1);

const unavailable = await runCase('unavailable', unavailableAdapter);
assert.equal(unavailable.result.strictFailed, true, 'Unavailable case should fail strict checks (fail-closed)');
assert.equal(unavailable.qa.postprocess.availability.slidesSkill, false);
assert.equal(unavailable.qa.postprocess.preview.status, 'skipped');
assert.equal(unavailable.qa.postprocess.overflowVisual.status, 'skipped');
assert.equal(unavailable.qa.strictOverflow.status, 1, 'Unavailable case should mark strict overflow as failed');
assert.equal(unavailable.qa.summary.postprocess.previewFailed, 0);
assert.equal(unavailable.qa.summary.postprocess.overflowVisualFailed, 0);

console.log('Postprocess flow tests passed (success/failure/unavailable).');

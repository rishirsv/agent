import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { parseCliOptions } from '../generator/app/cli.js';
import { resolveStrictOverflowStatus } from '../generator/app/strict-overflow.js';
import { generateFixture } from './harness/lib.mjs';

const renderRun = await generateFixture('scenario-saas-mid-diligence', {
  enforceOverlap: true,
});
const qa = renderRun.qa;

assert.equal(fs.existsSync(renderRun.outPath), true, 'Render lane should create deck.pptx.');
assert.equal(fs.existsSync(renderRun.qaPath), true, 'Render lane should create qa.json.');
assert.equal(qa?.schemaVersion, 1, 'QA report should expose schemaVersion.');
assert.ok(qa?.run, 'QA report should expose run metadata.');
assert.ok(qa?.outcome, 'QA report should expose outcome metadata.');
assert.ok(Array.isArray(qa?.checks), 'QA report should expose checks.');
assert.ok(Array.isArray(qa?.findings), 'QA report should expose findings.');
assert.ok(Array.isArray(qa?.slides), 'QA report should expose slide summaries.');
assert.ok(qa?.artifacts?.deck?.path, 'QA report should expose deck artifact path.');
assert.ok(qa.run.inputSlideCount > 0, 'Input slide count should be recorded.');
assert.ok(qa.run.outputSlideCount >= qa.run.inputSlideCount, 'Rendered slide count should be >= input slide count.');
assert.ok(
  qa.checks.some((check) => check.id === 'validation'),
  'QA report should include validation check.',
);
assert.ok(
  qa.checks.some((check) => check.id === 'contracts'),
  'QA report should include contracts check.',
);
assert.ok(
  qa.checks.some((check) => check.id === 'pagination'),
  'QA report should include pagination check.',
);
assert.ok(
  qa.checks.some((check) => check.id === 'overlap'),
  'QA report should include overlap check.',
);
assert.equal(
  qa.artifacts.deck.path,
  'deck.pptx',
  'Deck artifact should be recorded relative to the run root.',
);
assert.equal(
  qa.artifacts.qa.path,
  'qa.json',
  'QA artifact should be recorded relative to the run root.',
);
assert.equal(
  qa.slides.length,
  qa.run.outputSlideCount,
  'Slide summaries should cover each rendered slide.',
);

const defaultCli = parseCliOptions(['--in', 'fixtures/harness/golden/all-layouts/deckSpec.json']);
assert.ok(
  defaultCli.outPath.includes(path.join('outputs', 'kpmg-slidegen')),
  'CLI should default outputs under caller cwd outputs/kpmg-slidegen.',
);
assert.equal(
  defaultCli.qaOutPath,
  path.join(path.dirname(defaultCli.outPath), 'qa.json'),
  'CLI should default qa.json beside the generated deck.',
);

const strictOptions = {
  previewWidth: 1600,
  previewHeight: 900,
  visualOverflowPadPx: 100,
};
const strictUnavailable = resolveStrictOverflowStatus({
  strictRequested: true,
  adapter: {
    runVisualOverflow() {
      return { status: 'skipped', reason: 'python_not_found' };
    },
  },
  outPath: renderRun.outPath,
  postprocess: {
    availability: {
      slidesSkill: false,
      reason: 'python_not_found',
    },
    overflowVisual: {
      status: 'skipped',
      reason: 'python_not_found',
    },
  },
  postprocessOptions: strictOptions,
});
assert.equal(
  strictUnavailable.strictOverflow.status,
  1,
  'Strict overflow should fail closed when visual overflow is unavailable.',
);

console.log('Render lane passed.');

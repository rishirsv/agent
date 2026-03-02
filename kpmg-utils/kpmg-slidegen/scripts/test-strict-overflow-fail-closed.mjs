import assert from 'node:assert/strict';

import { resolveStrictOverflowStatus } from '../generator/app/strict-overflow.js';

function makeAdapter(visualResult) {
  return {
    runVisualOverflow() {
      return visualResult;
    },
  };
}

function basePostprocess() {
  return {
    availability: { slidesSkill: true, reason: null },
    overflowVisual: null,
  };
}

const options = {
  previewWidth: 1600,
  previewHeight: 900,
  visualOverflowPadPx: 100,
};

{
  const { strictOverflow } = resolveStrictOverflowStatus({
    strictRequested: false,
    adapter: makeAdapter({ status: 'fail' }),
    outPath: '/tmp/deck.pptx',
    postprocess: basePostprocess(),
    postprocessOptions: options,
  });
  assert.equal(strictOverflow.status, 0);
}

{
  const { strictOverflow } = resolveStrictOverflowStatus({
    strictRequested: true,
    adapter: makeAdapter({ status: 'pass' }),
    outPath: '/tmp/deck.pptx',
    postprocess: {
      ...basePostprocess(),
      overflowVisual: { status: 'pass', failingSlides: [] },
    },
    postprocessOptions: options,
  });
  assert.equal(strictOverflow.status, 0);
}

{
  const { strictOverflow } = resolveStrictOverflowStatus({
    strictRequested: true,
    adapter: makeAdapter({ status: 'fail', reason: 'overflow_detected', failingSlides: [2] }),
    outPath: '/tmp/deck.pptx',
    postprocess: {
      ...basePostprocess(),
      overflowVisual: { status: 'fail', reason: 'overflow_detected', failingSlides: [2] },
    },
    postprocessOptions: options,
  });
  assert.equal(strictOverflow.status, 1);
  assert.equal(strictOverflow.reason, 'overflow_detected');
}

{
  const { strictOverflow } = resolveStrictOverflowStatus({
    strictRequested: true,
    adapter: makeAdapter({ status: 'skipped', reason: 'slides_skill_dir_not_found' }),
    outPath: '/tmp/deck.pptx',
    postprocess: {
      ...basePostprocess(),
      overflowVisual: { status: 'skipped', reason: 'slides_skill_dir_not_found' },
    },
    postprocessOptions: options,
  });
  assert.equal(strictOverflow.status, 1);
  assert.equal(strictOverflow.skipped, true);
  assert.equal(strictOverflow.reason, 'slides_skill_dir_not_found');
}

{
  const { strictOverflow } = resolveStrictOverflowStatus({
    strictRequested: true,
    adapter: makeAdapter({ status: 'error', reason: 'script_failed', stderr: 'traceback' }),
    outPath: '/tmp/deck.pptx',
    postprocess: {
      ...basePostprocess(),
      overflowVisual: { status: 'error', reason: 'script_failed', stderr: 'traceback' },
    },
    postprocessOptions: options,
  });
  assert.equal(strictOverflow.status, 1);
  assert.equal(strictOverflow.skipped, true);
  assert.equal(strictOverflow.stderr, 'traceback');
}

{
  const { strictOverflow } = resolveStrictOverflowStatus({
    strictRequested: true,
    adapter: makeAdapter({ status: 'pass', reason: null, failingSlides: [] }),
    outPath: '/tmp/deck.pptx',
    postprocess: {
      ...basePostprocess(),
      overflowVisual: null,
    },
    postprocessOptions: options,
  });
  assert.equal(strictOverflow.status, 0);
}

{
  const { strictOverflow } = resolveStrictOverflowStatus({
    strictRequested: true,
    adapter: makeAdapter({ status: 'pass' }),
    outPath: '/tmp/deck.pptx',
    postprocess: {
      availability: { slidesSkill: false, reason: 'python_not_found' },
      overflowVisual: null,
    },
    postprocessOptions: options,
  });
  assert.equal(strictOverflow.status, 1);
  assert.equal(strictOverflow.skipped, true);
  assert.equal(strictOverflow.reason, 'python_not_found');
}

console.log('Strict-overflow fail-closed tests passed.');

/**
 * Translate visual overflow status into strict-overflow status.
 * @param {object|null} visualOverflow
 * @param {{ failClosed?: boolean }} [options]
 * @returns {object|null}
 */
function strictStatusFromVisualOverflow(visualOverflow, options = {}) {
  const failClosed = options.failClosed !== false;
  if (!visualOverflow) return null;
  if (visualOverflow.status === 'pass') {
    return { status: 0, mode: 'visual_overflow', failingSlides: [] };
  }
  if (visualOverflow.status === 'fail') {
    return {
      status: 1,
      mode: 'visual_overflow',
      failingSlides: visualOverflow.failingSlides || [],
      imagePaths: visualOverflow.imagePaths || [],
      reason: visualOverflow.reason || 'overflow_detected',
      stderr: visualOverflow.stderr || null,
    };
  }
  if (visualOverflow.status === 'skipped') {
    return {
      status: failClosed ? 1 : 0,
      skipped: true,
      mode: 'visual_overflow',
      reason: visualOverflow.reason || 'visual_overflow_skipped',
      stderr: visualOverflow.stderr || null,
    };
  }
  if (visualOverflow.status === 'error') {
    return {
      status: failClosed ? 1 : 0,
      skipped: true,
      mode: 'visual_overflow',
      reason: visualOverflow.reason || 'visual_overflow_error',
      stderr: visualOverflow.stderr || null,
    };
  }
  return null;
}

/**
 * Resolve strict overflow status using the adapter-backed visual checker only.
 * @param {object} params
 * @returns {{strictOverflow: object, postprocess: object|null}}
 */
export function resolveStrictOverflowStatus({
  strictRequested,
  adapter,
  outPath,
  postprocess,
  postprocessOptions,
}) {
  if (!strictRequested) return { strictOverflow: { status: 0 }, postprocess };

  // Strict mode fails closed: if visual overflow cannot be verified, strict fails.
  let strictStatus = strictStatusFromVisualOverflow(postprocess?.overflowVisual || null, { failClosed: true });

  // If strict mode is enabled and visual overflow wasn't run yet, run it once here.
  if (!strictStatus && postprocess?.availability?.slidesSkill) {
    const strictVisual = adapter.runVisualOverflow({
      pptxPath: outPath,
      width: postprocessOptions.previewWidth,
      height: postprocessOptions.previewHeight,
      padPx: postprocessOptions.visualOverflowPadPx,
    });
    postprocess.overflowVisual = {
      attempted: true,
      status: strictVisual?.status || 'error',
      reason: strictVisual?.reason || null,
      stderr: strictVisual?.stderr || null,
      failingSlides: strictVisual?.failingSlides || [],
      imagePaths: strictVisual?.imagePaths || [],
    };
    strictStatus = strictStatusFromVisualOverflow(postprocess.overflowVisual, { failClosed: true });
  }

  if (strictStatus) return { strictOverflow: strictStatus, postprocess };

  return {
    strictOverflow: {
      status: 1,
      skipped: true,
      mode: 'visual_overflow',
      reason: postprocess?.availability?.reason || 'visual_overflow_unavailable',
      stderr: null,
    },
    postprocess,
  };
}

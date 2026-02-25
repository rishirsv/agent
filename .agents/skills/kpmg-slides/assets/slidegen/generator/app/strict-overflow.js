/**
 * Translate visual overflow status into strict-overflow status.
 * @param {object|null} visualOverflow
 * @returns {object|null}
 */
function strictStatusFromVisualOverflow(visualOverflow) {
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
    };
  }
  if (visualOverflow.status === 'skipped') {
    return {
      status: 0,
      skipped: true,
      mode: 'visual_overflow',
      reason: visualOverflow.reason || 'visual_overflow_skipped',
    };
  }
  if (visualOverflow.status === 'error') {
    return {
      status: 0,
      skipped: true,
      mode: 'visual_overflow',
      reason: visualOverflow.reason || 'visual_overflow_error',
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

  let strictStatus = strictStatusFromVisualOverflow(postprocess?.overflowVisual || null);

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
    strictStatus = strictStatusFromVisualOverflow(postprocess.overflowVisual);
  }

  if (strictStatus) return { strictOverflow: strictStatus, postprocess };

  return {
    strictOverflow: {
      status: 0,
      skipped: true,
      mode: 'visual_overflow',
      reason: postprocess?.availability?.reason || 'visual_overflow_unavailable',
    },
    postprocess,
  };
}

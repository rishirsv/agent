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
      stderr: visualOverflow.stderr || null,
    };
  }
  if (visualOverflow.status === 'skipped') {
    return {
      status: 1,
      skipped: true,
      mode: 'visual_overflow',
      reason: visualOverflow.reason || 'visual_overflow_skipped',
      stderr: visualOverflow.stderr || null,
    };
  }
  if (visualOverflow.status === 'error') {
    return {
      status: 1,
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
  postprocess,
}) {
  if (!strictRequested) return { strictOverflow: { status: 0 }, postprocess };

  // Strict mode fails closed: if visual overflow cannot be verified, strict fails.
  const strictStatus = strictStatusFromVisualOverflow(postprocess?.overflowVisual || null);
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

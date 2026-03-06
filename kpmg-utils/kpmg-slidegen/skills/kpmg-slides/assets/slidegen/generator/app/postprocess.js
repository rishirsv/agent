import { listPreviewImages } from './artifacts.js';

/**
 * Parse a positive integer-like CLI value with fallback.
 * @param {string|boolean|undefined|number|null} raw
 * @param {number} fallback
 * @returns {number}
 */
export function parsePositiveInt(raw, fallback) {
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return fallback;
}

/**
 * Build the default postprocess object for a run.
 * @param {object} availability
 * @returns {object}
 */
function createInitialPostprocessReport(availability = {}) {
  return {
    availability: {
      slidesSkill: Boolean(availability?.available),
      reason: availability?.reason || null,
      slidesDir: availability?.slidesDir || null,
      python: availability?.python || null,
    },
    preview: {
      attempted: false,
      status: 'not_requested',
      reason: null,
      outputDir: null,
      slideImageCount: 0,
      imagePaths: [],
    },
    montage: {
      attempted: false,
      status: 'not_requested',
      reason: null,
      path: null,
      numCol: null,
      labelMode: null,
    },
    overflowVisual: {
      attempted: false,
      status: 'not_requested',
      reason: null,
      failingSlides: [],
      imagePaths: [],
    },
  };
}

/**
 * Convert postprocess status fields into summary counters.
 * @param {object|null} postprocess
 * @returns {object|null}
 */
export function buildPostprocessSummary(postprocess) {
  if (!postprocess) return null;
  const sections = [
    ['preview', postprocess.preview],
    ['montage', postprocess.montage],
    ['overflowVisual', postprocess.overflowVisual],
  ];
  const out = {};
  for (const [name, section] of sections) {
    out[`${name}Attempted`] = Boolean(section?.attempted) ? 1 : 0;
    out[`${name}Failed`] = section?.status === 'error' || section?.status === 'fail' ? 1 : 0;
    out[`${name}Status`] = section?.status || 'unknown';
  }
  return out;
}

/**
 * Build postprocess execution options with defaults.
 * @param {object} options
 * @param {string} outPath
 * @param {object} deps
 * @returns {object}
 */
export function buildPostprocessOptions(options, outPath, deps = {}) {
  const pathMod = deps.pathModule;
  return {
    withPreview: Boolean(options?.postprocess?.withPreview),
    withMontage: Boolean(options?.postprocess?.withMontage),
    withVisualOverflow: Boolean(options?.postprocess?.withVisualOverflow),
    previewWidth: parsePositiveInt(options?.postprocess?.previewWidth, 1600),
    previewHeight: parsePositiveInt(options?.postprocess?.previewHeight, 900),
    previewOutputDir:
      options?.postprocess?.previewOutputDir || pathMod.join(pathMod.dirname(outPath), 'preview'),
    montageOutputFile:
      options?.postprocess?.montageOutputFile || pathMod.join(pathMod.dirname(outPath), 'montage.png'),
    montageCols: parsePositiveInt(options?.postprocess?.montageCols, 5),
    montageLabelMode: options?.postprocess?.montageLabelMode || 'number',
    visualOverflowPadPx: parsePositiveInt(options?.postprocess?.visualOverflowPadPx, 100),
  };
}

/**
 * Execute optional postprocess flows against generated PPTX outputs.
 * @param {object} params
 * @returns {{postprocess: object, strictVisualOverflow: object|null}}
 */
export function runPostprocessPipelines({ adapter, outPath, options, onWarning }) {
  const availability =
    typeof adapter?.detectAvailability === 'function'
      ? adapter.detectAvailability()
      : { available: false, reason: 'missing_adapter_detect_availability' };

  const postprocess = createInitialPostprocessReport(availability);
  let strictVisualOverflow = null;

  const previewRequested = Boolean(options.withPreview || options.withMontage);
  if (previewRequested) {
    postprocess.preview.attempted = true;
    const previewResult = adapter.renderPreview({
      pptxPath: outPath,
      outputDir: options.previewOutputDir,
      width: options.previewWidth,
      height: options.previewHeight,
    });
    postprocess.preview = {
      attempted: true,
      status: previewResult?.status || 'error',
      reason: previewResult?.reason || null,
      stderr: previewResult?.stderr || null,
      outputDir: previewResult?.outputDir || options.previewOutputDir,
      slideImageCount: Number(previewResult?.slideImageCount || 0),
      imagePaths: listPreviewImages(previewResult?.outputDir || options.previewOutputDir),
      width: options.previewWidth,
      height: options.previewHeight,
    };
    if (postprocess.preview.status === 'error') {
      onWarning(`Postprocess preview failed: ${postprocess.preview.reason || 'unknown_error'}`);
    }
    if (postprocess.preview.status === 'skipped') {
      onWarning(`Postprocess preview skipped: ${postprocess.preview.reason || 'unavailable'}`);
    }
  }

  if (options.withMontage) {
    postprocess.montage.attempted = true;
    if (postprocess.preview.status !== 'ok') {
      postprocess.montage = {
        attempted: true,
        status: 'skipped',
        reason: 'preview_not_ready',
        path: options.montageOutputFile,
        numCol: options.montageCols,
        labelMode: options.montageLabelMode,
      };
      onWarning('Postprocess montage skipped: preview images were not successfully created.');
    } else {
      const montageResult = adapter.createMontage({
        inputDir: postprocess.preview.outputDir,
        outputFile: options.montageOutputFile,
        numCol: options.montageCols,
        labelMode: options.montageLabelMode,
      });
      postprocess.montage = {
        attempted: true,
        status: montageResult?.status || 'error',
        reason: montageResult?.reason || null,
        stderr: montageResult?.stderr || null,
        path: montageResult?.path || options.montageOutputFile,
        numCol: options.montageCols,
        labelMode: options.montageLabelMode,
      };
      if (postprocess.montage.status === 'error') {
        onWarning(`Postprocess montage failed: ${postprocess.montage.reason || 'unknown_error'}`);
      }
      if (postprocess.montage.status === 'skipped') {
        onWarning(`Postprocess montage skipped: ${postprocess.montage.reason || 'unavailable'}`);
      }
    }
  }

  if (options.withVisualOverflow) {
    postprocess.overflowVisual.attempted = true;
    const overflowResult = adapter.runVisualOverflow({
      pptxPath: outPath,
      width: options.previewWidth,
      height: options.previewHeight,
      padPx: options.visualOverflowPadPx,
    });
    postprocess.overflowVisual = {
      attempted: true,
      status: overflowResult?.status || 'error',
      reason: overflowResult?.reason || null,
      stderr: overflowResult?.stderr || null,
      failingSlides: overflowResult?.failingSlides || [],
      imagePaths: overflowResult?.imagePaths || [],
    };
    strictVisualOverflow = postprocess.overflowVisual;
    if (postprocess.overflowVisual.status === 'error') {
      onWarning(
        `Postprocess visual overflow failed: ${postprocess.overflowVisual.reason || 'unknown_error'}`,
      );
    }
    if (postprocess.overflowVisual.status === 'skipped') {
      onWarning(
        `Postprocess visual overflow skipped: ${postprocess.overflowVisual.reason || 'unavailable'}`,
      );
    }
  }

  return { postprocess, strictVisualOverflow };
}

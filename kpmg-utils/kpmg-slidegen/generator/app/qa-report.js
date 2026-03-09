import fs from 'node:fs';
import path from 'node:path';

import { listPreviewImages } from './artifacts.js';

const STATUS_ALIASES = Object.freeze({
  ok: 'pass',
  pass: 'pass',
  valid: 'pass',
  warning: 'warn',
  warn: 'warn',
  fail: 'fail',
  invalid: 'fail',
  not_requested: 'skipped',
  skipped: 'skipped',
  error: 'error',
});

/**
 * Normalize a status value into the public QA status family.
 * @param {string|null|undefined} status
 * @returns {'pass'|'warn'|'fail'|'skipped'|'error'}
 */
function normalizeStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  return STATUS_ALIASES[value] || 'error';
}

/**
 * Map a finding severity to a public QA status.
 * @param {string|null|undefined} severity
 * @returns {'pass'|'warn'|'fail'}
 */
function statusFromSeverity(severity) {
  if (severity === 'error') return 'fail';
  if (severity === 'warning') return 'warn';
  return 'pass';
}

/**
 * Return a stable string path relative to a run root when possible.
 * @param {string} runRoot
 * @param {string|null|undefined} targetPath
 * @returns {string|null}
 */
function relativeArtifactPath(runRoot, targetPath) {
  if (!targetPath) return null;
  if (!path.isAbsolute(targetPath)) return targetPath.split(path.sep).join('/');
  const relative = path.relative(runRoot, targetPath);
  if (!relative || relative.startsWith('..')) return targetPath.split(path.sep).join('/');
  return relative.split(path.sep).join('/');
}

/**
 * Build a normalized check row.
 * @param {object} input
 * @returns {object}
 */
function makeCheck({ id, status, blocking = false, summary, metrics = {}, details = {}, artifacts = {} }) {
  return {
    id,
    status: normalizeStatus(status),
    blocking: Boolean(blocking),
    summary,
    metrics,
    details,
    artifacts,
  };
}

/**
 * Convert freeform messages into normalized findings.
 * @param {string[]} messages
 * @param {object} base
 * @returns {object[]}
 */
function messageFindings(messages = [], base = {}) {
  return (messages || []).map((message) => ({
    code: base.code || 'message',
    severity: base.severity || 'warning',
    blocking: Boolean(base.blocking),
    checkId: base.checkId || 'validation',
    slideIndex: base.slideIndex ?? null,
    outputSlideIndex: base.outputSlideIndex ?? null,
    slideType: base.slideType || null,
    slot: base.slot || null,
    message: String(message),
    suggestedRemedy: base.suggestedRemedy || null,
    details: base.details || {},
  }));
}

/**
 * Build normalized findings from slot issues.
 * @param {object[]} issues
 * @returns {object[]}
 */
function slotIssueFindings(issues = []) {
  return issues.map((issue) => ({
    code: issue?.code || 'slot_issue',
    severity: issue?.severity === 'error' ? 'error' : 'warning',
    blocking: issue?.severity === 'error',
    checkId: 'validation',
    slideIndex: issue?.slideIndex ?? null,
    outputSlideIndex: null,
    slideType: issue?.slideType || null,
    slot: issue?.slot || null,
    message: issue?.message || 'Slot issue detected.',
    suggestedRemedy: issue?.suggestedRemedy || null,
    details: {
      actual: issue?.actual ?? null,
      target: issue?.target ?? null,
      kind: issue?.kind || null,
      hook: issue?.hook || null,
    },
  }));
}

/**
 * Build normalized findings from the verbosity contract.
 * @param {object} verbosity
 * @returns {object[]}
 */
function verbosityFindings(verbosity = null) {
  return Array.isArray(verbosity?.findings)
    ? verbosity.findings.map((finding) => ({
        code: finding?.code || 'verbosity_contract',
        severity: finding?.severity === 'error' ? 'error' : 'warning',
        blocking: false,
        checkId: 'verbosity',
        slideIndex: finding?.slideIndex ?? null,
        outputSlideIndex: null,
        slideType: finding?.slideType || null,
        slot: null,
        message: finding?.message || 'Verbosity contract mismatch.',
        suggestedRemedy: finding?.suggestedRemedy || null,
        details: {
          metric: finding?.metric || null,
          actual: finding?.actual ?? null,
          targetRange: finding?.targetRange || null,
        },
      }))
    : [];
}

/**
 * Build normalized findings from automatic pagination events.
 * @param {object[]} overflowEvents
 * @returns {object[]}
 */
function overflowFindings(overflowEvents = []) {
  return overflowEvents
    .filter((event) => Number(event?.splitInto || 0) > 1)
    .map((event) => ({
      code: 'auto_split',
      severity: Number(event?.splitInto || 0) >= 3 ? 'warning' : 'info',
      blocking: false,
      checkId: 'pagination',
      slideIndex: event?.slideIndex ?? null,
      outputSlideIndex: null,
      slideType: event?.slideType || null,
      slot: null,
      message: `Slide auto-split into ${event?.splitInto} page(s) using ${event?.mode || 'unknown'} pagination.`,
      suggestedRemedy: 'Keep the continuation split or tighten the content so the slide fits intentionally.',
      details: {
        mode: event?.mode || null,
        event: event?.event || null,
        splitInto: Number(event?.splitInto || 0),
        originalCount: Number(event?.originalCount || 0),
      },
    }));
}

/**
 * Build normalized findings from overlap inspection.
 * @param {object|null} overlapReport
 * @returns {object[]}
 */
function overlapFindings(overlapReport = null) {
  if (!overlapReport || !Array.isArray(overlapReport.slides)) return [];
  const findings = [];
  overlapReport.slides.forEach((slideReport, outputSlideIndex) => {
    const overlaps = Array.isArray(slideReport?.overlaps) ? slideReport.overlaps : [];
    overlaps.forEach((overlap) => {
      findings.push({
        code: 'overlap_detected',
        severity: overlap?.severity === 'severe' ? 'error' : 'warning',
        blocking: overlap?.severity === 'severe',
        checkId: 'overlap',
        slideIndex: null,
        outputSlideIndex,
        slideType: null,
        slot: null,
        message: overlap?.suggestion
          ? `Overlap detected: ${overlap.suggestion}`
          : 'Overlap detected between rendered slide elements.',
        suggestedRemedy: overlap?.suggestion || 'Adjust layout geometry or reduce content density.',
        details: {
          elementA: overlap?.a?.type || null,
          elementB: overlap?.b?.type || null,
          severity: overlap?.severity || null,
        },
      });
    });
  });
  return findings;
}

/**
 * Build normalized findings from diagnostics fallbacks.
 * @param {string[]} fallbacks
 * @returns {object[]}
 */
function fallbackFindings(fallbacks = []) {
  return messageFindings(fallbacks, {
    code: 'runtime_fallback_used',
    severity: 'warning',
    blocking: false,
    checkId: 'contracts',
    suggestedRemedy: 'Remove template/runtime drift so the generator does not need fallback behavior.',
  });
}

/**
 * Build normalized findings from postprocess failures.
 * @param {object|null} postprocess
 * @param {boolean} strictRequested
 * @returns {object[]}
 */
function postprocessFindings(postprocess = null, strictRequested = false) {
  if (!postprocess) return [];
  const findings = [];
  const previewStatus = normalizeStatus(postprocess?.preview?.status || 'skipped');
  const montageStatus = normalizeStatus(postprocess?.montage?.status || 'skipped');
  const overflowStatus = normalizeStatus(postprocess?.overflowVisual?.status || 'skipped');

  if (previewStatus === 'error') {
    findings.push({
      code: 'preview_generation_failed',
      severity: 'warning',
      blocking: false,
      checkId: 'visual_preview',
      slideIndex: null,
      outputSlideIndex: null,
      slideType: null,
      slot: null,
      message: `Preview generation failed: ${postprocess?.preview?.reason || 'unknown_reason'}`,
      suggestedRemedy: 'Repair the slides runtime or install the required preview dependencies.',
      details: {
        stderr: postprocess?.preview?.stderr || null,
      },
    });
  }

  if (montageStatus === 'error') {
    findings.push({
      code: 'montage_generation_failed',
      severity: 'warning',
      blocking: false,
      checkId: 'montage',
      slideIndex: null,
      outputSlideIndex: null,
      slideType: null,
      slot: null,
      message: `Montage generation failed: ${postprocess?.montage?.reason || 'unknown_reason'}`,
      suggestedRemedy: 'Repair the slides runtime montage path or regenerate preview images.',
      details: {
        stderr: postprocess?.montage?.stderr || null,
      },
    });
  }

  if (overflowStatus === 'fail' || (strictRequested && overflowStatus !== 'pass')) {
    findings.push({
      code: strictRequested ? 'strict_visual_overflow_failed' : 'visual_overflow_failed',
      severity: strictRequested ? 'error' : 'warning',
      blocking: Boolean(strictRequested),
      checkId: 'visual_overflow',
      slideIndex: null,
      outputSlideIndex: null,
      slideType: null,
      slot: null,
      message:
        overflowStatus === 'fail'
          ? 'Visual overflow was detected in rendered slide previews.'
          : `Visual overflow could not be verified: ${postprocess?.overflowVisual?.reason || 'unavailable'}`,
      suggestedRemedy: 'Fix overflow on the failing slides or restore the visual overflow runtime.',
      details: {
        failingSlides: postprocess?.overflowVisual?.failingSlides || [],
        imagePaths: postprocess?.overflowVisual?.imagePaths || [],
        stderr: postprocess?.overflowVisual?.stderr || null,
      },
    });
  }

  return findings;
}

/**
 * Count findings by severity.
 * @param {object[]} findings
 * @returns {{error: number, warning: number, info: number}}
 */
function countFindings(findings = []) {
  return findings.reduce(
    (counts, finding) => {
      const severity = finding?.severity || 'warning';
      counts[severity] = Number(counts[severity] || 0) + 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}

/**
 * Determine the overall status of a slide or run from related findings.
 * @param {object[]} findings
 * @returns {'pass'|'warn'|'fail'}
 */
function aggregateFindingStatus(findings = []) {
  if (findings.some((finding) => finding?.severity === 'error' && finding?.blocking !== false)) return 'fail';
  if (findings.some((finding) => finding?.severity === 'error' || finding?.severity === 'warning')) return 'warn';
  return 'pass';
}

/**
 * Index findings by input and output slide references for fast lookup.
 * @param {object[]} findings
 * @returns {{input: Map<number, object[]>, output: Map<number, object[]>}}
 */
function indexFindingsBySlide(findings = []) {
  const input = new Map();
  const output = new Map();

  for (const finding of findings) {
    if (Number.isInteger(finding?.slideIndex)) {
      const group = input.get(finding.slideIndex) || [];
      group.push(finding);
      input.set(finding.slideIndex, group);
    }
    if (Number.isInteger(finding?.outputSlideIndex)) {
      const group = output.get(finding.outputSlideIndex) || [];
      group.push(finding);
      output.set(finding.outputSlideIndex, group);
    }
  }

  return { input, output };
}

/**
 * Merge findings for one slide reference pair without duplication.
 * @param {{input: Map<number, object[]>, output: Map<number, object[]>}} index
 * @param {number|null} inputSlideIndex
 * @param {number|null} outputSlideIndex
 * @returns {object[]}
 */
function getSlideFindings(index, inputSlideIndex, outputSlideIndex) {
  const merged = [];
  const seen = new Set();
  const groups = [];
  if (Number.isInteger(inputSlideIndex)) groups.push(index.input.get(inputSlideIndex) || []);
  if (Number.isInteger(outputSlideIndex)) groups.push(index.output.get(outputSlideIndex) || []);

  for (const group of groups) {
    for (const finding of group) {
      if (seen.has(finding)) continue;
      seen.add(finding);
      merged.push(finding);
    }
  }

  return merged;
}

/**
 * Build the per-slide QA summary array.
 * @param {object} params
 * @returns {object[]}
 */
function buildSlides({
  deckSpec,
  renderQa,
  validation,
  verbosity,
  findings,
}) {
  const findingIndex = indexFindingsBySlide(findings);
  const densityByInputIndex = new Map(
    (validation?.qa?.densityFindings || []).map((finding) => [finding.slideIndex, finding]),
  );
  const verbosityByInputIndex = new Map();
  for (const finding of verbosity?.findings || []) {
    if (!Number.isInteger(finding?.slideIndex)) continue;
    const group = verbosityByInputIndex.get(finding.slideIndex) || [];
    group.push(finding);
    verbosityByInputIndex.set(finding.slideIndex, group);
  }
  const masterByOutputIndex = new Map(
    (renderQa?.masterApplied || []).map((row) => [row.slideIndex, row]),
  );

  const slideTrace = Array.isArray(renderQa?.slideTrace) ? renderQa.slideTrace : [];
  if (slideTrace.length === 0) {
    return (deckSpec?.slides || []).map((slideSpec, slideIndex) => {
      const relatedFindings = getSlideFindings(findingIndex, slideIndex, null);
      return {
        inputSlideIndex: slideIndex,
        outputSlideIndex: null,
        slideType: slideSpec?.type || null,
        status: aggregateFindingStatus(relatedFindings),
        pagination: {
          mode: null,
          policyKey: null,
          pageIndex: 0,
          pageCount: 0,
          split: false,
        },
        master: null,
        density: densityByInputIndex.get(slideIndex) || null,
        verbosity: {
          findings: verbosityByInputIndex.get(slideIndex) || [],
        },
        findingCodes: relatedFindings.map((finding) => finding.code),
      };
    });
  }

  return slideTrace.map((trace) => {
    const relatedFindings = getSlideFindings(
      findingIndex,
      trace.inputSlideIndex,
      trace.outputSlideIndex,
    );
    return {
      inputSlideIndex: trace.inputSlideIndex,
      outputSlideIndex: trace.outputSlideIndex,
      slideType: trace.slideType,
      sourceSlideType: trace.sourceSlideType,
      status: aggregateFindingStatus(relatedFindings),
      pagination: trace.pagination,
      master: masterByOutputIndex.get(trace.outputSlideIndex) || null,
      density: densityByInputIndex.get(trace.inputSlideIndex) || null,
      verbosity: {
        findings: verbosityByInputIndex.get(trace.inputSlideIndex) || [],
      },
      findingCodes: relatedFindings.map((finding) => finding.code),
    };
  });
}

/**
 * Build the normalized artifact index for the run.
 * @param {object} params
 * @returns {object}
 */
function buildArtifacts({ runRoot, outPath, qaPath, postprocess }) {
  const previewDir = postprocess?.preview?.outputDir || null;
  const previewImages =
    Array.isArray(postprocess?.preview?.imagePaths) && postprocess.preview.imagePaths.length > 0
      ? postprocess.preview.imagePaths
      : listPreviewImages(previewDir);
  return {
    runRoot: relativeArtifactPath(runRoot, runRoot) || '.',
    deck: {
      path: relativeArtifactPath(runRoot, outPath),
      exists: Boolean(outPath && fs.existsSync(outPath)),
    },
    qa: {
      path: relativeArtifactPath(runRoot, qaPath),
      exists: Boolean(qaPath),
    },
    preview: {
      status: normalizeStatus(postprocess?.preview?.status || 'skipped'),
      outputDir: relativeArtifactPath(runRoot, previewDir),
      slideCount: Number(postprocess?.preview?.slideImageCount || previewImages.length || 0),
      imagePaths: previewImages.map((filePath) => relativeArtifactPath(runRoot, filePath)),
      width: Number(postprocess?.preview?.width || 0) || null,
      height: Number(postprocess?.preview?.height || 0) || null,
      reason: postprocess?.preview?.reason || null,
    },
    montage: {
      status: normalizeStatus(postprocess?.montage?.status || 'skipped'),
      path: relativeArtifactPath(runRoot, postprocess?.montage?.path || null),
      reason: postprocess?.montage?.reason || null,
    },
    overflowVisual: {
      status: normalizeStatus(postprocess?.overflowVisual?.status || 'skipped'),
      failingSlides: postprocess?.overflowVisual?.failingSlides || [],
      imagePaths: (postprocess?.overflowVisual?.imagePaths || []).map((filePath) =>
        relativeArtifactPath(runRoot, filePath),
      ),
      reason: postprocess?.overflowVisual?.reason || null,
    },
  };
}

/**
 * Build the normalized QA report for one generation run.
 * @param {object} params
 * @returns {object}
 */
export function buildQaReport({
  deckSpec,
  templatePackage,
  outPath,
  qaPath,
  runRoot = path.dirname(outPath || qaPath || process.cwd()),
  validation,
  renderQa = null,
  overlapReport = null,
  postprocess = null,
  strictRequested = false,
  diagnostics = {},
}) {
  const inputSlideCount = Array.isArray(deckSpec?.slides) ? deckSpec.slides.length : 0;
  const outputSlideCount = Array.isArray(renderQa?.slideTrace)
    ? renderQa.slideTrace.length
    : Number(renderQa?.outputSlideCount || 0);
  const verbosity = validation?.qa?.verbosityContract || null;

  const findings = [
    ...messageFindings(validation?.errors || [], {
      code: 'validation_error',
      severity: 'error',
      blocking: true,
      checkId: 'validation',
      suggestedRemedy: 'Fix the failing slide contract or required-slot error before rendering again.',
    }),
    ...messageFindings(validation?.warnings || [], {
      code: 'validation_warning',
      severity: 'warning',
      blocking: false,
      checkId: 'validation',
    }),
    ...((validation?.qa?.missingSlots || []).map((missing) => ({
      code: 'missing_required_slot',
      severity: 'error',
      blocking: true,
      checkId: 'validation',
      slideIndex: missing?.slideIndex ?? null,
      outputSlideIndex: null,
      slideType: missing?.slideType || null,
      slot: missing?.slot || null,
      message: `Missing required slot "${missing?.slot}" on ${missing?.slideType || 'unknown'} slide.`,
      suggestedRemedy: 'Fill the required slot with valid content before rendering again.',
      details: {},
    })) || []),
    ...slotIssueFindings(validation?.qa?.slotIssues || []),
    ...verbosityFindings(verbosity),
    ...((renderQa?.tableWarnings || []).map((warning) => ({
      code: warning?.code || 'table_warning',
      severity: warning?.severity === 'error' ? 'error' : 'warning',
      blocking: false,
      checkId: 'pagination',
      slideIndex: warning?.slideIndex ?? null,
      outputSlideIndex: null,
      slideType: warning?.slideType || null,
      slot: 'table',
      message: warning?.message || 'Table pagination warning.',
      suggestedRemedy: 'Tighten row text or split the table across multiple slides.',
      details: warning?.details || {},
    })) || []),
    ...overflowFindings(renderQa?.overflowEvents || []),
    ...overlapFindings(overlapReport),
    ...fallbackFindings(diagnostics?.fallbacks || []),
    ...postprocessFindings(postprocess, strictRequested),
  ];

  const overlapSummary = overlapReport?.summary || {};
  const contractsCheck = makeCheck({
    id: 'contracts',
    status: (diagnostics?.fallbacks || []).length > 0 ? 'warn' : 'pass',
    blocking: true,
    summary:
      (diagnostics?.fallbacks || []).length > 0
        ? 'Runtime fallbacks were used during generation.'
        : 'Template contracts and master wiring completed without runtime fallback usage.',
    metrics: {
      fallbackCount: Number((diagnostics?.fallbacks || []).length),
      masterMismatchCount: Number((renderQa?.masterApplied || []).filter((row) => row?.matched === false).length),
    },
    details: {
      fallbacks: diagnostics?.fallbacks || [],
    },
  });

  const validationCounts = countFindings(
    findings.filter((finding) => finding?.checkId === 'validation'),
  );
  const validationCheck = makeCheck({
    id: 'validation',
    status:
      validationCounts.error > 0
        ? 'fail'
        : validationCounts.warning > 0
          ? 'warn'
          : validation?.valid === false
            ? 'fail'
            : 'pass',
    blocking: true,
    summary:
      validationCounts.error > 0
        ? 'Deck validation found blocking issues.'
        : validationCounts.warning > 0
          ? 'Deck validation passed with advisory issues.'
          : 'Deck validation passed.',
    metrics: {
      errorCount: validationCounts.error,
      warningCount: validationCounts.warning,
      missingSlotCount: Number((validation?.qa?.missingSlots || []).length),
      slotIssueCount: Number((validation?.qa?.slotIssues || []).length),
    },
  });

  const verbositySummary = verbosity?.summary || { status: 'pass', failCount: 0, warnCount: 0 };
  const verbosityCheck = makeCheck({
    id: 'verbosity',
    status: verbositySummary.status || 'pass',
    blocking: false,
    summary:
      verbositySummary.status === 'fail'
        ? 'Requested verbosity tier does not match authored slide density closely enough.'
        : verbositySummary.status === 'warn'
          ? 'Requested verbosity tier is mostly aligned but needs cleanup on some slides.'
          : 'Requested verbosity tier is aligned with the authored slides.',
    metrics: {
      failCount: Number(verbositySummary.failCount || 0),
      warningCount: Number(verbositySummary.warnCount || 0),
      checkedSlideCount: Number(verbositySummary.checkedSlideCount || 0),
      textAmount: verbosity?.metadata?.textAmount || null,
    },
  });

  const splitCount = Number((renderQa?.overflowEvents || []).filter((event) => Number(event?.splitInto || 0) > 1).length);
  const paginationCheck = makeCheck({
    id: 'pagination',
    status: Number((renderQa?.tableWarnings || []).length) > 0 ? 'warn' : 'pass',
    blocking: true,
    summary:
      Number((renderQa?.tableWarnings || []).length) > 0
        ? 'Pagination completed with table-density warnings.'
        : 'Pagination completed without blocking issues.',
    metrics: {
      decisionCount: Number((renderQa?.paginationDecisions || []).length),
      splitCount,
      recomputeFieldCount: Number((renderQa?.recomputeFields || []).length),
      tableWarningCount: Number((renderQa?.tableWarnings || []).length),
    },
    details: {
      recomputeFields: renderQa?.recomputeFields || [],
      decisions: renderQa?.paginationDecisions || [],
    },
  });

  const overlapCheck = makeCheck({
    id: 'overlap',
    status:
      Number(overlapSummary?.severeCount || 0) > 0
        ? 'fail'
        : Number(overlapSummary?.warningCount || 0) > 0
          ? 'warn'
          : overlapReport
            ? 'pass'
            : 'skipped',
    blocking: true,
    summary:
      Number(overlapSummary?.severeCount || 0) > 0
        ? 'Severe overlaps were detected in the rendered deck.'
        : Number(overlapSummary?.warningCount || 0) > 0
          ? 'Minor overlaps were detected in the rendered deck.'
          : overlapReport
            ? 'No overlaps were detected in the rendered deck.'
            : 'Overlap inspection was skipped.',
    metrics: {
      severeCount: Number(overlapSummary?.severeCount || 0),
      warningCount: Number(overlapSummary?.warningCount || 0),
      slideCount: Number((overlapReport?.slides || []).length),
    },
  });

  const previewStatus = normalizeStatus(postprocess?.preview?.status || 'skipped');
  const montageStatus = normalizeStatus(postprocess?.montage?.status || 'skipped');
  const visualOverflowStatus = normalizeStatus(postprocess?.overflowVisual?.status || 'skipped');
  const previewCheck = makeCheck({
    id: 'visual_preview',
    status: previewStatus,
    blocking: false,
    summary:
      previewStatus === 'pass'
        ? 'Preview images were generated successfully.'
        : previewStatus === 'skipped'
          ? 'Preview generation was skipped.'
          : 'Preview generation did not complete successfully.',
    metrics: {
      attempted: Boolean(postprocess?.preview?.attempted),
      slideImageCount: Number(postprocess?.preview?.slideImageCount || 0),
    },
  });
  const montageCheck = makeCheck({
    id: 'montage',
    status: montageStatus,
    blocking: false,
    summary:
      montageStatus === 'pass'
        ? 'Montage image was generated successfully.'
        : montageStatus === 'skipped'
          ? 'Montage generation was skipped.'
          : 'Montage generation did not complete successfully.',
    metrics: {
      attempted: Boolean(postprocess?.montage?.attempted),
    },
  });
  const visualOverflowCheck = makeCheck({
    id: 'visual_overflow',
    status:
      strictRequested && visualOverflowStatus === 'skipped'
        ? 'fail'
        : strictRequested && visualOverflowStatus === 'error'
          ? 'fail'
          : visualOverflowStatus,
    blocking: Boolean(strictRequested),
    summary:
      visualOverflowStatus === 'pass'
        ? 'Visual overflow inspection passed.'
        : visualOverflowStatus === 'fail'
          ? 'Visual overflow inspection found failing slides.'
          : visualOverflowStatus === 'skipped'
            ? 'Visual overflow inspection was skipped.'
            : 'Visual overflow inspection did not complete successfully.',
    metrics: {
      attempted: Boolean(postprocess?.overflowVisual?.attempted),
      failingSlideCount: Number((postprocess?.overflowVisual?.failingSlides || []).length),
    },
  });

  const checks = [
    contractsCheck,
    validationCheck,
    verbosityCheck,
    paginationCheck,
    overlapCheck,
    previewCheck,
    montageCheck,
    visualOverflowCheck,
  ];

  const blockingIssueCount = findings.filter((finding) => finding?.blocking).length;
  const advisoryIssueCount = findings.filter((finding) => !finding?.blocking).length;
  const outcomeStatus = checks.some((check) => check.blocking && check.status === 'fail')
    ? 'fail'
    : checks.some((check) => check.status === 'error')
      ? 'error'
      : checks.some((check) => check.status === 'warn')
        ? 'warn'
        : 'pass';

  return {
    schemaVersion: 1,
    run: {
      generatedAt: new Date().toISOString(),
      template: templatePackage?.templateName || null,
      strictRequested: Boolean(strictRequested),
      allowSparse: Boolean(validation?.qa?.allowSparse || deckSpec?.metadata?.allowSparse),
      inputSlideCount,
      outputSlideCount,
      textAmount: verbosity?.metadata?.textAmount || null,
      slideCountPolicy: deckSpec?.metadata?.slideCountPolicy || null,
      styleIntent: deckSpec?.metadata?.styleIntent || null,
    },
    outcome: {
      status: outcomeStatus,
      blockingIssueCount,
      advisoryIssueCount,
      failedChecks: checks.filter((check) => check.status === 'fail' || check.status === 'error').map((check) => check.id),
      warningChecks: checks.filter((check) => check.status === 'warn').map((check) => check.id),
    },
    checks,
    findings,
    slides: buildSlides({
      deckSpec,
      renderQa,
      validation,
      verbosity,
      findings,
    }),
    artifacts: buildArtifacts({
      runRoot,
      outPath,
      qaPath,
      postprocess,
    }),
  };
}

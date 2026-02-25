/**
 * generator/runtime/diagnostics.js — Optional generator diagnostics collector
 */

let activeDiagnostics = null;

/**
 * Start collecting diagnostics.
 * @returns {object}
 */
export function startDiagnostics() {
  activeDiagnostics = {
    warnings: [],
    missingSlots: [],
    fallbacks: [],
    overlaps: null,
  };
  return activeDiagnostics;
}

/**
 * Stop collecting diagnostics and return the report.
 * @returns {object|null}
 */
export function stopDiagnostics() {
  const report = activeDiagnostics;
  activeDiagnostics = null;
  return report;
}

/**
 * Record a fallback event.
 * @param {string} layout
 * @param {string} reason
 * @param {object} [details]
 */
export function recordFallback(layout, reason, details = {}) {
  if (!activeDiagnostics) return;
  activeDiagnostics.fallbacks.push({ layout, reason, details });
}

/**
 * Record a validation warning.
 * @param {string} message
 */
export function recordWarning(message) {
  if (!activeDiagnostics) return;
  activeDiagnostics.warnings.push(message);
}

/**
 * Record a missing slot event.
 * @param {number} slideIndex
 * @param {string} slideType
 * @param {string} slot
 */
export function recordMissingSlot(slideIndex, slideType, slot) {
  if (!activeDiagnostics) return;
  activeDiagnostics.missingSlots.push({ slideIndex, slideType, slot });
}

/**
 * Record overlap summary data.
 * @param {object} summary
 */
export function recordOverlapSummary(summary) {
  if (!activeDiagnostics) return;
  activeDiagnostics.overlaps = summary;
}

/**
 * generator/helpers/text.js — Shared text utilities
 */

/**
 * Estimate a text box height in inches.
 * @param {number} fontSize
 * @param {number} [lines=1]
 * @param {number} [leading=1.15]
 * @param {number} [padding=0.3]
 * @returns {number}
 */
export function calcTextBoxHeight(fontSize, lines = 1, leading = 1.15, padding = 0.3) {
  const lineHeightIn = (fontSize / 72) * leading;
  return lines * lineHeightIn + padding;
}

/**
 * Compute a dynamic strapline box that expands vertically for long text.
 * @param {object} params
 * @param {string} params.strapline
 * @param {{x:number,y:number,w:number,h:number}} params.titleGeo
 * @param {{x:number,y:number,w:number,h:number}} params.strapBase
 * @param {{x:number,y:number,w:number,h:number}} params.defaultStrapGeo
 * @param {number} params.fontSize
 * @param {number} [params.maxLines=8]
 * @param {number} [params.leading=1.1]
 * @param {number} [params.padding=0.12]
 * @returns {{x:number,y:number,w:number,h:number}}
 */
export function computeDynamicStraplineBox({
  strapline,
  titleGeo,
  strapBase,
  defaultStrapGeo,
  fontSize,
  maxLines = 8,
  leading = 1.1,
  padding = 0.12,
} = {}) {
  const clean = sanitizeText(strapline);
  const base = strapBase || defaultStrapGeo || {};
  const baseTitle = titleGeo || {};
  const width = base.w || baseTitle.w || defaultStrapGeo?.w || 11.1596;
  const estimatedCharsPerLine = Math.max(30, Math.floor(width * 12));
  const estimatedLines = Math.max(1, Math.ceil(clean.length / estimatedCharsPerLine));
  const dynamicHeight = calcTextBoxHeight(fontSize, Math.min(maxLines, estimatedLines), leading, padding);
  return {
    ...base,
    x: base.x ?? baseTitle.x ?? defaultStrapGeo?.x ?? 1.0919,
    y: base.y ?? defaultStrapGeo?.y ?? 1.2899,
    w: width,
    h: Math.max(base.h || defaultStrapGeo?.h || 0.5276, dynamicHeight),
  };
}

/**
 * Normalize text to reduce layout surprises.
 * @param {unknown} value
 * @param {object} [options]
 * @param {boolean} [options.preserveNewlines=false]
 * @returns {string}
 */
export function sanitizeText(value, options = {}) {
  const { preserveNewlines = false } = options;
  const raw = String(value ?? '');
  const normalized = preserveNewlines
    ? raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    : raw.replace(/[\r\n]+/g, ' ');
  return normalized.replace(/\s+/g, ' ').trim();
}

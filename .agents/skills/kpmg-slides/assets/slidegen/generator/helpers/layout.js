import { FOOTER_SAFE_TOP } from './footer.js';
import { clampBoxToBottom } from './geometry.js';

const STRAP_GAP = 0.06;
const SOURCE_TOP_OFFSET = 0.05;
const SOURCE_BOTTOM_GAP = 0.06;

export function normalizeBodyStyle(bodyStyle) {
  const normalized = String(bodyStyle || '').trim().toLowerCase();
  return normalized === 'paragraph' || normalized === 'paragraphs' ? 'paragraphs' : 'bullets';
}

export function computeStrapShift(strapBox, contentTop, gap = STRAP_GAP) {
  if (!strapBox || !Number.isFinite(contentTop)) return 0;
  return Math.max(0, (strapBox.y + strapBox.h + gap) - contentTop);
}

export function shiftBox(box, shift = 0) {
  if (!box || !shift) return box;
  return { ...box, y: box.y + shift, h: box.h - shift };
}

export function footerSafeTopForMaster(masterName) {
  return masterName === 'KPMG_WHITE' ? FOOTER_SAFE_TOP : null;
}

export function clampToMasterFooter(box, masterName, pad = 0) {
  const safeTop = footerSafeTopForMaster(masterName);
  if (!safeTop) return box;
  return clampBoxToBottom(box, safeTop - pad);
}

function normalizeSourceText(sourceText) {
  return String(sourceText ?? '').replace(/\s+/g, ' ').trim();
}

export function estimateSourceTextHeight(
  sourceText,
  boxW,
  {
    fontSize = 8,
    minHeight = 0.2,
    maxHeight = 0.44,
    lineHeightMultiplier = 1.15,
    paddingInches = 0.02,
  } = {},
) {
  const text = normalizeSourceText(sourceText);
  if (!text) return 0;

  const width = Math.max(0.5, Number(boxW || 0.5));
  const size = Math.max(6, Number(fontSize || 8));
  const charsPerLine = Math.max(20, Math.floor(width * 12.5 * (10 / size)));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  const lineHeightIn = ((size * lineHeightMultiplier) / 72);
  const estimated = lines * lineHeightIn + paddingInches;
  return Math.max(minHeight, Math.min(maxHeight, estimated));
}

export function sourceFootprintBelow(upperBox, sourceText, options = {}) {
  if (!upperBox) return 0;
  const text = normalizeSourceText(sourceText);
  if (!text) return 0;
  const topOffset = Number.isFinite(options.topOffset) ? options.topOffset : SOURCE_TOP_OFFSET;
  const sourceHeight = estimateSourceTextHeight(text, upperBox.w, options);
  return topOffset + sourceHeight;
}

export function buildSourceBox(upperBox, sourceText, options = {}) {
  if (!upperBox) return null;
  const text = normalizeSourceText(sourceText);
  if (!text) return null;
  const topOffset = Number.isFinite(options.topOffset) ? options.topOffset : SOURCE_TOP_OFFSET;
  const sourceHeight = estimateSourceTextHeight(text, upperBox.w, options);
  return {
    x: upperBox.x,
    y: upperBox.y + upperBox.h + topOffset,
    w: upperBox.w,
    h: sourceHeight,
  };
}

export function reserveSourceGutterBetweenBoxes({
  upperBox,
  lowerBox,
  sourceText,
  sourceOptions = {},
  bottomGap = SOURCE_BOTTOM_GAP,
  minUpperHeight = 1.05,
  minLowerHeight = 0.85,
} = {}) {
  if (!upperBox || !lowerBox) {
    return { upperBox, lowerBox, adjusted: false };
  }

  const footprint = sourceFootprintBelow(upperBox, sourceText, sourceOptions);
  if (footprint <= 0) {
    return { upperBox, lowerBox, adjusted: false };
  }

  const requiredTop = upperBox.y + upperBox.h + footprint + Math.max(0, Number(bottomGap || 0));
  const overlap = Math.max(0, requiredTop - lowerBox.y);
  if (overlap <= 0) {
    return { upperBox, lowerBox, adjusted: false };
  }

  let upper = { ...upperBox };
  let lower = { ...lowerBox };
  let remaining = overlap;

  const maxLowerShift = Math.max(0, lower.h - minLowerHeight);
  const lowerShift = Math.min(remaining, maxLowerShift);
  if (lowerShift > 0) {
    lower.y += lowerShift;
    lower.h -= lowerShift;
    remaining -= lowerShift;
  }

  const maxUpperShrink = Math.max(0, upper.h - minUpperHeight);
  const upperShrink = Math.min(remaining, maxUpperShrink);
  if (upperShrink > 0) {
    upper.h -= upperShrink;
    remaining -= upperShrink;
  }

  if (remaining > 0) {
    lower.y += remaining;
    lower.h = Math.max(0.4, lower.h - remaining);
  }

  return { upperBox: upper, lowerBox: lower, adjusted: true };
}
